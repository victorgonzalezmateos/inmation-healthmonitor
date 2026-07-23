/**
 * Reports — Health Monitor System Monitor Checkup via
 * inmation.app-reportviewer (reports + reportdata).
 * Renders the ADO.NET XML dataset as Smart Sentinel HTML (no Stimulsoft iframe).
 */

import Chart from "chart.js/auto";
import {
  WEBAPI_HOST,
  fetchReportData,
  fetchReportDesigns,
  formatApiError,
} from "./api/inmation.js";
import { siteLabelFromRow, buildSiteFilterOptions } from "./api/hm-live.js";
import { renderHealthDoughnut } from "./charts.js";
import { ensureIwaSession } from "./session.js";
import {
  clampPage,
  fullPagerHtml,
  pageCount,
  sliceRows,
  updateFullPager,
} from "./table-pager.js";

const REPORT_ITEM = {
  label: "System Monitor / Health Monitor Report",
  path: "/System/Core/_Global Core Logic/System Monitoring/Report/Health Monitor/Health Monitor Report",
};

/**
 * Native Stimulsoft Report Viewer for the Health Monitor Report
 * ("Report: System Monitor Checkup" — same item as this page loads via API).
 */
function reportViewerUrl() {
  const u = new URL(`${WEBAPI_HOST}/apps/reportviewer/`);
  u.searchParams.set("path", REPORT_ITEM.path);
  u.searchParams.set("secp", "iwa");
  u.searchParams.set("ssl", "true");
  return u.toString();
}

const DOUGHNUT_SPECS = [
  { key: "overall", title: "Overall", tag: "stateOverallDoughnut" },
  { key: "system", title: "System", tag: "stateSystemDoughnut" },
  { key: "core", title: "Core", tag: "stateCoreDoughnut" },
  { key: "relay", title: "Relay", tag: "stateRelayDoughnut" },
  { key: "connector", title: "Connector", tag: "stateConnectorDoughnut" },
  { key: "datasource", title: "Datasource", tag: "stateDatasourceDoughnut" },
  { key: "webapi", title: "WebAPI", tag: "stateWebapiDoughnut" },
  { key: "server", title: "Server", tag: "stateServerDoughnut" },
  { key: "datastore", title: "Datastore", tag: "stateDatastoreDoughnut" },
  { key: "mongodb", title: "MongoDB", tag: "stateMongoDBDoughnut" },
];

const INVENTORY_TABLES = [
  {
    key: "cores",
    title: "Cores",
    tag: "IO-CORE",
    cols: [
      ["name", "Name"],
      ["SystemName", "Host"],
      ["SoftwareVersion", "Version"],
      ["state", "State"],
      ["DiskUsagePercent", "Disk %"],
    ],
  },
  {
    key: "relays",
    title: "Relays",
    tag: "IO-RELAY",
    cols: [
      ["name", "Name"],
      ["SystemName", "Host"],
      ["SoftwareVersion", "Version"],
      ["state", "State"],
    ],
  },
  {
    key: "connectors",
    title: "Connectors",
    tag: "IO-CONNECTOR",
    cols: [
      ["name", "Name"],
      ["SystemName", "Host"],
      ["SoftwareVersion", "Version"],
      ["state", "State"],
      ["DiskUsagePercent", "Disk %"],
    ],
  },
  {
    key: "webapi",
    title: "Web API servers",
    tag: "IO-WEBAPISERVER",
    cols: [
      ["name", "Name"],
      ["SystemName", "Host"],
      ["SoftwareVersion", "Version"],
      ["state", "State"],
      ["BaseAddress", "Base"],
    ],
  },
  {
    key: "servers",
    title: "OPC servers",
    tag: "IO-SERVER",
    cols: [
      ["name", "Name"],
      ["SystemName", "Host"],
      ["SoftwareVersion", "Version"],
      ["state", "State"],
    ],
  },
];

const DATASOURCE_COLS = [
  ["name", "Name"],
  ["ServerType", "Type"],
  ["path", "Path"],
  ["state", "State"],
];

const CERT_COLS = [
  ["name", "Name"],
  ["path", "Path"],
  ["validTo", "Valid to"],
  ["expiresIn", "Expires in"],
];

const DATASOURCE_PAGE = 25;
const REPORT_TABLE_PAGE = 25;
const REPORT_LOAD_TIMEOUT_MS = 180_000;
const SKIP_XML_TAGS = new Set(["schema", "xs:schema", "xsd:schema"]);

