import "./styles.css";
import * as mock from "./mock-data.js";
import { mockNavTableRows } from "./hm-mock-data.js";
import {
  componentsBySiteChart,
  enrichIncompleteCompoundStates,
  extractKnownSites,
  fetchLiveNavigationTable,
  listCriticalIssues,
  listIssuesAndAlerts,
  recordAndBuildIssuesOverTime,
  siteFromRow,
  siteSummaryRows,
  summarizeNavHealth,
  topIssueTypesFromRows,
  touchIssueOnsets,
} from "./api/hm-live.js";
import {
  fillLegend,
  renderHealthDoughnut,
  renderPie,
  renderTimeline,
  renderTopTypes,
} from "./charts.js";
import {
  initHealthMonitorPage,
  resetHealthMonitorToMock,
} from "./health-monitor.js";
import { initTrendsPage } from "./trends.js";
import { initDrillDownPage } from "./drill-down.js";
import { initConfigurationPage } from "./configuration.js";
import {
  disconnectIwaSession,
  ensureIwaSession,
  setTopbarConnectionState,
} from "./session.js";
import { getStoredToken } from "./api/inmation.js";
import { fetchExpiringCertificateIssues } from "./api/hm-certificates.js";

function fmt(n) {
  return n.toLocaleString("en-US");
}

