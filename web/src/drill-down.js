import { mockNavTableRows } from "./hm-mock-data.js";
import {
  drillFilterOptions,
  fetchLiveNavigationTable,
  fetchObjectSeverityLogs,
  filterDrillObjects,
  navRowsToDrillObjects,
} from "./api/hm-live.js";
import { ensureIwaSession } from "./session.js";
import { getStoredToken } from "./api/inmation.js";
import { clampPage, pageCount, sliceRows, updateFullPager } from "./table-pager.js";

const DD_PAGE_SIZE = 15;

/** @type {ReturnType<typeof navRowsToDrillObjects>} */
let drillObjects = [];
/** @type {object[]} */
let rawNavRows = [];

let selectedId = null;
let filters = {
  site: "All",
  type: "All",
  severity: "All",
  nonGoodOnly: true,
};
let sortKey = "site";
let sortDir = 1;
let page = 1;
let wired = false;
let detailLogsSeq = 0;
/** @type {object[]} */
let detailLogRows = [];
let logsSortKey = "timestampUtc";
let logsSortDir = -1;
let logsPage = 1;
const DD_LOGS_PAGE_SIZE = 15;
/** Index into sortedLogRows() while Log Details modal is open; -1 = closed. */
let logModalIndex = -1;
/** @type {Set<string>} */
let logModalCollapsed = new Set();
let logModalWired = false;
let logsMaximized = false;

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stateClass(worst) {
  const w = String(worst || "").toLowerCase();
  if (w === "bad" || w === "problem") return "bad";
  if (w === "warning") return "uncertain";
  if (w === "unknown" || w === "disabled" || w === "empty") return "disabled";
  return "good";
}