const chartIds = new Set();
let bound = false;
/** Prefer Stimulsoft design named "Report"; fall back to host default. */
let selectedDesign = "Report";
let lastParsed = null;
let lastMeta = null;
/** @type {Record<string, number>} 1-based page per report table id */
const tablePage = {};
/** Inventory/datasource state filter: issues | all | good | bad | warning | disabled */
let stateFilter = "issues";
let siteFilter = "All";
/** @type {Record<string, { key: string, dir: number }>} */
const tableSort = {};
let loadSeq = 0;
let loadAbort = null;

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hmStudioUrl() {
  return reportViewerUrl();
}

function destroyReportCharts() {
  for (const id of chartIds) {
    const el = document.getElementById(id);
    if (el) Chart.getChart(el)?.destroy();
  }
  chartIds.clear();
}

/** Site code from a report inventory / cert / generic row. */
function reportRowSite(row) {
  return siteLabelFromRow({
    name: row?.name,
    path: row?.path,
    ObjectName: row?.name || row?.SystemName,
    Path: row?.path || row?.SystemName,
  });
}

function filterRowsBySite(rows) {
  if (!siteFilter || siteFilter === "All") return rows || [];
  return (rows || []).filter((r) => reportRowSite(r) === siteFilter);
}

function collectReportSites(parsed) {
  const bag = [];
  for (const rows of Object.values(parsed?.inventory || {})) {
    bag.push(...(rows || []));
  }
  bag.push(...(parsed?.certificates || []));
  for (const rows of Object.values(parsed?.allTables || {})) {
    bag.push(...(rows || []));
  }
  return buildSiteFilterOptions(
    bag.map((r) => ({
      name: r.name || r.SystemName,
      path: r.path || r.SystemName,
    }))
  );
}

function syncSiteFilterOptions(parsed) {
  const sel = document.getElementById("reports-site-filter");
  if (!sel) return;
  const prev = sel.value || siteFilter || "All";
  const sites = collectReportSites(parsed);
  sel.innerHTML = "";
  const all = document.createElement("option");
  all.value = "All";
  all.textContent = "All";
  sel.appendChild(all);
  for (const site of sites) {
    const opt = document.createElement("option");
    opt.value = site;
    opt.textContent = site;
    sel.appendChild(opt);
  }
  siteFilter = sites.includes(prev) || prev === "All" ? prev : "All";
  sel.value = siteFilter;
}

function getSort(tableId, defaultKey = "name") {
  return tableSort[tableId] || { key: defaultKey, dir: 1 };
}

