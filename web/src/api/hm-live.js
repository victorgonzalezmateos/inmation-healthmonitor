/**
 * Map Health Monitor Web API responses into the Health Monitor page model.
 */

import {
  execHm,
  formatApiError,
  getStoredToken,
  parseJsonPreservingLargeInts,
} from "./inmation.js";
import { DEFAULT_PERIOD, periodToApiTimes } from "../hm-chart-period.js";
import { formatHmTimestamp, toEpochMs } from "../hm-time-format.js";

/** HM tree nodes use n/i/path/c/image/t — map to our UI shape. */
export function mapHmTreeNodes(nodes) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map(mapOne);
}

function mapOne(n) {
  // Keep raw `i` — may be number or string (large IDs preserved as string)
  const rawId = n.i ?? n.ObjectID ?? n.id ?? null;
  const id = String(rawId ?? n.path ?? n.n ?? Math.random());
  const children = mapHmTreeNodes(n.c || n.children || []);
  return {
    id,
    name: n.n || n.ObjectName || n.name || id,
    path: n.path || n.Path || "",
    type: n.Type || n.type || (n.t != null ? String(n.t) : "Object"),
    objectId: rawId,
    image: n.image || n.Image || "",
    children,
  };
}

/**
 * Prefer a numeric / digit-string ObjectID (tree `i`).
 * Dotted forms like "1.9.0" are not valid for counters getobject.
 */
export function coerceObjectId(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const s = String(value).trim();
  const paren = s.match(/\((\d+)\)/);
  if (paren) return digitId(paren[1]);
  if (/^\d+$/.test(s)) return digitId(s);
  return null;
}

function digitId(digits) {
  if (digits.length >= 16) return digits; // keep exact as string
  const n = Number(digits);
  return Number.isSafeInteger(n) ? n : digits;
}

/** Pick best ObjectID: tree `i` first, then props numeric/paren forms. */
export function resolveObjectId(node, props = null) {
  const candidates = [
    node?.objectId,
    node?.id,
    props?.ObjectIDExtended,
    props?.ObjectID,
  ];
  for (const c of candidates) {
    const id = coerceObjectId(c);
    if (id != null) return id;
  }
  return null;
}

/** Unwrap common Web API envelopes. */
export function unwrapData(body) {
  if (body == null) return null;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (body.data != null && typeof body.data === "object") return body.data;
  return body;
}

export async function fetchLiveNavigationTree() {
  const body = await execHm("fetchNavigationTree", {});
  const data = unwrapData(body);
  if (Array.isArray(data)) return mapHmTreeNodes(data);
  if (data && (data.c || data.children || data.n)) return mapHmTreeNodes([data]);
  console.warn("[hm-live] unexpected tree shape", body);
  return [];
}

/**
 * Flat health table — Name / Type / WorstState / CommState / …
 * Used for HM-style list view in the Navigation panel.
 */
export async function fetchLiveNavigationTable() {
  const body = await execHm("fetchNavigationTable", {});
  const data = unwrapData(body);
  const rows = Array.isArray(data) ? data : data?.rows || [];
  if (!Array.isArray(rows)) {
    console.warn("[hm-live] unexpected nav table shape", body);
    return [];
  }
  return rows.map((r, i) => ({
    id: String(r.ObjectID ?? r.i ?? r.path ?? r.Path ?? `nav-${i}`),
    name: r.ObjectName ?? r.n ?? r.Name ?? "—",
    path: r.Path ?? r.path ?? "",
    type: r.Type ?? r.type ?? "—",
    image: r.Image ?? r.image ?? "",
    CommState: unwrapStateValue(r.CommState ?? r.commState),
    ObjectState: unwrapStateValue(r.ObjectState ?? r.objectState),
    WorstState: unwrapStateValue(r.WorstState ?? r.worstState),
    State: unwrapStateValue(r.State ?? r.state),
  }));
}

/** Normalize HM state cells (plain string or VQT `{ v }`). */
function unwrapStateValue(v) {
  if (v == null) return "";
  if (typeof v === "object" && !Array.isArray(v) && "v" in v) {
    return unwrapStateValue(v.v);
  }
  return String(v).trim();
}

