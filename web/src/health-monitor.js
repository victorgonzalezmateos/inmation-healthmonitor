import {
  countersForNode,
  propsForNode,
  treeRoots,
} from "./hm-mock-data.js";

let selectedId = "core";
const expanded = new Set(["io-model", "system", "core", "server-model"]);

function findNode(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function renderTreeNodes(nodes, depth = 0) {
  return nodes
    .map((n) => {
      const hasKids = n.children && n.children.length > 0;
      const isOpen = expanded.has(n.id);
      const isSel = n.id === selectedId;
      const kids =
        hasKids && isOpen ? renderTreeNodes(n.children, depth + 1) : "";
      return `
        <li class="hm-tree-item" style="--depth:${depth}">
          <button type="button" class="hm-tree-row${isSel ? " selected" : ""}" data-id="${n.id}" data-toggle="${hasKids ? "1" : "0"}">
            <span class="hm-tree-twist${hasKids ? "" : " empty"}">${hasKids ? (isOpen ? "▾" : "▸") : ""}</span>
            <span class="hm-tree-label">${escapeHtml(n.name)}</span>
          </button>
          ${hasKids && isOpen ? `<ul class="hm-tree-children">${kids}</ul>` : ""}
        </li>`;
    })
    .join("");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderProps(node) {
  const box = document.getElementById("hm-props");
  if (!box) return;
  const p = propsForNode(node);
  if (!p) {
    box.innerHTML = `<p class="hm-props-empty">Select an object in the tree.</p>`;
    return;
  }
  const rows = [
    ["Name", p.ObjectName],
    ["Type", p.Type],
    ["Object ID", p.ObjectID],
    ["Path", p.Path],
    ["Config Version", p.ConfigVersion],
    ["Class Version", p.ClassVersion],
    ["Created", p.Created],
    ["Modified", p.Modified],
    ["State", p.State],
  ];
  box.innerHTML = rows
    .map(
      ([k, v]) =>
        `<div class="hm-prop-row"><span class="hm-prop-key">${k}</span><span class="hm-prop-val">${escapeHtml(v)}</span></div>`
    )
    .join("");
}

function renderCounters(nodeId) {
  const tbody = document.querySelector("#hm-counters-table tbody");
  const empty = document.getElementById("hm-counters-empty");
  if (!tbody) return;
  const rows = countersForNode(nodeId);
  if (!rows.length) {
    tbody.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  tbody.innerHTML = rows
    .map(
      (r) => `<tr>
        <td>${escapeHtml(r.ObjectName)}</td>
        <td>${escapeHtml(r.type)}</td>
        <td>${escapeHtml(String(r.Value))}</td>
        <td>${escapeHtml(r.Unit)}</td>
        <td>${escapeHtml(r.penName)}</td>
        <td class="hm-path-cell">${escapeHtml(r.path)}</td>
      </tr>`
    )
    .join("");
}

function refresh() {
  const list = document.getElementById("hm-tree");
  if (!list) return;
  list.innerHTML = renderTreeNodes(treeRoots);
  const node = findNode(treeRoots, selectedId);
  renderProps(node);
  renderCounters(selectedId);
  const title = document.getElementById("hm-counters-title");
  if (title && node) {
    title.textContent = `Performance Counters — ${node.name}`;
  }
}

function onTreeClick(e) {
  const btn = e.target.closest(".hm-tree-row");
  if (!btn) return;
  const id = btn.dataset.id;
  const canToggle = btn.dataset.toggle === "1";
  const twist = e.target.closest(".hm-tree-twist");

  if (canToggle && (twist || e.detail === 2)) {
    if (expanded.has(id)) expanded.delete(id);
    else expanded.add(id);
  }

  selectedId = id;
  // Ensure ancestors stay expanded when selecting
  expanded.add(id);
  refresh();
}

export function initHealthMonitorPage() {
  const tree = document.getElementById("hm-tree");
  if (!tree || tree.dataset.ready === "1") {
    refresh();
    return;
  }
  tree.dataset.ready = "1";
  tree.addEventListener("click", onTreeClick);
  refresh();
}
