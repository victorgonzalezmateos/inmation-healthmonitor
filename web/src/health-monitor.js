import {
  countersForNode,
  mockNavTableRows,
  propsForNode,
  treeRoots as mockTreeRoots,
} from "./hm-mock-data.js";
import {
  getStoredToken,
  peekTokenClaims,
  setManualToken,
} from "./api/inmation.js";
import {
  disconnectIwaSession,
  ensureIwaSession,
  setTopbarConnectionState,
} from "./session.js";
import {
  classifyNavHealth,
  fetchCounterHistorySeries,
  fetchLiveCounters,
  fetchLiveNavigationTable,
  fetchLiveNavigationTree,
  fetchLiveObjProps,
  resolveHmImageUrl,
} from "./api/hm-live.js";
import {
  buildSeriesFromSelectedCounters,
  destroyChartInstance,
  paintTrendChart,
  resetChartCanvas,
} from "./hm-chart-paint.js";
import {
  DEFAULT_PERIOD,
  formatPeriodSummary,
  fromDatetimeLocalValue,
  lengthPartsFromMs,
  msFromLengthParts,
  periodDurationMs,
  PRESET_PERIODS,
  resolvePeriodInstant,
  toDatetimeLocalValue,
} from "./hm-chart-period.js";
import { formatHmTimestamp } from "./hm-time-format.js";

let mode = "mock"; // "mock" | "live"
let treeRoots = mockTreeRoots;
let selectedId = "core";
const expanded = new Set(["io-model", "system", "core", "server-model"]);
let liveProps = null;
let liveCounters = [];
let busy = false;
let autoConnectStarted = false;

/** @type {Array<Record<string, unknown>>} */
let counterRows = [];
/** @type {Set<string>} */
const selectedCounterKeys = new Set();
let sortKey = "ObjectName";
let sortDir = 1; // 1 asc, -1 desc
let countersPanelView = "table"; // "table" | "chart" | "values"
let hmChartInstance = null;
/** @type {Array<Record<string, unknown>>} */
let chartSourceRows = [];
/** @type {{ labels: string[], pens: unknown[], empty?: boolean } | null} */
let lastChartPayload = null;
/** @type {Set<string>} pens visible on the chart */
let enabledPenKeys = new Set();
let chartMaximized = false;
/** @type {{ start: string, end: string, intervals: number }} */
let chartPeriod = { ...DEFAULT_PERIOD };
let chartReloadBusy = false;
let periodDraft = { ...DEFAULT_PERIOD };
let valuesPageSize = 50;
let valuesPageIndex = 0; // 0-based

/** "tree" | "list" */
let navView = "tree";
/** @type {Array<Record<string, unknown>>} */
let navTableRows = [...mockNavTableRows];
let navSortKey = "name";
let navSortDir = 1;
let navTableLoaded = false;

function findNode(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function findNodeByPath(nodes, path) {
  if (!path) return null;
  const want = String(path).replace(/\/+$/, "");
  for (const n of nodes) {
    const p = String(n.path || "").replace(/\/+$/, "");
    if (p && p === want) return n;
    if (n.children?.length) {
      const found = findNodeByPath(n.children, path);
      if (found) return found;
    }
  }
  return null;
}

function findNodeByObjectId(nodes, objectId) {
  if (objectId == null || objectId === "") return null;
  const want = String(objectId);
  for (const n of nodes) {
    if (String(n.id) === want || String(n.objectId ?? "") === want) return n;
    if (n.children?.length) {
      const found = findNodeByObjectId(n.children, objectId);
      if (found) return found;
    }
  }
  return null;
}

/** Tree node, or synthetic node from navigation table row (list view). */
function resolveSelectedNode() {
  const fromTree =
    findNode(treeRoots, selectedId) ||
    findNodeByObjectId(treeRoots, selectedId);
  if (fromTree) return fromTree;

  const row = navTableRows.find((r) => String(r.id) === String(selectedId));
  return nodeFromNavRow(row);
}

function nodeFromNavRow(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name || "—",
    path: row.path || "",
    type: row.type || "—",
    objectId: row.id,
    image: row.image || "",
    children: [],
  };
}

function firstLeafOrRoot(nodes) {
  if (!nodes?.length) return null;
  return nodes[0];
}

function penKey(p, i = 0) {
  return String(p?.path || p?.name || `pen-${i}`);
}

function resetEnabledPens(pens) {
  enabledPenKeys = new Set((pens || []).map((p, i) => penKey(p, i)));
}

function retainEnabledPens(pens) {
  const keys = (pens || []).map((p, i) => penKey(p, i));
  if (!keys.length) {
    enabledPenKeys = new Set();
    return;
  }
  if (!enabledPenKeys.size) {
    enabledPenKeys = new Set(keys);
    return;
  }
  const oldKeys = new Set(
    (lastChartPayload?.pens || []).map((p, i) => penKey(p, i))
  );
  const next = new Set();
  for (const k of keys) {
    if (enabledPenKeys.has(k) || !oldKeys.has(k)) next.add(k);
  }
  enabledPenKeys = next;
}

function payloadWithVisiblePens(payload) {
  if (!payload?.pens?.length) return payload;
  const pens = payload.pens.filter((p, i) => enabledPenKeys.has(penKey(p, i)));
  return {
    ...payload,
    pens,
    empty: pens.length === 0,
  };
}

