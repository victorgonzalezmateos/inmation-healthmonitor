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
import { formatHmTimestamp, formatHmTimestampUtc, toEpochMs } from "../hm-time-format.js";

/** HM tree nodes use n/i/path/c/image/t — map to our UI shape. */
export function mapHmTreeNodes(nodes) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map(mapOne);
}

/** "./assets/model/classes/Relay.svg" → "Relay" */
function typeNameFromImage(image) {
  const s = String(image || "");
  const m = s.match(/\/classes\/([^/.]+)\.[a-z0-9]+$/i);
  return m ? m[1] : "";
}

/**
 * Prefer a readable class name over numeric `t` (e.g. 97 → Relay via SVG).
 */
export function resolveTreeNodeType(n) {
  const explicit = n?.Type ?? n?.type;
  if (
    explicit != null &&
    String(explicit).trim() !== "" &&
    !/^\d+$/.test(String(explicit).trim())
  ) {
    return String(explicit).trim();
  }
  const fromImg = typeNameFromImage(n?.image || n?.Image);
  if (fromImg) return fromImg;
  if (n?.t != null && String(n.t).trim() !== "") return String(n.t);
  return "Object";
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
    type: resolveTreeNodeType(n),
    classCode: n.t != null ? n.t : null,
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

/** Normalize HM state cells (plain string, array of flags, numeric bitmask, or VQT `{ v }`). */
function unwrapStateValue(v) {
  if (v == null) return "";
  if (Array.isArray(v)) {
    return v
      .map((x) => unwrapStateValue(x))
      .filter(Boolean)
      .join("|");
  }
  if (typeof v === "object" && !Array.isArray(v) && "v" in v) {
    return unwrapStateValue(v.v);
  }
  return String(v).trim();
}

/**
 * ModUserState flag values (docs.inmation.com ModUserState).
 * Used when `State` arrives as a numeric bitmask instead of COMM_*|STATE_*|OBJ_*.
 */
const MOD_USER_STATE_FLAGS = Object.freeze([
  // Communication (exactly one expected)
  ["COMM_EMPTY", 1],
  ["COMM_NEUTRAL", 2],
  ["COMM_GOOD", 4],
  ["COMM_WARNING", 8],
  ["COMM_ERROR", 16],
  // Functional state (exactly one expected)
  ["STATE_EMPTY", 256],
  ["STATE_NEUTRAL", 512],
  ["STATE_GOOD", 1024],
  ["STATE_WARNING", 2048],
  ["STATE_ERROR", 4096],
  ["STATE_UNCONFIRMED", 8192],
  // Object characteristics
  ["OBJ_ENABLED", 65536],
  ["OBJ_DELETED", 131072],
  ["OBJ_CLASS_MISMATCH", 2097152],
  ["OBJ_DYNAMIC", 16777216],
  ["OBJ_SECURITY_REF", 33554432],
  ["OBJ_OBJECT_REF", 67108864],
  ["OBJ_EXPLORING", 536870912],
  ["OBJ_REGISTERING", 1073741824],
]);

/** Decode ModUserState integer → `COMM_ERROR|STATE_GOOD|OBJ_ENABLED`. */
export function decodeModUserState(bitmask) {
  const n = typeof bitmask === "bigint" ? Number(bitmask) : Number(bitmask);
  if (!Number.isFinite(n) || n <= 0) return "";
  // Keep as unsigned 32-bit for high OBJ_* flags
  const bits = n >>> 0;
  const flags = [];
  for (const [name, value] of MOD_USER_STATE_FLAGS) {
    if ((bits & value) === value) flags.push(name);
  }
  return flags.join("|");
}

function coerceToBitmask(raw) {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw >>> 0;
  if (typeof raw === "bigint") return Number(raw) >>> 0;
  if (typeof raw === "string" && /^\d+$/.test(raw.trim())) {
    return Number(raw.trim()) >>> 0;
  }
  return null;
}

/** True when string already looks like Object-Properties compound State. */
function hasCompoundStateFlags(raw) {
  return /(?:^|\|)(?:COMM_|STATE_|OBJ_)[A-Z0-9_]+/i.test(String(raw || ""));
}

/** Normalize `COMM_GOOD | STATE_GOOD | OBJ_ENABLED` → `COMM_GOOD|STATE_GOOD|OBJ_ENABLED`. */
function normalizeCompoundState(raw) {
  // Numeric bitmask from Web API / nav table
  const mask = coerceToBitmask(raw);
  if (mask != null && !hasCompoundStateFlags(String(raw))) {
    return decodeModUserState(mask);
  }
  const s = unwrapStateValue(raw);
  if (!s) return "";
  // Digit-only string already handled above; still try decode if no flags
  if (/^\d+$/.test(s)) return decodeModUserState(Number(s));
  return s
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean)
    .join("|");
}

