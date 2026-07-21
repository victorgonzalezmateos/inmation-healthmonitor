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

/** Aggregate List View health counts for Overview KPIs. */
export function summarizeNavHealth(rows) {
  const list = Array.isArray(rows) ? rows : [];
  let bad = 0;
  let warning = 0;
  let disabled = 0;
  let good = 0;
  let other = 0;
  for (const r of list) {
    const h = classifyNavHealth(r);
    const worst = unwrapStateValue(r?.WorstState);
    if (h === "bad") bad += 1;
    else if (h === "warning") warning += 1;
    else if (h === "disabled") disabled += 1;
    else if (stateIn(worst, ["Good"])) good += 1;
    else other += 1; // Empty, Neutral, or blank — not yellow, not Good
  }
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
    other,
    goodPct,
    problemsPct,
    warningsPct,
    disabledPct,
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

