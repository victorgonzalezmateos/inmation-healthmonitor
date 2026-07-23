/**
 * Configuration — EAM Critical Objects (live TableData).
 * Single-select + Add / Edit / Delete + Apply to host.
 */

import {
  EAM_COLUMN_KEYS,
  EAM_CRITICAL_OBJECT_PATH,
  fetchEamCriticalObjects,
  saveEamCriticalObjects,
} from "./api/eam-critical.js";
import {
  fetchLiveNavigationTree,
  siteFromRow,
} from "./api/hm-live.js";
import { formatApiError } from "./api/inmation.js";
import { ensureIwaSession } from "./session.js";
import {
  nextSortState,
  paintSortHeaders,
  sortRowsBy,
} from "./table-sort.js";
import { clampPage, sliceRows, updateFullPager } from "./table-pager.js";

/** @type {object[]} */
let rows = [];
let selectedId = null;
let typeFilter = "All";
let siteFilter = "All";
let sourceLabel = "Loading EAM Critical Objects…";
let loadSeq = 0;
let bound = false;
let dirty = false;
let sort = { key: "path", dir: 1 };
let newRowSeq = 0;
let applying = false;
let cfgPage = 1;
const CFG_PAGE_SIZE = 15;

/** Host write context from last successful read. */
let hostObjectPath = EAM_CRITICAL_OBJECT_PATH;
let hostPropPath = `${EAM_CRITICAL_OBJECT_PATH}.TableData`;
let hostColumnKeys = [...EAM_COLUMN_KEYS];

/** Draft emails while Edit modal is open. */
let editDraftEmails = [];
let editDraftId = null;

/** Path picker (Browse…) state. */
/** @type {object[]} */
let pathTreeRoots = [];
/** @type {Set<string>} */
let pathTreeExpanded = new Set();
let pathTreeSelectedId = null;
let pathTreeLoading = false;
let pathTreeLoaded = false;
let pathTreeError = "";

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nullCell(v) {
  if (v == null || String(v).trim() === "") {
    return `<span class="cfg-null">&lt;null&gt;</span>`;
  }
  return escapeHtml(v);
}