function sortRows(rows, tableId, defaultKey = "name") {
  const { key, dir } = getSort(tableId, defaultKey);
  return [...(rows || [])].sort((a, b) => {
    let av = a?.[key];
    let bv = b?.[key];
    if (key === "DiskUsagePercent" || key === "expiresIn") {
      const an = Number(av);
      const bn = Number(bv);
      const aOk = Number.isFinite(an);
      const bOk = Number.isFinite(bn);
      if (aOk && bOk) return dir * (an - bn);
      if (aOk) return -dir;
      if (bOk) return dir;
    }
    const an = Number(av);
    const bn = Number(bv);
    if (
      av !== "" &&
      bv !== "" &&
      av != null &&
      bv != null &&
      Number.isFinite(an) &&
      Number.isFinite(bn) &&
      String(av).trim() !== "" &&
      String(bv).trim() !== ""
    ) {
      return dir * (an - bn);
    }
    return (
      dir *
      String(av ?? "").localeCompare(String(bv ?? ""), undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  });
}

function sortTh(tableId, key, label) {
  const sort = getSort(tableId, key);
  const active = sort.key === key;
  const arrow = active ? (sort.dir === 1 ? " ▲" : " ▼") : "";
  return `<th data-report-sort="${esc(tableId)}" data-sort-key="${esc(key)}" class="${active ? "is-sorted" : ""}" scope="col"><button type="button" class="hm-sort-btn">${esc(label)}${arrow}</button></th>`;
}

/** Parse ADO.NET DataSet XML from reportdata into plain objects. */
export function parseReportXml(xmlStr) {
  const doc = new DOMParser().parseFromString(xmlStr, "text/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("Invalid report XML");
  }

  function rows(tag) {
    return [...doc.getElementsByTagName(tag)].map((el) => {
      const o = {};
      for (const child of el.children) {
        o[child.tagName] = child.textContent ?? "";
      }
      return o;
    });
  }

  function doughnut(tag) {
    return rows(tag).map((r) => ({
      name: r.name || "",
      value: Number(r.value) || 0,
    }));
  }

  const doughnuts = {};
  for (const spec of DOUGHNUT_SPECS) {
    doughnuts[spec.key] = doughnut(spec.tag);
  }

  const allTables = {};
  const root = doc.documentElement;
  if (root) {
    for (const el of root.children) {
      const tag = el.tagName;
      if (!tag || SKIP_XML_TAGS.has(tag) || tag.includes(":")) continue;
      if (!el.children?.length) continue;
      const o = {};
      for (const child of el.children) {
        o[child.tagName] = child.textContent ?? "";
      }
      if (!Object.keys(o).length) continue;
      if (!allTables[tag]) allTables[tag] = [];
      allTables[tag].push(o);
    }
  }

  return {
    header: rows("Header")[0] || {},
    global: rows("Global")[0] || {},
    doughnuts,
    inventory: {
      cores: rows("IO-CORE"),
      relays: rows("IO-RELAY"),
      connectors: rows("IO-CONNECTOR"),
      datasources: rows("IO-DATASOURCE"),
      webapi: rows("IO-WEBAPISERVER"),
      servers: rows("IO-SERVER"),
    },
    certificates: rows("Certificates"),
    dataStores: rows("DataStore"),
    allTables,
  };
}

function isHmShaped(parsed) {
  const hasDonut = DOUGHNUT_SPECS.some(
    (s) => (parsed.doughnuts[s.key] || []).length > 0
  );
  const hasInv = Object.values(parsed.inventory || {}).some(
    (rows) => Array.isArray(rows) && rows.length > 0
  );
  return hasDonut || hasInv || (parsed.certificates || []).length > 0;
}

function pctDisk(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  const p = n <= 1.5 ? n * 100 : n;
  return `${p.toFixed(1)}%`;
}

function stateClass(state) {
  const s = String(state || "").toLowerCase();
  if (s === "bad") return "is-bad";
  if (s === "warning") return "is-warn";
  if (s === "disabled") return "is-disabled";
  if (s === "good") return "is-good";
  return "";
}

function normalizeReportState(state) {
  return String(state || "")
    .toLowerCase()
    .trim();
}

function isGoodReportState(state) {
  return normalizeReportState(state) === "good";
}

/** Worse first: Bad → Warning → Disabled → Empty/Neutral → other → Good */
function stateSeverity(state) {
  const s = normalizeReportState(state);
  if (s === "bad") return 0;
  if (s === "warning") return 1;
  if (s === "disabled") return 2;
  if (s === "empty" || s === "neutral") return 3;
  if (s === "good") return 9;
  return 5;
}

/**
 * Site filter then state filter.
 * Default `issues` = everything that is not Good (Bad / Warning / Disabled / …).
 */
function filterInventoryRows(rows) {
  let list = filterRowsBySite(rows);
  if (stateFilter === "all") return list;
  if (stateFilter === "issues") {
    return list.filter((r) => !isGoodReportState(r.state));
  }
  return list.filter(
    (r) => normalizeReportState(r.state) === stateFilter
  );
}

function sortInventoryRows(rows, tableId, defaultKey = "name") {
  const sorted = sortRows(rows, tableId, defaultKey);
  const { key } = getSort(tableId, defaultKey);
  // When user hasn't sorted by State, keep issues ordered worst-first
  if (key !== "state" && stateFilter !== "good") {
    return [...sorted].sort((a, b) => {
      const d = stateSeverity(a.state) - stateSeverity(b.state);
      if (d !== 0) return d;
      return 0;
    });
  }
  return sorted;
}

function stateFilterNote(shown, siteTotal) {
  if (stateFilter === "all" || siteTotal === shown) return "";
  const hidden = Math.max(0, siteTotal - shown);
  if (stateFilter === "issues") {
    return `<p class="muted report-filter-note">Showing ${shown} not-Good · ${hidden} Good hidden.</p>`;
  }
  return `<p class="muted report-filter-note">Showing ${shown} of ${siteTotal} for state filter.</p>`;
}

function getTablePage(tableId) {
  return tablePage[tableId] || 1;
}

function setTablePage(tableId, page) {
  tablePage[tableId] = Math.max(1, Number(page) || 1);
}

function resetReportPages() {
  Object.keys(tablePage).forEach((k) => delete tablePage[k]);
}

function reportPagerMarkup(tableId, ariaLabel) {
  const id = String(tableId);
  return fullPagerHtml({
    pagerId: `report-pager-${id}`,
    firstAttr: `data-report-page="first" data-report-pager="${id}"`,
    prevAttr: `data-report-page="prev" data-report-pager="${id}"`,
    nextAttr: `data-report-page="next" data-report-pager="${id}"`,
    lastAttr: `data-report-page="last" data-report-pager="${id}"`,
    inputId: `report-page-input-${id}`,
    inputAttr: `data-report-page-input="${id}"`,
    ofId: `report-page-of-${id}`,
    ariaLabel,
  }).replace(
    `id="report-pager-${id}"`,
    `id="report-pager-${id}" data-report-pager="${id}"`
  );
}

function syncReportPagerDom(tableId, page, pages, total, pageSize) {
  const id = String(tableId);
  updateFullPager(
    {
      pager: document.getElementById(`report-pager-${id}`),
      first: document.querySelector(
        `button[data-report-pager="${id}"][data-report-page="first"]`
      ),
      prev: document.querySelector(
        `button[data-report-pager="${id}"][data-report-page="prev"]`
      ),
      next: document.querySelector(
        `button[data-report-pager="${id}"][data-report-page="next"]`
      ),
      last: document.querySelector(
        `button[data-report-pager="${id}"][data-report-page="last"]`
      ),
      pageInput: document.querySelector(`input[data-report-page-input="${id}"]`),
      pageOf: document.getElementById(`report-page-of-${id}`),
    },
    { page, pages, total, pageSize }
  );
}

function formatWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return esc(iso);
  return esc(d.toISOString().replace(/\.\d{3}Z$/, "Z"));
}

function renderInventoryTable(cfg, rows) {
  const tableId = `inv-${cfg.key}`;
  const siteRows = filterRowsBySite(rows);
  const filtered = filterInventoryRows(rows);
  if (!siteRows.length) {
    return `
      <section class="report-section" id="report-inv-${esc(cfg.key)}">
        <h3 class="report-section-title">${esc(cfg.title)} <span class="muted">(0)</span></h3>
        <p class="muted">${siteFilter !== "All" ? `No rows for site ${esc(siteFilter)}.` : "No rows."}</p>
      </section>`;
  }
  if (!filtered.length) {
    return `
      <section class="report-section" id="report-inv-${esc(cfg.key)}">
        <h3 class="report-section-title">${esc(cfg.title)} <span class="muted">(0)</span></h3>
        <p class="${
          stateFilter === "issues"
            ? "report-all-good"
            : "muted"
        }">${
          stateFilter === "issues"
            ? `All ${siteRows.length} ${esc(cfg.title.toLowerCase())} are Good.`
            : `No rows for this state filter (${siteRows.length} total).`
        }</p>
      </section>`;
  }
  const list = sortInventoryRows(filtered, tableId, cfg.cols[0][0]);
  const paged = sliceRows(list, getTablePage(tableId), REPORT_TABLE_PAGE);
  setTablePage(tableId, paged.page);
  const head = cfg.cols
    .map(([key, label]) => sortTh(tableId, key, label))
    .join("");
  const body = paged.slice
    .map((r) => {
      const cells = cfg.cols
        .map(([key]) => {
          let v = r[key] ?? "";
          if (key === "DiskUsagePercent") v = pctDisk(v);
          if (key === "state") {
            return `<td><span class="report-state ${stateClass(v)}">${esc(v)}</span></td>`;
          }
          return `<td>${esc(v)}</td>`;
        })
        .join("");
      return `<tr class="${stateClass(r.state)}">${cells}</tr>`;
    })
    .join("");
  return `
    <section class="report-section" id="report-inv-${esc(cfg.key)}">
      <h3 class="report-section-title">${esc(cfg.title)} <span class="muted">(${filtered.length})</span></h3>
      ${stateFilterNote(filtered.length, siteRows.length)}
      <div class="report-table-wrap">
        <table class="report-table" data-report-table="${esc(tableId)}">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      ${reportPagerMarkup(tableId, `${cfg.title} page`)}
    </section>`;
}

function filterDatasources(rows) {
  return filterInventoryRows(rows);
}

function renderDatasources(rows) {
  const tableId = "datasources";
  const siteRows = filterRowsBySite(rows);
  const filtered = filterDatasources(rows);
  const total = filtered.length;
  const sorted = sortInventoryRows(filtered, tableId, "name");
  const paged = sliceRows(sorted, getTablePage(tableId), DATASOURCE_PAGE);
  setTablePage(tableId, paged.page);
  const slice = paged.slice;

  const head = DATASOURCE_COLS.map(([key, label]) =>
    sortTh(tableId, key, label)
  ).join("");
  const body = slice
    .map((r) => {
      const st = r.state || "";
      return `<tr class="${stateClass(st)}">
        <td>${esc(r.name)}</td>
        <td>${esc(r.ServerType)}</td>
        <td class="mono truncate" title="${esc(r.path)}">${esc(r.path)}</td>
        <td><span class="report-state ${stateClass(st)}">${esc(st)}</span></td>
      </tr>`;
    })
    .join("");

  let emptyMsg = "No datasources for this filter.";
  let emptyCls = "muted";
  if (!siteRows.length) {
    emptyMsg =
      siteFilter !== "All"
        ? `No datasources for site ${siteFilter}.`
        : "No datasources.";
  } else if (!filtered.length && stateFilter === "issues") {
    emptyMsg = `All ${siteRows.length} datasources are Good.`;
    emptyCls = "report-all-good";
  }

  return `
    <section class="report-section" id="report-inv-datasources">
      <div class="report-section-head">
        <h3 class="report-section-title">Datasources <span class="muted">(${total})</span></h3>
      </div>
      ${stateFilterNote(total, siteRows.length)}
      <div class="report-table-wrap">
        <table class="report-table" data-report-table="${tableId}">
          <thead><tr>${head}</tr></thead>
          <tbody>${body || `<tr><td colspan="4"><span class="${emptyCls}">${esc(emptyMsg)}</span></td></tr>`}</tbody>
        </table>
      </div>
      ${reportPagerMarkup(tableId, "Datasources page")}
    </section>`;
}

function certExpiryDays(row) {
  const n = Number(row?.expiresIn);
  if (Number.isFinite(n)) return n;
  if (row?.validTo) {
    const t = new Date(row.validTo).getTime();
    if (!Number.isNaN(t)) {
      return Math.ceil((t - Date.now()) / (24 * 60 * 60 * 1000));
    }
  }
  return null;
}

/** Keep only expired or expiring within 30 days. */
function filterExpiringCerts(rows) {
  return (rows || []).filter((r) => {
    const d = certExpiryDays(r);
    return d != null && d < 30;
  });
}

/**
 * Expired → red. 15–30 days → yellow.
 * Under 15 days → lerp yellow → reddish as days approach 0.
 */
function certRowAppearance(days) {
  if (!Number.isFinite(days)) return { cls: "", style: "" };
  if (days < 0) return { cls: "is-bad", style: "" };
  if (days >= 15) return { cls: "is-warn", style: "" };
  // 0 ≤ days < 15: blend #fffbeb (yellow) → #fee2e2 (red)
  const t = Math.min(1, Math.max(0, 1 - days / 15));
  const r = Math.round(255 + (254 - 255) * t);
  const g = Math.round(251 + (226 - 251) * t);
  const b = Math.round(235 + (226 - 235) * t);
  return {
    cls: "is-cert-urgent",
    style: `background-color: rgb(${r},${g},${b})`,
  };
}

function renderCertificates(rows) {
  const tableId = "certificates";
  const siteFiltered = filterRowsBySite(rows);
  const filtered = filterExpiringCerts(siteFiltered);
  if (!filtered.length) {
    return `
      <section class="report-section">
        <h3 class="report-section-title">Certificates <span class="muted">(0)</span></h3>
        <p class="muted">${
          siteFilter !== "All"
            ? `No expired / &lt;30-day certificates for site ${esc(siteFilter)}.`
            : "No expired or soon-expiring certificates (&lt; 30 days)."
        }</p>
      </section>`;
  }
  if (!tableSort[tableId]) {
    tableSort[tableId] = { key: "expiresIn", dir: 1 };
  }
  const list = sortRows(filtered, tableId, "expiresIn");
  const paged = sliceRows(list, getTablePage(tableId), REPORT_TABLE_PAGE);
  setTablePage(tableId, paged.page);
  const head = CERT_COLS.map(([key, label]) => sortTh(tableId, key, label)).join(
    ""
  );
  const body = paged.slice
    .map((r) => {
      const days = certExpiryDays(r);
      const { cls, style } = certRowAppearance(days);
      const daysLabel = Number.isFinite(days)
        ? days < 0
          ? `Expired (${Math.abs(days)} d ago)`
          : `${days} d`
        : "—";
      return `<tr class="${cls}"${style ? ` style="${style}"` : ""}>
        <td>${esc(r.name)}</td>
        <td class="mono truncate" title="${esc(r.path)}">${esc(r.path)}</td>
        <td>${formatWhen(r.validTo)}</td>
        <td>${daysLabel}</td>
      </tr>`;
    })
    .join("");
  const hidden = Math.max(0, siteFiltered.length - filtered.length);
  return `
    <section class="report-section">
      <h3 class="report-section-title">Certificates <span class="muted">(${filtered.length})</span></h3>
      <p class="muted report-filter-note">Expired or expiring within 30 days${
        hidden ? ` · ${hidden} healthy hidden` : ""
      }</p>
      <div class="report-table-wrap">
        <table class="report-table" data-report-table="${tableId}">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      ${reportPagerMarkup(tableId, "Certificates page")}
    </section>`;
}

function renderGenericTables(allTables) {
  const entries = Object.entries(allTables || {}).filter(
    ([name, rows]) =>
      rows?.length &&
      name !== "Header" &&
      name !== "Global" &&
      name !== "Environment"
  );
  if (!entries.length) {
    return `<p class="muted">Report XML loaded, but no tabular rows were found.</p>`;
  }
  return entries
    .map(([name, rows]) => {
      const tableId = `gen-${name}`;
      const filtered = filterRowsBySite(rows);
      const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
      const defaultKey = cols[0] || "name";
      const sorted = sortRows(filtered, tableId, defaultKey);
      const paged = sliceRows(sorted, getTablePage(tableId), REPORT_TABLE_PAGE);
      setTablePage(tableId, paged.page);
      const head = cols.map((c) => sortTh(tableId, c, c)).join("");
      const body = paged.slice
        .map(
          (r) =>
            `<tr>${cols
              .map((c) => `<td>${esc(r[c] ?? "")}</td>`)
              .join("")}</tr>`
        )
        .join("");
      return `
        <section class="report-section">
          <h3 class="report-section-title">${esc(name)} <span class="muted">(${filtered.length})</span></h3>
          ${
            filtered.length
              ? `<div class="report-table-wrap">
            <table class="report-table" data-report-table="${esc(tableId)}">
              <thead><tr>${head}</tr></thead>
              <tbody>${body}</tbody>
            </table>
          </div>
          ${reportPagerMarkup(tableId, `${name} page`)}`
              : `<p class="muted">No rows for site ${esc(siteFilter)}.</p>`
          }
        </section>`;
    })
    .join("");
}

function renderReportHtml(parsed, meta) {
  const testName =
    parsed.header.TestName ||
    parsed.header.Name ||
    meta.label ||
    "Report";
  const when =
    parsed.header.ExecutingDate ||
    parsed.header.Date ||
    parsed.header.Timestamp ||
    "";
  const version = parsed.global.inmationVersionCore || "";
  const filterNotes = [];
  if (siteFilter !== "All") {
    filterNotes.push(
      `Tables filtered by site <strong>${esc(siteFilter)}</strong>.`
    );
  }
  if (stateFilter === "issues") {
    filterNotes.push("Inventory shows <strong>Not Good</strong> only (Good hidden).");
  } else if (stateFilter !== "all") {
    filterNotes.push(
      `Inventory filtered by state <strong>${esc(stateFilter)}</strong>.`
    );
  }
  if (filterNotes.length) {
    filterNotes.push("Component health charts remain system-wide.");
  }
  const siteNote = filterNotes.length
    ? `<p class="muted report-filter-note">${filterNotes.join(" ")}</p>`
    : "";

  if (!isHmShaped(parsed)) {
    return `
      <header class="report-hero">
        <div>
          <p class="report-eyebrow">Report</p>
          <h2 class="report-title">${esc(testName)}</h2>
          <p class="report-meta muted">
            ${when ? `Executed ${formatWhen(when)} · ` : ""}
            Custom schema — sortable tables
          </p>
        </div>
      </header>
      ${siteNote}
      ${renderGenericTables(parsed.allTables)}
    `;
  }

  const donutCards = DOUGHNUT_SPECS.map(
    (spec) => `
      <div class="report-donut-card">
        <div class="report-donut-title">${esc(spec.title)}</div>
        <div class="report-donut-canvas-wrap">
          <canvas id="report-donut-${esc(spec.key)}" aria-label="${esc(spec.title)} status"></canvas>
        </div>
      </div>`
  ).join("");

  const inv = INVENTORY_TABLES.map((cfg) =>
    renderInventoryTable(cfg, parsed.inventory[cfg.key] || [])
  ).join("");

  return `
    <header class="report-hero">
      <div>
        <p class="report-eyebrow">System Monitor Checkup</p>
        <h2 class="report-title">${esc(testName)}</h2>
        <p class="report-meta muted">
          Executed ${formatWhen(when)}
          ${version ? ` · Core ${esc(version)}` : ""}
        </p>
      </div>
    </header>
    ${siteNote}
    <section class="report-section">
      <h3 class="report-section-title">Component health</h3>
      <div class="report-donut-grid">${donutCards}</div>
    </section>
    ${inv}
    ${renderDatasources(parsed.inventory.datasources)}
    ${renderCertificates(parsed.certificates)}
  `;
}

function setStatus(msg, isError = false) {
  const el = document.getElementById("reports-status");
  if (!el) return;
  el.textContent = msg || "";
  el.classList.toggle("is-error", Boolean(isError && msg));
}

function syncOpenLink() {
  const a = document.getElementById("reports-open");
  if (a) {
    a.href = reportViewerUrl();
    a.title = `Open “System Monitor Checkup” in Report Viewer (${REPORT_ITEM.path})`;
  }
}

function preferReportDesign(list) {
  const designs = Array.isArray(list) ? list : [];
  if (!designs.length) return "Report";
  const preferred =
    designs.find((d) => d.name === "Report") ||
    designs.find((d) => d.default) ||
    designs[0];
  return preferred?.name || "Report";
}

function paintDoughnuts(parsed) {
  destroyReportCharts();
  for (const spec of DOUGHNUT_SPECS) {
    const canvasId = `report-donut-${spec.key}`;
    const canvas = document.getElementById(canvasId);
    if (!canvas) continue;
    const slices = parsed.doughnuts[spec.key] || [];
    const byName = Object.fromEntries(
      slices.map((s) => [String(s.name).toLowerCase(), s.value])
    );
    chartIds.add(canvasId);
    renderHealthDoughnut(canvas, {
      good: byName.good ?? 0,
      bad: byName.bad ?? 0,
      warning: byName.warning ?? 0,
      disabled: byName.disabled ?? 0,
    });
  }
}

function syncReportPagersAfterPaint() {
  if (!lastParsed) return;
  document
    .querySelectorAll("#reports-body .hm-values-pager[id^='report-pager-']")
    .forEach((pager) => {
      const tableId =
        pager.getAttribute("data-report-pager") ||
        String(pager.id || "").replace(/^report-pager-/, "");
      if (!tableId) return;
      const pageSize =
        tableId === "datasources" ? DATASOURCE_PAGE : REPORT_TABLE_PAGE;
      let rowTotal = 0;
      if (tableId === "datasources") {
        rowTotal = filterDatasources(
          lastParsed.inventory?.datasources || []
        ).length;
      } else if (tableId === "certificates") {
        rowTotal = filterExpiringCerts(
          filterRowsBySite(lastParsed.certificates || [])
        ).length;
      } else if (tableId.startsWith("inv-")) {
        const key = tableId.slice(4);
        rowTotal = filterInventoryRows(
          lastParsed.inventory?.[key] || []
        ).length;
      } else if (tableId.startsWith("gen-")) {
        const name = tableId.slice(4);
        rowTotal = filterRowsBySite(lastParsed.allTables?.[name] || []).length;
      }
      const page = clampPage(getTablePage(tableId), rowTotal, pageSize);
      setTablePage(tableId, page);
      syncReportPagerDom(
        tableId,
        page,
        pageCount(rowTotal, pageSize),
        rowTotal,
        pageSize
      );
    });
}

function goToReportTablePage(tableId, page1Based) {
  if (!tableId || !lastParsed) return;
  const pageSize =
    tableId === "datasources" ? DATASOURCE_PAGE : REPORT_TABLE_PAGE;
  let total = 0;
  if (tableId === "datasources") {
    total = filterDatasources(lastParsed.inventory?.datasources || []).length;
  } else if (tableId === "certificates") {
    total = filterExpiringCerts(
      filterRowsBySite(lastParsed.certificates || [])
    ).length;
  } else if (tableId.startsWith("inv-")) {
    const key = tableId.slice(4);
    total = filterInventoryRows(lastParsed.inventory?.[key] || []).length;
  } else if (tableId.startsWith("gen-")) {
    const name = tableId.slice(4);
    total = filterRowsBySite(lastParsed.allTables?.[name] || []).length;
  }
  setTablePage(tableId, clampPage(page1Based, total, pageSize));
  paintReportBody({ keepCharts: true });
}

function paintReportBody({ keepCharts = false } = {}) {
  const body = document.getElementById("reports-body");
  if (!body || !lastParsed) return;
  if (!keepCharts) destroyReportCharts();
  body.innerHTML = renderReportHtml(lastParsed, lastMeta || {});
  requestAnimationFrame(() => {
    if (isHmShaped(lastParsed)) {
      if (!keepCharts) paintDoughnuts(lastParsed);
      else {
        paintDoughnuts(lastParsed);
      }
    }
    syncReportPagersAfterPaint();
  });
}

function syncStateFilterSelect() {
  const sel = document.getElementById("reports-state-filter");
  if (sel && sel.value !== stateFilter) sel.value = stateFilter;
}

async function loadReport() {
  const body = document.getElementById("reports-body");
  if (body) {
    body.innerHTML = `<p class="muted report-loading">Loading report…</p>`;
  }
  destroyReportCharts();

  loadAbort?.abort();
  const ac = new AbortController();
  loadAbort = ac;
  const seq = ++loadSeq;
  const timeoutId = setTimeout(() => ac.abort(), REPORT_LOAD_TIMEOUT_MS);
  const signal = ac.signal;
  const stillCurrent = () => seq === loadSeq && !signal.aborted;

  setStatus("Connecting…");

  try {
    const ok = await ensureIwaSession();
    if (!ok) {
      throw new Error("Not connected — IWA session required");
    }
    if (!stillCurrent()) return;

    let designList = [];
    try {
      designList = await fetchReportDesigns(REPORT_ITEM.path, { signal });
    } catch (err) {
      if (err.name === "AbortError") return;
      console.warn("[reports] designs list failed, using Report", err);
    }
    if (!stillCurrent()) return;
    selectedDesign = preferReportDesign(designList);

    setStatus("Loading report from Web API (may take a while)…");
    let report;
    try {
      report = await fetchReportData(REPORT_ITEM.path, selectedDesign, {
        signal,
      });
    } catch (err) {
      if (err.name === "AbortError") {
        if (seq !== loadSeq) return;
        throw new Error(
          `Timed out after ${Math.round(REPORT_LOAD_TIMEOUT_MS / 1000)}s waiting for reportdata`
        );
      }
      console.warn("[reports] reportdata with reportname failed, retry bare", err);
      report = await fetchReportData(REPORT_ITEM.path, null, { signal });
    }
    if (!stillCurrent()) return;

    const xml = report.data;
    if (!xml || typeof xml !== "string") {
      throw new Error("reportdata: missing report.data XML");
    }

    setStatus("Parsing report XML…");
    resetReportPages();
    stateFilter = "issues";
    syncStateFilterSelect();
    Object.keys(tableSort).forEach((k) => delete tableSort[k]);
    lastParsed = parseReportXml(xml);
    lastMeta = {
      label: REPORT_ITEM.label,
      design: report.name || selectedDesign,
    };
    if (!stillCurrent()) return;

    syncSiteFilterOptions(lastParsed);
    paintReportBody();

    const dsCount = lastParsed.inventory.datasources.length;
    const certCount = lastParsed.certificates.length;
    const tableCount = Object.keys(lastParsed.allTables || {}).length;
    setStatus(
      isHmShaped(lastParsed)
        ? `Loaded ${REPORT_ITEM.label} · ${dsCount} datasources · ${certCount} certificates`
        : `Loaded ${REPORT_ITEM.label} · ${tableCount} tables`
    );
  } catch (err) {
    if (err.name === "AbortError" && seq !== loadSeq) return;
    console.error("[reports]", err);
    destroyReportCharts();
    lastParsed = null;
    lastMeta = null;
    if (body) {
      body.innerHTML = `<p class="report-error">Could not load report: ${esc(err.message || err)}</p>
        <p class="muted">Use <strong>Open Report</strong> for the native Stimulsoft viewer, or check IWA / Web API access to <code>inmation.app-reportviewer</code>.</p>`;
    }
    setStatus(
      (err.body ? formatApiError(err.body) : null) ||
        err.message ||
        String(err),
      true
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export function initReportsPage() {
  syncOpenLink();
  if (!bound) {
    bound = true;
    document.getElementById("reports-reload")?.addEventListener("click", () => {
      loadReport();
    });
    document
      .getElementById("reports-site-filter")
      ?.addEventListener("change", (e) => {
        siteFilter = e.target.value || "All";
        resetReportPages();
        paintReportBody();
      });
    document
      .getElementById("reports-state-filter")
      ?.addEventListener("change", (e) => {
        stateFilter = e.target.value || "issues";
        resetReportPages();
        paintReportBody();
      });
    const body = document.getElementById("reports-body");
    body?.addEventListener("click", (e) => {
      const pageBtn = e.target.closest("[data-report-page][data-report-pager]");
      if (pageBtn) {
        const tableId = pageBtn.getAttribute("data-report-pager");
        const action = pageBtn.getAttribute("data-report-page");
        const cur = getTablePage(tableId);
        if (action === "first") goToReportTablePage(tableId, 1);
        else if (action === "prev") goToReportTablePage(tableId, cur - 1);
        else if (action === "next") goToReportTablePage(tableId, cur + 1);
        else if (action === "last") goToReportTablePage(tableId, 99999);
        return;
      }
      const th = e.target.closest("th[data-report-sort]");
      if (!th) return;
      const tableId = th.getAttribute("data-report-sort");
      const key = th.getAttribute("data-sort-key");
      if (!tableId || !key) return;
      const cur = tableSort[tableId];
      if (cur?.key === key) tableSort[tableId] = { key, dir: cur.dir * -1 };
      else tableSort[tableId] = { key, dir: 1 };
      setTablePage(tableId, 1);
      paintReportBody({ keepCharts: true });
    });
    body?.addEventListener("change", (e) => {
      const input = e.target.closest("[data-report-page-input]");
      if (!input) return;
      goToReportTablePage(input.getAttribute("data-report-page-input"), input.value);
    });
    body?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const input = e.target.closest("[data-report-page-input]");
      if (!input) return;
      e.preventDefault();
      goToReportTablePage(input.getAttribute("data-report-page-input"), input.value);
    });
  }
  loadReport();
}