function scoreColor(score) {
  if (score >= 80) return "#16a34a";
  if (score >= 70) return "#89d329";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

function fillFilterOptions() {
  const opts = drillFilterOptions(drillObjects);
  const siteSel = document.getElementById("dd-filter-site");
  const typeSel = document.getElementById("dd-filter-type");
  const sevSel = document.getElementById("dd-filter-severity");

  const fillSelect = (el, values, current) => {
    if (!el) return;
    const prev = current || el.value || "All";
    el.innerHTML = values
      .map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`)
      .join("");
    el.value = values.includes(prev) ? prev : "All";
  };

  fillSelect(siteSel, opts.sites, filters.site);
  fillSelect(typeSel, opts.types, filters.type);
  fillSelect(sevSel, opts.severities, filters.severity);
  filters.site = siteSel?.value || "All";
  filters.type = typeSel?.value || "All";
  filters.severity = sevSel?.value || "All";

  const nonGood = document.getElementById("dd-filter-nongood");
  if (nonGood) nonGood.checked = filters.nonGoodOnly;
}

function filteredRows() {
  return filterDrillObjects(drillObjects, filters);
}

function sortedRows(rows) {
  const list = [...rows];
  const key = sortKey;
  const dir = sortDir;
  list.sort((a, b) => {
    if (key === "score") {
      return dir * ((Number(a[key]) || 0) - (Number(b[key]) || 0));
    }
    return (
      dir *
      String(a[key] ?? "").localeCompare(String(b[key] ?? ""), undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  });
  return list;
}

function updateSortHeaders() {
  document.querySelectorAll("#dd-table th[data-dd-sort]").forEach((th) => {
    const key = th.getAttribute("data-dd-sort");
    const active = key === sortKey;
    th.classList.toggle("is-sorted", active);
    const btn = th.querySelector(".hm-sort-btn");
    if (btn) {
      const label = btn.dataset.label || key;
      btn.textContent = active
        ? `${label} ${sortDir === 1 ? "▲" : "▼"}`
        : label;
    }
  });
}

function syncDdPager(total) {
  page = clampPage(page, total, DD_PAGE_SIZE);
  updateFullPager(
    {
      pager: document.getElementById("dd-pager"),
      first: document.getElementById("dd-page-first"),
      prev: document.getElementById("dd-page-prev"),
      next: document.getElementById("dd-page-next"),
      last: document.getElementById("dd-page-last"),
      pageInput: document.getElementById("dd-page-input"),
      pageOf: document.getElementById("dd-page-of"),
    },
    {
      page,
      pages: pageCount(total, DD_PAGE_SIZE),
      total,
      pageSize: DD_PAGE_SIZE,
    }
  );
}

function renderTable() {
  const rows = sortedRows(filteredRows());
  const tbody = document.querySelector("#dd-table tbody");
  const count = document.getElementById("dd-result-count");
  const total = rows.length;

  if (count) {
    count.textContent = `${total} object${total === 1 ? "" : "s"}`;
  }
  updateSortHeaders();

  if (!tbody) return;

  if (!total) {
    tbody.innerHTML = `<tr><td colspan="6" class="dd-empty-row">No objects match these filters.</td></tr>`;
    selectedId = null;
    renderDetail(null);
    syncDdPager(0);
    return;
  }

  if (!rows.some((r) => r.id === selectedId)) {
    selectedId = rows[0].id;
  }

  const paged = sliceRows(rows, page, DD_PAGE_SIZE);
  page = paged.page;

  tbody.innerHTML = paged.slice
    .map((o) => {
      const sel = o.id === selectedId ? " selected" : "";
      const emph = o.health !== "good" ? " dd-row-emph" : "";
      const color = scoreColor(o.score);
      return `<tr class="dd-row${sel}${emph}" data-id="${escapeHtml(o.id)}">
        <td>${escapeHtml(o.site)}</td>
        <td title="${escapeHtml(o.path)}">${escapeHtml(o.name)}</td>
        <td>${escapeHtml(o.type)}</td>
        <td><span class="dd-state ${stateClass(o.worstState)}">${escapeHtml(o.worstState)}</span></td>
        <td><span class="score-pill"><i class="score-dot" style="background:${color}"></i>${o.score}</span></td>
        <td title="${escapeHtml(o.message)}">${escapeHtml(o.message)}</td>
      </tr>`;
    })
    .join("");

  syncDdPager(total);

  const selected = rows.find((r) => r.id === selectedId) || rows[0];
  renderDetail(selected);
}

function sortedLogRows() {
  const list = [...detailLogRows];
  const key = logsSortKey;
  const dir = logsSortDir;
  list.sort((a, b) => {
    if (key === "timestampUtc" || key === "timeMs") {
      return dir * ((a.timeMs || 0) - (b.timeMs || 0));
    }
    if (key === "severity") {
      const rank = (s) => {
        const u = String(s || "").toUpperCase();
        if (u.includes("ERROR") || u === "ERR" || u === "4") return 2;
        if (u.includes("WARN") || u === "3") return 1;
        return 0;
      };
      return dir * (rank(a.severity) - rank(b.severity));
    }
    return (
      dir *
      String(a[key] ?? "").localeCompare(String(b[key] ?? ""), undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  });
  return list;
}

function updateLogSortHeaders() {
  document.querySelectorAll("#dd-logs th[data-dd-log-sort]").forEach((th) => {
    const key = th.getAttribute("data-dd-log-sort");
    const active = key === logsSortKey;
    th.classList.toggle("is-sorted", active);
    const btn = th.querySelector(".hm-sort-btn");
    if (btn) {
      const label = btn.dataset.label || key;
      btn.textContent = active
        ? `${label} ${logsSortDir === 1 ? "▲" : "▼"}`
        : label;
    }
  });
}

function renderObjectLogs(logs, { status = "" } = {}) {
  if (Array.isArray(logs)) detailLogRows = logs;
  const tbody = document.querySelector("#dd-logs tbody");
  const empty = document.getElementById("dd-logs-empty");
  const wrap = document.getElementById("dd-logs-wrap");
  if (!tbody) return;

  if (status) {
    closeLogModal();
    detailLogRows = [];
    logsPage = 1;
    tbody.innerHTML = "";
    if (wrap) wrap.hidden = true;
    if (empty) {
      empty.hidden = false;
      empty.textContent = status;
    }
    updateFullPager(
      {
        pager: document.getElementById("dd-logs-pager"),
        first: document.getElementById("dd-logs-first"),
        prev: document.getElementById("dd-logs-prev"),
        next: document.getElementById("dd-logs-next"),
        last: document.getElementById("dd-logs-last"),
        pageInput: document.getElementById("dd-logs-page-input"),
        pageOf: document.getElementById("dd-logs-page-of"),
      },
      { page: 1, pages: 1, total: 0, pageSize: DD_LOGS_PAGE_SIZE }
    );
    updateLogSortHeaders();
    return;
  }

  const sorted = sortedLogRows();
  if (!sorted.length) {
    closeLogModal();
    tbody.innerHTML = "";
    if (wrap) wrap.hidden = true;
    if (empty) {
      empty.hidden = false;
      empty.textContent = "No Error / Warning logs in the last 24 hours.";
    }
    updateFullPager(
      {
        pager: document.getElementById("dd-logs-pager"),
        first: document.getElementById("dd-logs-first"),
        prev: document.getElementById("dd-logs-prev"),
        next: document.getElementById("dd-logs-next"),
        last: document.getElementById("dd-logs-last"),
        pageInput: document.getElementById("dd-logs-page-input"),
        pageOf: document.getElementById("dd-logs-page-of"),
      },
      { page: 1, pages: 1, total: 0, pageSize: DD_LOGS_PAGE_SIZE }
    );
    updateLogSortHeaders();
    return;
  }

  if (wrap) wrap.hidden = false;
  if (empty) empty.hidden = true;
  const paged = sliceRows(sorted, logsPage, DD_LOGS_PAGE_SIZE);
  logsPage = paged.page;
  updateFullPager(
    {
      pager: document.getElementById("dd-logs-pager"),
      first: document.getElementById("dd-logs-first"),
      prev: document.getElementById("dd-logs-prev"),
      next: document.getElementById("dd-logs-next"),
      last: document.getElementById("dd-logs-last"),
      pageInput: document.getElementById("dd-logs-page-input"),
      pageOf: document.getElementById("dd-logs-page-of"),
    },
    {
      page: paged.page,
      pages: paged.pages,
      total: paged.total,
      pageSize: DD_LOGS_PAGE_SIZE,
    }
  );
  updateLogSortHeaders();
  const startIdx = (paged.page - 1) * DD_LOGS_PAGE_SIZE;
  tbody.innerHTML = paged.slice
    .map((r, i) => {
      const idx = startIdx + i;
      const sev = String(r.severity || "").toLowerCase();
      const badge =
        sev.includes("error") || sev === "err"
          ? "high"
          : sev.includes("warn")
            ? "medium"
            : "low";
      const active =
        logModalIndex >= 0 && logModalIndex === idx ? " is-log-active" : "";
      return `<tr class="dd-log-row${active}" data-log-idx="${idx}" title="Double-click for details">
        <td class="mono">${escapeHtml(r.timestampUtc)}</td>
        <td><span class="badge ${badge}">${escapeHtml(r.severity)}</span></td>
        <td>${escapeHtml(r.message)}</td>
      </tr>`;
    })
    .join("");
}

function logModalTitle(log) {
  if (!log) return "Log Details";
  const id = log.logId || log.id || "—";
  const when = log.localTime && log.localTime !== "—" ? log.localTime : log.timestampUtc;
  return `Log Details — ID: ${id} (${when})`;
}

function sectionsToPlainText(log) {
  const lines = [logModalTitle(log), ""];
  const sections = Array.isArray(log?.sections) ? log.sections : [];
  for (const sec of sections) {
    lines.push(`[${sec.title}]`);
    for (const f of sec.fields || []) {
      lines.push(`${f.name}\t${f.value ?? ""}`);
    }
    lines.push("");
  }
  if (!sections.length) {
    lines.push(`Timestamp (UTC)\t${log?.timestampUtc ?? ""}`);
    lines.push(`Severity\t${log?.severity ?? ""}`);
    lines.push(`Message\t${log?.message ?? ""}`);
  }
  return lines.join("\n").trim();
}

function renderLogModalBody(log) {
  const tbody = document.getElementById("dd-log-detail-body");
  if (!tbody) return;
  const sections = Array.isArray(log?.sections) ? log.sections : [];
  if (!sections.length) {
    tbody.innerHTML = `<tr class="dd-log-sec"><td colspan="2">Details</td></tr>
      <tr><td class="dd-log-name">Timestamp (UTC)</td><td class="dd-log-value">${escapeHtml(log?.timestampUtc)}</td></tr>
      <tr><td class="dd-log-name">Local Time</td><td class="dd-log-value">${escapeHtml(log?.localTime)}</td></tr>
      <tr><td class="dd-log-name">Severity</td><td class="dd-log-value">${escapeHtml(log?.severity)}</td></tr>
      <tr><td class="dd-log-name">Message</td><td class="dd-log-value">${escapeHtml(log?.message)}</td></tr>
      <tr><td class="dd-log-name">Log ID</td><td class="dd-log-value">${escapeHtml(log?.logId || log?.id)}</td></tr>`;
    return;
  }
  tbody.innerHTML = sections
    .map((sec) => {
      const collapsed = logModalCollapsed.has(sec.title);
      const tri = collapsed ? "▶" : "▼";
      const head = `<tr class="dd-log-sec" data-dd-log-sec="${escapeHtml(sec.title)}">
        <td colspan="2"><span class="dd-log-sec-toggle">${tri}</span>${escapeHtml(sec.title)}</td>
      </tr>`;
      if (collapsed) return head;
      const rows = (sec.fields || [])
        .map(
          (f) =>
            `<tr><td class="dd-log-name">${escapeHtml(f.name)}</td><td class="dd-log-value">${escapeHtml(f.value)}</td></tr>`
        )
        .join("");
      return head + rows;
    })
    .join("");
}

function syncLogModalNav(total, index) {
  const atStart = index <= 0;
  const atEnd = index >= total - 1 || total <= 0;
  const set = (id, disabled) => {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
  };
  set("dd-log-nav-first", atStart);
  set("dd-log-nav-page-up", atStart);
  set("dd-log-nav-prev", atStart);
  set("dd-log-nav-next", atEnd);
  set("dd-log-nav-page-down", atEnd);
  set("dd-log-nav-last", atEnd);
}

function showLogAtIndex(index) {
  const sorted = sortedLogRows();
  if (!sorted.length) {
    closeLogModal();
    return;
  }
  const idx = Math.max(0, Math.min(sorted.length - 1, index));
  logModalIndex = idx;
  const log = sorted[idx];

  // Keep table page in sync with the visible log
  const targetPage = Math.floor(idx / DD_LOGS_PAGE_SIZE) + 1;
  if (targetPage !== logsPage) {
    logsPage = targetPage;
    renderObjectLogs(detailLogRows);
  } else {
    document.querySelectorAll("#dd-logs tbody tr.dd-log-row").forEach((tr) => {
      tr.classList.toggle(
        "is-log-active",
        Number(tr.dataset.logIdx) === logModalIndex
      );
    });
  }

  const title = document.getElementById("dd-log-modal-title");
  if (title) title.textContent = logModalTitle(log);
  renderLogModalBody(log);
  syncLogModalNav(sorted.length, idx);

  const main = document.querySelector(".dd-log-modal-main");
  if (main) main.scrollTop = 0;
}

function openLogModal(index) {
  const modal = document.getElementById("dd-log-modal");
  if (!modal) return;
  modal.hidden = false;
  showLogAtIndex(index);
  document.getElementById("dd-log-nav-prev")?.focus();
}

function closeLogModal() {
  const modal = document.getElementById("dd-log-modal");
  if (modal) modal.hidden = true;
  logModalIndex = -1;
  document.querySelectorAll("#dd-logs tbody tr.is-log-active").forEach((tr) => {
    tr.classList.remove("is-log-active");
  });
}

/** Close Log Details when leaving Diagnostics (called from main nav). */
export function closeDrillLogModal() {
  closeLogModal();
  setLogsMaximized(false);
}

function setLogsMaximized(on) {
  logsMaximized = !!on;
  const card = document.querySelector(".dd-detail-card");
  const btn = document.getElementById("dd-logs-maximize");
  card?.classList.toggle("is-maximized", logsMaximized);
  if (btn) {
    btn.title = logsMaximized ? "Restore panel size" : "Maximize panel";
    btn.setAttribute(
      "aria-label",
      logsMaximized ? "Restore panel size" : "Maximize panel"
    );
    btn.classList.toggle("is-maximized", logsMaximized);
    const expand = btn.querySelector(".hm-ico-expand");
    const compress = btn.querySelector(".hm-ico-compress");
    if (expand) expand.hidden = logsMaximized;
    if (compress) compress.hidden = !logsMaximized;
  }
}

async function copyLogDetails() {
  const sorted = sortedLogRows();
  const log = sorted[logModalIndex];
  if (!log) return;
  const text = sectionsToPlainText(log);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } finally {
      ta.remove();
    }
  }
}

function onLogModalKeydown(e) {
  const modal = document.getElementById("dd-log-modal");
  if (modal && !modal.hidden) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeLogModal();
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      showLogAtIndex(logModalIndex - 1);
    } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      showLogAtIndex(logModalIndex + 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      showLogAtIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      showLogAtIndex(sortedLogRows().length - 1);
    } else if (e.key === "PageUp") {
      e.preventDefault();
      showLogAtIndex(logModalIndex - DD_LOGS_PAGE_SIZE);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      showLogAtIndex(logModalIndex + DD_LOGS_PAGE_SIZE);
    }
    return;
  }
  if (e.key === "Escape" && logsMaximized) {
    e.preventDefault();
    setLogsMaximized(false);
  }
}

function wireLogModalOnce() {
  if (logModalWired) return;
  logModalWired = true;

  document.querySelectorAll("[data-dd-log-close]").forEach((el) => {
    el.addEventListener("click", () => closeLogModal());
  });
  document.getElementById("dd-log-copy")?.addEventListener("click", () => {
    void copyLogDetails();
  });
  document.getElementById("dd-log-nav-first")?.addEventListener("click", () =>
    showLogAtIndex(0)
  );
  document.getElementById("dd-log-nav-page-up")?.addEventListener("click", () =>
    showLogAtIndex(logModalIndex - DD_LOGS_PAGE_SIZE)
  );
  document.getElementById("dd-log-nav-prev")?.addEventListener("click", () =>
    showLogAtIndex(logModalIndex - 1)
  );
  document.getElementById("dd-log-nav-next")?.addEventListener("click", () =>
    showLogAtIndex(logModalIndex + 1)
  );
  document
    .getElementById("dd-log-nav-page-down")
    ?.addEventListener("click", () =>
      showLogAtIndex(logModalIndex + DD_LOGS_PAGE_SIZE)
    );
  document.getElementById("dd-log-nav-last")?.addEventListener("click", () =>
    showLogAtIndex(sortedLogRows().length - 1)
  );

  document
    .getElementById("dd-log-detail-body")
    ?.addEventListener("click", (e) => {
      const sec = e.target.closest("tr.dd-log-sec");
      if (!sec) return;
      const title = sec.getAttribute("data-dd-log-sec");
      if (!title) return;
      if (logModalCollapsed.has(title)) logModalCollapsed.delete(title);
      else logModalCollapsed.add(title);
      const log = sortedLogRows()[logModalIndex];
      if (log) renderLogModalBody(log);
    });

  document.addEventListener("keydown", onLogModalKeydown);

  const logsTable = document.getElementById("dd-logs");
  logsTable?.addEventListener("dblclick", (e) => {
    const row = e.target.closest("tr.dd-log-row");
    if (!row) return;
    const idx = Number(row.dataset.logIdx);
    if (!Number.isFinite(idx)) return;
    openLogModal(idx);
  });
}

async function loadObjectLogsForDetail(obj) {
  const seq = ++detailLogsSeq;
  const objectId = obj?.objectId ?? obj?.id;
  if (objectId == null || objectId === "") {
    renderObjectLogs([], { status: "No Object ID available for log lookup." });
    return;
  }

  logsPage = 1;
  renderObjectLogs([], { status: "Loading logs (last 24h)…" });

  try {
    const ok = await ensureIwaSession({ force: false });
    if (!ok || !getStoredToken()) {
      if (seq !== detailLogsSeq) return;
      renderObjectLogs([], {
        status: "Connect with IWA to load object logs.",
      });
      return;
    }
    const logs = await fetchObjectSeverityLogs(objectId, {
      starttime: "*-1d",
      endtime: "*",
      limit: 50,
      path: obj?.path || "",
    });
    if (seq !== detailLogsSeq) return;
    logsPage = 1;
    renderObjectLogs(logs);
  } catch (err) {
    console.warn("[drill-down] logs", err);
    if (seq !== detailLogsSeq) return;
    renderObjectLogs([], {
      status: `Could not load logs: ${err.message || err}`,
    });
  }
}

function renderDetail(obj) {
  const empty = document.getElementById("dd-detail-empty");
  const body = document.getElementById("dd-detail-body");
  const title = document.getElementById("dd-detail-title");

  if (!obj) {
    if (title) title.textContent = "Recent Logs (Last 24h)";
    if (empty) empty.hidden = false;
    if (body) body.hidden = true;
    detailLogsSeq += 1;
    detailLogRows = [];
    closeLogModal();
    renderObjectLogs([], { status: "" });
    return;
  }

  if (title) title.textContent = "Recent Logs (Last 24h)";
  if (empty) empty.hidden = true;
  if (body) body.hidden = false;
  closeLogModal();
  loadObjectLogsForDetail(obj);
}

function readFiltersFromDom() {
  filters = {
    site: document.getElementById("dd-filter-site")?.value || "All",
    type: document.getElementById("dd-filter-type")?.value || "All",
    severity: document.getElementById("dd-filter-severity")?.value || "All",
    nonGoodOnly: !!document.getElementById("dd-filter-nongood")?.checked,
  };
}

function onTableClick(e) {
  const th = e.target.closest("th[data-dd-sort]");
  if (th) {
    const key = th.getAttribute("data-dd-sort");
    if (!key) return;
    if (key === sortKey) sortDir *= -1;
    else {
      sortKey = key;
      sortDir = 1;
    }
    page = 1;
    renderTable();
    return;
  }
  const row = e.target.closest("tr.dd-row");
  if (!row) return;
  selectedId = row.dataset.id;
  renderTable();
}

function wireDdLogsPagerOnce() {
  const root = document.getElementById("dd-logs-pager");
  if (!root || root.dataset.wired === "1") return;
  root.dataset.wired = "1";
  const go = (p) => {
    logsPage = clampPage(p, detailLogRows.length, DD_LOGS_PAGE_SIZE);
    renderObjectLogs(detailLogRows);
  };
  document.getElementById("dd-logs-first")?.addEventListener("click", () => go(1));
  document.getElementById("dd-logs-prev")?.addEventListener("click", () => go(logsPage - 1));
  document.getElementById("dd-logs-next")?.addEventListener("click", () => go(logsPage + 1));
  document.getElementById("dd-logs-last")?.addEventListener("click", () =>
    go(sliceRows(detailLogRows, 99999, DD_LOGS_PAGE_SIZE).pages)
  );
  const input = document.getElementById("dd-logs-page-input");
  input?.addEventListener("change", () => go(input.value));
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      go(input.value);
    }
  });
}

function onLogsSortClick(e) {
  const th = e.target.closest("th[data-dd-log-sort]");
  if (!th) return;
  const key = th.getAttribute("data-dd-log-sort");
  if (!key) return;
  if (key === logsSortKey) logsSortDir *= -1;
  else {
    logsSortKey = key;
    logsSortDir = key === "timestampUtc" ? -1 : 1;
  }
  logsPage = 1;
  if (logModalIndex >= 0) closeLogModal();
  renderObjectLogs(detailLogRows);
}

function wireDdPagerOnce() {
  const root = document.getElementById("dd-pager");
  if (!root || root.dataset.wired === "1") return;
  root.dataset.wired = "1";
  const go = (p) => {
    page = clampPage(p, filteredRows().length, DD_PAGE_SIZE);
    renderTable();
  };
  document.getElementById("dd-page-first")?.addEventListener("click", () => go(1));
  document.getElementById("dd-page-prev")?.addEventListener("click", () => go(page - 1));
  document.getElementById("dd-page-next")?.addEventListener("click", () => go(page + 1));
  document.getElementById("dd-page-last")?.addEventListener("click", () =>
    go(sliceRows(filteredRows(), 99999, DD_PAGE_SIZE).pages)
  );
  const input = document.getElementById("dd-page-input");
  input?.addEventListener("change", () => go(input.value));
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      go(input.value);
    }
  });
}

function applyRows(rows) {
  rawNavRows = Array.isArray(rows) ? rows : [];
  drillObjects = navRowsToDrillObjects(rawNavRows);
  fillFilterOptions();
  page = 1;
  renderTable();
}

async function loadLiveDrillData() {
  let rows = [...mockNavTableRows];
  try {
    const ok = await ensureIwaSession({ force: false });
    if (ok && getStoredToken()) {
      const live = await fetchLiveNavigationTable();
      if (live.length) rows = live;
    }
  } catch (err) {
    console.warn("[drill-down] nav table", err);
  }
  applyRows(rows);
}

function wireOnce() {
  if (wired) return;
  wired = true;

  const table = document.getElementById("dd-table");
  table?.addEventListener("click", onTableClick);
  document.getElementById("dd-logs")?.addEventListener("click", onLogsSortClick);
  wireDdPagerOnce();
  wireDdLogsPagerOnce();
  wireLogModalOnce();

  document.getElementById("dd-logs-maximize")?.addEventListener("click", () => {
    setLogsMaximized(!logsMaximized);
  });

  ["dd-filter-site", "dd-filter-type", "dd-filter-severity"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", () => {
      readFiltersFromDom();
      page = 1;
      renderTable();
    });
  });
  document.getElementById("dd-filter-nongood")?.addEventListener("change", () => {
    readFiltersFromDom();
    page = 1;
    renderTable();
  });
}

/**
 * @param {{ site?: string, type?: string, severity?: string, objectId?: string, nonGoodOnly?: boolean } | null} preset
 */
export function initDrillDownPage(preset = null) {
  wireOnce();

  if (preset) {
    if (preset.site) filters.site = preset.site;
    if (preset.type) filters.type = preset.type;
    if (preset.severity) filters.severity = preset.severity;
    if (preset.objectId) selectedId = preset.objectId;
    if (typeof preset.nonGoodOnly === "boolean") {
      filters.nonGoodOnly = preset.nonGoodOnly;
    }
  }

  if (!drillObjects.length) {
    applyRows(mockNavTableRows);
  } else {
    fillFilterOptions();
    renderTable();
  }

  loadLiveDrillData();
}