function stateEquals(value, expected) {
  return unwrapStateValue(value).toLowerCase() === String(expected).toLowerCase();
}

function stateIn(value, list) {
  return list.some((x) => stateEquals(value, x));
}

/**
 * Row emphasis from source states (DC-02 + HM Warning).
 * Priority: Bad → Disabled → Warning (yellow) → Good
 * Yellow: WorstState Warning, Empty / COMM_EMPTY (not Neutral).
 */
export function classifyNavHealth(row) {
  const worst = unwrapStateValue(row?.WorstState);
  const comm = unwrapStateValue(row?.CommState);
  const obj = unwrapStateValue(row?.ObjectState);
  const state = unwrapStateValue(row?.State);

  if (stateIn(worst, ["Bad"]) || stateIn(comm, ["Bad"]) || stateIn(obj, ["Bad"])) {
    return "bad";
  }
  if (/COMM_ERROR|STATE_ERROR/i.test(state)) return "bad";

  if (
    stateIn(worst, ["Disabled"]) ||
    stateIn(comm, ["Disabled"]) ||
    stateIn(obj, ["Disabled"]) ||
    /OBJ_DISABLED/i.test(state)
  ) {
    return "disabled";
  }

  // Yellow: Warning, Empty, or compound COMM_EMPTY
  if (stateIn(worst, ["Warning", "Empty"])) {
    return "warning";
  }
  if (stateIn(comm, ["Empty"]) || stateIn(obj, ["Empty"])) {
    return "warning";
  }
  if (/COMM_EMPTY/i.test(state)) {
    return "warning";
  }

  return "good";
}

/** Official Site codes from Bayer naming: Area-Country-Site-Layer-Host-Counter */
export const KNOWN_SITES = Object.freeze([
  "ALH",
  "BIT",
  "CSA",
  "CIM",
  "DAR",
  "GRZ",
  "GUC",
  "KMN",
  "MYR",
  "PLA",
  "QID",
  "TOL",
]);

/** Temporary aliases — KUN is the same site as KMN (to be corrected upstream). */
const SITE_ALIASES = Object.freeze({
  KUN: "KMN",
});

const KNOWN_SITE_SET = new Set(KNOWN_SITES);
const SITE_NAME_RE =
  /\b(EMEA|LA|APAC|NA)-([A-Z]{2,3})-([A-Z]{2,3})(?=-|[/\s]|$)/gi;

function normalizeSiteCode(code) {
  const upper = String(code || "").toUpperCase();
  return SITE_ALIASES[upper] || upper;
}

/** First known site code found in a row name/path, or "". */
export function siteFromRow(row) {
  const texts = [row?.name, row?.path, row?.ObjectName, row?.Path].filter(Boolean);
  for (const t of texts) {
    SITE_NAME_RE.lastIndex = 0;
    let m;
    while ((m = SITE_NAME_RE.exec(String(t)))) {
      const site = normalizeSiteCode(m[3]);
      if (KNOWN_SITE_SET.has(site)) return site;
    }
  }
  return "";
}

/**
 * Extract distinct known <Site> codes from ObjectName / Path
 * (Area-Country-Site-Layer-Host[-Counter]).
 * Aliases (e.g. KUN→KMN) are normalized before matching the catalog.
 */
export function extractKnownSites(rows) {
  const found = new Set();
  for (const r of rows || []) {
    const site = siteFromRow(r);
    if (site) found.add(site);
  }
  return [...found].sort();
}

/** Pie data: component counts per known site (from naming convention). */
export function componentsBySiteChart(rows) {
  const counts = new Map();
  for (const site of KNOWN_SITES) counts.set(site, 0);
  for (const r of rows || []) {
    const site = siteFromRow(r);
    if (site) counts.set(site, (counts.get(site) || 0) + 1);
  }
  const labels = [];
  const values = [];
  for (const site of KNOWN_SITES) {
    const n = counts.get(site) || 0;
    if (n > 0) {
      labels.push(site);
      values.push(n);
    }
  }
  const palette = [
    "#2563eb",
    "#7c3aed",
    "#0ea5e9",
    "#16a34a",
    "#ca8a04",
    "#ef4444",
    "#db2777",
    "#0891b2",
    "#65a30d",
    "#ea580c",
    "#4f46e5",
    "#64748b",
  ];
  return {
    labels,
    values,
    colors: labels.map((_, i) => palette[i % palette.length]),
  };
}

