/**
 * EAM Critical Objects — live Table Holder (TableData) via Web API read.
 */

import { formatApiError, readItems, writeItems } from "./inmation.js";

/** Primary path (sibling of Generic Item "EAM" under BCH Health Monitor). */
export const EAM_CRITICAL_OBJECT_PATH =
  "/System/Core/_Global Core Logic/System Monitoring/BCH Health Monitor/EAM Critical Objects";

/** Fallbacks if primary cannot be resolved. */
export const EAM_CRITICAL_PATHS = [
  EAM_CRITICAL_OBJECT_PATH,
  "/System/Core/_Global Core Logic/System Monitoring/BCH Health Monitor/EAM/EAM Critical Objects",
];

const COL_ALIASES = {
  path: ["path", "Path"],
  objectType: ["objecttype", "object type", "ObjectType", "Object Type", "Type"],
  standby: ["standby", "Standby"],
  localContact: [
    "localcontact",
    "local contact",
    "LocalContact",
    "Local Contact",
  ],
};

function normKey(k) {
  return String(k || "")
    .toLowerCase()
    // inmation TablePropertyGrid often prefixes: "1 Path", "2 ObjectType", …
    .replace(/^\d+\s+/, "")
    .replace(/[\s_]+/g, "");
}

function pickColumn(rowOrCols, aliases) {
  const want = aliases.map(normKey);
  if (Array.isArray(rowOrCols)) {
    for (const name of rowOrCols) {
      if (want.includes(normKey(name))) return name;
    }
    return null;
  }
  for (const key of Object.keys(rowOrCols || {})) {
    if (want.includes(normKey(key))) return rowOrCols[key];
  }
  return "";
}

function isNullish(v) {
  if (v == null) return true;
  const s = String(v).trim();
  return !s || /^<null>$/i.test(s) || /^null$/i.test(s);
}

function displayCell(v) {
  if (isNullish(v)) return "";
  return String(v).trim();
}

function normalizeRow(raw, index = 0) {
  const path = displayCell(pickColumn(raw, COL_ALIASES.path));
  const objectType = displayCell(pickColumn(raw, COL_ALIASES.objectType));
  const standby = displayCell(pickColumn(raw, COL_ALIASES.standby));
  const localContact = displayCell(pickColumn(raw, COL_ALIASES.localContact));
  return {
    id: `eam-${index}`,
    path,
    objectType,
    type: objectType,
    standby,
    localContact,
    emails: localContact
      ? localContact
          .split(/[,;]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  };
}

function rowsFromColumnArrays(data) {
  const colNames = Object.keys(data || {}).filter((k) =>
    Array.isArray(data[k])
  );
  if (!colNames.length) return [];

  const pathCol = pickColumn(colNames, COL_ALIASES.path) || colNames[0];
  const typeCol =
    pickColumn(colNames, COL_ALIASES.objectType) ||
    colNames.find((c) => c !== pathCol) ||
    colNames[0];
  const standbyCol = pickColumn(colNames, COL_ALIASES.standby);
  const contactCol = pickColumn(colNames, COL_ALIASES.localContact);

  const n = Math.max(...colNames.map((k) => data[k].length), 0);
  const rows = [];
  for (let i = 0; i < n; i++) {
    rows.push(
      normalizeRow(
        {
          Path: data[pathCol]?.[i],
          ObjectType: data[typeCol]?.[i],
          Standby: standbyCol ? data[standbyCol]?.[i] : "",
          LocalContact: contactCol ? data[contactCol]?.[i] : "",
        },
        i
      )
    );
  }
  return rows;
}

/**
 * Convert schema-less TableData JSON to row objects.
 */
export function parseTableData(raw) {
  let obj = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      obj = JSON.parse(trimmed);
    } catch {
      throw new Error("TableData is not valid JSON");
    }
  }
  if (obj == null) return [];
  if (typeof obj !== "object") return [];

  // Array of row objects
  if (Array.isArray(obj)) {
    if (!obj.length) return [];
    if (typeof obj[0] === "object" && !Array.isArray(obj[0])) {
      return obj.map((r, i) => normalizeRow(r, i));
    }
  }

  // { columns: [...], data: [ [...], ... ] } or rows:
  if (Array.isArray(obj.columns) && (Array.isArray(obj.data) || Array.isArray(obj.rows))) {
    const cols = obj.columns.map((c) =>
      typeof c === "string" ? c : c?.n || c?.name || String(c)
    );
    const matrix = Array.isArray(obj.data) ? obj.data : obj.rows;
    return matrix.map((cells, i) => {
      const row = {};
      cols.forEach((name, idx) => {
        row[name] = Array.isArray(cells) ? cells[idx] : cells?.[name];
      });
      return normalizeRow(row, i);
    });
  }

  const data = obj.data != null ? obj.data : obj;

  // Column-oriented: { Path: [...], ObjectType: [...] }
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const colRows = rowsFromColumnArrays(data);
    if (colRows.length) return colRows;

    // Row map: { "1": { Path, ... }, ... }
    const values = Object.values(data);
    if (
      values.length &&
      values.every((v) => v && typeof v === "object" && !Array.isArray(v))
    ) {
      return values.map((r, i) => normalizeRow(r, i));
    }
  }

  // Array of rows under data
  if (Array.isArray(data)) {
    return data.map((r, i) => normalizeRow(r, i));
  }

  return [];
}