function scoreColor(score) {
  if (score >= 80) return "#16a34a";
  if (score >= 70) return "#89d329";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

function healthLabelFromPct(goodPct) {
  if (goodPct >= 80) return "Good";
  if (goodPct >= 70) return "Fair";
  if (goodPct >= 50) return "Poor";
  return "Critical";
}

function tickClock() {
  const now = new Date();
  const s = now.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  document.getElementById("system-time").textContent = s;
  document.getElementById("last-refresh").textContent = s;
}

/** @type {import('chart.js').Chart | null} */
let healthChart = null;

/** Last nav-table rows (unfiltered) for Overview re-apply without refetch. */
let overviewRawRows = [];

const AUTO_REFRESH_MS = 5 * 60 * 1000;
/** @type {ReturnType<typeof setInterval> | null} */
let overviewAutoRefreshTimer = null;

function getOverviewTimeRange() {
  const el = document.getElementById("overview-time-range");
  const v = el?.value || "24h";
  return v === "7d" || v === "1m" ? v : "24h";
}

function getOverviewSiteFilter() {
  const el = document.getElementById("overview-site-filter");
  return el?.value || "All";
}

function filterRowsBySite(rows, site) {
  if (!site || site === "All") return rows;
  return (rows || []).filter((r) => siteFromRow(r) === site);
}

function syncOverviewSiteOptions(rows) {
  const sel = document.getElementById("overview-site-filter");
  if (!sel) return;
  const prev = sel.value || "All";
  const sites = extractKnownSites(rows);
  sel.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "All";
  allOpt.textContent = "All";
  sel.appendChild(allOpt);
  for (const site of sites) {
    const opt = document.createElement("option");
    opt.value = site;
    opt.textContent = site;
    sel.appendChild(opt);
  }
  sel.value = sites.includes(prev) || prev === "All" ? prev : "All";
}

function applyOverviewKpis(summary) {
  const scoreEl = document.getElementById("kpi-score");
  const scoreSub = document.getElementById("kpi-score-sub");
  const scoreLabel = document.getElementById("kpi-score-label");
  const totalEl = document.getElementById("kpi-total");
  const totalFooter = document.getElementById("kpi-total-footer");
  const problemsEl = document.getElementById("kpi-problems");
  const problemsPct = document.getElementById("kpi-problems-pct");
  const warningsEl = document.getElementById("kpi-warnings");
  const warningsPct = document.getElementById("kpi-warnings-pct");

  const pctText =
    summary.goodPct % 1 === 0
      ? `${summary.goodPct}%`
      : `${summary.goodPct.toFixed(1)}%`;

  if (scoreEl) scoreEl.textContent = pctText;
  if (scoreSub) {
    scoreSub.textContent = summary.total
      ? `${fmt(summary.good)} / ${fmt(summary.total)}`
      : "no data";
  }
  if (scoreLabel) {
    scoreLabel.textContent = healthLabelFromPct(summary.goodPct);
    scoreLabel.className = "kpi-footer";
    if (summary.goodPct >= 70) scoreLabel.classList.add("good");
    else if (summary.goodPct >= 50) scoreLabel.classList.add("warn");
    else scoreLabel.classList.add("danger");
  }

  if (totalEl) totalEl.textContent = fmt(summary.total);
  if (totalFooter) {
    totalFooter.textContent = summary.total
      ? "From Health Monitor table"
      : "No components loaded";
  }

  if (problemsEl) problemsEl.textContent = fmt(summary.bad);
  if (problemsPct) {
    problemsPct.textContent = summary.total
      ? `${summary.problemsPct}% of components`
      : "—";
  }

  if (warningsEl) warningsEl.textContent = fmt(summary.warning);
  if (warningsPct) {
    warningsPct.textContent = summary.total
      ? `${summary.warningsPct}% of components`
      : "—";
  }

  const unknownEl = document.getElementById("kpi-unknown");
  const unknownPctEl = document.getElementById("kpi-unknown-pct");
  if (unknownEl) unknownEl.textContent = fmt(summary.unknown ?? 0);
  if (unknownPctEl) {
    unknownPctEl.textContent = summary.total
      ? `${summary.unknownPct ?? 0}% of components`
      : "—";
  }

  const disabledEl = document.getElementById("kpi-disabled");
  const disabledPctEl = document.getElementById("kpi-disabled-pct");
  if (disabledEl) disabledEl.textContent = fmt(summary.disabled ?? 0);
  if (disabledPctEl) {
    disabledPctEl.textContent = summary.total
      ? `${summary.disabledPct ?? 0}% of components`
      : "—";
  }

  const goodEl = document.getElementById("kpi-good");
  const goodPctEl = document.getElementById("kpi-good-pct");
  if (goodEl) goodEl.textContent = fmt(summary.good);
  if (goodPctEl) {
    goodPctEl.textContent = summary.total
      ? `${summary.goodPct}% of components`
      : "—";
  }

  // Sites from naming convention Area-Country-Site-…
  const sitesEl = document.getElementById("kpi-sites");
  const sitesOf = document.getElementById("kpi-sites-of");
  if (sitesEl) {
    sitesEl.textContent = fmt(summary.sitesCount ?? 0);
  }
  if (sitesOf) {
    const totalSites = summary.sitesTotal ?? 12;
    const list = summary.sites?.length
      ? summary.sites.join(", ")
      : "none detected";
    sitesOf.textContent = `of ${totalSites} sites`;
    sitesOf.title = list;
  }

  const canvas = document.getElementById("chart-health");
  if (canvas) {
    try {
      healthChart = renderHealthDoughnut(canvas, summary);
    } catch (err) {
      console.error("[chart:health]", err);
    }
  }
}

async function loadOverviewKpis() {
  let rows = [...mockNavTableRows];
  try {
    const ok = await ensureIwaSession({ force: false });
    if (ok && getStoredToken()) {
      const live = await fetchLiveNavigationTable();
      if (live.length) {
        // Nav table often lacks STATE_* — fill from Object Properties for unhealthy rows
        await enrichIncompleteCompoundStates(live);
        rows = live;
      }
    }
  } catch (err) {
    console.warn("[overview] nav table", err);
  }
  applyOverviewFromRows(rows);
}

function fillKpisFromMock() {
  applyOverviewFromRows(mockNavTableRows);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyOverviewFromRows(rows) {
  overviewRawRows = Array.isArray(rows) ? rows : [];
  syncOverviewSiteOptions(overviewRawRows);
  const site = getOverviewSiteFilter();
  const filtered = filterRowsBySite(overviewRawRows, site);
  const summary = summarizeNavHealth(filtered);
  applyOverviewKpis(summary);
  applyComponentsBySite(filtered);
  fillCriticalTable(filtered);
  fillSitesTable(filtered);
  applyIssuesOverTime(summary, site);
  applyTopIssueTypes(filtered);
  // Keep issue onset clocks warm while Overview refreshes
  touchIssueOnsets(overviewRawRows);
  // Refresh Issues tables if already populated; keep current page when possible
  applyIssuesPageFromRows(overviewRawRows, { resetPage: false });
}

/** Re-apply filters on cached rows (no network). */
function reapplyOverviewFilters() {
  if (!overviewRawRows.length) {
    applyOverviewFromRows(mockNavTableRows);
    return;
  }
  applyOverviewFromRows(overviewRawRows);
}

function applyComponentsBySite(rows) {
  const pie = componentsBySiteChart(rows);
  const canvas = document.getElementById("chart-components");
  const legend = document.getElementById("legend-components");
  if (!canvas || !pie.labels.length) {
    if (legend) legend.innerHTML = "<span class='muted'>No site-tagged components</span>";
    return;
  }
  safeChart("components", () => {
    renderPie(canvas, pie);
    fillLegend(legend, pie.labels, pie.values, pie.colors);
  });
}

function applyIssuesOverTime(summary, site = "All") {
  const range = getOverviewTimeRange();
  // Keep global + scoped history so switching Site still has a series
  if (site !== "All" && overviewRawRows.length) {
    recordAndBuildIssuesOverTime(summarizeNavHealth(overviewRawRows), {
      range,
      site: "All",
    });
  }
  const series = recordAndBuildIssuesOverTime(summary, { range, site });
  const hint = document.getElementById("timeline-hint");
  const points = series.problems.filter((v) => v != null).length;
  const rangeLabel =
    range === "7d"
      ? "last 7 days"
      : range === "1m"
        ? "last month"
        : "last 24h";
  const sampleLabel = range === "24h" ? "hourly samples" : "daily samples";
  if (hint) {
    hint.textContent =
      points <= 1
        ? `(${rangeLabel} · history builds on refresh)`
        : `(${rangeLabel} · ${points} ${sampleLabel})`;
  }
  safeChart("timeline", () =>
    renderTimeline(document.getElementById("chart-timeline"), series)
  );
}

function wireOverviewFilters() {
  const rangeEl = document.getElementById("overview-time-range");
  const siteEl = document.getElementById("overview-site-filter");
  const autoEl = document.getElementById("overview-auto-refresh");

  rangeEl?.addEventListener("change", () => reapplyOverviewFilters());
  siteEl?.addEventListener("change", () => reapplyOverviewFilters());
  autoEl?.addEventListener("change", () => syncOverviewAutoRefresh());
  syncOverviewAutoRefresh();
}

function isOverviewVisible() {
  return document.getElementById("page-overview")?.classList.contains("visible");
}

function syncOverviewAutoRefresh() {
  const autoEl = document.getElementById("overview-auto-refresh");
  const on = Boolean(autoEl?.checked);
  if (overviewAutoRefreshTimer) {
    clearInterval(overviewAutoRefreshTimer);
    overviewAutoRefreshTimer = null;
  }
  if (!on) return;
  overviewAutoRefreshTimer = setInterval(() => {
    if (!isOverviewVisible()) return;
    loadOverviewKpis().catch((err) =>
      console.warn("[overview] auto refresh", err)
    );
  }, AUTO_REFRESH_MS);
}

function applyTopIssueTypes(rows) {
  const data = topIssueTypesFromRows(rows);
  const canvas = document.getElementById("chart-top-types");
  if (!canvas) return;
  if (!data.labels.length) {
    safeChart("top-types", () =>
      renderTopTypes(canvas, { labels: ["No issues"], values: [0] })
    );
    return;
  }
  safeChart("top-types", () => renderTopTypes(canvas, data));
}

/** @type {ReturnType<typeof listCriticalIssues>} */
let criticalIssueRows = [];
let critSortKey = "site";
let critSortDir = 1;

function fillCriticalTable(rows = mockNavTableRows) {
  criticalIssueRows = listCriticalIssues(rows);
  renderCriticalTableBody();
  wireCriticalSortOnce();
}

function sortedCriticalRows() {
  const list = [...criticalIssueRows];
  const dir = critSortDir;
  const key = critSortKey;
  list.sort((a, b) => {
    const av = String(a[key] ?? "");
    const bv = String(b[key] ?? "");
    return dir * av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
  });
  return list;
}

function renderCriticalTableBody() {
  const tbody = document.querySelector("#table-critical tbody");
  const countEl = document.getElementById("critical-count");
  const issues = sortedCriticalRows();
  if (countEl) countEl.textContent = String(criticalIssueRows.length);
  document.querySelectorAll("#table-critical th[data-crit-sort]").forEach((th) => {
    const key = th.getAttribute("data-crit-sort");
    const active = key === critSortKey;
    th.classList.toggle("is-sorted", active);
    const btn = th.querySelector(".hm-sort-btn");
    if (btn) {
      const label = btn.dataset.label || key;
      btn.textContent = active
        ? `${label} ${critSortDir === 1 ? "▲" : "▼"}`
        : label;
    }
  });
  if (!tbody) return;
  if (!issues.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="hm-props-empty">No Bad components</td></tr>`;
    return;
  }
  tbody.innerHTML = issues
    .map(
      (r) => `<tr class="critical">
      <td>${escapeHtml(r.site)}</td>
      <td title="${escapeHtml(r.path)}">${escapeHtml(r.component)}</td>
      <td>${escapeHtml(r.type)}</td>
      <td>${escapeHtml(r.message)}</td>
    </tr>`
    )
    .join("");
}

function wireCriticalSortOnce() {
  const table = document.getElementById("table-critical");
  if (!table || table.dataset.sortReady === "1") return;
  table.dataset.sortReady = "1";
  table.addEventListener("click", (e) => {
    const th = e.target.closest("th[data-crit-sort]");
    if (!th) return;
    const key = th.getAttribute("data-crit-sort");
    if (key === critSortKey) critSortDir *= -1;
    else {
      critSortKey = key;
      critSortDir = 1;
    }
    renderCriticalTableBody();
  });
}

/** @type {ReturnType<typeof siteSummaryRows>} */
let siteSummaryData = [];
let siteSortKey = "site";
let siteSortDir = 1;

function fillSitesTable(rows = mockNavTableRows) {
  siteSummaryData = siteSummaryRows(rows);
  renderSitesTableBody();
  wireSiteSortOnce();
}

function sortedSiteRows() {
  const list = [...siteSummaryData];
  const dir = siteSortDir;
  const key = siteSortKey;
  list.sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === "number" && typeof bv === "number") return dir * (av - bv);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return (
      dir *
      String(av).localeCompare(String(bv), undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  });
  return list;
}

function renderSitesTableBody() {
  const tbody = document.querySelector("#table-sites tbody");
  if (!tbody) return;
  document.querySelectorAll("#table-sites th[data-site-sort]").forEach((th) => {
    const key = th.getAttribute("data-site-sort");
    const active = key === siteSortKey;
    th.classList.toggle("is-sorted", active);
    const btn = th.querySelector(".hm-sort-btn");
    if (btn) {
      const label = btn.dataset.label || key;
      btn.textContent = active
        ? `${label} ${siteSortDir === 1 ? "▲" : "▼"}`
        : label;
    }
  });
  const rows = sortedSiteRows();
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="hm-props-empty">No sites detected</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map((r) => {
      const score = r.score == null ? "—" : r.score;
      const color = r.score == null ? "#94a3b8" : scoreColor(r.score);
      return `<tr>
        <td>${escapeHtml(r.site)}</td>
        <td><span class="score-pill"><i class="score-dot" style="background:${color}"></i>${score}${r.score != null ? "%" : ""}</span></td>
        <td>${fmt(r.total)}</td>
        <td>${fmt(r.good)}</td>
        <td>${fmt(r.problems)}</td>
        <td>${fmt(r.warnings)}</td>
        <td>${fmt(r.unknown)}</td>
        <td>${fmt(r.disabled)}</td>
      </tr>`;
    })
    .join("");
}

function wireSiteSortOnce() {
  const table = document.getElementById("table-sites");
  if (!table || table.dataset.sortReady === "1") return;
  table.dataset.sortReady = "1";
  table.addEventListener("click", (e) => {
    const th = e.target.closest("th[data-site-sort]");
    if (!th) return;
    const key = th.getAttribute("data-site-sort");
    if (key === siteSortKey) siteSortDir *= -1;
    else {
      siteSortKey = key;
      siteSortDir = 1;
    }
    renderSitesTableBody();
  });
}

function fillAlertsTable() {
  const tbody = document.querySelector("#table-alerts tbody");
  tbody.innerHTML = mock.recentAlerts
    .map((r) => {
      const sev = r.severity.toLowerCase();
      return `<tr>
        <td>${r.time}</td>
        <td><span class="badge ${sev}">${r.severity}</span></td>
        <td>${r.site}</td>
        <td>${r.component}</td>
        <td>${r.message}</td>
        <td>${r.status}</td>
        <td>${r.duration}</td>
        <td>${r.ack}</td>
      </tr>`;
    })
    .join("");
}

const ISSUES_PAGE_SIZE = 15;

const SEVERITY_RANK = { High: 3, Medium: 2, Unknown: 1, Disabled: 1, Low: 0 };

/** @type {Record<string, { rows: object[], page: number, tableId: string, countId: string, sortKey: string, sortDir: number }>} */
const issuesLists = {
  problems: {
    rows: [],
    page: 1,
    tableId: "table-system-issues",
    countId: "issues-count",
    sortKey: "site",
    sortDir: 1,
  },
  warnings: {
    rows: [],
    page: 1,
    tableId: "table-system-warnings",
    countId: "warnings-count",
    sortKey: "site",
    sortDir: 1,
  },
  disabled: {
    rows: [],
    page: 1,
    tableId: "table-system-disabled",
    countId: "disabled-count",
    sortKey: "site",
    sortDir: 1,
  },
  certificates: {
    rows: [],
    page: 1,
    tableId: "table-system-certificates",
    countId: "certificates-count",
    sortKey: "duration",
    sortDir: 1,
  },
};

function issuesPageCount(total) {
  return Math.max(1, Math.ceil(total / ISSUES_PAGE_SIZE));
}

function sortedIssuesRows(list) {
  const rows = [...list.rows];
  const key = list.sortKey;
  const dir = list.sortDir;
  rows.sort((a, b) => {
    if (key === "time") {
      return dir * ((a.timeMs || 0) - (b.timeMs || 0));
    }
    if (key === "duration") {
      return dir * ((a.durationMs || 0) - (b.durationMs || 0));
    }
    if (key === "severity") {
      const ar = SEVERITY_RANK[a.severity] ?? -1;
      const br = SEVERITY_RANK[b.severity] ?? -1;
      return dir * (ar - br);
    }
    return (
      dir *
      String(a[key] ?? "").localeCompare(String(b[key] ?? ""), undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  });
  return rows;
}

function updateIssuesSortHeaders(kind) {
  const list = issuesLists[kind];
  if (!list) return;
  document
    .querySelectorAll(`#${list.tableId} th[data-issues-sort]`)
    .forEach((th) => {
      const key = th.getAttribute("data-issues-sort");
      const active = key === list.sortKey;
      th.classList.toggle("is-sorted", active);
      const btn = th.querySelector(".hm-sort-btn");
      if (btn) {
        const label = btn.dataset.label || key;
        btn.textContent = active
          ? `${label} ${list.sortDir === 1 ? "▲" : "▼"}`
          : label;
      }
    });
}

function renderIssuesList(kind) {
  const list = issuesLists[kind];
  if (!list) return;
  const sorted = sortedIssuesRows(list);
  const total = sorted.length;
  const pages = issuesPageCount(total);
  if (list.page > pages) list.page = pages;
  if (list.page < 1) list.page = 1;

  const countEl = document.getElementById(list.countId);
  if (countEl) countEl.textContent = String(total);

  updateIssuesSortHeaders(kind);

  const tbody = document.querySelector(`#${list.tableId} tbody`);
  if (!tbody) return;

  // warnings / unknown (disabled): Site · Component · Message only
  // problems: full set without Status
  // certificates: full set with Status
  const layout =
    kind === "warnings" || kind === "disabled"
      ? "message-focus"
      : kind === "certificates"
        ? "certificates"
        : "problems";

  const colSpan =
    layout === "message-focus" ? 3 : layout === "certificates" ? 8 : 7;

  if (!total) {
    tbody.innerHTML = `<tr><td colspan="${colSpan}" class="hm-props-empty">${
      kind === "certificates"
        ? "No expired or soon-expiring certificates"
        : "None"
    }</td></tr>`;
  } else {
    const start = (list.page - 1) * ISSUES_PAGE_SIZE;
    const slice = sorted.slice(start, start + ISSUES_PAGE_SIZE);
    tbody.innerHTML = slice
      .map((r) => {
        const sev = String(r.severity || "").toLowerCase();
        const rowClass = escapeHtml(r.rowClass || "");
        const rowStyle = r.rowStyle
          ? ` style="${String(r.rowStyle).replace(/"/g, "")}"`
          : "";
        if (layout === "message-focus") {
          return `<tr class="${rowClass}"${rowStyle} title="${escapeHtml(r.path || "")}">
        <td>${escapeHtml(r.site)}</td>
        <td>${escapeHtml(r.component)}</td>
        <td>${escapeHtml(r.message)}</td>
      </tr>`;
        }
        const statusCell =
          layout === "certificates"
            ? `<td>${escapeHtml(r.status)}</td>`
            : "";
        return `<tr class="${rowClass}"${rowStyle} title="${escapeHtml(r.path || "")}">
        <td>${escapeHtml(r.time)}</td>
        <td><span class="badge ${escapeHtml(sev)}">${escapeHtml(r.severity)}</span></td>
        <td>${escapeHtml(r.site)}</td>
        <td>${escapeHtml(r.component)}</td>
        <td>${escapeHtml(r.type)}</td>
        <td>${escapeHtml(r.message)}</td>
        ${statusCell}
        <td>${escapeHtml(r.duration)}</td>
      </tr>`;
      })
      .join("");
  }

  const label = document.getElementById(`issues-page-label-${kind}`);
  if (label) {
    label.textContent =
      total === 0
        ? "Page 0 of 0"
        : `Page ${list.page} of ${pages} · ${total} total`;
  }
  const pager = document.getElementById(`issues-pager-${kind}`);
  if (pager) pager.hidden = total <= ISSUES_PAGE_SIZE;

  const prev = document.querySelector(`[data-issues-prev="${kind}"]`);
  const next = document.querySelector(`[data-issues-next="${kind}"]`);
  if (prev) prev.disabled = list.page <= 1 || total === 0;
  if (next) next.disabled = list.page >= pages || total === 0;
}

function setIssuesList(kind, rows, { resetPage = false } = {}) {
  const list = issuesLists[kind];
  if (!list) return;
  list.rows = Array.isArray(rows) ? rows : [];
  if (resetPage) list.page = 1;
  renderIssuesList(kind);
}

function applyIssuesPageFromRows(rows, { resetPage = false } = {}) {
  const { problems, warnings, unknown, disabled } = listIssuesAndAlerts(rows);
  setIssuesList("problems", problems, { resetPage });
  setIssuesList("warnings", warnings, { resetPage });
  // Issues panel labeled Unknown — include Disabled rows there until a separate panel exists
  setIssuesList("disabled", [...(unknown || []), ...(disabled || [])], { resetPage });
}

async function loadIssuesPage() {
  let rows = overviewRawRows.length ? overviewRawRows : [...mockNavTableRows];
  try {
    const ok = await ensureIwaSession({ force: false });
    if (ok && getStoredToken()) {
      const live = await fetchLiveNavigationTable();
      if (live.length) {
        await enrichIncompleteCompoundStates(live);
        rows = live;
        overviewRawRows = live;
      }
    }
  } catch (err) {
    console.warn("[issues] nav table", err);
  }
  applyIssuesPageFromRows(rows, { resetPage: true });
  await loadIssuesCertificates({ resetPage: true });
}

async function loadIssuesCertificates({ resetPage = false } = {}) {
  const note = document.getElementById("certificates-note");
  try {
    const ok = await ensureIwaSession({ force: false });
    if (!ok || !getStoredToken()) {
      setIssuesList("certificates", [], { resetPage });
      if (note) {
        note.textContent =
          "Connect with IWA to load certificates from Health Monitor Report.";
      }
      return;
    }
    if (note) {
      note.textContent = "Loading certificates from Health Monitor Report…";
    }
    const { issues, raw } = await fetchExpiringCertificateIssues();
    setIssuesList("certificates", issues, { resetPage });
    if (note) {
      const hidden = Math.max(0, (raw?.length || 0) - issues.length);
      note.textContent = hidden
        ? `Expired or expiring within 30 days · ${hidden} healthy hidden`
        : "Expired or expiring within 30 days (from Health Monitor Report)";
    }
  } catch (err) {
    console.warn("[issues] certificates", err);
    setIssuesList("certificates", [], { resetPage });
    if (note) {
      note.textContent = `Could not load certificates: ${err.message || err}`;
    }
  }
}

function fillIssuesPage() {
  applyIssuesPageFromRows(
    overviewRawRows.length ? overviewRawRows : mockNavTableRows,
    { resetPage: true }
  );
}

function wireIssuesPagers() {
  document.querySelectorAll("[data-issues-prev]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.getAttribute("data-issues-prev");
      const list = issuesLists[kind];
      if (!list || list.page <= 1) return;
      list.page -= 1;
      renderIssuesList(kind);
    });
  });
  document.querySelectorAll("[data-issues-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.getAttribute("data-issues-next");
      const list = issuesLists[kind];
      if (!list) return;
      const pages = issuesPageCount(list.rows.length);
      if (list.page >= pages) return;
      list.page += 1;
      renderIssuesList(kind);
    });
  });

  for (const kind of Object.keys(issuesLists)) {
    const table = document.getElementById(issuesLists[kind].tableId);
    if (!table || table.dataset.sortReady === "1") continue;
    table.dataset.sortReady = "1";
    table.addEventListener("click", (e) => {
      const th = e.target.closest("th[data-issues-sort]");
      if (!th) return;
      const key = th.getAttribute("data-issues-sort");
      const list = issuesLists[kind];
      if (!list || !key) return;
      if (key === list.sortKey) list.sortDir *= -1;
      else {
        list.sortKey = key;
        list.sortDir = 1;
      }
      list.page = 1;
      renderIssuesList(kind);
    });
  }
}

