import {
  componentTypes,
  filterDrillObjects,
  relatedFor,
  severities,
  sites,
} from "./drill-mock-data.js";

let selectedId = null;
let filters = {
  site: "All",
  type: "All",
  severity: "All",
  nonGoodOnly: true,
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stateClass(worst) {
  const w = String(worst).toLowerCase();
  if (w === "bad") return "bad";
  if (w === "uncertain") return "uncertain";
  return "good";
}

function scoreColor(score) {
  if (score >= 80) return "#16a34a";
  if (score >= 70) return "#89d329";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

function fillFilterOptions() {
  const siteSel = document.getElementById("dd-filter-site");
  const typeSel = document.getElementById("dd-filter-type");
  const sevSel = document.getElementById("dd-filter-severity");
  if (siteSel && !siteSel.dataset.filled) {
    siteSel.innerHTML = sites
      .map((s) => `<option value="${s}">${s}</option>`)
      .join("");
    siteSel.value = filters.site;
    siteSel.dataset.filled = "1";
  }
  if (typeSel && !typeSel.dataset.filled) {
    typeSel.innerHTML = componentTypes
      .map((t) => `<option value="${t}">${t}</option>`)
      .join("");
    typeSel.value = filters.type;
    typeSel.dataset.filled = "1";
  }
  if (sevSel && !sevSel.dataset.filled) {
    sevSel.innerHTML = severities
      .map((s) => `<option value="${s}">${s}</option>`)
      .join("");
    sevSel.value = filters.severity;
    sevSel.dataset.filled = "1";
  }
  const nonGood = document.getElementById("dd-filter-nongood");
  if (nonGood) nonGood.checked = filters.nonGoodOnly;
}

function renderTable() {
  const rows = filterDrillObjects(filters);
  const tbody = document.querySelector("#dd-table tbody");
  const count = document.getElementById("dd-result-count");
  if (count) count.textContent = `${rows.length} object${rows.length === 1 ? "" : "s"}`;

  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="dd-empty-row">No objects match these filters.</td></tr>`;
    if (selectedId && !rows.some((r) => r.id === selectedId)) {
      selectedId = null;
      renderDetail(null);
    }
    return;
  }

  // Keep selection if still visible; else select first unhealthy-ish row
  if (!rows.some((r) => r.id === selectedId)) {
    selectedId = rows[0].id;
  }

  tbody.innerHTML = rows
    .map((o) => {
      const sel = o.id === selectedId ? " selected" : "";
      const emph = o.worstState !== "Good" ? " dd-row-emph" : "";
      const color = scoreColor(o.score);
      return `<tr class="dd-row${sel}${emph}" data-id="${o.id}">
        <td>${escapeHtml(o.site)}</td>
        <td>${escapeHtml(o.name)}</td>
        <td>${escapeHtml(o.type)}</td>
        <td><span class="dd-state ${stateClass(o.worstState)}">${escapeHtml(o.worstState)}</span></td>
        <td><span class="score-pill"><i class="score-dot" style="background:${color}"></i>${o.score}</span></td>
        <td>${o.problems}</td>
        <td>${o.warnings}</td>
        <td>${escapeHtml(o.message)}</td>
      </tr>`;
    })
    .join("");

  const selected = rows.find((r) => r.id === selectedId) || rows[0];
  renderDetail(selected);
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
      ["Object ID", obj.objectId],
      ["Path", obj.path],
      ["Worst State", obj.worstState],
      ["State", obj.state],
      ["Health Score", String(obj.score)],
      ["Problems", String(obj.problems)],
      ["Warnings", String(obj.warnings)],
      ["Info", String(obj.info)],
    ];
    props.innerHTML = rows
      .map(
        ([k, v]) =>
          `<div class="hm-prop-row"><span class="hm-prop-key">${k}</span><span class="hm-prop-val">${escapeHtml(v)}</span></div>`
      )
      .join("");
  }

  const related = relatedFor(obj.id);
  const relBody = document.querySelector("#dd-related tbody");
  const relEmpty = document.getElementById("dd-related-empty");
  if (relBody) {
    if (!related.length) {
      relBody.innerHTML = "";
      if (relEmpty) relEmpty.hidden = false;
    } else {
      if (relEmpty) relEmpty.hidden = true;
      relBody.innerHTML = related
        .map((r) => {
          const sev = r.severity.toLowerCase();
          return `<tr>
            <td>${escapeHtml(r.time)}</td>
            <td><span class="badge ${sev}">${escapeHtml(r.severity)}</span></td>
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
  const row = e.target.closest("tr.dd-row");
  if (!row) return;
  selectedId = row.dataset.id;
  renderTable();
}

function goToTrends() {
  const trendsBtn = document.querySelector('.nav-list button[data-page="trends"]');
  if (trendsBtn) trendsBtn.click();
}

export function initDrillDownPage(preset = null) {
  fillFilterOptions();

  if (preset) {
    if (preset.site) {
      filters.site = preset.site;
      const el = document.getElementById("dd-filter-site");
      if (el) el.value = preset.site;
    }
    if (preset.type) {
      filters.type = preset.type;
      const el = document.getElementById("dd-filter-type");
      if (el) el.value = preset.type;
    }
    if (preset.severity) {
      filters.severity = preset.severity;
      const el = document.getElementById("dd-filter-severity");
      if (el) el.value = preset.severity;
    }
    if (preset.objectId) selectedId = preset.objectId;
    if (typeof preset.nonGoodOnly === "boolean") {
      filters.nonGoodOnly = preset.nonGoodOnly;
      const el = document.getElementById("dd-filter-nongood");
      if (el) el.checked = preset.nonGoodOnly;
    }
  }

  const table = document.getElementById("dd-table");
  if (table && table.dataset.ready !== "1") {
    table.dataset.ready = "1";
    table.addEventListener("click", onTableClick);

    ["dd-filter-site", "dd-filter-type", "dd-filter-severity"].forEach((id) => {
      document.getElementById(id)?.addEventListener("change", () => {
        readFiltersFromDom();
        renderTable();
      });
    });
    document.getElementById("dd-filter-nongood")?.addEventListener("change", () => {
      readFiltersFromDom();
      renderTable();
    });

    const openTrends = document.getElementById("dd-open-trends");
    if (openTrends && !openTrends.dataset.bound) {
      openTrends.dataset.bound = "1";
      openTrends.addEventListener("click", goToTrends);
    }
  }

  renderTable();
}