/**
 * Map fetchNavigationTable rollup words (Good/Bad/Empty/…) to compound flags.
 * Only used as a last resort when no real State bitmask/string is available.
 * Never invent STATE_* from WorstState (WorstState rolls up Comm+State).
 */
const COMM_WORD_TO_FLAG = Object.freeze({
  good: "COMM_GOOD",
  bad: "COMM_ERROR",
  empty: "COMM_EMPTY",
  warning: "COMM_WARNING",
  neutral: "COMM_NEUTRAL",
  disabled: "COMM_NEUTRAL",
});

const OBJ_WORD_TO_FLAG = Object.freeze({
  good: "OBJ_ENABLED",
  bad: "OBJ_CLASS_MISMATCH",
  empty: "",
  warning: "",
  neutral: "",
  disabled: "",
});

function mapRollupWord(value, table) {
  const w = unwrapStateValue(value).toLowerCase();
  if (!w) return "";
  if (hasCompoundStateFlags(w)) return normalizeCompoundState(value);
  return table[w] || "";
}

/**
 * Resolve Object-Properties-style compound `State` for a nav/props row.
 * 1) Real compound string or ModUserState bitmask
 * 2) Last resort: CommState → COMM_*, ObjectState → OBJ_* (no STATE_* from WorstState)
 * 3) If HM ObjectState/WorstState === "Disabled" and no STATE_* yet → STATE_NEUTRAL
 *    (do NOT invent NEUTRAL from mere Comm/Worst "Neutral" — that over-counts Disabled)
 */
export function resolveCompoundState(row) {
  // Prefer raw State before any previous mapping (bitmask or pipe string)
  const candidates = [row?.State, row?.state, row?.UserState, row?.ModUserState];
  for (const c of candidates) {
    if (c == null || c === "") continue;
    const normalized = normalizeCompoundState(c);
    if (hasCompoundStateFlags(normalized)) return normalized;
  }

  const parts = [
    mapRollupWord(row?.CommState ?? row?.commState, COMM_WORD_TO_FLAG),
    mapRollupWord(row?.ObjectState ?? row?.objectState, OBJ_WORD_TO_FLAG),
  ].filter(Boolean);

  const joined = parts.join("|");
  const groups = splitStateGroups(joined);
  const worst = unwrapStateValue(row?.WorstState ?? row?.worstState);
  const obj = unwrapStateValue(row?.ObjectState ?? row?.objectState);
  const looksExplicitlyDisabled =
    /^disabled$/i.test(worst) || /^disabled$/i.test(obj);

  if (looksExplicitlyDisabled && groups.state === "—") {
    parts.push("STATE_NEUTRAL");
  }

  return parts.filter(Boolean).join("|");
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
  return rows.map((r, i) => {
    const CommState = unwrapStateValue(r.CommState ?? r.commState);
    const ObjectState = unwrapStateValue(r.ObjectState ?? r.objectState);
    const WorstState = unwrapStateValue(r.WorstState ?? r.worstState);
    // Keep raw State (may be bitmask number) for decodeModUserState
    const rawState = r.State ?? r.state ?? r.UserState ?? null;
    const rawId = r.ObjectID ?? r.i ?? null;
    const mapped = {
      id: String(rawId ?? r.path ?? r.Path ?? `nav-${i}`),
      objectId: rawId,
      name: r.ObjectName ?? r.n ?? r.Name ?? "—",
      path: r.Path ?? r.path ?? "",
      type: r.Type ?? r.type ?? "—",
      image: r.Image ?? r.image ?? "",
      CommState,
      ObjectState,
      WorstState,
      State: rawState,
    };
    mapped.State = resolveCompoundState(mapped);
    return mapped;
  });
}

/** Parse `State` pipe flags into an uppercase set (e.g. COMM_GOOD|STATE_GOOD). */
export function parseStateFlags(state) {
  const raw = normalizeCompoundState(state);
  if (!raw) return new Set();
  return new Set(
    raw
      .split("|")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
  );
}

/**
 * Split `State` into Comm / State / Object flag groups (order preserved).
 * Example: "COMM_GOOD|STATE_GOOD|OBJ_ENABLED|OBJ_DYNAMIC"
 *   → { comm: "COMM_GOOD", state: "STATE_GOOD", object: "OBJ_ENABLED|OBJ_DYNAMIC" }
 */