/**
 * Active Critical Issues = rows classified as Bad (Problems KPI).
 */
export function listCriticalIssues(rows) {
  return (rows || [])
    .filter((r) => classifyNavHealth(r) === "bad")
    .map((r) => ({
      site: siteFromRow(r) || "—",
      component: r.name || r.ObjectName || "—",
      type: r.type || r.Type || "—",
      message:
        [r.WorstState && `WorstState: ${r.WorstState}`, r.CommState && `Comm: ${r.CommState}`, r.State]
          .filter(Boolean)
          .join(" · ") || "Bad",
      path: r.path || "",
    }))
    .sort((a, b) =>
      String(a.site).localeCompare(String(b.site)) ||
      String(a.component).localeCompare(String(b.component))
    );
}

/**
 * Per-site Health Score summary (known sites only — no Other).
 * Health = % Good (same rule as Overview doughnut).
 * P = Problems (Bad), W = Warnings, D = Disabled.
 */
export function siteSummaryRows(rows) {
  const buckets = new Map();
  for (const site of KNOWN_SITES) {
    buckets.set(site, { site, total: 0, good: 0, problems: 0, warnings: 0, disabled: 0 });
  }
  for (const r of rows || []) {
    const site = siteFromRow(r);
    if (!site || !buckets.has(site)) continue;
    const b = buckets.get(site);
    b.total += 1;
    const h = classifyNavHealth(r);
    if (h === "bad") b.problems += 1;
    else if (h === "warning") b.warnings += 1;
    else if (h === "disabled") b.disabled += 1;
    else b.good += 1;
  }
  return KNOWN_SITES.map((site) => {
    const b = buckets.get(site);
    const score = b.total ? Math.round((b.good / b.total) * 1000) / 10 : null;
    return {
      site,
      score,
      total: b.total,
      problems: b.problems,
      warnings: b.warnings,
      disabled: b.disabled,
      present: b.total > 0,
    };
  }).filter((r) => r.present);
}

/** Classify issue category for Top Issue Types (from State / health fields). */
export function issueTypeLabel(row) {
  const state = String(row?.State || "");
  const worst = String(row?.WorstState || "");
  const comm = String(row?.CommState || "");
  if (/COMM_ERROR/i.test(state) || comm === "Bad") return "Communication";
  if (/STATE_ERROR/i.test(state)) return "State Error";
  if (/COMM_EMPTY/i.test(state) || comm === "Empty" || worst === "Empty") {
    return "Empty / No data";
  }
  if (/OBJ_DISABLED/i.test(state) || worst === "Disabled") return "Disabled";
  if (worst === "Warning") return "Warning";
  if (worst === "Bad") return row?.type ? `Bad · ${row.type}` : "Bad";
  return row?.type || "Other";
}

const ISSUE_ONSET_KEY = "smart-sentinel-issue-onset-v1";

