import "./styles.css";
import * as mock from "./mock-data.js";
import { mockNavTableRows } from "./hm-mock-data.js";
import {
  fetchLiveNavigationTable,
  summarizeNavHealth,
} from "./api/hm-live.js";
import {
  fillLegend,
  renderHealthDoughnut,
  renderPie,
  renderSparkline,
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

  const disabledEl = document.getElementById("kpi-disabled");
  const disabledPctEl = document.getElementById("kpi-disabled-pct");
  if (disabledEl) disabledEl.textContent = fmt(summary.disabled);
  if (disabledPctEl) {
    disabledPctEl.textContent = summary.total
      ? `${summary.disabledPct}% of components`
      : "—";
  }

  // Sites still from static mock until wired
  const k = mock.kpis;
  const sitesEl = document.getElementById("kpi-sites");
  const sitesOf = document.getElementById("kpi-sites-of");
  if (sitesEl) sitesEl.textContent = String(k.sitesImpacted);
  if (sitesOf) sitesOf.textContent = `of ${k.sitesTotal} sites`;

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
      if (live.length) rows = live;
    }
  } catch (err) {
    console.warn("[overview] nav table", err);
  }
  applyOverviewKpis(summarizeNavHealth(rows));
}

function fillKpisFromMock() {
  applyOverviewKpis(summarizeNavHealth(mockNavTableRows));
}

function fillCriticalTable() {
  const tbody = document.querySelector("#table-critical tbody");
  tbody.innerHTML = mock.criticalIssues
    .map(
      (r) => `<tr class="critical">
      <td>${r.time}</td><td>${r.site}</td><td>${r.component}</td>
      <td>${r.type}</td><td>${r.message}</td></tr>`
    )
    .join("");
}

function fillSitesTable() {
  const tbody = document.querySelector("#table-sites tbody");
  tbody.innerHTML = mock.siteSummary
    .map((r, i) => {
      const color = scoreColor(r.score);
      return `<tr>
        <td>${r.site}</td>
        <td><span class="score-pill"><i class="score-dot" style="background:${color}"></i>${r.score}</span></td>
        <td>${r.total}</td>
        <td>${r.problems}</td>
        <td>${r.warnings}</td>
        <td>${r.info}</td>
        <td><canvas class="spark" id="spark-${i}" width="72" height="28"></canvas></td>
      </tr>`;
    })
    .join("");

  mock.siteSummary.forEach((r, i) => {
    const el = document.getElementById(`spark-${i}`);
    if (el) renderSparkline(el, r.trend);
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

function fillIssueRows(tableId, countId, rows) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  const countEl = document.getElementById(countId);
  if (countEl) countEl.textContent = String(rows.length);
  tbody.innerHTML = rows
    .map((r) => {
      const sev = r.severity.toLowerCase();
      return `<tr>
        <td>${r.time}</td>
        <td><span class="badge ${sev}">${r.severity}</span></td>
        <td>${r.site}</td>
        <td>${r.component}</td>
        <td>${r.type}</td>
        <td>${r.message}</td>
        <td>${r.status}</td>
        <td>${r.duration}</td>
      </tr>`;
    })
    .join("");
}

function fillIssuesPage() {
  fillIssueRows("table-system-issues", "issues-count", mock.systemIssues);
  fillIssueRows("table-system-warnings", "warnings-count", mock.systemWarnings);
}

function wireNav() {
  const overview = document.getElementById("page-overview");
  const health = document.getElementById("page-health-monitor");
  const issues = document.getElementById("page-issues");
  const trends = document.getElementById("page-trends");
  const drilldown = document.getElementById("page-drilldown");
  const config = document.getElementById("page-config");
  const other = document.getElementById("page-other");
  const title = document.getElementById("other-title");

  function show(page) {
    overview.classList.toggle("visible", page === "overview");
    health.classList.toggle("visible", page === "health-monitor");
    issues.classList.toggle("visible", page === "issues");
    trends.classList.toggle("visible", page === "trends");
    drilldown.classList.toggle("visible", page === "drilldown");
    config.classList.toggle("visible", page === "config");
    other.classList.toggle(
      "visible",
      page !== "overview" &&
        page !== "health-monitor" &&
        page !== "issues" &&
        page !== "trends" &&
        page !== "drilldown" &&
        page !== "config"
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
      } else if (page === "trends") {
        show("trends");
        initTrendsPage();
      } else if (page === "drilldown") {
        show("drilldown");
        initDrillDownPage();
      } else if (page === "config") {
        show("config");
        initConfigurationPage();
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
  // Health Score doughnut is painted by applyOverviewKpis / loadOverviewKpis

  safeChart("components", () => {
    renderPie(document.getElementById("chart-components"), mock.componentsByType);
    fillLegend(
      document.getElementById("legend-components"),
      mock.componentsByType.labels,
      mock.componentsByType.values,
      mock.componentsByType.colors
    );
  });

  safeChart("severity", () => {
    renderPie(document.getElementById("chart-severity"), mock.issuesBySeverity);
    fillLegend(
      document.getElementById("legend-severity"),
      mock.issuesBySeverity.labels,
      mock.issuesBySeverity.values,
      mock.issuesBySeverity.colors
    );
  });

  safeChart("timeline", () =>
    renderTimeline(document.getElementById("chart-timeline"), mock.issuesOverTime)
  );

  safeChart("top-types", () =>
    renderTopTypes(document.getElementById("chart-top-types"), mock.topIssueTypes)
  );

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
fillCriticalTable();
fillAlertsTable();
fillIssuesPage();
wireNav();
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
  fillSitesTable();
  requestAnimationFrame(() => {
    initCharts();
    fillKpisFromMock();
    loadOverviewKpis();
  });
});