export function splitStateGroups(state) {
  const raw = normalizeCompoundState(state);
  const comm = [];
  const st = [];
  const obj = [];
  if (raw) {
    for (const part of raw.split("|")) {
      const flag = part.trim();
      if (!flag) continue;
      const u = flag.toUpperCase();
      if (u.startsWith("COMM_")) comm.push(u);
      else if (u.startsWith("STATE_")) st.push(u);
      else if (u.startsWith("OBJ_")) obj.push(u);
    }
  }
  return {
    comm: comm.join("|") || "—",
    state: st.join("|") || "—",
    object: obj.join("|") || "—",
  };
}

/**
 * Classify object health from Object Properties `State` (ModUserState flags).
 * Aligned with inmation DataStudio traffic lights + docs examples:
 * https://docs.inmation.com/datastudio/1.110/general/states.html
 * https://docs.inmation.com/system/1.110/object-states/states-in-the-system.html
 *
 * Used by Overview KPIs + Site Summary — NOT by HM Navigation list coloring.
 *
 * Priority: Problem > Warning > Disabled > Unknown > Good
 *
 * PROBLEM:  COMM_ERROR | STATE_ERROR
 * WARNING:  COMM_WARNING | STATE_WARNING | STATE_UNCONFIRMED | OBJ_CLASS_MISMATCH
 * DISABLED: object explicitly off (DataStudio grey) —
 *           (COMM_NEUTRAL|STATE_NEUTRAL) AND NOT OBJ_ENABLED,
 *           or HM ObjectState/WorstState === "Disabled"
 *           NOTE: STATE_NEUTRAL + OBJ_ENABLED is NOT disabled (e.g. under a down connector)
 * UNKNOWN:  STATE_EMPTY (mainly relays)
 * GOOD:     everything else (COMM_EMPTY alone is normal for I/O items)
 */
export function classifyNavHealth(row) {
  const flags = parseStateFlags(resolveCompoundState(row));

  if (flags.has("COMM_ERROR") || flags.has("STATE_ERROR")) {
    return "bad";
  }

  if (
    flags.has("COMM_WARNING") ||
    flags.has("STATE_WARNING") ||
    flags.has("STATE_UNCONFIRMED") ||
    flags.has("OBJ_CLASS_MISMATCH")
  ) {
    return "warning";
  }

  // DataStudio grey = disabled object: neutral lights and no OBJ_ENABLED
  const objectState = unwrapStateValue(row?.ObjectState ?? row?.objectState);
  const worstState = unwrapStateValue(row?.WorstState ?? row?.worstState);
  const explicitlyDisabled =
    /^disabled$/i.test(objectState) || /^disabled$/i.test(worstState);
  const neutralOff =
    (flags.has("COMM_NEUTRAL") || flags.has("STATE_NEUTRAL")) &&
    !flags.has("OBJ_ENABLED");
  if (explicitlyDisabled || neutralOff) {
    return "disabled";
  }

  if (flags.has("STATE_EMPTY")) {
    return "unknown";
  }

  return "good";
}

/**
 * HM Navigation list row accent — same idea as default Health Monitor table rules
 * on WorstState (Bad / Warning / Disabled). Cell text stays CommState / ObjectState.
 */