function parseEmails(contact) {
  if (!contact) return [];
  return String(contact)
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinEmails(list) {
  return (list || []).join(",");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function rowSortValue(row, key) {
  if (key === "objectType") return row.objectType || row.type || "";
  return row?.[key] ?? "";
}

/**
 * Site for the Configuration filter.
 * Global: /System/Core, /System/Core/_Global*, /System/Core/NA-US-ENTERPRISE-001(…)
 * Otherwise Bayer Area-Country-Site code from Path.
 */
function rowSite(row) {
  const raw = String(row?.path || "").replace(/\\/g, "/").trim();
  const path = raw.replace(/\/+$/, "");
  const lower = path.toLowerCase();

  if (lower === "/system/core") return "Global";
  if (lower.startsWith("/system/core/_global")) return "Global";
  if (
    lower === "/system/core/na-us-enterprise-001" ||
    lower.startsWith("/system/core/na-us-enterprise-001/")
  ) {
    return "Global";
  }

  return siteFromRow({ path: row?.path, name: row?.path }) || "Global";
}

function collectCfgSites(list) {
  const found = new Set(["Global"]);
  for (const r of list || []) {
    const site = rowSite(r);
    if (site) found.add(site);
  }
  return [...found].sort((a, b) => {
    if (a === "Global") return -1;
    if (b === "Global") return 1;
    return a.localeCompare(b);
  });
}

function filteredObjects() {
  let list = rows;
  if (siteFilter !== "All") {
    list = list.filter((o) => rowSite(o) === siteFilter);
  }
  if (typeFilter !== "All") {
    list = list.filter(
      (o) => o.objectType === typeFilter || o.type === typeFilter
    );
  }
  return sortRowsBy(list, sort.key, sort.dir, rowSortValue);
}

function fillFilters() {
  fillSiteFilter();
  fillTypeFilter();
}

function fillSiteFilter() {
  const sel = document.getElementById("cfg-filter-site");
  if (!sel) return;
  const prev = siteFilter;
  const sites = ["All", ...collectCfgSites(rows)];
  sel.innerHTML = sites
    .map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`)
    .join("");
  siteFilter = sites.includes(prev) ? prev : "All";
  sel.value = siteFilter;
}

function fillTypeFilter() {
  const sel = document.getElementById("cfg-filter-type");
  if (!sel) return;
  const prev = typeFilter;
  const types = [
    "All",
    ...new Set(rows.map((o) => o.objectType || o.type).filter(Boolean)),
  ];
  sel.innerHTML = types
    .map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`)
    .join("");
  typeFilter = types.includes(prev) ? prev : "All";
  sel.value = typeFilter;

  const list = document.getElementById("cfg-type-list");
  if (list) {
    list.innerHTML = types
      .filter((t) => t !== "All")
      .map((t) => `<option value="${escapeHtml(t)}"></option>`)
      .join("");
  }
}

function findRow(id) {
  return rows.find((r) => r.id === id) || null;
}

function markDirty() {
  dirty = true;
  syncApplyButton();
  if (sourceLabel && !/unsaved/i.test(sourceLabel)) {
    sourceLabel = `${sourceLabel} · unsaved local edits`;
    const source = document.getElementById("cfg-source");
    if (source) source.textContent = sourceLabel;
  }
}

function clearDirty(label) {
  dirty = false;
  if (label) sourceLabel = label;
  else if (sourceLabel) {
    sourceLabel = sourceLabel.replace(/\s*·\s*unsaved local edits/i, "");
  }
  syncApplyButton();
  const source = document.getElementById("cfg-source");
  if (source) source.textContent = sourceLabel;
}

function syncApplyButton() {
  const btn = document.getElementById("cfg-apply");
  if (btn) btn.disabled = !dirty || applying;
}

function paintHeaders() {
  const table = document.getElementById("cfg-eam-table");
  if (table) paintSortHeaders(table, "data-cfg-sort", sort);
}

function syncActionButtons() {
  const hasSel = Boolean(findRow(selectedId));
  const edit = document.getElementById("cfg-edit-row");
  const del = document.getElementById("cfg-delete-row");
  if (edit) edit.disabled = !hasSel;
  if (del) del.disabled = !hasSel;
  syncApplyButton();
}

function selectRow(id) {
  selectedId = id || null;
  renderTable();
}

function deleteSelectedRow() {
  const obj = findRow(selectedId);
  if (!obj) return;
  const label = obj.path || obj.id;
  if (
    !window.confirm(
      `Delete this row from the table?\n\n${label}\n\nLocal only until you click Apply.`
    )
  ) {
    return;
  }
  rows = rows.filter((r) => r.id !== selectedId);
  selectedId = null;
  markDirty();
  fillFilters();
  renderTable();
}

function renderTable() {
  const list = filteredObjects();
  const tbody = document.querySelector("#cfg-eam-table tbody");
  const count = document.getElementById("cfg-count");
  const source = document.getElementById("cfg-source");
  if (source) source.textContent = sourceLabel;
  if (count) {
    count.textContent = `${list.length} object${list.length === 1 ? "" : "s"}`;
  }
  paintHeaders();
  if (!tbody) return;

  if (selectedId && !findRow(selectedId)) selectedId = null;

  if (!list.length) {
    const filterHint =
      siteFilter !== "All" || typeFilter !== "All"
        ? "No rows for this site/type filter."
        : "No rows.";
    tbody.innerHTML = `<tr><td colspan="5" class="muted">${escapeHtml(
      rows.length ? filterHint : "No data loaded."
    )}</td></tr>`;
    cfgPage = 1;
    updateFullPager(
      {
        pager: document.getElementById("cfg-pager"),
        first: document.getElementById("cfg-page-first"),
        prev: document.getElementById("cfg-page-prev"),
        next: document.getElementById("cfg-page-next"),
        last: document.getElementById("cfg-page-last"),
        pageInput: document.getElementById("cfg-page-input"),
        pageOf: document.getElementById("cfg-page-of"),
      },
      { page: 1, pages: 1, total: 0, pageSize: CFG_PAGE_SIZE }
    );
    syncActionButtons();
    return;
  }

  const paged = sliceRows(list, cfgPage, CFG_PAGE_SIZE);
  cfgPage = paged.page;
  updateFullPager(
    {
      pager: document.getElementById("cfg-pager"),
      first: document.getElementById("cfg-page-first"),
      prev: document.getElementById("cfg-page-prev"),
      next: document.getElementById("cfg-page-next"),
      last: document.getElementById("cfg-page-last"),
      pageInput: document.getElementById("cfg-page-input"),
      pageOf: document.getElementById("cfg-page-of"),
    },
    {
      page: paged.page,
      pages: paged.pages,
      total: paged.total,
      pageSize: CFG_PAGE_SIZE,
    }
  );

  tbody.innerHTML = paged.slice
    .map((o) => {
      const sel = o.id === selectedId;
      return `<tr class="cfg-row${sel ? " is-selected" : ""}" data-id="${escapeHtml(o.id)}">
        <td class="cfg-col-check">
          <input
            type="radio"
            class="cfg-row-radio"
            name="cfg-eam-select"
            ${sel ? "checked" : ""}
            aria-label="Select ${escapeHtml(o.path || o.id)}"
          />
        </td>
        <td class="cfg-path-cell" title="${escapeHtml(o.path)}">${escapeHtml(o.path || "—")}</td>
        <td>${escapeHtml(o.objectType || o.type || "—")}</td>
        <td>${nullCell(o.standby)}</td>
        <td class="cfg-emails-cell">${nullCell(o.localContact)}</td>
      </tr>`;
    })
    .join("");

  syncActionButtons();
}

function wireCfgPagerOnce() {
  const root = document.getElementById("cfg-pager");
  if (!root || root.dataset.wired === "1") return;
  root.dataset.wired = "1";
  const go = (p) => {
    cfgPage = clampPage(p, filteredObjects().length, CFG_PAGE_SIZE);
    renderTable();
  };
  document.getElementById("cfg-page-first")?.addEventListener("click", () => go(1));
  document.getElementById("cfg-page-prev")?.addEventListener("click", () => go(cfgPage - 1));
  document.getElementById("cfg-page-next")?.addEventListener("click", () => go(cfgPage + 1));
  document.getElementById("cfg-page-last")?.addEventListener("click", () =>
    go(sliceRows(filteredObjects(), 99999, CFG_PAGE_SIZE).pages)
  );
  const input = document.getElementById("cfg-page-input");
  input?.addEventListener("change", () => go(input.value));
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      go(input.value);
    }
  });
}