function readIssueOnsetStore() {
  try {
    const raw = localStorage.getItem(ISSUE_ONSET_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeIssueOnsetStore(store) {
  try {
    localStorage.setItem(ISSUE_ONSET_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

function issueOnsetKey(row, health) {
  const id = String(row?.id || row?.path || row?.name || "");
  return `${id}|${health}`;
}

function formatIssueClock(ms) {
  const d = new Date(ms);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatIssueDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return `${secs}s`;
}

function issueMessage(row) {
  return (
    [
      row?.WorstState && `WorstState: ${row.WorstState}`,
      row?.CommState && `Comm: ${row.CommState}`,
      row?.ObjectState && `Object: ${row.ObjectState}`,
      row?.State,
    ]
      .filter(Boolean)
      .join(" · ") || "—"
  );
}

function severityForHealth(health) {
  if (health === "bad") return "High";
  if (health === "warning") return "Medium";
  if (health === "disabled") return "Disabled";
  return "Low";
}

/**
 * Record first-seen timestamps for Bad/Warning/Disabled rows so Duration/Time
 * can be shown (nav table has no onset field). Call on each Overview refresh.
 */
export function touchIssueOnsets(rows, now = Date.now()) {
  const store = readIssueOnsetStore();
  const active = new Set();
  for (const r of rows || []) {
    const health = classifyNavHealth(r);
    if (health === "good") continue;
    const key = issueOnsetKey(r, health);
    active.add(key);
    if (store[key] == null) store[key] = now;
  }
  for (const k of Object.keys(store)) {
    if (!active.has(k)) delete store[k];
  }
  writeIssueOnsetStore(store);
  return store;
}

/**
 * Issues & Alerts tables from live nav rows.
 * @returns {{ problems: object[], warnings: object[], disabled: object[] }}
 */
export function listIssuesAndAlerts(rows, now = Date.now()) {
  const onset = touchIssueOnsets(rows, now);
  const problems = [];
  const warnings = [];
  const disabled = [];

  for (const r of rows || []) {
    const health = classifyNavHealth(r);
    if (health === "good") continue;
    const started = onset[issueOnsetKey(r, health)] ?? now;
    const entry = {
      id: String(r.id || ""),
      path: r.path || "",
      time: formatIssueClock(started),
      timeMs: started,
      severity: severityForHealth(health),
      site: siteFromRow(r) || "—",
      component: r.name || r.ObjectName || "—",
      type: issueTypeLabel(r),
      message: issueMessage(r),
      status: unwrapStateValue(r.WorstState) || health,
      duration: formatIssueDuration(now - started),
      durationMs: Math.max(0, now - started),
      health,
    };
    if (health === "bad") problems.push(entry);
    else if (health === "warning") warnings.push(entry);
    else if (health === "disabled") disabled.push(entry);
  }

  const bySiteThenName = (a, b) =>
    String(a.site).localeCompare(String(b.site)) ||
    String(a.component).localeCompare(String(b.component));
  problems.sort(bySiteThenName);
  warnings.sort(bySiteThenName);
  disabled.sort(bySiteThenName);
  return { problems, warnings, disabled };
}

function scoreFromHealth(health) {
  if (health === "bad") return 40;
  if (health === "warning") return 70;
  if (health === "disabled") return 55;
  return 100;
}

function displayWorstState(row, health) {
  const worst = unwrapStateValue(row?.WorstState);
  if (worst) return worst;
  if (health === "bad") return "Bad";
  if (health === "warning") return "Warning";
  if (health === "disabled") return "Disabled";
  return "Good";
}

/** Map one nav-table row into a Drill-down hierarchy object. */
export function navRowToDrillObject(row) {
  const health = classifyNavHealth(row);
  return {
    id: String(row?.id || row?.path || row?.name || ""),
    site: siteFromRow(row) || "—",
    name: row?.name || row?.ObjectName || "—",
    type: row?.type || row?.Type || "—",
    path: row?.path || row?.Path || "",
    image: row?.image || "",
    objectId: row?.id || null,
    worstState: displayWorstState(row, health),
    health,
    severity: health === "good" ? "Good" : severityForHealth(health),
    problems: health === "bad" ? 1 : 0,
    warnings: health === "warning" ? 1 : 0,
    info: health === "disabled" ? 1 : 0,
    score: scoreFromHealth(health),
    state: unwrapStateValue(row?.State) || "—",
    CommState: unwrapStateValue(row?.CommState) || "—",
    ObjectState: unwrapStateValue(row?.ObjectState) || "—",
    message: health === "good" ? "—" : issueMessage(row),
  };
}

/** All Drill-down rows from `fetchNavigationTable`. */
export function navRowsToDrillObjects(rows) {
  return (rows || []).map(navRowToDrillObject);
}

/** Filter options derived from live drill objects. */
export function drillFilterOptions(objects) {
  const sites = new Set();
  const types = new Set();
  for (const o of objects || []) {
    if (o.site && o.site !== "—") sites.add(o.site);
    if (o.type && o.type !== "—") types.add(o.type);
  }
  return {
    sites: ["All", ...[...sites].sort()],
    types: ["All", ...[...types].sort()],
    severities: ["All", "High", "Medium", "Disabled", "Good"],
  };
}

export function filterDrillObjects(objects, { site, type, severity, nonGoodOnly } = {}) {
  return (objects || []).filter((o) => {
    if (site && site !== "All" && o.site !== site) return false;
    if (type && type !== "All" && o.type !== type) return false;
    if (severity && severity !== "All" && o.severity !== severity) return false;
    if (nonGoodOnly && o.health === "good") return false;
    return true;
  });
}

/**
 * Related issues for the selected object:
 * 1) Its own Bad/Warning/Disabled entry if unhealthy
 * 2) Otherwise other unhealthy objects at the same site (context)
 */
export function relatedIssuesForDrillObject(obj, allRows, now = Date.now()) {
  if (!obj) return [];
  const { problems, warnings, disabled } = listIssuesAndAlerts(allRows, now);
  const all = [...problems, ...warnings, ...disabled];
  const self = all.filter((i) => i.id === obj.id || (obj.path && i.path === obj.path));
  if (self.length) return self;
  if (obj.site && obj.site !== "—") {
    return all.filter((i) => i.site === obj.site).slice(0, 15);
  }
  return [];
}

/** Top issue types from current Bad + Warning rows (live snapshot). */
export function topIssueTypesFromRows(rows) {
  const counts = new Map();
  for (const r of rows || []) {
    const h = classifyNavHealth(r);
    if (h !== "bad" && h !== "warning") continue;
    const label = issueTypeLabel(r);
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return {
    labels: sorted.map(([k]) => k),
    values: sorted.map(([, v]) => v),
  };
}

const HOURLY_KEY = "smart-sentinel-overview-hourly-v2";

function hourKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}`;
}

function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readHourlyStore() {
  try {
    const raw = localStorage.getItem(HOURLY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeHourlyStore(store) {
  try {
    localStorage.setItem(HOURLY_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

function snapFromHourEntry(entry, siteKey) {
  if (!entry) return null;
  // v2: { All: {...}, ALH: {...} } — also accept legacy flat { problems, warnings }
  if (entry.problems != null || entry.warnings != null || entry.disabled != null) {
    return entry;
  }
  return entry[siteKey] || entry.All || null;
}

/**
 * Record current P/W/Disabled for site scope; build series for range.
 * @param {'24h'|'7d'|'1m'} range
 * @param {string} site  "All" or site code
 */
export function recordAndBuildIssuesOverTime(
  summary,
  { range = "24h", site = "All" } = {}
) {
  const store = readHourlyStore();
  const now = new Date();
  const hk = hourKey(now);
  const siteKey = site || "All";
  if (!store[hk] || typeof store[hk] !== "object") store[hk] = {};
  // migrate legacy flat hour entry
  if (store[hk].problems != null && !store[hk].All) {
    store[hk] = { All: { ...store[hk] } };
  }
  store[hk][siteKey] = {
    problems: summary.bad || 0,
    warnings: summary.warning || 0,
    disabled: summary.disabled || 0,
    info: summary.disabled || 0,
  };

  const cutoff = new Date(now.getTime() - 35 * 24 * 3600_000);
  for (const k of Object.keys(store)) {
    const t = Date.parse(k.includes("T") ? `${k}:00:00` : `${k}T00:00:00`);
    if (Number.isFinite(t) && t < cutoff.getTime()) delete store[k];
  }
  writeHourlyStore(store);

  if (range === "7d" || range === "1m") {
    return buildDailySeries(store, siteKey, range === "7d" ? 7 : 30, now);
  }
  return buildHourlySeries(store, siteKey, 24, now);
}

function buildHourlySeries(store, siteKey, hours, now) {
  const labels = [];
  const problems = [];
  const warnings = [];
  const info = [];
  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600_000);
    labels.push(
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
    const snap = snapFromHourEntry(store[hourKey(d)], siteKey);
    problems.push(snap ? snap.problems : null);
    warnings.push(snap ? snap.warnings : null);
    info.push(snap ? snap.disabled ?? snap.info : null);
  }
  return { labels, problems, warnings, info, range: "24h" };
}

function buildDailySeries(store, siteKey, days, now) {
  const labels = [];
  const problems = [];
  const warnings = [];
  const info = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dk = dayKey(d);
    labels.push(
      d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    );
    // Prefer last hour of that day that has data; else average hours
    let last = null;
    let sumP = 0;
    let sumW = 0;
    let sumD = 0;
    let n = 0;
    for (let h = 0; h < 24; h++) {
      const key = `${dk}T${String(h).padStart(2, "0")}`;
      const snap = snapFromHourEntry(store[key], siteKey);
      if (!snap) continue;
      last = snap;
      sumP += snap.problems || 0;
      sumW += snap.warnings || 0;
      sumD += snap.disabled ?? snap.info ?? 0;
      n += 1;
    }
    if (last) {
      // use last snapshot of the day (closest to EOD / latest refresh)
      problems.push(last.problems);
      warnings.push(last.warnings);
      info.push(last.disabled ?? last.info);
    } else if (n) {
      problems.push(Math.round(sumP / n));
      warnings.push(Math.round(sumW / n));
      info.push(Math.round(sumD / n));
    } else {
      problems.push(null);
      warnings.push(null);
      info.push(null);
    }
  }
  return { labels, problems, warnings, info, range: days === 7 ? "7d" : "1m" };
}

/** Aggregate List View health counts for Overview KPIs. */
export function summarizeNavHealth(rows) {
  const list = Array.isArray(rows) ? rows : [];
  let bad = 0;
  let warning = 0;
  let disabled = 0;
  let good = 0;
  for (const r of list) {
    const h = classifyNavHealth(r);
    if (h === "bad") bad += 1;
    else if (h === "warning") warning += 1;
    else if (h === "disabled") disabled += 1;
    else good += 1; // Good, Neutral, and anything else not Bad/Warning/Disabled
  }
  const sites = extractKnownSites(list);
  const total = list.length;
  const goodPct = total ? Math.round((good / total) * 1000) / 10 : 0;
  const problemsPct = total ? Math.round((bad / total) * 1000) / 10 : 0;
  const warningsPct = total ? Math.round((warning / total) * 1000) / 10 : 0;
  const disabledPct = total ? Math.round((disabled / total) * 1000) / 10 : 0;
  return {
    total,
    bad,
    warning,
    disabled,
    good,
    other: 0,
    goodPct,
    problemsPct,
    warningsPct,
    disabledPct,
    sites,
    sitesCount: sites.length,
    sitesTotal: KNOWN_SITES.length,
  };
}

/** Display field order for Object Properties panel (UI). */
export const OBJ_PROP_DISPLAY_FIELDS = [
  "Image",
  "ObjectName",
  "Type",
  "ObjectID",
  "Path",
  "ConfigVersion",
  "ClassVersion",
  "Created",
  "Modified",
  "State",
];

/** Fields used to detect a valid fetchObjProps payload. */
export const OBJ_PROP_FIELDS = [
  ...OBJ_PROP_DISPLAY_FIELDS,
  "ObjectIDExtended",
  "access",
];

function flattenPropValue(key, v) {
  if (v == null) return null;
  // VQT wrapper
  if (typeof v === "object" && "v" in v && !("date" in v) && !("user" in v)) {
    return flattenPropValue(key, v.v);
  }
  // Created / Modified — keep { date, user } like default HM / DataStudio
  if (key === "Created" || key === "Modified") {
    if (typeof v === "object" && !Array.isArray(v)) {
      let date = v.date ?? v.Date ?? v.t ?? v.time ?? null;
      let user = v.user ?? v.User ?? v.u ?? null;
      // Nested VQT on date/user
      if (date && typeof date === "object" && "v" in date) date = date.v;
      if (user && typeof user === "object" && "v" in user) user = user.v;
      return { date, user };
    }
    return { date: v, user: null };
  }
  if (typeof v === "object" && !Array.isArray(v)) {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return v;
}

function normalizePropRow(row) {
  if (!row || typeof row !== "object") return null;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (k.startsWith("_")) continue;
    out[k] = flattenPropValue(k, v);
  }
  return out;
}

/** Resolve HM/WebStudio class icon path to an absolute URL. */
export function resolveHmImageUrl(imagePath) {
  if (!imagePath) return "";
  const s = String(imagePath).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s;
  // "./assets/model/classes/Core.svg" → /apps/webstudio/assets/...
  const cleaned = s.replace(/^\.\//, "").replace(/^\//, "");
  if (cleaned.startsWith("apps/webstudio/")) {
    return `/${cleaned}`;
  }
  if (cleaned.startsWith("assets/")) {
    // Same-origin via Vite proxy → host WebStudio assets
    return `/apps/webstudio/${cleaned}`;
  }
  return `/apps/webstudio/${cleaned}`;
}

/**
 * Live object properties — same source as default HM / DataStudio panel:
 * `syslib.app-webstudio-healthmonitor` → `fetchObjProps`
 */
export async function fetchLiveObjProps(node) {
  const objectId = resolveObjectId(node);
  const attempts = [
    {
      ObjectName: node.name,
      ObjectID: objectId,
      Path: node.path,
      Image: node.image || "",
    },
    { ObjectID: objectId, Path: node.path },
    { Path: node.path },
    { ObjectID: objectId },
  ].filter((a) => a.ObjectID != null || (a.Path && a.Path.length > 0));

  let lastErr = null;
  for (const farg of attempts) {
    try {
      const body = await execHm("fetchObjProps", farg);
      const data = unwrapData(body);
      let row = Array.isArray(data) ? data[0] : data;
      if (row?.items) {
        row = Array.isArray(row.items) ? row.items[0] : row.items;
      }
      const normalized = normalizePropRow(row);
      if (!normalized) continue;

      // Accept if we got any known HM property field
      const hasKnown = OBJ_PROP_FIELDS.some(
        (f) => normalized[f] != null && normalized[f] !== ""
      );
      if (!hasKnown && Object.keys(normalized).length === 0) continue;

      return {
        ...normalized,
        // Fill gaps only from tree identity — never invent State/versions
        ObjectName: normalized.ObjectName ?? node.name,
        Path: normalized.Path ?? node.path,
        Type: normalized.Type ?? node.type,
        ObjectID: normalized.ObjectID ?? objectId,
        Image: normalized.Image ?? node.image ?? "",
        _source: "fetchObjProps",
      };
    } catch (err) {
      lastErr = err;
      if (err.status && err.status !== 400) throw err;
    }
  }
  throw lastErr || new Error("fetchObjProps returned no usable properties");
}

/**
 * Try several farg shapes — WebStudio uses ObjectID from tree `$i`.
 * Some hosts also accept Path when ID lookup fails.
 */
export async function fetchLiveCounters(node, props = null) {
  const objectId = resolveObjectId(node, props);
  const attempts = [];

  if (objectId != null) {
    attempts.push({ ObjectID: objectId });
    attempts.push({ ObjectID: objectId, i: objectId });
  }
  if (node.path) {
    attempts.push({ Path: node.path });
    if (objectId != null) {
      attempts.push({
        ObjectID: objectId,
        Path: node.path,
        ObjectName: node.name,
      });
    }
  }

  if (!attempts.length) {
    throw new Error("No ObjectID or Path for counters");
  }

  let lastErr = null;
  for (const farg of attempts) {
    try {
      const body = await execHm("fetchPerformanceCountersTable", farg);
      return normalizeCounterRows(body);
    } catch (err) {
      lastErr = err;
      // Only retry on 400 "cannot find"; rethrow auth / 5xx
      if (err.status && err.status !== 400) throw err;
    }
  }
  throw lastErr || new Error("Counters fetch failed");
}

function normalizeCounterRows(body) {
  const data = unwrapData(body);
  const rows = Array.isArray(data) ? data : data?.rows || [];
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({
    ObjectName: r.ObjectName ?? r.n ?? "—",
    type: r.type ?? r.Type ?? "—",
    group: r.group ?? r.Group ?? "",
    Value: r.Value ?? r.v ?? "—",
    Unit: r.Unit ?? "",
    Description: r.ObjectDescription ?? r.Description ?? r.description ?? "",
    // Hidden — needed for Submit → chart (HM pen wiring)
    penName: r.penName ?? "",
    path: r.path ?? r.Path ?? "",
  }));
}

/**
 * Load historical series for selected counter paths (HM Submit → Chart).
 * Uses Web API POST /api/v2/readhistoricaldata with HM-style period settings.
 */
export async function fetchCounterHistorySeries(rows, options = {}) {
  const token = getStoredToken();
  if (!token) throw new Error("No access token — connect with IWA first");

  const items = (rows || [])
    .filter((r) => r?.path)
    .map((r) => ({
      p: String(r.path),
      aggregate: options.aggregate || "AGG_TYPE_INTERPOLATIVE",
    }));
  if (!items.length) {
    throw new Error("Selected counters have no path for historical data");
  }

  const period = options.period || DEFAULT_PERIOD;
  const times = periodToApiTimes(period);
  const bodies = [
    { items, ...times.relative },
    { items, ...times.absolute },
  ];

  let lastErr = null;
  for (const body of bodies) {
    try {
      const res = await fetch("/api/v2/readhistoricaldata", {
        method: "POST",
        credentials: "omit",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: options.signal,
      });

      const text = await res.text();
      let parsed = null;
      try {
        parsed = text ? parseJsonPreservingLargeInts(text) : null;
      } catch {
        parsed = { raw: text };
      }

      if (!res.ok) {
        lastErr = new Error(
          `readhistoricaldata → ${res.status}: ${formatApiError(parsed)}`
        );
        lastErr.status = res.status;
        lastErr.body = parsed;
        continue;
      }

      const series = historyResponseToSeries(parsed, rows);
      series.period = { ...period };
      return series;
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error("readhistoricaldata failed");
}

function historyResponseToSeries(body, rows) {
  const data = body?.data ?? body;
  const histItems = Array.isArray(data?.items) ? data.items : [];
  const byPath = new Map(
    histItems.map((it) => [String(it.p || it.path || ""), it])
  );

  let labels = null;
  let times = null;
  const pens = [];

  for (let i = 0; i < (rows || []).length; i++) {
    const row = rows[i];
    const path = String(row.path || "");
    const hist = byPath.get(path) || histItems[i];
    const points = flattenIntervals(hist?.intervals);
    if (!labels && points.length) {
      times = points.map((p) => toEpochMs(p.T));
      labels = points.map((p) => formatHmTimestamp(p.T));
    }
    pens.push({
      name: row.penName || row.ObjectName || `Pen ${i + 1}`,
      unit: row.Unit || "",
      penName: row.penName,
      path: row.path,
      color: PEN_COLORS[i % PEN_COLORS.length],
      values: points.map((p) => p.V),
      current: row.Value,
    });
  }

  // Align shorter series to shared label length
  const n = labels?.length || 0;
  if (n) {
    for (const pen of pens) {
      if (pen.values.length < n) {
        while (pen.values.length < n) pen.values.push(null);
      } else if (pen.values.length > n) {
        pen.values = pen.values.slice(0, n);
      }
    }
  }

  return {
    labels: labels || [],
    times: times || [],
    pens,
    empty: !labels?.length || pens.every((p) => !p.values.some((v) => v != null)),
  };
}

function flattenIntervals(intervals) {
  if (!Array.isArray(intervals)) return [];
  const out = [];
  for (const iv of intervals) {
    if (!iv || typeof iv !== "object") continue;
    const { T, V, Q } = iv;
    if (Array.isArray(T) && Array.isArray(V)) {
      for (let i = 0; i < T.length; i++) {
        out.push({ T: T[i], V: V[i], Q: Array.isArray(Q) ? Q[i] : Q });
      }
    } else if (T != null && V != null) {
      out.push({ T, V, Q });
    }
  }
  return out;
}

const PEN_COLORS = [
  "#00bcff",
  "#89d329",
  "#10384f",
  "#dc2626",
  "#ca8a04",
  "#7c3aed",
  "#0891b2",
  "#ea580c",
];