function unwrapReadItem(body) {
  const items =
    body?.data?.items ||
    body?.items ||
    (Array.isArray(body?.data) ? body.data : null) ||
    (Array.isArray(body) ? body : null);
  const item = Array.isArray(items) ? items[0] : null;
  if (!item || typeof item !== "object") {
    throw new Error(`Unexpected read response: ${formatApiError(body)}`);
  }
  const errObj = item.e || item.error;
  if (errObj != null) {
    throw new Error(
      errObj?.msg || formatApiError(errObj) || "Read error"
    );
  }
  return item;
}

/** Default column keys as returned by this Table Holder in DataStudio. */
export const EAM_COLUMN_KEYS = Object.freeze([
  "1 Path",
  "2 ObjectType",
  "3 Standby",
  "4 LocalContact",
]);

/**
 * Serialize app rows back to the TableData array shape inmation expects.
 * @param {object[]} rows
 * @param {string[]} [columnKeys]
 */
export function serializeTableData(rows, columnKeys) {
  const keys =
    Array.isArray(columnKeys) && columnKeys.length
      ? columnKeys
      : EAM_COLUMN_KEYS;
  const [pathKey, typeKey, standbyKey, contactKey] = keys;
  return (rows || []).map((r) => ({
    [pathKey]: r.path ?? "",
    [typeKey]: r.objectType || r.type || "",
    [standbyKey]: r.standby ?? "",
    [contactKey]:
      r.localContact ||
      (Array.isArray(r.emails) ? r.emails.join(",") : "") ||
      "",
  }));
}

function detectColumnKeys(raw) {
  let obj = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return [...EAM_COLUMN_KEYS];
    }
  }
  if (Array.isArray(obj) && obj[0] && typeof obj[0] === "object") {
    const keys = Object.keys(obj[0]);
    if (keys.length) return keys;
  }
  return [...EAM_COLUMN_KEYS];
}

/**
 * True when `v` is a real TableData payload (including empty table `[]`).
 * Distinguishes "empty table" from "property missing / unreadable".
 */
function isTableDataPayload(v) {
  if (v == null || v === "") return false;
  if (Array.isArray(v)) return true;
  if (typeof v === "string") {
    const t = v.trim();
    return t.startsWith("[") || t.startsWith("{");
  }
  if (typeof v === "object") {
    if (Array.isArray(v.columns) || Array.isArray(v.data) || Array.isArray(v.rows)) {
      return true;
    }
    // Column-oriented or row-map objects
    const keys = Object.keys(v);
    if (!keys.length) return true;
    if (keys.some((k) => Array.isArray(v[k]))) return true;
    if (keys.every((k) => v[k] && typeof v[k] === "object")) return true;
  }
  return false;
}

async function readTableProp(propPath, objectPath, options = {}) {
  const body = await readItems([{ p: propPath }], options);
  const item = unwrapReadItem(body);
  if (!isTableDataPayload(item.v)) {
    throw new Error(
      `${propPath}: empty value (q=${item.q ?? "—"})`
    );
  }
  const columnKeys = detectColumnKeys(item.v);
  const rows = parseTableData(item.v).map((r, i) => ({
    ...r,
    id: `eam-${i}`,
  }));
  return {
    rows,
    path: objectPath,
    propPath,
    columnKeys,
    sourceLabel: `Live · ${objectPath}`,
  };
}

/**
 * Load EAM Critical Objects rows from the host.
 * Tries object path and `.TableData` for each candidate.
 * Empty tables (`[]`) are valid and returned as 0 rows.
 *
 * @param {{ preferPropPath?: string, preferObjectPath?: string, signal?: AbortSignal, token?: string }} [options]
 */
export async function fetchEamCriticalObjects(options = {}) {
  const errors = [];
  const preferProp = options.preferPropPath;
  const preferObj =
    options.preferObjectPath ||
    (preferProp ? String(preferProp).replace(/\.TableData(Aux)?$/i, "") : null);

  if (preferProp) {
    try {
      return await readTableProp(
        preferProp,
        preferObj || EAM_CRITICAL_OBJECT_PATH,
        options
      );
    } catch (err) {
      errors.push(`${preferProp}: ${err.message || err}`);
      // Fall through to discovery if preferred path fails.
    }
  }

  for (const objectPath of EAM_CRITICAL_PATHS) {
    const propCandidates = [
      `${objectPath}.TableData`,
      `${objectPath}.TableDataAux`,
      objectPath,
    ];
    for (const propPath of propCandidates) {
      if (preferProp && propPath === preferProp) continue;
      try {
        return await readTableProp(propPath, objectPath, options);
      } catch (err) {
        errors.push(`${propPath}: ${err.message || err}`);
      }
    }
  }

  throw new Error(
    errors.length
      ? errors.join(" | ")
      : "Could not read EAM Critical Objects"
  );
}

/**
 * Write EAM Critical Objects rows back to TableData on the host.
 * @param {object[]} rows
 * @param {{ propPath?: string, objectPath?: string, columnKeys?: string[], signal?: AbortSignal }} [options]
 */
export async function saveEamCriticalObjects(rows, options = {}) {
  const objectPath = options.objectPath || EAM_CRITICAL_OBJECT_PATH;
  const propPath = options.propPath || `${objectPath}.TableData`;
  const columnKeys = options.columnKeys || EAM_COLUMN_KEYS;
  const table = serializeTableData(rows, columnKeys);

  await writeItems(
    [
      {
        p: propPath,
        v: table,
        q: 0,
      },
    ],
    { signal: options.signal }
  );

  return { propPath, objectPath, rowCount: table.length };
}