function setAddFormOpen(open) {
  const form = document.getElementById("cfg-add-form");
  if (!form) return;
  form.hidden = !open;
  if (open) {
    const err = document.getElementById("cfg-add-error");
    if (err) err.textContent = "";
    document.getElementById("cfg-add-path")?.focus();
  }
}

/** Prefer readable class name if tree still has a numeric type code. */
function findTreeNode(nodes, id) {
  for (const n of nodes || []) {
    if (n.id === id) return n;
    const hit = findTreeNode(n.children, id);
    if (hit) return hit;
  }
  return null;
}

/** Prefer readable class name if tree still has a numeric type code. */
function readableNodeType(node) {
  const t = String(node?.type || "").trim();
  if (t && !/^\d+$/.test(t)) return t;
  const img = String(node?.image || "");
  const m = img.match(/\/classes\/([^/.]+)\.[a-z0-9]+$/i);
  if (m) return m[1];
  return t;
}

/** Keep only the I/O Model root (and its subtree) for the path picker. */
function filterIoModelRoots(roots) {
  const list = Array.isArray(roots) ? roots : [];
  return list.filter((n) => {
    const name = String(n?.name || "").trim().toLowerCase();
    const path = String(n?.path || "").trim().toLowerCase();
    return (
      name === "i/o model" ||
      name === "io model" ||
      path === "/i/o model" ||
      path === "/io model" ||
      /^\/i\/?o\s*model\b/i.test(path) ||
      /^i\/?o\s*model$/i.test(name)
    );
  });
}

