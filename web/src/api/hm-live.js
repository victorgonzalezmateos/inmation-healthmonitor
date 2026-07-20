/**
 * Map Health Monitor Web API responses into the Health Monitor page model.
 */

import { execHm } from "./inmation.js";

/** HM tree nodes use n/i/path/c/image/t — map to our UI shape. */
export function mapHmTreeNodes(nodes) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map(mapOne);
}

function mapOne(n) {
  // Keep raw `i` (number or string) — counters API needs numeric ObjectID
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
 * WebStudio passes $i as a JSON number. String IDs often 400 in Lua getobject.
 */
export function coerceObjectId(value) {
  if (value == null || value === "") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const s = String(value).trim();
  const paren = s.match(/\((\d+)\)/);
  if (paren) {
    const n = Number(paren[1]);
    if (Number.isSafeInteger(n)) return n;
    return paren[1];
  }
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isSafeInteger(n)) return n;
    return s;
  }
  return s;
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

export async function fetchLiveObjProps(node) {
  const objectId = coerceObjectId(node.objectId ?? node.id);
  const body = await execHm("fetchObjProps", {
    ObjectName: node.name,
    ObjectID: objectId,
    Path: node.path,
    Image: node.image || "",
  });
  const data = unwrapData(body);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  return {
    ObjectName: row.ObjectName ?? node.name,
    Type: row.Type ?? node.type,
    ObjectID: row.ObjectID ?? objectId,
    ObjectIDExtended: row.ObjectIDExtended,
    Path: row.Path ?? node.path,
    ConfigVersion: row.ConfigVersion ?? "—",
    ClassVersion: row.ClassVersion ?? "—",
    Created: row.Created ?? "—",
    Modified: row.Modified ?? "—",
    State: row.State ?? "—",
  };
}

export async function fetchLiveCounters(node, props = null) {
  const objectId = coerceObjectId(
    props?.ObjectID ?? props?.ObjectIDExtended ?? node.objectId ?? node.id
  );
  const farg = { ObjectID: objectId };
  if (node.path) farg.Path = node.path;

  try {
    const body = await execHm("fetchPerformanceCountersTable", farg);
    return normalizeCounterRows(body);
  } catch (err) {
    if (node.path && err.status === 400) {
      const body = await execHm("fetchPerformanceCountersTable", {
        Path: node.path,
        ObjectID: objectId,
        ObjectName: node.name,
      });
      return normalizeCounterRows(body);
    }
    throw err;
  }
}

function normalizeCounterRows(body) {
  const data = unwrapData(body);
  const rows = Array.isArray(data) ? data : data?.rows || [];
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({
    ObjectName: r.ObjectName ?? r.n ?? "—",
    type: r.type ?? r.Type ?? "—",
    Value: r.Value ?? r.v ?? "—",
    Unit: r.Unit ?? "",
    penName: r.penName ?? "",
    path: r.path ?? r.Path ?? "",
  }));
}