export function classifyNavListAccent(row) {
  const worst = unwrapStateValue(row?.WorstState ?? row?.worstState);
  if (/^bad$/i.test(worst)) return "bad";
  if (/^warning$/i.test(worst)) return "warning";
  if (/^disabled$/i.test(worst)) return "disabled";
  if (/^empty$/i.test(worst)) return "empty";
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
 * Known Bayer site code, or "Global" when the path/name does not match a site filter.
 * Used by Issues & Alerts (and similar site pickers).
 */
export function siteLabelFromRow(row) {
  return siteFromRow(row) || "Global";
}

/**
 * Site codes for a filter dropdown: known sites present in rows, plus Global
 * (always, for rows that do not match a Bayer site code).
 */
export function buildSiteFilterOptions(rows) {
  const known = new Set();
  for (const r of rows || []) {
    const s = siteFromRow(r);
    if (s) known.add(s);
  }
  const sites = [...known].sort((a, b) => a.localeCompare(b));
  sites.unshift("Global");
  return sites;
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
      site: siteLabelFromRow(r),
      component: r.name || r.ObjectName || "—",
      type: r.type || r.Type || "—",
      message:
        resolveCompoundState(r) ||
        [
          r.WorstState && `WorstState: ${r.WorstState}`,
          r.CommState && `Comm: ${r.CommState}`,
        ]
          .filter(Boolean)
          .join(" · ") ||
        "Problem",
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
 * G / P / W / U / D = Good / Problems / Warnings / Unknown / Disabled.
 */
export function siteSummaryRows(rows) {
  const buckets = new Map();
  for (const site of [...KNOWN_SITES, "Global"]) {
    buckets.set(site, {
      site,
      total: 0,
      good: 0,
      problems: 0,
      warnings: 0,
      unknown: 0,
      disabled: 0,
    });
  }
  for (const r of rows || []) {
    const site = siteLabelFromRow(r);
    if (!buckets.has(site)) continue;
    const b = buckets.get(site);
    b.total += 1;
    const h = classifyNavHealth(r);
    if (h === "bad") b.problems += 1;
    else if (h === "warning") b.warnings += 1;
    else if (h === "unknown") b.unknown += 1;
    else if (h === "disabled") b.disabled += 1;
    else b.good += 1;
  }
  return [...KNOWN_SITES, "Global"]
    .map((site) => {
      const b = buckets.get(site);
      const score = b.total ? Math.round((b.good / b.total) * 1000) / 10 : null;
      return {
        site,
        score,
        total: b.total,
        good: b.good,
        problems: b.problems,
        warnings: b.warnings,
        unknown: b.unknown,
        disabled: b.disabled,
        present: b.total > 0,
      };
    })
    .filter((r) => r.present);
}

/** Classify issue category for Top Issue Types (from State flags). */
export function issueTypeLabel(row) {
  const flags = parseStateFlags(row?.State);
  if (flags.has("COMM_ERROR")) return "Communication";
  if (flags.has("STATE_ERROR")) return "State Error";
  if (flags.has("OBJ_CLASS_MISMATCH")) return "Class Mismatch";
  if (flags.has("COMM_WARNING")) return "Comm Warning";
  if (flags.has("STATE_WARNING")) return "State Warning";
  if (flags.has("STATE_UNCONFIRMED")) return "Unconfirmed";
  if (flags.has("STATE_EMPTY")) return "Unknown / Empty";
  if (flags.has("COMM_NEUTRAL") || flags.has("STATE_NEUTRAL")) return "Disabled";
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
  const compound = resolveCompoundState(row);
  if (compound) return compound;
  return (
    [
      row?.WorstState && `WorstState: ${row.WorstState}`,
      row?.CommState && `Comm: ${row.CommState}`,
      row?.ObjectState && `Object: ${row.ObjectState}`,
    ]
      .filter(Boolean)
      .join(" · ") || "—"
  );
}

function severityForHealth(health) {
  if (health === "bad") return "High";
  if (health === "warning") return "Medium";
  if (health === "disabled") return "Disabled";
  if (health === "unknown") return "Unknown";
  return "Low";
}

/**
 * Record first-seen timestamps for Problem/Warning/Unknown/Disabled rows so Duration/Time
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
 * @returns {{ problems: object[], warnings: object[], unknown: object[], disabled: object[] }}
 */
export function listIssuesAndAlerts(rows, now = Date.now()) {
  const onset = touchIssueOnsets(rows, now);
  const problems = [];
  const warnings = [];
  const unknown = [];
  const disabled = [];

  for (const r of rows || []) {
    const health = classifyNavHealth(r);
    if (health === "good") continue;
    const started = onset[issueOnsetKey(r, health)] ?? now;
    const entry = {
      id: String(r.id || ""),
      objectId: r.objectId ?? r.id ?? null,
      path: r.path || "",
      time: formatIssueClock(started),
      timeMs: started,
      severity: severityForHealth(health),
      site: siteLabelFromRow(r),
      component: r.name || r.ObjectName || "—",
      type: issueTypeLabel(r),
      message: issueMessage(r),
      // Full compound State (same as Message) — Status column removed from P/W/U tables
      status: issueMessage(r),
      duration: formatIssueDuration(now - started),
      durationMs: Math.max(0, now - started),
      health,
    };
    if (health === "bad") problems.push(entry);
    else if (health === "warning") warnings.push(entry);
    else if (health === "unknown") unknown.push(entry);
    else if (health === "disabled") disabled.push(entry);
  }

  const bySiteThenName = (a, b) =>
    String(a.site).localeCompare(String(b.site)) ||
    String(a.component).localeCompare(String(b.component));
  problems.sort(bySiteThenName);
  warnings.sort(bySiteThenName);
  unknown.sort(bySiteThenName);
  disabled.sort(bySiteThenName);
  return { problems, warnings, unknown, disabled };
}

/**
 * HM Logs — `fetchLogTable` (needs starttime/endtime like WebStudio timeperiodtable).
 * Tries absolute ISO window first; does not stop on empty successful responses.
 */
export async function fetchObjectLogTable(objectId, options = {}) {
  const id = coerceObjectId(objectId) ?? objectId;
  if (id == null || id === "") {
    throw new Error("No ObjectID for fetchLogTable");
  }
  const idStr = String(id);
  const path = options.path ? String(options.path).trim() : "";
  const startRel = String(options.starttime || "*-1d");
  const endRel = String(options.endtime || "*");
  const times = periodToApiTimes({
    start: startRel,
    end: endRel,
    intervals: 100,
  });
  const absStart = times.absolute.start_time;
  const absEnd = times.absolute.end_time;

  const attempts = [
    { ObjectID: idStr, starttime: absStart, endtime: absEnd },
    { ObjectID: idStr, starttime: startRel, endtime: endRel },
  ];
  if (path) {
    attempts.push({
      ObjectID: idStr,
      Path: path,
      starttime: absStart,
      endtime: absEnd,
    });
    attempts.push({ Path: path, starttime: absStart, endtime: absEnd });
  }

  let lastErr = null;
  let sawOk = false;
  let emptySample = null;
  for (const farg of attempts) {
    try {
      const body = await execHm("fetchLogTable", farg);
      const rows = normalizeLogRows(body);
      sawOk = true;
      if (rows.length) return rows;
      if (!emptySample) emptySample = body;
    } catch (err) {
      lastErr = err;
    }
  }
  if (sawOk) {
    if (emptySample) {
      console.warn(
        "[hm-live] fetchLogTable returned empty for ObjectID",
        idStr,
        emptySample
      );
    }
    return [];
  }
  throw lastErr || new Error("fetchLogTable failed");
}

function digLogField(obj, ...keys) {
  for (const k of keys) {
    if (obj == null) return undefined;
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) {
      return unwrapLogScalar(obj[k]);
    }
  }
  return undefined;
}

function unwrapLogScalar(v) {
  if (v == null) return v;
  if (typeof v === "object" && !Array.isArray(v) && "v" in v) {
    return unwrapLogScalar(v.v);
  }
  return v;
}

function extractLogRowArrays(body) {
  const found = [];
  const visit = (node, depth) => {
    if (node == null || depth > 6) return;
    if (Array.isArray(node)) {
      if (
        node.length &&
        typeof node[0] === "object" &&
        node[0] &&
        (node[0]._common != null ||
          node[0].message != null ||
          node[0].Message != null ||
          node[0].severity != null ||
          node[0].Severity != null ||
          node[0].timestamp != null ||
          node[0].time != null)
      ) {
        found.push(node);
      }
      return;
    }
    if (typeof node !== "object") return;
    for (const k of ["data", "rows", "items", "logs", "table", "model"]) {
      if (k in node) visit(node[k], depth + 1);
    }
  };
  visit(body, 0);
  visit(unwrapData(body), 0);
  if (!found.length) return [];
  found.sort((a, b) => b.length - a.length);
  return found[0];
}

function normalizeLogRows(body) {
  const rows = extractLogRowArrays(body);
  if (!Array.isArray(rows)) return [];
  return rows.map((r, i) => {
    const common =
      r?._common && typeof r._common === "object" ? r._common : null;
    const ts =
      digLogField(
        r,
        "timestamp",
        "Timestamp",
        "Timestamp (UTC)",
        "TimestampUTC",
        "t",
        "time",
        "Time",
        "LocalTime",
        "localtime"
      ) ?? digLogField(common, "time", "timestamp", "Timestamp", "LocalTime");
    const msg =
      digLogField(r, "message", "Message", "msg", "Msg") ??
      digLogField(common, "message", "Message", "msg") ??
      "";
    const severity =
      digLogField(r, "severity", "Severity", "level", "Level") ??
      digLogField(common, "severity", "Severity", "level") ??
      "";
    return {
      id: String(r.id ?? r.i ?? `${i}`),
      timestamp: ts,
      timeMs: toEpochMs(ts),
      message: msg == null ? "" : String(msg),
      severity: String(severity || "").trim(),
      raw: r,
    };
  });
}

/**
 * Last 24h logs for an object with Severity Error or Warning.
 * Display: Timestamp (UTC) · Severity · Message. Newest first, max `limit`.
 */
export async function fetchObjectSeverityLogs(
  objectId,
  { starttime = "*-1d", endtime = "*", limit = 50, path = "" } = {}
) {
  const logs = await fetchObjectLogTable(objectId, {
    starttime,
    endtime,
    path,
  });
  const withSev = (logs || []).filter((e) =>
    isErrorOrWarningSeverity(e.severity)
  );
  withSev.sort((a, b) => (b.timeMs || 0) - (a.timeMs || 0));
  const capped = withSev.slice(0, Math.max(0, Number(limit) || 50));
  return capped.map((e) => {
    const common =
      e.raw?._common && typeof e.raw._common === "object"
        ? e.raw._common
        : null;
    const localRaw =
      digLogField(e.raw, "LocalTime", "localtime", "localTime") ??
      digLogField(common, "LocalTime", "localtime", "localTime", "time");
    const logId =
      digLogField(e.raw, "LogID", "LogId", "logId", "id") ??
      digLogField(common, "LogID", "LogId", "logId", "id") ??
      e.id;
    return {
      id: String(e.id),
      logId: logId != null ? String(logId) : String(e.id),
      timestampUtc:
        e.timestamp != null ? formatHmTimestampUtc(e.timestamp) : "—",
      localTime:
        localRaw != null ? formatHmTimestamp(localRaw) : e.timestamp != null
          ? formatHmTimestamp(e.timestamp)
          : "—",
      timeMs: e.timeMs,
      message: e.message?.trim() ? e.message.trim() : "—",
      severity: e.severity,
      raw: e.raw || null,
      sections: buildLogDetailSections(e.raw),
    };
  });
}

/** Pretty section title for nested log payload keys. */
function logSectionTitle(key) {
  const k = String(key || "").replace(/^_/, "");
  const map = {
    common: "Common",
    environment: "Environment",
    object: "Object Details",
    objectdetails: "Object Details",
    objectDetails: "Object Details",
    network: "Network Peer",
    networkpeer: "Network Peer",
    peer: "Network Peer",
    source: "Source",
  };
  if (map[k]) return map[k];
  if (map[k.toLowerCase()]) return map[k.toLowerCase()];
  return k
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function logFieldLabel(key) {
  const map = {
    time: "Timestamp (UTC)",
    timestamp: "Timestamp (UTC)",
    Timestamp: "Timestamp (UTC)",
    LocalTime: "Local Time",
    localtime: "Local Time",
    localTime: "Local Time",
    severity: "Severity",
    Severity: "Severity",
    component: "Component",
    Component: "Component",
    facility: "Facility",
    Facility: "Facility",
    code: "Code",
    Code: "Code",
    LogID: "Log ID",
    LogId: "Log ID",
    logId: "Log ID",
    id: "Log ID",
    Runtime: "Runtime",
    area: "Area",
    Area: "Area",
    scope: "Scope",
    Scope: "Scope",
    group: "Group",
    Group: "Group",
    ObjectID: "Object ID",
    ObjectId: "Object ID",
    objectId: "Object ID",
    ObjectName: "Object Name",
    objectName: "Object Name",
    message: "Message",
    Message: "Message",
    Persistent: "Persistent",
    New: "New",
    CounterAction: "Counter Action",
    OperatingSystem: "Operating System",
    Host: "Host",
    User: "User",
    Service: "Service",
    RuntimeID: "Runtime ID",
    Process: "Process",
    PID: "PID",
    TID: "TID",
    FullObjectPath: "Full Object Path",
    Path: "Full Object Path",
    path: "Full Object Path",
    SystemName: "System Name",
    PropertyName: "Property Name",
    ProtocolType: "Protocol Type",
    Direction: "Direction",
    LocalIP: "Local IP",
    LocalPort: "Local Port",
    RemoteIP: "Remote IP",
    RemotePort: "Remote Port",
    RemoteHost: "Remote Host",
    RemoteUser: "Remote User",
    ClientType: "Client Type",
    ChannelType: "Channel Type",
    Module: "Module",
    Line: "Line",
  };
  if (map[key]) return map[key];
  return String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ");
}

function formatLogDetailValue(key, value) {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  const s = String(value);
  const lk = String(key).toLowerCase();
  if (
    lk.includes("time") ||
    lk.includes("timestamp") ||
    key === "time" ||
    key === "LocalTime"
  ) {
    if (lk.includes("local")) return formatHmTimestamp(s) || s;
    return formatHmTimestampUtc(s) || s;
  }
  return s;
}

/**
 * Build DataStudio-like Log Details sections from a raw fetchLogTable row.
 * @returns {{ title: string, fields: { name: string, value: string }[] }[]}
 */
export function buildLogDetailSections(raw) {
  if (!raw || typeof raw !== "object") return [];
  const sections = [];
  const skipKeys = new Set(["id", "i", "raw"]);

  const pushSection = (title, obj) => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
    const fields = [];
    for (const [k, v] of Object.entries(obj)) {
      if (v != null && typeof v === "object" && !Array.isArray(v) && !("v" in v)) {
        continue;
      }
      const val = unwrapLogScalar(v);
      if (val == null || val === "") {
        fields.push({ name: logFieldLabel(k), value: "" });
        continue;
      }
      if (typeof val === "object") {
        fields.push({
          name: logFieldLabel(k),
          value: formatLogDetailValue(k, val),
        });
        continue;
      }
      fields.push({
        name: logFieldLabel(k),
        value: formatLogDetailValue(k, val),
      });
    }
    if (fields.length) sections.push({ title, fields });
  };

  // Prefer known nested bags (_common, _environment, …)
  const nestedOrder = [
    ["_common", "Common"],
    ["common", "Common"],
    ["_environment", "Environment"],
    ["environment", "Environment"],
    ["_object", "Object Details"],
    ["object", "Object Details"],
    ["objectdetails", "Object Details"],
    ["_network", "Network Peer"],
    ["network", "Network Peer"],
    ["networkpeer", "Network Peer"],
    ["_source", "Source"],
    ["source", "Source"],
  ];
  const used = new Set();
  for (const [key, title] of nestedOrder) {
    if (raw[key] && typeof raw[key] === "object") {
      pushSection(title, raw[key]);
      used.add(key);
    }
  }

  // Any other nested objects as sections
  for (const [k, v] of Object.entries(raw)) {
    if (used.has(k) || skipKeys.has(k)) continue;
    if (v && typeof v === "object" && !Array.isArray(v) && !("v" in v)) {
      pushSection(logSectionTitle(k), v);
      used.add(k);
    }
  }

  // Flat leftover scalars → Common (or append)
  const flat = {};
  for (const [k, v] of Object.entries(raw)) {
    if (used.has(k) || skipKeys.has(k)) continue;
    if (v != null && typeof v === "object" && !Array.isArray(v) && !("v" in v)) {
      continue;
    }
    flat[k] = v;
  }
  if (Object.keys(flat).length) {
    const existing = sections.find((s) => s.title === "Common");
    if (existing) {
      for (const [k, v] of Object.entries(flat)) {
        existing.fields.push({
          name: logFieldLabel(k),
          value: formatLogDetailValue(k, unwrapLogScalar(v)),
        });
      }
    } else {
      pushSection("Common", flat);
    }
  }

  return sections;
}

function isErrorOrWarningSeverity(severity) {
  const s = String(severity || "")
    .trim()
    .toUpperCase();
  if (!s) return false;
  // Numeric codes sometimes used by log APIs
  if (s === "3" || s === "4") return true;
  if (
    s === "ERROR" ||
    s === "ERR" ||
    s.includes("ERROR") ||
    s === "SEV_ERROR" ||
    s === "LOG_ERROR"
  ) {
    return true;
  }
  if (
    s === "WARNING" ||
    s === "WARN" ||
    s.includes("WARNING") ||
    s === "SEV_WARNING" ||
    s === "LOG_WARNING"
  ) {
    return true;
  }
  return false;
}

function scoreFromHealth(health) {
  if (health === "bad") return 40;
  if (health === "warning") return 70;
  if (health === "unknown") return 55;
  if (health === "disabled") return 50;
  return 100;
}

function displayWorstState(row, health) {
  if (health === "bad") return "Problem";
  if (health === "warning") return "Warning";
  if (health === "unknown") return "Unknown";
  if (health === "disabled") return "Disabled";
  const worst = unwrapStateValue(row?.WorstState);
  if (worst) return worst;
  return "Good";
}

/** Map one nav-table row into a Drill-down hierarchy object. */
export function navRowToDrillObject(row) {
  const health = classifyNavHealth(row);
  return {
    id: String(row?.id || row?.path || row?.name || ""),
    site: siteLabelFromRow(row),
    name: row?.name || row?.ObjectName || "—",
    type: row?.type || row?.Type || "—",
    path: row?.path || row?.Path || "",
    image: row?.image || "",
    objectId: row?.objectId ?? row?.id ?? null,
    worstState: displayWorstState(row, health),
    health,
    severity: health === "good" ? "Good" : severityForHealth(health),
    problems: health === "bad" ? 1 : 0,
    warnings: health === "warning" ? 1 : 0,
    info: health === "unknown" || health === "disabled" ? 1 : 0,
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
  sites.add("Global");
  const siteList = [...sites].sort((a, b) => {
    if (a === "Global") return -1;
    if (b === "Global") return 1;
    return a.localeCompare(b);
  });
  return {
    sites: ["All", ...siteList],
    types: ["All", ...[...types].sort()],
    severities: ["All", "High", "Medium", "Unknown", "Disabled", "Good"],
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
 * 1) Its own Problem/Warning/Unknown/Disabled entry if unhealthy
 * 2) Otherwise other unhealthy objects at the same site (context)
 */
export function relatedIssuesForDrillObject(obj, allRows, now = Date.now()) {
  if (!obj) return [];
  const { problems, warnings, unknown, disabled } = listIssuesAndAlerts(allRows, now);
  const all = [...problems, ...warnings, ...(unknown || []), ...(disabled || [])];
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
    unknown: summary.unknown || 0,
    disabled: summary.disabled || 0,
    info: (summary.unknown || 0) + (summary.disabled || 0),
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
  let unknown = 0;
  let disabled = 0;
  let good = 0;
  for (const r of list) {
    const h = classifyNavHealth(r);
    if (h === "bad") bad += 1;
    else if (h === "warning") warning += 1;
    else if (h === "unknown") unknown += 1;
    else if (h === "disabled") disabled += 1;
    else good += 1;
  }
  const sites = extractKnownSites(list);
  const total = list.length;
  const goodPct = total ? Math.round((good / total) * 1000) / 10 : 0;
  const problemsPct = total ? Math.round((bad / total) * 1000) / 10 : 0;
  const warningsPct = total ? Math.round((warning / total) * 1000) / 10 : 0;
  const unknownPct = total ? Math.round((unknown / total) * 1000) / 10 : 0;
  const disabledPct = total ? Math.round((disabled / total) * 1000) / 10 : 0;
  return {
    total,
    bad,
    warning,
    unknown,
    disabled,
    good,
    other: 0,
    goodPct,
    problemsPct,
    warningsPct,
    unknownPct,
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
  // Object Properties State may arrive as ModUserState bitmask
  if (key === "State") {
    const decoded = normalizeCompoundState(v);
    if (decoded) return decoded;
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

/** True when compound State includes both COMM_* and STATE_* (Object Properties shape). */
export function compoundStateHasCommAndState(state) {
  const g = splitStateGroups(state);
  return g.comm !== "—" && g.state !== "—";
}

const propsStateCache = new Map();

/**
 * Ensure row.State is the full Object Properties compound string.
 * Nav table often omits STATE_* (fallback → COMM_ERROR|OBJ_ENABLED only).
 * Fetches fetchObjProps when COMM or STATE group is missing.
 */
export async function ensureFullCompoundState(row) {
  if (!row) return "";
  const current = resolveCompoundState(row);
  if (compoundStateHasCommAndState(current)) {
    row.State = current;
    return current;
  }

  const key = String(row.id || row.path || row.name || "");
  if (key && propsStateCache.has(key)) {
    const cached = propsStateCache.get(key);
    if (cached) row.State = cached;
    return cached || current;
  }

  try {
    const props = await fetchLiveObjProps({
      id: row.id,
      path: row.path,
      name: row.name,
      type: row.type,
      image: row.image,
    });
    const full = normalizeCompoundState(props?.State);
    if (full && hasCompoundStateFlags(full)) {
      if (key) propsStateCache.set(key, full);
      row.State = full;
      return full;
    }
  } catch (err) {
    console.warn("[hm-live] ensureFullCompoundState", row?.name, err?.message || err);
  }

  if (key) propsStateCache.set(key, current);
  return current;
}

/**
 * For Problem / Warning / Unknown / Disabled rows missing STATE_*, pull full State from props.
 * Keeps Active Critical Issues / Issues Message columns complete (COMM|STATE|OBJ).
 */
export async function enrichIncompleteCompoundStates(
  rows,
  { concurrency = 8 } = {}
) {
  const list = Array.isArray(rows) ? rows : [];
  const need = list.filter((r) => {
    const h = classifyNavHealth(r);
    if (h === "good") return false;
    return !compoundStateHasCommAndState(resolveCompoundState(r));
  });
  if (!need.length) return list;

  let i = 0;
  async function worker() {
    while (i < need.length) {
      const idx = i++;
      await ensureFullCompoundState(need[idx]);
    }
  }
  const n = Math.min(concurrency, need.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return list;
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