function renderPathTreeNodes(nodes, depth = 0) {
  return (nodes || [])
    .map((n) => {
      const hasKids = n.children && n.children.length > 0;
      const isOpen = pathTreeExpanded.has(n.id);
      const isSel = n.id === pathTreeSelectedId;
      const kids =
        hasKids && isOpen ? renderPathTreeNodes(n.children, depth + 1) : "";
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

function paintPathTree() {
  const list = document.getElementById("cfg-path-tree");
  const status = document.getElementById("cfg-path-tree-status");
  const meta = document.getElementById("cfg-path-selected-meta");
  if (!list) return;

  if (pathTreeLoading) {
    list.hidden = true;
    if (status) {
      status.hidden = false;
      status.textContent = "Loading I/O Model tree…";
      status.classList.remove("report-error");
    }
    return;
  }

  if (!pathTreeRoots.length) {
    list.hidden = true;
    if (status) {
      status.hidden = false;
      status.textContent =
        pathTreeError ||
        (pathTreeLoaded
          ? "Tree is empty — check profile permissions."
          : "Tree not loaded.");
      status.classList.toggle(
        "report-error",
        Boolean(pathTreeError || pathTreeLoaded)
      );
    }
    return;
  }

  if (status) status.hidden = true;
  list.hidden = false;
  list.innerHTML = renderPathTreeNodes(pathTreeRoots);

  const node = findTreeNode(pathTreeRoots, pathTreeSelectedId);
  if (meta) {
    const typeLabel = readableNodeType(node);
    meta.textContent = node?.path
      ? `Selected: ${node.name}${typeLabel ? ` · ${typeLabel}` : ""}`
      : "Select a node, or type a path above / below.";
  }
}

function setPathManualValue(path, { focus = false } = {}) {
  const top = document.getElementById("cfg-path-manual");
  const bottom = document.getElementById("cfg-path-manual-bottom");
  const v = path ?? "";
  if (top && top.value !== v) top.value = v;
  if (bottom && bottom.value !== v) bottom.value = v;
  if (focus) top?.focus();
}

function syncPathManualFromInputs(sourceEl) {
  const v = String(sourceEl?.value || "");
  const top = document.getElementById("cfg-path-manual");
  const bottom = document.getElementById("cfg-path-manual-bottom");
  if (top && top !== sourceEl) top.value = v;
  if (bottom && bottom !== sourceEl) bottom.value = v;
  pathTreeSelectedId = null;
  const meta = document.getElementById("cfg-path-selected-meta");
  if (meta) {
    meta.textContent = v.trim()
      ? "Using typed path (no tree selection)."
      : "Select a node, or type a path above / below.";
  }
  paintPathTree();
}

function onPathTreeClick(e) {
  const btn = e.target.closest(".hm-tree-row");
  if (!btn) return;
  const id = btn.dataset.id;
  const canToggle = btn.dataset.toggle === "1";
  const onTwist = !!e.target.closest(".hm-tree-twist:not(.empty)");

  if (canToggle && (onTwist || e.detail === 2)) {
    if (pathTreeExpanded.has(id)) pathTreeExpanded.delete(id);
    else pathTreeExpanded.add(id);
  }

  pathTreeSelectedId = id;
  const node = findTreeNode(pathTreeRoots, id);
  if (node?.path) setPathManualValue(node.path);
  paintPathTree();
}

async function ensurePathTreeLoaded() {
  if (pathTreeLoaded && pathTreeRoots.length) {
    paintPathTree();
    return;
  }
  if (pathTreeLoading) return;

  pathTreeLoading = true;
  pathTreeError = "";
  paintPathTree();
  try {
    const ok = await ensureIwaSession({ force: false });
    if (!ok) throw new Error("Not connected — IWA session required");
    const roots = await fetchLiveNavigationTree();
    pathTreeRoots = filterIoModelRoots(roots || []);
    pathTreeExpanded = new Set(
      pathTreeRoots.slice(0, 1).map((n) => n.id).filter(Boolean)
    );
    pathTreeLoaded = true;
    pathTreeError = pathTreeRoots.length
      ? ""
      : "I/O Model not found in navigation tree.";
  } catch (err) {
    console.error("[config] path tree load failed", err);
    pathTreeRoots = [];
    pathTreeLoaded = true;
    pathTreeError =
      (err.body ? formatApiError(err.body) : null) ||
      err.message ||
      String(err);
  } finally {
    pathTreeLoading = false;
    paintPathTree();
  }
}

function openPathPicker() {
  const current = String(
    document.getElementById("cfg-add-path")?.value || ""
  ).trim();
  pathTreeSelectedId = null;
  setPathManualValue(current);
  const modal = document.getElementById("cfg-path-modal");
  if (modal) modal.hidden = false;
  paintPathTree();
  ensurePathTreeLoaded();
  document.getElementById("cfg-path-manual")?.focus();
}

function closePathPicker() {
  const modal = document.getElementById("cfg-path-modal");
  if (modal) modal.hidden = true;
}

function confirmPathPicker() {
  const path = String(
    document.getElementById("cfg-path-manual")?.value ||
      document.getElementById("cfg-path-manual-bottom")?.value ||
      ""
  ).trim();
  if (!path) {
    const meta = document.getElementById("cfg-path-selected-meta");
    if (meta) meta.textContent = "Enter a path or select a tree node.";
    document.getElementById("cfg-path-manual")?.focus();
    return;
  }

  const pathInput = document.getElementById("cfg-add-path");
  if (pathInput) pathInput.value = path;

  const node = findTreeNode(pathTreeRoots, pathTreeSelectedId);
  const typeInput = document.getElementById("cfg-add-type");
  const typeLabel = readableNodeType(node);
  if (typeInput && !String(typeInput.value || "").trim() && typeLabel) {
    typeInput.value = typeLabel;
  }

  closePathPicker();
  pathInput?.focus();
}

function onAddRowSubmit(e) {
  e.preventDefault();
  const path = String(document.getElementById("cfg-add-path")?.value || "").trim();
  const objectType = String(
    document.getElementById("cfg-add-type")?.value || ""
  ).trim();
  const standby = String(
    document.getElementById("cfg-add-standby")?.value || ""
  ).trim();
  const localContact = String(
    document.getElementById("cfg-add-contact")?.value || ""
  ).trim();
  const err = document.getElementById("cfg-add-error");

  if (!path) {
    if (err) err.textContent = "Path is required.";
    return;
  }
  if (!objectType) {
    if (err) err.textContent = "Object Type is required.";
    return;
  }
  if (rows.some((r) => r.path === path)) {
    if (err) err.textContent = "A row with this Path already exists.";
    return;
  }

  newRowSeq += 1;
  const id = `eam-new-${Date.now()}-${newRowSeq}`;
  const emails = parseEmails(localContact);
  const row = {
    id,
    path,
    objectType,
    type: objectType,
    standby,
    localContact: joinEmails(emails),
    emails,
  };
  rows = [...rows, row];
  selectedId = id;
  typeFilter = "All";
  siteFilter = "All";
  markDirty();
  fillFilters();
  renderTable();
  setAddFormOpen(false);
  e.target.reset?.();
}

function renderEditEmailList() {
  const list = document.getElementById("cfg-edit-email-list");
  if (!list) return;
  if (!editDraftEmails.length) {
    list.innerHTML = `<li class="cfg-email-empty">No alert emails — add one below.</li>`;
    return;
  }
  list.innerHTML = editDraftEmails
    .map(
      (email) => `<li class="cfg-email-chip">
        <span>${escapeHtml(email)}</span>
        <button type="button" class="cfg-email-remove" data-email="${escapeHtml(email)}" title="Remove email" aria-label="Remove ${escapeHtml(email)}">×</button>
      </li>`
    )
    .join("");
}

function openEditModal() {
  const obj = findRow(selectedId);
  if (!obj) return;
  editDraftId = obj.id;
  editDraftEmails = [...(obj.emails || parseEmails(obj.localContact))];

  const pathEl = document.getElementById("cfg-edit-path");
  const typeEl = document.getElementById("cfg-edit-type");
  const standbyEl = document.getElementById("cfg-edit-standby");
  const err = document.getElementById("cfg-edit-email-error");
  const input = document.getElementById("cfg-edit-email-input");
  if (pathEl) pathEl.textContent = obj.path || "—";
  if (typeEl) typeEl.textContent = obj.objectType || obj.type || "—";
  if (standbyEl) {
    standbyEl.innerHTML = obj.standby
      ? escapeHtml(obj.standby)
      : `<span class="cfg-null">&lt;null&gt;</span>`;
  }
  if (err) err.textContent = "";
  if (input) input.value = "";
  renderEditEmailList();

  const modal = document.getElementById("cfg-edit-modal");
  if (modal) modal.hidden = false;
  input?.focus();
}

function closeEditModal() {
  const modal = document.getElementById("cfg-edit-modal");
  if (modal) modal.hidden = true;
  editDraftId = null;
  editDraftEmails = [];
}

function applyEditModal() {
  const obj = findRow(editDraftId);
  if (!obj) {
    closeEditModal();
    return;
  }
  obj.emails = [...editDraftEmails];
  obj.localContact = joinEmails(editDraftEmails);
  markDirty();
  closeEditModal();
  renderTable();
}

function onEditAddEmail(e) {
  e.preventDefault();
  const input = document.getElementById("cfg-edit-email-input");
  const err = document.getElementById("cfg-edit-email-error");
  const email = String(input?.value || "").trim();
  if (!email) {
    if (err) err.textContent = "Enter an email address.";
    return;
  }
  if (!isValidEmail(email)) {
    if (err) err.textContent = "Invalid email address.";
    return;
  }
  if (editDraftEmails.some((x) => x.toLowerCase() === email.toLowerCase())) {
    if (err) err.textContent = "Email already in the list.";
    return;
  }
  editDraftEmails = [...editDraftEmails, email];
  if (input) input.value = "";
  if (err) err.textContent = "";
  renderEditEmailList();
}

function onEditRemoveEmail(e) {
  const btn = e.target.closest(".cfg-email-remove");
  if (!btn) return;
  const email = btn.dataset.email;
  editDraftEmails = editDraftEmails.filter((x) => x !== email);
  renderEditEmailList();
}

function openApplyModal() {
  if (!dirty || applying) return;
  const err = document.getElementById("cfg-apply-error");
  if (err) err.textContent = "";
  const modal = document.getElementById("cfg-apply-modal");
  if (modal) modal.hidden = false;
}

function closeApplyModal({ force = false } = {}) {
  if (applying && !force) return;
  const modal = document.getElementById("cfg-apply-modal");
  if (modal) modal.hidden = true;
}

async function confirmApplyToHost() {
  const err = document.getElementById("cfg-apply-error");
  const confirmBtn = document.getElementById("cfg-apply-confirm");
  if (applying) return;

  applying = true;
  syncApplyButton();
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Applying…";
  }
  if (err) err.textContent = "";

  try {
    const ok = await ensureIwaSession({ force: false });
    if (!ok) throw new Error("Not connected — IWA session required");

    await saveEamCriticalObjects(rows, {
      objectPath: hostObjectPath,
      propPath: hostPropPath,
      columnKeys: hostColumnKeys,
    });

    // Close immediately on success (force: applying is still true here).
    closeApplyModal({ force: true });
    applying = false;
    syncApplyButton();

    await loadEamTable();
    sourceLabel = `Live · ${hostObjectPath} · applied OK`;
    clearDirty(sourceLabel);
    renderTable();
  } catch (ex) {
    console.error("[config] Apply failed", ex);
    if (err) {
      err.textContent =
        (ex.body ? formatApiError(ex.body) : null) ||
        ex.message ||
        String(ex);
    }
  } finally {
    applying = false;
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Apply";
    }
    syncApplyButton();
  }
}

async function loadEamTable() {
  const seq = ++loadSeq;
  sourceLabel = "Loading EAM Critical Objects from host…";
  rows = [];
  selectedId = null;
  dirty = false;
  cfgPage = 1;
  closeEditModal();
  closeApplyModal({ force: true });
  renderTable();

  try {
    const ok = await ensureIwaSession({ force: false });
    if (!ok) throw new Error("Not connected — IWA session required");
    if (seq !== loadSeq) return;

    const result = await fetchEamCriticalObjects({
      // Prefer last-known TableData path so Reload never falls back to a stale sibling.
      preferPropPath: hostPropPath,
      preferObjectPath: hostObjectPath,
    });
    if (seq !== loadSeq) return;

    rows = result.rows.map((r) => ({
      ...r,
      emails: r.emails?.length ? r.emails : parseEmails(r.localContact),
    }));
    hostObjectPath = result.path || EAM_CRITICAL_OBJECT_PATH;
    hostPropPath = result.propPath || `${hostObjectPath}.TableData`;
    hostColumnKeys = result.columnKeys?.length
      ? result.columnKeys
      : [...EAM_COLUMN_KEYS];
    const stamp = new Date().toLocaleTimeString();
    sourceLabel = `${result.sourceLabel} · ${stamp}`;
    selectedId = null;
    dirty = false;
    fillFilters();
    renderTable();
  } catch (err) {
    if (seq !== loadSeq) return;
    console.error("[config] EAM load failed", err);
    sourceLabel =
      (err.body ? formatApiError(err.body) : null) ||
      err.message ||
      String(err);
    rows = [];
    fillFilters();
    renderTable();
    const tbody = document.querySelector("#cfg-eam-table tbody");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" class="report-error" style="white-space:normal">
        ${escapeHtml(sourceLabel)}
      </td></tr>`;
    }
  }
}

export function initConfigurationPage() {
  if (!bound) {
    bound = true;
    wireCfgPagerOnce();
    const table = document.getElementById("cfg-eam-table");
    table?.addEventListener("click", (e) => {
      const th = e.target.closest("th[data-cfg-sort]");
      if (th) {
        const key = th.getAttribute("data-cfg-sort");
        if (!key) return;
        sort = nextSortState(sort, key);
        cfgPage = 1;
        renderTable();
        return;
      }
      const row = e.target.closest("tr.cfg-row");
      if (!row) return;
      selectRow(row.dataset.id);
    });

    document.getElementById("cfg-filter-site")?.addEventListener("change", (e) => {
      siteFilter = e.target.value;
      cfgPage = 1;
      renderTable();
    });
    document.getElementById("cfg-filter-type")?.addEventListener("change", (e) => {
      typeFilter = e.target.value;
      cfgPage = 1;
      renderTable();
    });

    document.getElementById("cfg-reload")?.addEventListener("click", () => {
      if (
        dirty &&
        !window.confirm("Discard unsaved local edits and reload from host?")
      ) {
        return;
      }
      loadEamTable();
    });

    document.getElementById("cfg-apply")?.addEventListener("click", () => {
      openApplyModal();
    });

    document.getElementById("cfg-add-row")?.addEventListener("click", () => {
      setAddFormOpen(true);
      fillFilters();
    });
    document.getElementById("cfg-add-cancel")?.addEventListener("click", () => {
      setAddFormOpen(false);
    });
    document.getElementById("cfg-add-form")?.addEventListener("submit", onAddRowSubmit);

    document.getElementById("cfg-browse-path")?.addEventListener("click", () => {
      openPathPicker();
    });
    document.getElementById("cfg-path-modal")?.addEventListener("click", (e) => {
      if (e.target.closest("[data-cfg-path-close]")) closePathPicker();
    });
    document.getElementById("cfg-path-ok")?.addEventListener("click", () => {
      confirmPathPicker();
    });
    document.getElementById("cfg-path-tree")?.addEventListener("click", onPathTreeClick);
    document.getElementById("cfg-path-manual")?.addEventListener("input", (e) => {
      syncPathManualFromInputs(e.target);
    });
    document.getElementById("cfg-path-manual-bottom")?.addEventListener("input", (e) => {
      syncPathManualFromInputs(e.target);
    });
    document.getElementById("cfg-path-manual")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmPathPicker();
      }
    });
    document.getElementById("cfg-path-manual-bottom")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmPathPicker();
      }
    });

    document.getElementById("cfg-edit-row")?.addEventListener("click", () => {
      openEditModal();
    });
    document.getElementById("cfg-delete-row")?.addEventListener("click", () => {
      deleteSelectedRow();
    });

    document.getElementById("cfg-edit-modal")?.addEventListener("click", (e) => {
      if (e.target.closest("[data-cfg-edit-close]")) closeEditModal();
    });
    document.getElementById("cfg-edit-save")?.addEventListener("click", () => {
      applyEditModal();
    });
    document
      .getElementById("cfg-edit-email-form")
      ?.addEventListener("submit", onEditAddEmail);
    document
      .getElementById("cfg-edit-email-list")
      ?.addEventListener("click", onEditRemoveEmail);

    document.getElementById("cfg-apply-modal")?.addEventListener("click", (e) => {
      if (e.target.closest("[data-cfg-apply-close]")) closeApplyModal();
    });
    document.getElementById("cfg-apply-confirm")?.addEventListener("click", () => {
      confirmApplyToHost();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const path = document.getElementById("cfg-path-modal");
      const edit = document.getElementById("cfg-edit-modal");
      const apply = document.getElementById("cfg-apply-modal");
      if (path && !path.hidden) closePathPicker();
      else if (edit && !edit.hidden) closeEditModal();
      else if (apply && !apply.hidden) closeApplyModal();
    });
  }

  loadEamTable();
}