function wireNav() {
  const overview = document.getElementById("page-overview");
  const health = document.getElementById("page-health-monitor");
  const issues = document.getElementById("page-issues");
  const trends = document.getElementById("page-trends");
  const drilldown = document.getElementById("page-drilldown");
  const config = document.getElementById("page-config");
  const reports = document.getElementById("page-reports");
  const other = document.getElementById("page-other");
  const title = document.getElementById("other-title");

  function show(page) {
    overview.classList.toggle("visible", page === "overview");
    health.classList.toggle("visible", page === "health-monitor");
    issues.classList.toggle("visible", page === "issues");
    trends.classList.toggle("visible", page === "trends");
    drilldown.classList.toggle("visible", page === "drilldown");
    config.classList.toggle("visible", page === "config");
    reports?.classList.toggle("visible", page === "reports");
    other.classList.toggle(
      "visible",
      page !== "overview" &&
        page !== "health-monitor" &&
        page !== "issues" &&
        page !== "trends" &&
        page !== "drilldown" &&
        page !== "config" &&
        page !== "reports"
    );
  }

  document.querySelectorAll(".nav-list button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".nav-list button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const page = btn.dataset.page;
      if (page === "overview") {
        show("overview");
        loadOverviewKpis();
      } else if (page === "health-monitor") {
        show("health-monitor");
        initHealthMonitorPage();
      } else if (page === "issues") {
        show("issues");
        loadIssuesPage();
      } else if (page === "trends") {
        show("trends");
        initTrendsPage();
      } else if (page === "drilldown") {
        show("drilldown");
        initDrillDownPage();
      } else if (page === "config") {
        show("config");
        initConfigurationPage();
      } else if (page === "reports") {
        show("reports");
        // Dynamic import: a Reports module error must not break app CSS/boot
        import("./reports.js")
          .then((m) => m.initReportsPage())
          .catch((err) => {
            console.error("[reports] module failed", err);
            const body = document.getElementById("reports-body");
            const status = document.getElementById("reports-status");
            if (body) {
              body.innerHTML =
                `<p class="report-error">Reports module failed to load: ${String(err.message || err)}</p>`;
            }
            if (status) {
              status.textContent = String(err.message || err);
              status.classList.add("is-error");
            }
          });
      } else {
        show("other");
        title.textContent = btn.textContent.trim();
      }
    });
  });
}

function safeChart(name, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`[chart:${name}]`, err);
  }
}

function initCharts() {
  // Overview live charts: components / timeline / top-types via applyOverviewFromRows

  safeChart("alerts", () => {
    renderPie(document.getElementById("chart-alerts"), mock.alertsBySeverity);
    fillLegend(
      document.getElementById("legend-alerts"),
      mock.alertsBySeverity.labels,
      mock.alertsBySeverity.values,
      mock.alertsBySeverity.colors
    );
  });
}

fillKpisFromMock();
fillAlertsTable();
fillIssuesPage();
wireNav();
wireOverviewFilters();
wireIssuesPagers();
tickClock();
setInterval(tickClock, 1000);

setTopbarConnectionState(false);
ensureIwaSession()
  .then((ok) => {
    if (ok) return loadOverviewKpis();
    return null;
  })
  .catch(() => {});

document.querySelector(".topbar-logout")?.addEventListener("click", () => {
  disconnectIwaSession();
  resetHealthMonitorToMock();
  fillKpisFromMock();
});

// Defer charts until layout has real sizes (fixes blank Chart.js canvases)
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    initCharts();
    fillKpisFromMock();
    loadOverviewKpis();
  });
});

