import {
  EAM_SOURCE_LABEL,
  addEmail,
  eamCriticalObjects,
  findEamObject,
  removeEmail,
} from "./config-mock-data.js";

let selectedId = eamCriticalObjects[0]?.id || null;
let typeFilter = "All";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function filteredObjects() {
  if (typeFilter === "All") return eamCriticalObjects;
  return eamCriticalObjects.filter((o) => o.type === typeFilter);
}

function fillTypeFilter() {
  const sel = document.getElementById("cfg-filter-type");
  if (!sel || sel.dataset.filled === "1") return;
  const types = ["All", ...new Set(eamCriticalObjects.map((o) => o.type))];
  sel.innerHTML = types
    .map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`)
    .join("");
  sel.value = typeFilter;
  sel.dataset.filled = "1";
}

function renderTable() {
  const rows = filteredObjects();
  const tbody = document.querySelector("#cfg-eam-table tbody");
  const count = document.getElementById("cfg-count");
  if (count) {
    count.textContent = `${rows.length} object${rows.length === 1 ? "" : "s"}`;
  }
  if (!tbody) return;

  if (!rows.some((r) => r.id === selectedId)) {
    selectedId = rows[0]?.id || null;
  }

  tbody.innerHTML = rows
    .map((o) => {
      const sel = o.id === selectedId ? " selected" : "";
      const mailPreview =
        o.emails.length === 0
          ? `<span class="cfg-null">&lt;null&gt;</span>`
          : escapeHtml(o.emails.join(", "));
      return `<tr class="cfg-row${sel}" data-id="${o.id}">
        <td class="cfg-path-cell" title="${escapeHtml(o.path)}">${escapeHtml(o.path)}</td>
        <td>${escapeHtml(o.type)}</td>
        <td class="cfg-emails-cell">${mailPreview}</td>
      </tr>`;
    })
    .join("");

  renderEditor();
}

function renderEditor() {
  const obj = findEamObject(selectedId);
  const empty = document.getElementById("cfg-editor-empty");
  const body = document.getElementById("cfg-editor-body");
  const title = document.getElementById("cfg-editor-title");
  const pathEl = document.getElementById("cfg-editor-path");
  const typeEl = document.getElementById("cfg-editor-type");
  const list = document.getElementById("cfg-email-list");
  const err = document.getElementById("cfg-email-error");

  if (err) err.textContent = "";

  if (!obj) {
    if (title) title.textContent = "Alert recipients";
    if (empty) empty.hidden = false;
    if (body) body.hidden = true;
    return;
  }

  if (title) title.textContent = "Alert recipients";
  if (empty) empty.hidden = true;
  if (body) body.hidden = false;
  if (pathEl) pathEl.textContent = obj.path;
  if (typeEl) typeEl.textContent = obj.type;

  if (list) {
    if (!obj.emails.length) {
      list.innerHTML = `<li class="cfg-email-empty">No alert emails — add one below.</li>`;
    } else {
      list.innerHTML = obj.emails
        .map(
          (email) => `<li class="cfg-email-chip">
            <span>${escapeHtml(email)}</span>
            <button type="button" class="cfg-email-remove" data-email="${escapeHtml(email)}" title="Remove email" aria-label="Remove ${escapeHtml(email)}">×</button>
          </li>`
        )
        .join("");
    }
  }
}

function setError(msg) {
  const err = document.getElementById("cfg-email-error");
  if (err) err.textContent = msg || "";
}

function onAddEmail(e) {
  e.preventDefault();
  const input = document.getElementById("cfg-email-input");
  const result = addEmail(selectedId, input?.value);
  if (!result.ok) {
    setError(result.error);
    return;
  }
  if (input) input.value = "";
  setError("");
  renderTable();
}

function onRemoveEmail(e) {
  const btn = e.target.closest(".cfg-email-remove");
  if (!btn) return;
  const result = removeEmail(selectedId, btn.dataset.email);
  if (!result.ok) {
    setError(result.error);
    return;
  }
  setError("");
  renderTable();
}

export function initConfigurationPage() {
  fillTypeFilter();

  const source = document.getElementById("cfg-source");
  if (source) source.textContent = EAM_SOURCE_LABEL;

  const table = document.getElementById("cfg-eam-table");
  if (table && table.dataset.ready !== "1") {
    table.dataset.ready = "1";
    table.addEventListener("click", (e) => {
      const row = e.target.closest("tr.cfg-row");
      if (!row) return;
      selectedId = row.dataset.id;
      renderTable();
    });

    document.getElementById("cfg-filter-type")?.addEventListener("change", (e) => {
      typeFilter = e.target.value;
      renderTable();
    });

    document.getElementById("cfg-email-form")?.addEventListener("submit", onAddEmail);
    document.getElementById("cfg-email-list")?.addEventListener("click", onRemoveEmail);
  }

  renderTable();
}