function renderTreeNodes(nodes, depth = 0) {
  return nodes
    .map((n) => {
      const hasKids = n.children && n.children.length > 0;
      const isOpen = expanded.has(n.id);
      const isSel = n.id === selectedId;
      const kids =
        hasKids && isOpen ? renderTreeNodes(n.children, depth + 1) : "";
      return `
        <li class="hm-tree-item" style="--depth:${depth}">
          <button type="button" class="hm-tree-row${isSel ? " selected" : ""}" data-id="${escapeHtml(n.id)}" data-toggle="${hasKids ? "1" : "0"}">
            <span class="hm-tree-twist${hasKids ? "" : " empty"}">${hasKids ? (isOpen ? "▾" : "▸") : ""}</span>
            <span class="hm-tree-label">${escapeHtml(n.name)}</span>
          </button>
          ${hasKids && isOpen ? `<ul class="hm-tree-children">${kids}</ul>` : ""}
        </li>`;
    })
    .join("");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPropsFromObject(p, { live = false } = {}) {
  const box = document.getElementById("hm-props");
  const head = document.getElementById("hm-props-head");
  if (head) {
    head.textContent = "Object Properties";
  }
  if (!box) return;
  if (!p) {
    box.innerHTML = `<p class="hm-props-empty">Select an object in the tree.</p>`;
    return;
  }

  const access = p.access;
  if (
    access != null &&
    /den(y|ied)|restrict|forbidden|no\s*access/i.test(String(access))
  ) {
    box.innerHTML = `<p class="hm-props-empty">Access denied (${escapeHtml(String(access))})</p>`;
    return;
  }

  const objectIdDisplay =
    p.ObjectIDExtended != null && p.ObjectIDExtended !== ""
      ? p.ObjectIDExtended
      : p.ObjectID;

  const imgSrc = resolveHmImageUrl(p.Image);
  const imgHtml = imgSrc
    ? `<img class="hm-prop-icon" src="${escapeHtml(imgSrc)}" alt="" width="40" height="40" loading="lazy"
        onerror="this.style.display='none'" />`
    : `<div class="hm-prop-icon hm-prop-icon-empty" aria-hidden="true"></div>`;

  // Layout like DataStudio: icon left of Name+Type, then full-width rows
  box.innerHTML = `
    <div class="hm-prop-top">
      ${imgHtml}
      <div class="hm-prop-top-fields">
        <div class="hm-prop-row">
          <span class="hm-prop-key">Name</span>
          <span class="hm-prop-val">${escapeHtml(fmtProp(p.ObjectName))}</span>
        </div>
        <div class="hm-prop-row">
          <span class="hm-prop-key">Type</span>
          <span class="hm-prop-val">${escapeHtml(fmtProp(p.Type))}</span>
        </div>
      </div>
    </div>
    <div class="hm-prop-row">
      <span class="hm-prop-key">Object ID</span>
      <span class="hm-prop-val">${escapeHtml(fmtProp(objectIdDisplay))}</span>
    </div>
    <div class="hm-prop-row">
      <span class="hm-prop-key">Item Path</span>
      <span class="hm-prop-val hm-prop-val-path">${escapeHtml(fmtProp(p.Path))}</span>
    </div>
    <div class="hm-prop-row hm-prop-versions">
      <span class="hm-prop-key">Config Version</span>
      <span class="hm-prop-val hm-version-pair">
        <span class="hm-audit-box">${escapeHtml(fmtProp(p.ConfigVersion))}</span>
        <span class="hm-prop-key hm-prop-key-inline">Class version</span>
        <span class="hm-audit-box">${escapeHtml(fmtProp(p.ClassVersion))}</span>
      </span>
    </div>
    ${renderAuditRow("Created", p.Created)}
    ${renderAuditRow("Modified", p.Modified)}
    ${renderStateRow(p.State)}
  `;
}

function fmtProp(val) {
  if (val == null || val === "") return "—";
  return String(val);
}

/** Format HM timestamps like DataStudio: 22-Oct-18 14:50:26.031 */
function formatHmDate(raw) {
  if (raw == null || raw === "") return "—";
  if (typeof raw === "object") {
    if ("v" in raw) return formatHmDate(raw.v);
    if ("date" in raw) return formatHmDate(raw.date);
  }

  let d = null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    // seconds vs milliseconds
    const ms = raw < 1e12 ? raw * 1000 : raw;
    d = new Date(ms);
  } else {
    const s = String(raw).trim();
    if (/^\d{10,13}$/.test(s)) {
      const n = Number(s);
      d = new Date(s.length <= 10 ? n * 1000 : n);
    } else {
      const parsed = Date.parse(s);
      if (!Number.isNaN(parsed)) d = new Date(parsed);
      else return s; // already human-readable
    }
  }

  if (!d || Number.isNaN(d.getTime())) return String(raw);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dd = String(d.getDate()).padStart(2, "0");
  const mon = months[d.getMonth()];
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${dd}-${mon}-${yy} ${hh}:${mm}:${ss}.${ms}`;
}

function splitAudit(val) {
  if (val && typeof val === "object" && !Array.isArray(val)) {
    return {
      date: val.date ?? val.Date ?? val.t ?? val.time ?? null,
      user: val.user ?? val.User ?? val.u ?? null,
    };
  }
  if (val == null || val === "") return { date: null, user: null };
  return { date: val, user: null };
}

function renderAuditRow(label, val) {
  const { date, user } = splitAudit(val);
  return `<div class="hm-prop-row hm-prop-audit">
    <span class="hm-prop-key">${escapeHtml(label)}</span>
    <span class="hm-prop-val hm-audit-pair">
      <span class="hm-audit-box" title="Date">${escapeHtml(formatHmDate(date))}</span>
      <span class="hm-audit-box hm-audit-user" title="User">${escapeHtml(fmtProp(user))}</span>
    </span>
  </div>`;
}

function renderStateRow(state) {
  if (state == null || state === "") {
    return `<div class="hm-prop-row">
      <span class="hm-prop-key">State</span>
      <span class="hm-prop-val">—</span>
    </div>`;
  }
  const raw = String(state);
  const segments = raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  const chips = (segments.length ? segments : [raw])
    .map((s) => {
      const cls = stateAccentClass(s);
      return `<span class="hm-state-seg ${cls}">${escapeHtml(s)}</span>`;
    })
    .join("");
  return `<div class="hm-prop-row hm-prop-state">
    <span class="hm-prop-key">State</span>
    <span class="hm-prop-val"><div class="hm-state-segs">${chips}</div></span>
  </div>`;
}

function stateAccentClass(state) {
  if (/COMM_ERROR|STATE_ERROR/.test(state)) return "accent-bad";
  if (/OBJ_DISABLED/.test(state)) return "accent-muted";
  if (/COMM_GOOD|STATE_GOOD|OBJ_ENABLED/.test(state)) return "accent-good";
  return "accent-good";
}

function counterRowKey(r) {
  return String(r.path || r.penName || r.ObjectName || "");
}

function canSubmitRow(r) {
  // Any named counter can be charted; path only required for live history
  return !!(r && (r.ObjectName || r.penName || r.path));
}

function compareCounterValues(a, b, key) {
  let va = a?.[key];
  let vb = b?.[key];
  if (key === "Value") {
    const na = Number(va);
    const nb = Number(vb);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  }
  va = va == null ? "" : String(va);
  vb = vb == null ? "" : String(vb);
  return va.localeCompare(vb, undefined, { numeric: true, sensitivity: "base" });
}

function sortedCounterRows(rows) {
  const list = [...(rows || [])];
  if (!sortKey) return list;
  list.sort((a, b) => sortDir * compareCounterValues(a, b, sortKey));
  return list;
}

function updateSortHeaderUi() {
  document.querySelectorAll("#hm-counters-table th[data-sort]").forEach((th) => {
    const key = th.dataset.sort;
    th.classList.toggle("is-sorted", key === sortKey);
    th.dataset.dir = key === sortKey ? (sortDir === 1 ? "asc" : "desc") : "";
    const btn = th.querySelector(".hm-sort-btn");
    if (btn) {
      const label = btn.dataset.label || btn.textContent.replace(/\s*[▲▼]$/, "");
      btn.textContent =
        key === sortKey ? `${label} ${sortDir === 1 ? "▲" : "▼"}` : label;
    }
  });
}

function updateSelectionUi() {
  const submit = document.getElementById("hm-submit");
  const hint = document.getElementById("hm-selection-hint");
  const selectAll = document.getElementById("hm-select-all");
  const selected = counterRows.filter((r) =>
    selectedCounterKeys.has(counterRowKey(r))
  );
  const submittable = selected.filter(canSubmitRow);
  if (submit) submit.disabled = submittable.length === 0;
  if (hint) {
    hint.textContent = selected.length
      ? `${selected.length} selected`
      : "Click rows to select";
  }
  if (selectAll) {
    const keys = counterRows.map(counterRowKey).filter(Boolean);
    const n = keys.filter((k) => selectedCounterKeys.has(k)).length;
    selectAll.checked = keys.length > 0 && n === keys.length;
    selectAll.indeterminate = n > 0 && n < keys.length;
  }
}

function setCountersPanelView(view) {
  countersPanelView = view;
  const countersView = document.getElementById("hm-counters-view");
  const chartView = document.getElementById("hm-chart-view");
  const valuesView = document.getElementById("hm-values-view");
  const btnCounters = document.getElementById("hm-view-table");
  const btnChart = document.getElementById("hm-view-chart");
  const btnValues = document.getElementById("hm-view-values");
  const maxBtn = document.getElementById("hm-chart-maximize");

  if (countersView) countersView.hidden = view !== "table";
  if (chartView) chartView.hidden = view !== "chart";
  if (valuesView) valuesView.hidden = view !== "values";

  btnCounters?.classList.toggle("is-active", view === "table");
  btnChart?.classList.toggle("is-active", view === "chart");
  btnValues?.classList.toggle("is-active", view === "values");

  const canMaximize = view === "chart" || view === "values";
  if (maxBtn) maxBtn.hidden = !canMaximize;
  if (!canMaximize && chartMaximized) {
    setChartMaximized(false);
  }
}

function setChartMaximized(on) {
  chartMaximized = !!on;
  const card = document.querySelector(".hm-counters-card");
  const btn = document.getElementById("hm-chart-maximize");
  card?.classList.toggle("is-maximized", chartMaximized);
  if (btn) {
    btn.title = chartMaximized ? "Restore panel size" : "Maximize panel";
    btn.setAttribute(
      "aria-label",
      chartMaximized ? "Restore panel size" : "Maximize panel"
    );
    btn.classList.toggle("is-maximized", chartMaximized);
    const expand = btn.querySelector(".hm-ico-expand");
    const compress = btn.querySelector(".hm-ico-compress");
    if (expand) expand.hidden = chartMaximized;
    if (compress) compress.hidden = !chartMaximized;
  }
}

function destroyHmChart() {
  hmChartInstance = destroyChartInstance(hmChartInstance);
}

function updatePeriodSummaryBtn() {
  const text = `${chartPeriod.start} → ${chartPeriod.end}`;
  const el = document.getElementById("hm-period-summary");
  const el2 = document.getElementById("hm-period-summary-values");
  if (el) el.textContent = text;
  if (el2) el2.textContent = text;
}

function setChartPanelStatus(text, kind = "info") {
  const el = document.getElementById("hm-chart-status");
  if (!el) return;
  el.textContent = text;
  el.dataset.kind = kind;
}

function syncLengthFieldsFromPeriod(period) {
  const parts = lengthPartsFromMs(periodDurationMs(period));
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = String(v);
  };
  set("hm-period-len-d", parts.d);
  set("hm-period-len-h", parts.h);
  set("hm-period-len-m", parts.m);
  set("hm-period-len-s", parts.s);
  set("hm-period-len-ms", parts.ms);
}

function readLengthPartsFromUi() {
  const num = (id) => Number(document.getElementById(id)?.value || 0) || 0;
  return {
    d: num("hm-period-len-d"),
    h: num("hm-period-len-h"),
    m: num("hm-period-len-m"),
    s: num("hm-period-len-s"),
    ms: num("hm-period-len-ms"),
  };
}

function fillPeriodModal(period) {
  periodDraft = { ...period };
  const startTok = period.start || "*-1h";
  const endTok = period.end || "*";
  const intervals = period.intervals || 60;

  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v;
  };
  setVal("hm-period-bar-start", startTok);
  setVal("hm-period-bar-end", endTok);
  setVal("hm-period-bar-intervals", String(intervals));
  setVal("hm-period-start-token", startTok);
  setVal("hm-period-end-token", endTok);
  setVal("hm-period-intervals", String(intervals));
  setVal(
    "hm-period-start-dt",
    toDatetimeLocalValue(resolvePeriodInstant(startTok))
  );
  setVal(
    "hm-period-end-dt",
    toDatetimeLocalValue(resolvePeriodInstant(endTok))
  );
  syncLengthFieldsFromPeriod(period);
}

function readPeriodFromModal() {
  const start =
    document.getElementById("hm-period-start-token")?.value.trim() ||
    document.getElementById("hm-period-bar-start")?.value.trim() ||
    "*-1h";
  const end =
    document.getElementById("hm-period-end-token")?.value.trim() ||
    document.getElementById("hm-period-bar-end")?.value.trim() ||
    "*";
  const intervals = Math.max(
    2,
    Number(
      document.getElementById("hm-period-intervals")?.value ||
        document.getElementById("hm-period-bar-intervals")?.value ||
        60
    ) || 60
  );
  return { start, end, intervals };
}

function openPeriodModal() {
  const modal = document.getElementById("hm-period-modal");
  fillPeriodModal(chartPeriod);
  if (modal) modal.hidden = false;
}

function closePeriodModal() {
  const modal = document.getElementById("hm-period-modal");
  if (modal) modal.hidden = true;
}

function applyPeriodPreset(key) {
  const preset = PRESET_PERIODS[key];
  if (!preset) return;
  fillPeriodModal({
    start: preset.start,
    end: preset.end,
    intervals: preset.intervals,
  });
}

function onStartTokenChanged() {
  const tok = document.getElementById("hm-period-start-token")?.value.trim();
  const bar = document.getElementById("hm-period-bar-start");
  const dt = document.getElementById("hm-period-start-dt");
  if (bar && tok != null) bar.value = tok;
  if (dt && tok) dt.value = toDatetimeLocalValue(resolvePeriodInstant(tok));
  const period = readPeriodFromModal();
  syncLengthFieldsFromPeriod(period);
}

function onEndTokenChanged() {
  const tok = document.getElementById("hm-period-end-token")?.value.trim();
  const bar = document.getElementById("hm-period-bar-end");
  const dt = document.getElementById("hm-period-end-dt");
  if (bar && tok != null) bar.value = tok;
  if (dt && tok) dt.value = toDatetimeLocalValue(resolvePeriodInstant(tok));
  const period = readPeriodFromModal();
  syncLengthFieldsFromPeriod(period);
}

function onStartDtChanged() {
  const dt = fromDatetimeLocalValue(
    document.getElementById("hm-period-start-dt")?.value
  );
  if (!dt) return;
  const iso = dt.toISOString();
  const tok = document.getElementById("hm-period-start-token");
  const bar = document.getElementById("hm-period-bar-start");
  if (tok) tok.value = iso;
  if (bar) bar.value = iso;
  syncLengthFieldsFromPeriod(readPeriodFromModal());
}

function onEndDtChanged() {
  const dt = fromDatetimeLocalValue(
    document.getElementById("hm-period-end-dt")?.value
  );
  if (!dt) return;
  // End "*" means now — if user picks calendar, use absolute
  const iso = dt.toISOString();
  const tok = document.getElementById("hm-period-end-token");
  const bar = document.getElementById("hm-period-bar-end");
  if (tok) tok.value = iso;
  if (bar) bar.value = iso;
  syncLengthFieldsFromPeriod(readPeriodFromModal());
}

function onLengthChanged() {
  const ms = msFromLengthParts(readLengthPartsFromUi());
  const endTok =
    document.getElementById("hm-period-end-token")?.value.trim() || "*";
  const end = resolvePeriodInstant(endTok);
  const start = new Date(end.getTime() - Math.max(60_000, ms));
  const startIso = start.toISOString();
  const tok = document.getElementById("hm-period-start-token");
  const bar = document.getElementById("hm-period-bar-start");
  const dt = document.getElementById("hm-period-start-dt");
  // Prefer relative if end is * and length matches a simple hour/day
  let startToken = startIso;
  if (endTok === "*") {
    const hours = ms / 3_600_000;
    const days = ms / 86_400_000;
    if (Number.isInteger(hours) && hours > 0 && hours <= 48) {
      startToken = `*-${hours}h`;
    } else if (Number.isInteger(days) && days > 0 && days <= 30) {
      startToken = `*-${days}d`;
    }
  }
  if (tok) tok.value = startToken;
  if (bar) bar.value = startToken;
  if (dt) dt.value = toDatetimeLocalValue(start);
}

function commitPeriodFromModal({ close } = { close: false }) {
  const period = readPeriodFromModal();
  chartPeriod = period;
  updatePeriodSummaryBtn();
  if (close) closePeriodModal();
  if (chartSourceRows.length) onChartPeriodApplied();
}

function wirePeriodModal() {
  const open = () => openPeriodModal();
  document.getElementById("hm-period-open")?.addEventListener("click", open);
  document
    .getElementById("hm-period-open-values")
    ?.addEventListener("click", open);
  document.querySelectorAll("[data-period-close]").forEach((el) => {
    el.addEventListener("click", () => closePeriodModal());
  });
  document.querySelectorAll("[data-period-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyPeriodPreset(btn.getAttribute("data-period-preset"));
    });
  });
  document
    .getElementById("hm-period-start-token")
    ?.addEventListener("change", onStartTokenChanged);
  document
    .getElementById("hm-period-end-token")
    ?.addEventListener("change", onEndTokenChanged);
  document
    .getElementById("hm-period-bar-start")
    ?.addEventListener("change", () => {
      const v = document.getElementById("hm-period-bar-start")?.value;
      const tok = document.getElementById("hm-period-start-token");
      if (tok && v != null) tok.value = v;
      onStartTokenChanged();
    });
  document
    .getElementById("hm-period-bar-end")
    ?.addEventListener("change", () => {
      const v = document.getElementById("hm-period-bar-end")?.value;
      const tok = document.getElementById("hm-period-end-token");
      if (tok && v != null) tok.value = v;
      onEndTokenChanged();
    });
  document
    .getElementById("hm-period-bar-intervals")
    ?.addEventListener("change", () => {
      const v = document.getElementById("hm-period-bar-intervals")?.value;
      const i = document.getElementById("hm-period-intervals");
      if (i && v != null) i.value = v;
    });
  document
    .getElementById("hm-period-intervals")
    ?.addEventListener("change", () => {
      const v = document.getElementById("hm-period-intervals")?.value;
      const i = document.getElementById("hm-period-bar-intervals");
      if (i && v != null) i.value = v;
    });
  document
    .getElementById("hm-period-start-dt")
    ?.addEventListener("change", onStartDtChanged);
  document
    .getElementById("hm-period-end-dt")
    ?.addEventListener("change", onEndDtChanged);
  ["d", "h", "m", "s", "ms"].forEach((u) => {
    document
      .getElementById(`hm-period-len-${u}`)
      ?.addEventListener("change", onLengthChanged);
  });
  document.getElementById("hm-period-apply")?.addEventListener("click", () => {
    commitPeriodFromModal({ close: false });
  });
  document.getElementById("hm-period-ok")?.addEventListener("click", () => {
    commitPeriodFromModal({ close: true });
  });
  updatePeriodSummaryBtn();
}

function waitForLayout() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function renderChartPensLegend(pens) {
  const el = document.getElementById("hm-chart-pens");
  if (!el) return;
  if (!pens?.length) {
    el.innerHTML = "";
    return;
  }
  const multi = pens.length > 1;
  el.innerHTML = pens
    .map((p, i) => {
      const key = penKey(p, i);
      const on = enabledPenKeys.has(key);
      return `<button type="button" class="hm-chart-pen${on ? "" : " is-off"}${multi ? " is-toggle" : ""}" data-pen-key="${escapeHtml(key)}" ${multi ? "" : "disabled"} title="${multi ? (on ? "Hide series" : "Show series") : ""}">
        <span class="hm-chart-pen-check" aria-hidden="true">${on ? "☑" : "☐"}</span>
        <i class="hm-chart-pen-swatch" style="background:${escapeHtml(p.color || "#00bcff")}"></i>
        <span class="hm-chart-pen-name">${escapeHtml(p.name || "Pen")}</span>
        <span class="hm-chart-pen-meta">${escapeHtml(String(p.current ?? ""))}${p.unit ? ` ${escapeHtml(p.unit)}` : ""}</span>
      </button>`;
    })
    .join("");
}

function onChartPensClick(e) {
  const btn = e.target.closest(".hm-chart-pen.is-toggle");
  if (!btn || !lastChartPayload) return;
  const key = btn.dataset.penKey;
  if (!key) return;
  if (enabledPenKeys.has(key)) enabledPenKeys.delete(key);
  else enabledPenKeys.add(key);
  if (countersPanelView === "chart") {
    renderHmCounterChartFromPayload(lastChartPayload);
  } else if (countersPanelView === "values") {
    renderValuesTableFromPayload(lastChartPayload);
  }
}

function showChartEmpty(message) {
  const empty = document.getElementById("hm-chart-empty");
  const wrap = document.getElementById("hm-chart-wrap");
  destroyHmChart();
  renderChartPensLegend([]);
  setChartPanelStatus(message, "info");
  if (empty) {
    empty.hidden = false;
    empty.textContent = message;
  }
  if (wrap) {
    wrap.hidden = true;
    wrap.style.display = "";
  }
}

async function renderHmCounterChartFromPayload(payload) {
  const empty = document.getElementById("hm-chart-empty");
  const wrap = document.getElementById("hm-chart-wrap");
  const box = document.getElementById("hm-chart-canvas-box");

  if (!payload?.pens?.length || payload.empty) {
    showChartEmpty(
      payload?.empty
        ? "No historical data for the selected counters."
        : "Select counters in the table and click Submit."
    );
    return;
  }

  // Keep full legend; paint only enabled pens
  if (!enabledPenKeys.size) resetEnabledPens(payload.pens);
  renderChartPensLegend(payload.pens);

  const visible = payloadWithVisiblePens(payload);
  if (!visible.pens.length) {
    if (empty) {
      empty.hidden = false;
      empty.textContent =
        "All series hidden — click a pen above to show it again.";
    }
    if (wrap) {
      wrap.hidden = true;
      wrap.style.display = "";
    }
    destroyHmChart();
    setChartPanelStatus("All pens deselected", "info");
    return;
  }

  if (empty) empty.hidden = true;
  if (wrap) {
    wrap.hidden = false;
    wrap.style.display = "flex";
  }
  setChartPanelStatus(
    `Rendering ${visible.pens.length}/${payload.pens.length} pen(s)…`,
    "info"
  );

  await waitForLayout();

  try {
    destroyHmChart();
    const canvas = resetChartCanvas(box);
    if (!canvas) {
      showChartEmpty("Chart container missing — reload the page.");
      return;
    }
    await waitForLayout();
    const result = paintTrendChart(canvas, visible);
    hmChartInstance = result.chart;
    window.__hmLastChart = {
      pens: visible.pens.length,
      labels: payload.labels?.length || 0,
      mode: result.mode,
      error: result.error || null,
    };
    setChartPanelStatus(
      result.mode === "chartjs"
        ? `Trend · ${visible.pens.length}/${payload.pens.length} pen(s)`
        : `Trend · ${visible.pens.length}/${payload.pens.length} pen(s) · canvas fallback`,
      result.error ? "err" : "ok"
    );
  } catch (err) {
    console.error("[hm-chart] render", err);
    window.__hmLastChart = { error: String(err?.message || err) };
    showChartEmpty(`Chart render failed: ${err.message}`);
  }
}

async function showChartView() {
  setCountersPanelView("chart");
  if (lastChartPayload) {
    await renderHmCounterChartFromPayload(lastChartPayload);
  } else {
    showChartEmpty("Select counters in the table and click Submit.");
  }
}

function setValuesPanelStatus(text, kind = "info") {
  const el = document.getElementById("hm-values-status");
  if (!el) return;
  el.textContent = text;
  el.dataset.kind = kind;
}

function getValuesPageSize() {
  const sel = document.getElementById("hm-values-pagesize");
  const n = Number(sel?.value || valuesPageSize || 50);
  valuesPageSize = n === 100 ? 100 : 50;
  if (sel && String(sel.value) !== String(valuesPageSize)) {
    sel.value = String(valuesPageSize);
  }
  return valuesPageSize;
}

function formatValuesTimeCell(payload, index) {
  const raw = payload.times?.[index];
  if (raw != null) return formatHmTimestamp(raw);
  const label = payload.labels?.[index];
  if (label == null || label === "") return "—";
  // If label is already HM-formatted, keep it; otherwise try parse
  if (/^\d{2}-[A-Za-z]{3}-\d{2}\s/.test(String(label))) return String(label);
  return formatHmTimestamp(label) || String(label);
}

function updateValuesPagerUi(totalRows) {
  const pager = document.getElementById("hm-values-pager");
  const label = document.getElementById("hm-values-page-label");
  const prev = document.getElementById("hm-values-prev");
  const next = document.getElementById("hm-values-next");
  const pageSize = getValuesPageSize();
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  if (valuesPageIndex >= pageCount) valuesPageIndex = pageCount - 1;
  if (valuesPageIndex < 0) valuesPageIndex = 0;

  const showPager = totalRows > pageSize;
  if (pager) pager.hidden = !showPager;
  if (label) {
    label.textContent = `Page ${valuesPageIndex + 1} of ${pageCount} · ${totalRows} rows`;
  }
  if (prev) prev.disabled = valuesPageIndex <= 0;
  if (next) next.disabled = valuesPageIndex >= pageCount - 1;
}

function renderValuesTableFromPayload(payload) {
  const empty = document.getElementById("hm-values-empty");
  const wrap = document.getElementById("hm-values-wrap");
  const table = document.getElementById("hm-values-table");
  const thead = table?.querySelector("thead");
  const tbody = table?.querySelector("tbody");
  if (!table || !thead || !tbody) return;

  if (!payload?.pens?.length || payload.empty) {
    thead.innerHTML = "";
    tbody.innerHTML = "";
    if (empty) {
      empty.hidden = false;
      empty.textContent = "Select counters in the table and click Submit.";
    }
    if (wrap) wrap.hidden = true;
    updateValuesPagerUi(0);
    setValuesPanelStatus("Select counters and click Submit.", "info");
    return;
  }

  if (!enabledPenKeys.size) resetEnabledPens(payload.pens);

  const pens = payload.pens.filter((p, i) => enabledPenKeys.has(penKey(p, i)));
  if (!pens.length) {
    thead.innerHTML = "";
    tbody.innerHTML = "";
    if (empty) {
      empty.hidden = false;
      empty.textContent =
        "All series hidden — switch to chart view and re-enable pens.";
    }
    if (wrap) wrap.hidden = true;
    updateValuesPagerUi(0);
    setValuesPanelStatus("All pens deselected", "info");
    return;
  }

  const labels = payload.labels || [];
  const rowCount = Math.max(
    labels.length,
    ...(payload.times?.length ? [payload.times.length] : []),
    ...pens.map((p) => p.values?.length || 0)
  );

  const pageSize = getValuesPageSize();
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize));
  if (valuesPageIndex >= pageCount) valuesPageIndex = pageCount - 1;
  const start = valuesPageIndex * pageSize;
  const end = Math.min(rowCount, start + pageSize);

  thead.innerHTML = `<tr>
    <th scope="col">Time</th>
    ${pens
      .map((p) => {
        const title = p.unit ? `${p.name} (${p.unit})` : p.name;
        return `<th scope="col">${escapeHtml(title)}</th>`;
      })
      .join("")}
  </tr>`;

  const rows = [];
  for (let i = start; i < end; i++) {
    const time = formatValuesTimeCell(payload, i);
    const cells = pens
      .map((p) => {
        const v = p.values?.[i];
        const text =
          v == null || Number.isNaN(Number(v)) ? "—" : String(v);
        return `<td class="hm-num">${escapeHtml(text)}</td>`;
      })
      .join("");
    rows.push(
      `<tr><td class="hm-values-time">${escapeHtml(String(time))}</td>${cells}</tr>`
    );
  }
  tbody.innerHTML = rows.join("");

  if (empty) empty.hidden = true;
  if (wrap) wrap.hidden = false;
  updateValuesPagerUi(rowCount);
  setValuesPanelStatus(
    `Values · ${pens.length} pen(s) · showing ${start + 1}–${end} of ${rowCount} · ${chartPeriod.start} → ${chartPeriod.end}`,
    "ok"
  );
}

function showValuesView() {
  setCountersPanelView("values");
  updatePeriodSummaryBtn();
  if (lastChartPayload) {
    renderValuesTableFromPayload(lastChartPayload);
  } else {
    renderValuesTableFromPayload(null);
  }
}

function onValuesPageSizeChange() {
  valuesPageIndex = 0;
  getValuesPageSize();
  if (lastChartPayload) renderValuesTableFromPayload(lastChartPayload);
}

function onValuesPrevPage() {
  if (valuesPageIndex <= 0) return;
  valuesPageIndex -= 1;
  if (lastChartPayload) renderValuesTableFromPayload(lastChartPayload);
}

function onValuesNextPage() {
  valuesPageIndex += 1;
  if (lastChartPayload) renderValuesTableFromPayload(lastChartPayload);
}

function withTimeout(promiseOrFactory, ms, label = "Request") {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  const promise =
    typeof promiseOrFactory === "function"
      ? promiseOrFactory(ctrl.signal)
      : promiseOrFactory;

  return promise
    .catch((err) => {
      if (err?.name === "AbortError") {
        throw new Error(`${label} timed out after ${ms / 1000}s`);
      }
      throw err;
    })
    .finally(() => clearTimeout(timer));
}

function renderCounterRows(rows) {
  counterRows = Array.isArray(rows) ? rows : [];
  // Drop selections that no longer exist
  const valid = new Set(counterRows.map(counterRowKey).filter(Boolean));
  for (const k of [...selectedCounterKeys]) {
    if (!valid.has(k)) selectedCounterKeys.delete(k);
  }

  const tbody = document.querySelector("#hm-counters-table tbody");
  const empty = document.getElementById("hm-counters-empty");
  if (!tbody) return;

  if (!counterRows.length) {
    tbody.innerHTML = "";
    if (empty) {
      empty.hidden = false;
      empty.textContent =
        mode === "live"
          ? "No counters for this object (or still loading)."
          : "Select an object in the tree.";
    }
    updateSortHeaderUi();
    updateSelectionUi();
    return;
  }
  if (empty) empty.hidden = true;

  const sorted = sortedCounterRows(counterRows);
  tbody.innerHTML = sorted
    .map((r) => {
      const key = counterRowKey(r);
      const selected = selectedCounterKeys.has(key);
      const ok = canSubmitRow(r);
      return `<tr class="hm-counter-row${selected ? " is-selected" : ""}${ok ? "" : " is-disabled"}" data-key="${escapeHtml(key)}" tabindex="0">
        <td class="hm-col-check"><input type="checkbox" class="hm-row-check" ${selected ? "checked" : ""} ${ok ? "" : "disabled"} aria-label="Select ${escapeHtml(String(r.ObjectName || key))}" /></td>
        <td>${escapeHtml(r.ObjectName)}</td>
        <td>${escapeHtml(r.type)}</td>
        <td>${escapeHtml(r.group)}</td>
        <td class="hm-num">${escapeHtml(String(r.Value ?? ""))}</td>
        <td>${escapeHtml(r.Unit)}</td>
        <td class="hm-desc-cell">${escapeHtml(r.Description)}</td>
      </tr>`;
    })
    .join("");

  updateSortHeaderUi();
  updateSelectionUi();
}

function toggleCounterSelection(key, force) {
  if (!key) return;
  const row = counterRows.find((r) => counterRowKey(r) === key);
  if (!row || !canSubmitRow(row)) return;
  const on = force == null ? !selectedCounterKeys.has(key) : !!force;
  if (on) selectedCounterKeys.add(key);
  else selectedCounterKeys.delete(key);
  renderCounterRows(counterRows);
}

function onCountersTableClick(e) {
  const th = e.target.closest("th[data-sort]");
  if (th && e.target.closest(".hm-sort-btn, th[data-sort]")) {
    if (e.target.closest("#hm-select-all")) return;
    const key = th.dataset.sort;
    if (sortKey === key) sortDir = -sortDir;
    else {
      sortKey = key;
      sortDir = 1;
    }
    renderCounterRows(counterRows);
    return;
  }

  if (e.target.id === "hm-select-all" || e.target.closest("#hm-select-all")) {
    const selectAll = document.getElementById("hm-select-all");
    const on = !!selectAll?.checked;
    selectedCounterKeys.clear();
    if (on) {
      counterRows.forEach((r) => {
        if (canSubmitRow(r)) selectedCounterKeys.add(counterRowKey(r));
      });
    }
    renderCounterRows(counterRows);
    return;
  }

  const row = e.target.closest("tr.hm-counter-row");
  if (!row) return;
  const key = row.dataset.key;
  if (e.target.classList.contains("hm-row-check")) {
    toggleCounterSelection(key, e.target.checked);
    return;
  }
  toggleCounterSelection(key);
}

async function loadChartForSelection(selected, { flashSubmit = false } = {}) {
  if (!selected?.length) return;
  const period = { ...chartPeriod };
  const rangeLabel = formatPeriodSummary(period);
  const targetView =
    flashSubmit || countersPanelView === "table"
      ? "chart"
      : countersPanelView === "values"
        ? "values"
        : "chart";

  chartSourceRows = selected;
  setCountersPanelView(targetView);
  updatePeriodSummaryBtn();
  valuesPageIndex = 0;

  const estimate = buildSeriesFromSelectedCounters(selected, period);
  console.info("[hm-chart] pens", selected.length, period, estimate);
  resetEnabledPens(estimate.pens);
  lastChartPayload = estimate;

  if (targetView === "values") {
    renderValuesTableFromPayload(estimate);
  } else {
    await renderHmCounterChartFromPayload(estimate);
  }

  window.__hmDebugSubmit = {
    period,
    selected: selected.map((r) => ({
      name: r.ObjectName,
      path: r.path,
      value: r.Value,
    })),
    estimatePens: estimate.pens?.length,
    estimateLabels: estimate.labels?.length,
  };

  if (flashSubmit) {
    const submit = document.getElementById("hm-submit");
    submit?.classList.add("btn-submit-flash");
    setTimeout(() => submit?.classList.remove("btn-submit-flash"), 400);
  }

  updateSelectionUi();

  if (!(mode === "live" && getStoredToken())) {
    setStatus(`Chart · ${selected.length} pen(s) · ${rangeLabel}`, "ok");
    if (targetView === "chart") {
      setChartPanelStatus(
        `Trend · ${selected.length} pen(s) · ${period.start} → ${period.end}`,
        "ok"
      );
    }
    return;
  }

  setStatus(`Loading history · ${selected.length} pen(s)…`, "info");
  if (targetView === "chart") {
    setChartPanelStatus(
      `Loading history · ${period.start} → ${period.end}…`,
      "info"
    );
  } else {
    setValuesPanelStatus(
      `Loading history · ${period.start} → ${period.end}…`,
      "info"
    );
  }
  try {
    const live = await withTimeout(
      (signal) => fetchCounterHistorySeries(selected, { signal, period }),
      8_000,
      "readhistoricaldata"
    );
    if (!live.empty && live.pens?.some((p) => p.values?.length)) {
      retainEnabledPens(live.pens);
      lastChartPayload = live;
      if (targetView === "values") {
        renderValuesTableFromPayload(live);
      } else {
        await renderHmCounterChartFromPayload(live);
      }
      setStatus(
        `Chart · ${selected.length} pen(s) · ${period.start} → ${period.end} (live)`,
        "ok"
      );
    } else {
      if (targetView === "values") {
        renderValuesTableFromPayload(estimate);
        setValuesPanelStatus(
          `Values · ${selected.length} pen(s) · ${period.start} → ${period.end} (estimate)`,
          "info"
        );
      } else {
        setChartPanelStatus(
          `Trend · ${selected.length} pen(s) · ${period.start} → ${period.end} (estimate)`,
          "info"
        );
      }
      setStatus(`Chart · ${selected.length} pen(s) · estimate`, "info");
    }
  } catch (err) {
    console.warn("[hm-chart] history skipped", err);
    setStatus(`Chart · ${selected.length} pen(s) · estimate`, "info");
    if (targetView === "values") {
      setValuesPanelStatus(
        `Values · ${selected.length} pen(s) · ${period.start} → ${period.end} (estimate)`,
        "info"
      );
    } else {
      setChartPanelStatus(
        `Trend · ${selected.length} pen(s) · ${period.start} → ${period.end} (estimate)`,
        "info"
      );
    }
  } finally {
    updateSelectionUi();
  }
}

async function submitSelectedToChart() {
  const selected = sortedCounterRows(counterRows).filter(
    (r) => selectedCounterKeys.has(counterRowKey(r)) && canSubmitRow(r)
  );
  if (!selected.length) {
    setStatus("Select at least one counter with a path", "err");
    return;
  }
  await loadChartForSelection(selected, { flashSubmit: true });
}

async function onChartPeriodApplied() {
  if (chartReloadBusy) return;
  if (!chartSourceRows.length) return;
  chartReloadBusy = true;
  try {
    await loadChartForSelection(chartSourceRows);
  } finally {
    chartReloadBusy = false;
  }
}

function setStatus(text, kind = "info") {
  const el = document.getElementById("hm-conn-status");
  if (!el) return;
  el.textContent = text;
  el.dataset.kind = kind;
}

function updateConnUi() {
  const badge = document.getElementById("hm-conn-badge");
  const claims = peekTokenClaims();
  if (badge) {
    if (mode === "live" && getStoredToken()) {
      badge.textContent = "LIVE";
      badge.dataset.state = "live";
    } else {
      badge.textContent = "MOCK";
      badge.dataset.state = "mock";
    }
  }
  const user = document.getElementById("hm-conn-user");
  if (user) {
    user.textContent = claims?.sub
      ? String(claims.sub)
      : mode === "live"
        ? "(token OK)"
        : "—";
  }
}

async function loadLiveDetails(node) {
  if (!node || mode !== "live") return;
  setStatus(`Loading props/counters for ${node.name}…`, "info");

  // Load independently — counters must not wipe a successful props fetch
  let propsErr = null;
  let countersErr = null;

  try {
    liveProps = await fetchLiveObjProps(node);
    renderPropsFromObject(liveProps, { live: true });
  } catch (err) {
    propsErr = err;
    console.error("[hm-live] props", err);
    liveProps = null;
    const box = document.getElementById("hm-props");
    if (box) {
      box.innerHTML = `<p class="hm-props-empty">fetchObjProps failed: ${escapeHtml(err.message)}</p>`;
    }
  }

  try {
    liveCounters = await fetchLiveCounters(node, liveProps);
    renderCounterRows(liveCounters);
  } catch (err) {
    countersErr = err;
    console.error("[hm-live] counters", err);
    liveCounters = [];
    renderCounterRows([]);
  }

  if (!propsErr && !countersErr) {
    setStatus(
      `Live · ${node.name} · ${liveCounters.length} counters`,
      "ok"
    );
  } else if (propsErr && countersErr) {
    setStatus(`Details error: ${countersErr.message}`, "err");
  } else if (countersErr) {
    setStatus(
      `Props OK · counters: ${countersErr.message}`,
      "err"
    );
  } else {
    setStatus(`Counters OK · props: ${propsErr.message}`, "err");
  }
}

function refreshTreeOnly() {
  const list = document.getElementById("hm-tree");
  if (list) list.innerHTML = renderTreeNodes(treeRoots);
  renderNavList();
  applyNavView();
  const node = resolveSelectedNode();
  const title = document.getElementById("hm-counters-title");
  if (title && node) {
    title.textContent = `Performance Counters — ${node.name}`;
  } else if (title) {
    title.textContent = "Performance Counters";
  }
}

function applyNavView() {
  const tree = document.getElementById("hm-tree");
  const listWrap = document.getElementById("hm-nav-list-wrap");
  const propsCard = document.querySelector(".hm-props-card");
  const left = document.querySelector(".hm-left");
  const treeBtn = document.getElementById("hm-nav-tree-btn");
  const listBtn = document.getElementById("hm-nav-list-btn");
  const isList = navView === "list";

  if (tree) tree.hidden = isList;
  if (listWrap) listWrap.hidden = !isList;
  if (propsCard) propsCard.hidden = isList;
  left?.classList.toggle("is-nav-list", isList);
  treeBtn?.classList.toggle("is-active", !isList);
  listBtn?.classList.toggle("is-active", isList);
}

function sortedNavRows() {
  const rows = [...navTableRows];
  const dir = navSortDir;
  const field =
    navSortKey === "type"
      ? "type"
      : navSortKey === "object"
        ? "ObjectState"
        : "name";
  rows.sort((a, b) => {
    const av = String(a[field] ?? "").toLowerCase();
    const bv = String(b[field] ?? "").toLowerCase();
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
  return rows;
}

function renderNavList() {
  const table = document.getElementById("hm-nav-list-table");
  const tbody = table?.querySelector("tbody");
  const meta = document.getElementById("hm-nav-list-meta");
  if (!tbody) return;

  const rows = sortedNavRows();
  const selectedNode = resolveSelectedNode();
  const bad = rows.filter((r) => classifyNavHealth(r) === "bad").length;
  const warn = rows.filter((r) => classifyNavHealth(r) === "warning").length;
  if (meta) {
    meta.textContent = `${rows.length} objects${bad || warn ? ` · ${bad} problems · ${warn} warnings` : ""}`;
  }

  table?.querySelectorAll("th[data-nav-sort]").forEach((th) => {
    const key = th.getAttribute("data-nav-sort");
    const active = key === navSortKey;
    th.classList.toggle("is-sorted", active);
    th.dataset.dir = active ? (navSortDir === 1 ? "asc" : "desc") : "";
    const btn = th.querySelector(".hm-sort-btn");
    if (btn) {
      const label = btn.dataset.label || btn.textContent.replace(/\s*[▲▼]$/, "");
      btn.textContent = active
        ? `${label} ${navSortDir === 1 ? "▲" : "▼"}`
        : label;
    }
  });

  tbody.innerHTML = rows
    .map((r) => {
      const health = classifyNavHealth(r);
      const sel =
        String(r.id) === String(selectedId) ||
        (r.path && selectedNode?.path && r.path === selectedNode.path);
      const displayName = r.name || r.path || "—";
      const objectState = r.ObjectState || "—";
      return `<tr class="hm-nav-row health-${health}${sel ? " is-selected" : ""}" data-id="${escapeHtml(String(r.id))}" data-path="${escapeHtml(String(r.path || ""))}" title="${escapeHtml([r.path, r.WorstState, r.CommState, r.ObjectState].filter(Boolean).join(" · "))}">
        <td class="hm-nav-name">${escapeHtml(displayName)}</td>
        <td class="hm-nav-type">${escapeHtml(String(r.type || "—"))}</td>
        <td class="hm-nav-object">${escapeHtml(String(objectState))}</td>
      </tr>`;
    })
    .join("");
}

async function ensureNavTableLoaded({ force = false } = {}) {
  if (navTableLoaded && !force) return;
  if (mode === "live" && getStoredToken()) {
    try {
      const rows = await fetchLiveNavigationTable();
      if (rows.length) {
        navTableRows = rows;
        navTableLoaded = true;
        renderNavList();
        return;
      }
    } catch (err) {
      console.warn("[hm-nav] fetchNavigationTable", err);
    }
  }
  navTableRows = [...mockNavTableRows];
  navTableLoaded = mode !== "live";
  renderNavList();
}

async function setNavView(view) {
  navView = view === "list" ? "list" : "tree";
  applyNavView();
  if (navView === "list") {
    await ensureNavTableLoaded();
    renderNavList();
  }
}

function onNavListClick(e) {
  const th = e.target.closest("th[data-nav-sort]");
  if (th) {
    const key = th.getAttribute("data-nav-sort");
    if (key === navSortKey) navSortDir *= -1;
    else {
      navSortKey = key;
      navSortDir = 1;
    }
    renderNavList();
    return;
  }
  const rowEl = e.target.closest("tr.hm-nav-row");
  if (!rowEl) return;
  const path = rowEl.dataset.path || "";
  const id = rowEl.dataset.id;
  const byPath = path ? findNodeByPath(treeRoots, path) : null;
  const byId = id
    ? findNode(treeRoots, id) || findNodeByObjectId(treeRoots, id)
    : null;
  const treeNode = byPath || byId;
  const tableRow = navTableRows.find((r) => String(r.id) === String(id));
  const node = treeNode || nodeFromNavRow(tableRow);
  if (!node) return;
  selectedId = node.id;
  liveProps = null;
  liveCounters = [];
  selectedCounterKeys.clear();
  chartSourceRows = [];
  lastChartPayload = null;
  enabledPenKeys = new Set();
  destroyHmChart();
  setChartMaximized(false);
  setCountersPanelView("table");
  refresh();
}

function selectTreeNode(id) {
  selectedId = id;
  liveProps = null;
  liveCounters = [];
  selectedCounterKeys.clear();
  chartSourceRows = [];
  lastChartPayload = null;
  enabledPenKeys = new Set();
  destroyHmChart();
  setChartMaximized(false);
  setCountersPanelView("table");
  refresh();
}

async function refresh() {
  refreshTreeOnly();
  const node = resolveSelectedNode();

  if (mode === "live") {
    if (liveProps) renderPropsFromObject(liveProps, { live: true });
    else renderPropsFromObject(null, { live: true });
    renderCounterRows(liveCounters);
    if (node) await loadLiveDetails(node);
  } else {
    renderPropsFromObject(propsForNode(node), { live: false });
    renderCounterRows(countersForNode(selectedId));
  }
  updateConnUi();
}

function onTreeClick(e) {
  const btn = e.target.closest(".hm-tree-row");
  if (!btn) return;
  const id = btn.dataset.id;
  const canToggle = btn.dataset.toggle === "1";
  const onTwist = !!e.target.closest(".hm-tree-twist:not(.empty)");

  // ▸/▾ toggles expand/collapse (also select that node)
  if (canToggle && (onTwist || e.detail === 2)) {
    if (expanded.has(id)) expanded.delete(id);
    else expanded.add(id);
  }

  selectTreeNode(id);
}

async function connectLive({ force = true } = {}) {
  if (busy) return;
  busy = true;
  const btn = document.getElementById("hm-connect");
  if (btn) btn.disabled = true;
  setStatus("Connecting with Windows IWA…", "info");
  try {
    const ok = await ensureIwaSession({ force });
    if (!ok) throw new Error("IWA authorize failed");
    setStatus("IWA OK · loading navigation tree…", "ok");
    const roots = await fetchLiveNavigationTree();
    if (!roots.length) {
      throw new Error("Tree returned empty — check profile permissions");
    }
    mode = "live";
    treeRoots = roots;
    expanded.clear();
    roots.forEach((r) => expanded.add(r.id));
    const first = firstLeafOrRoot(roots);
    selectedId = first?.id || roots[0].id;
    if (first?.children?.length) {
      first.children.slice(0, 3).forEach((c) => expanded.add(c.id));
    }
    liveProps = null;
    liveCounters = [];
    navTableLoaded = false;
    await ensureNavTableLoaded({ force: true });
    await refresh();
    setTopbarConnectionState(true);
    setStatus(`Connected · ${roots.length} root(s)`, "ok");
  } catch (err) {
    console.error("[hm-live] connect", err);
    mode = "mock";
    treeRoots = mockTreeRoots;
    navTableRows = [...mockNavTableRows];
    navTableLoaded = true;
    setTopbarConnectionState(false);
    setStatus(`Connect failed: ${err.message}`, "err");
    await refresh();
  } finally {
    busy = false;
    if (btn) btn.disabled = false;
    updateConnUi();
  }
}

function disconnectLive() {
  disconnectIwaSession();
  mode = "mock";
  treeRoots = mockTreeRoots;
  selectedId = "core";
  expanded.clear();
  ["io-model", "system", "core", "server-model"].forEach((id) =>
    expanded.add(id)
  );
  liveProps = null;
  liveCounters = [];
  navTableRows = [...mockNavTableRows];
  navTableLoaded = true;
  autoConnectStarted = true;
  setStatus("Using mock data", "info");
  refresh();
  updateConnUi();
}

function useManualToken() {
  const raw = window.prompt(
    "Paste Bearer access_token (from WebStudio Network → authorize / token):"
  );
  if (!raw) return;
  try {
    setManualToken(raw);
    setStatus("Manual token saved — click Connect to load tree", "ok");
    updateConnUi();
    // Try load with existing token (skip IWA)
    connectWithExistingToken();
  } catch (err) {
    setStatus(err.message, "err");
  }
}

async function connectWithExistingToken() {
  if (!getStoredToken()) return connectLive({ force: false });
  if (busy) return;
  busy = true;
  setStatus("Loading tree with stored token…", "info");
  try {
    const roots = await fetchLiveNavigationTree();
    if (!roots.length) throw new Error("Tree returned empty");
    mode = "live";
    treeRoots = roots;
    expanded.clear();
    roots.forEach((r) => expanded.add(r.id));
    selectedId = roots[0].id;
    liveProps = null;
    liveCounters = [];
    navTableLoaded = false;
    await ensureNavTableLoaded({ force: true });
    await refresh();
    setTopbarConnectionState(true);
    setStatus(`Connected with stored token · ${roots.length} root(s)`, "ok");
  } catch (err) {
    console.error(err);
    setTopbarConnectionState(!!getStoredToken());
    setStatus(`Token/tree failed: ${err.message} — try Connect (IWA)`, "err");
  } finally {
    busy = false;
    updateConnUi();
  }
}

/** Reset to mock after topbar Sign out. */
export function resetHealthMonitorToMock() {
  if (mode === "mock" && !getStoredToken()) {
    refresh();
    return;
  }
  mode = "mock";
  treeRoots = mockTreeRoots;
  selectedId = "core";
  expanded.clear();
  ["io-model", "system", "core", "server-model"].forEach((id) =>
    expanded.add(id)
  );
  liveProps = null;
  liveCounters = [];
  navTableRows = [...mockNavTableRows];
  navTableLoaded = true;
  autoConnectStarted = true; // stay signed out until Connect or page reload
  setStatus("Signed out · mock data", "info");
  refresh();
  updateConnUi();
}

export function initHealthMonitorPage() {
  const tree = document.getElementById("hm-tree");
  if (!tree) return;

  if (tree.dataset.ready !== "1") {
    tree.dataset.ready = "1";
    tree.addEventListener("click", onTreeClick);

    document.getElementById("hm-nav-tree-btn")?.addEventListener("click", () => {
      setNavView("tree");
    });
    document.getElementById("hm-nav-list-btn")?.addEventListener("click", () => {
      setNavView("list");
    });
    document
      .getElementById("hm-nav-list-table")
      ?.addEventListener("click", onNavListClick);

    document.getElementById("hm-chart-pens")?.addEventListener("click", onChartPensClick);

    document.getElementById("hm-connect")?.addEventListener("click", () => {
      connectLive({ force: true });
    });
    document
      .getElementById("hm-disconnect")
      ?.addEventListener("click", disconnectLive);
    document
      .getElementById("hm-token-paste")
      ?.addEventListener("click", useManualToken);

    document
      .getElementById("hm-counters-table")
      ?.addEventListener("click", onCountersTableClick);

    document.getElementById("hm-view-table")?.addEventListener("click", () => {
      setCountersPanelView("table");
    });
    document.getElementById("hm-view-chart")?.addEventListener("click", () => {
      showChartView();
    });
    document.getElementById("hm-view-values")?.addEventListener("click", () => {
      showValuesView();
    });
    document
      .getElementById("hm-values-pagesize")
      ?.addEventListener("change", onValuesPageSizeChange);
    document
      .getElementById("hm-values-prev")
      ?.addEventListener("click", onValuesPrevPage);
    document
      .getElementById("hm-values-next")
      ?.addEventListener("click", onValuesNextPage);
    document.getElementById("hm-chart-maximize")?.addEventListener("click", () => {
      if (countersPanelView !== "chart" && countersPanelView !== "values") {
        return;
      }
      setChartMaximized(!chartMaximized);
      if (countersPanelView === "chart" && lastChartPayload) {
        renderHmCounterChartFromPayload(lastChartPayload);
      }
    });
    wirePeriodModal();

    const submit = document.getElementById("hm-submit");
    if (submit && !submit.dataset.bound) {
      submit.dataset.bound = "1";
      submit.addEventListener("click", () => {
        submitSelectedToChart();
      });
    }
  }

  refresh();

  if (mode === "live") return;

  if (!autoConnectStarted) {
    autoConnectStarted = true;
    setStatus("Auto-connecting with Windows IWA…", "info");
    connectLive({ force: false });
  }
}
