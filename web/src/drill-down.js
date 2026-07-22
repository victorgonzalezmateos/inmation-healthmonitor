import { mockNavTableRows } from "./hm-mock-data.js";
import {
  drillFilterOptions,
  fetchLiveNavigationTable,
  filterDrillObjects,
  navRowsToDrillObjects,
  relatedIssuesForDrillObject,
} from "./api/hm-live.js";
import { ensureIwaSession } from "./session.js";
import { getStoredToken } from "./api/inmation.js";

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

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stateClass(worst) {
  const w = String(worst || "").toLowerCase();
  if (w === "bad") return "bad";
  if (w === "warning" || w === "empty" || w === "uncertain" || w === "neutral") {
    return "uncertain";
  }
  if (w === "disabled") return "disabled";
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
    if (key === "score" || key === "problems" || key === "warnings") {
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

function renderTable() {
  const rows = sortedRows(filteredRows());
  const tbody = document.querySelector("#dd-table tbody");
  const count = document.getElementById("dd-result-count");
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / DD_PAGE_SIZE));
  if (page > pages) page = pages;
  if (page < 1) page = 1;

  if (count) {
    count.textContent = `${total} object${total === 1 ? "" : "s"}`;
  }
  updateSortHeaders();

  if (!tbody) return;

  if (!total) {
    tbody.innerHTML = `<tr><td colspan="8" class="dd-empty-row">No objects match these filters.</td></tr>`;
    selectedId = null;
    renderDetail(null);
    syncPager(0, 1);
    return;
  }

  if (!rows.some((r) => r.id === selectedId)) {
    selectedId = rows[0].id;
  }

  const start = (page - 1) * DD_PAGE_SIZE;
  const slice = rows.slice(start, start + DD_PAGE_SIZE);

  tbody.innerHTML = slice
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
        <td>${o.problems}</td>
        <td>${o.warnings}</td>
        <td title="${escapeHtml(o.message)}">${escapeHtml(o.message)}</td>
      </tr>`;
    })
    .join("");

  syncPager(total, pages);

  const selected = rows.find((r) => r.id === selectedId) || rows[0];
  renderDetail(selected);
}

function syncPager(total, pages) {
  const pager = document.getElementById("dd-pager");
  const label = document.getElementById("dd-page-label");
  const prev = document.getElementById("dd-page-prev");
  const next = document.getElementById("dd-page-next");
  if (pager) pager.hidden = total <= DD_PAGE_SIZE;
  if (label) {
    label.textContent =
      total === 0
        ? "Page 0 of 0"
        : `Page ${page} of ${pages} · ${total} total`;
  }
  if (prev) prev.disabled = page <= 1 || total === 0;
  if (next) next.disabled = page >= pages || total === 0;
}

function renderDetail(obj) {
  const empty = document.getElementById("dd-detail-empty");
  const body = document.getElementById("dd-detail-body");
  const title = document.getElementById("dd-detail-title");

  if (!obj) {
    if (title) title.textContent = "Object detail";
    if (empty) empty.hidden = false;
    if (body) body.hidden = true;
    return;
  }

  if (title) title.textContent = `${obj.name} — ${obj.site}`;
  if (empty) empty.hidden = true;
  if (body) body.hidden = false;

  const props = document.getElementById("dd-props");
  if (props) {
    const rows = [
      ["Name", obj.name],
      ["Site", obj.site],
      ["Type", obj.type],
      ["Object ID", String(obj.objectId ?? "—")],
      ["Path", obj.path || "—"],
      ["Worst State", obj.worstState],
      ["Comm State", obj.CommState],
      ["Object State", obj.ObjectState],
      ["State", obj.state],
      ["Severity", obj.severity],
      ["Health Score", String(obj.score)],
      ["Problems", String(obj.problems)],
      ["Warnings", String(obj.warnings)],
      ["Disabled flag", String(obj.info)],
      ["Message", obj.message],
    ];
    props.innerHTML = rows
      .map(
        ([k, v]) =>
          `<div class="hm-prop-row"><span class="hm-prop-key">${escapeHtml(k)}</span><span class="hm-prop-val">${escapeHtml(v)}</span></div>`
      )
      .join("");
  }

  const related = relatedIssuesForDrillObject(obj, rawNavRows);
  const relBody = document.querySelector("#dd-related tbody");
  const relEmpty = document.getElementById("dd-related-empty");
  const relWrap = document.querySelector(".dd-related-wrap");
  const relHead = document.querySelector(".dd-related-head");

  if (relHead) {
    relHead.textContent = related.length
      ? obj.health === "good"
        ? `Related issues at site ${obj.site}`
        : "Related issues & alerts"
      : "Related issues & alerts";
  }

  if (relBody) {
    if (!related.length) {
      relBody.innerHTML = "";
      if (relWrap) relWrap.hidden = true;
      if (relEmpty) {
        relEmpty.hidden = false;
        if (obj.health === "good") {
          relEmpty.textContent =
            !obj.site || obj.site === "—"
              ? "This object is Good. No site code in the name, so there are no related site issues to show."
              : `This object is Good. No Bad / Warning / Disabled components found at site ${obj.site}.`;
        } else {
          relEmpty.textContent =
            "No related issue row found for this object yet.";
        }
      }
    } else {
      if (relWrap) relWrap.hidden = false;
      if (relEmpty) relEmpty.hidden = true;
      relBody.innerHTML = related
        .map((r) => {
          const sev = String(r.severity || "").toLowerCase();
          return `<tr>
            <td>${escapeHtml(r.time)}</td>
            <td><span class="badge ${escapeHtml(sev)}">${escapeHtml(r.severity)}</span></td>
            <td>${escapeHtml(r.type)}</td>
            <td>${escapeHtml(r.message)}</td>
            <td>${escapeHtml(r.status)}</td>
            <td>${escapeHtml(r.duration)}</td>
          </tr>`;
        })
        .join("");
    }
  }

  const openTrends = document.getElementById("dd-open-trends");
  if (openTrends) {
    openTrends.dataset.objectName = obj.name;
    openTrends.dataset.objectId = obj.id;
  }
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

function goToTrends() {
  const trendsBtn = document.querySelector(
    '.nav-list button[data-page="trends"]'
  );
  if (trendsBtn) trendsBtn.click();
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

  document.getElementById("dd-page-prev")?.addEventListener("click", () => {
    if (page <= 1) return;
    page -= 1;
    renderTable();
  });
  document.getElementById("dd-page-next")?.addEventListener("click", () => {
    const pages = Math.max(1, Math.ceil(filteredRows().length / DD_PAGE_SIZE));
    if (page >= pages) return;
    page += 1;
    renderTable();
  });

  const openTrends = document.getElementById("dd-open-trends");
  if (openTrends && !openTrends.dataset.bound) {
    openTrends.dataset.bound = "1";
    openTrends.addEventListener("click", goToTrends);
  }
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
