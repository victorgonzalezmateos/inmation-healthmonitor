import {
  countersForNode,
  propsForNode,
  treeRoots as mockTreeRoots,
} from "./hm-mock-data.js";
import {
  authorizeIwa,
  clearToken,
  getStoredToken,
  peekTokenClaims,
  setManualToken,
} from "./api/inmation.js";
import {
  fetchLiveCounters,
  fetchLiveNavigationTree,
  fetchLiveObjProps,
} from "./api/hm-live.js";

let mode = "mock"; // "mock" | "live"
let treeRoots = mockTreeRoots;
let selectedId = "core";
const expanded = new Set(["io-model", "system", "core", "server-model"]);
let liveProps = null;
let liveCounters = [];
let busy = false;

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

function firstLeafOrRoot(nodes) {
  if (!nodes?.length) return null;
  return nodes[0];
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
          <button type="button" class="hm-tree-row${isSel ? " selected" : ""}" data-id="${escapeHtml(n.id)}" data-toggle="${hasKids ? "1" : "0"}">
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

function renderPropsFromObject(p) {
  const box = document.getElementById("hm-props");
  if (!box) return;
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
        `<div class="hm-prop-row"><span class="hm-prop-key">${k}</span><span class="hm-prop-val">${escapeHtml(v ?? "—")}</span></div>`
    )
    .join("");
}

function renderCounterRows(rows) {
  const tbody = document.querySelector("#hm-counters-table tbody");
  const empty = document.getElementById("hm-counters-empty");
  if (!tbody) return;
  if (!rows?.length) {
    tbody.innerHTML = "";
    if (empty) {
      empty.hidden = false;
      empty.textContent =
        mode === "live"
          ? "No counters for this object (or still loading)."
          : "Select an object in the tree.";
    }
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

function setStatus(text, kind = "info") {
  const el = document.getElementById("hm-conn-status");
  if (!el) return;
  el.textContent = text;
  el.dataset.kind = kind;
}

function updateConnUi() {
  const badge = document.getElementById("hm-conn-badge");
  const claims = peekTokenClaims();
  if (badge) {
    if (mode === "live" && getStoredToken()) {
      badge.textContent = "LIVE";
      badge.dataset.state = "live";
    } else {
      badge.textContent = "MOCK";
      badge.dataset.state = "mock";
    }
  }
  const user = document.getElementById("hm-conn-user");
  if (user) {
    user.textContent = claims?.sub
      ? String(claims.sub)
      : mode === "live"
        ? "(token OK)"
        : "—";
  }
}

async function loadLiveDetails(node) {
  if (!node || mode !== "live") return;
  setStatus(`Loading props/counters for ${node.name}…`, "info");

  // Load independently — counters must not wipe a successful props fetch
  let propsErr = null;
  let countersErr = null;

  try {
    liveProps = await fetchLiveObjProps(node);
    renderPropsFromObject(liveProps);
  } catch (err) {
    propsErr = err;
    console.error("[hm-live] props", err);
    liveProps = {
      ObjectName: node.name,
      Type: node.type,
      ObjectID: String(node.objectId ?? node.id),
      Path: node.path,
      ConfigVersion: "—",
      ClassVersion: "—",
      Created: "—",
      Modified: "—",
      State: `Error: ${err.message}`,
    };
    renderPropsFromObject(liveProps);
  }

  try {
    liveCounters = await fetchLiveCounters(node, liveProps);
    renderCounterRows(liveCounters);
  } catch (err) {
    countersErr = err;
    console.error("[hm-live] counters", err);
    liveCounters = [];
    renderCounterRows([]);
  }

  if (!propsErr && !countersErr) {
    setStatus(
      `Live · ${node.name} · ${liveCounters.length} counters`,
      "ok"
    );
  } else if (propsErr && countersErr) {
    setStatus(`Details error: ${countersErr.message}`, "err");
  } else if (countersErr) {
    setStatus(
      `Props OK · counters: ${countersErr.message}`,
      "err"
    );
  } else {
    setStatus(`Counters OK · props: ${propsErr.message}`, "err");
  }
}

function refreshTreeOnly() {
  const list = document.getElementById("hm-tree");
  if (!list) return;
  list.innerHTML = renderTreeNodes(treeRoots);
  const node = findNode(treeRoots, selectedId);
  const title = document.getElementById("hm-counters-title");
  if (title && node) {
    title.textContent = `Performance Counters — ${node.name}`;
  }
}

async function refresh() {
  refreshTreeOnly();
  const node = findNode(treeRoots, selectedId);

  if (mode === "live") {
    if (liveProps) renderPropsFromObject(liveProps);
    else renderPropsFromObject(null);
    renderCounterRows(liveCounters);
    if (node) await loadLiveDetails(node);
  } else {
    renderPropsFromObject(propsForNode(node));
    renderCounterRows(countersForNode(selectedId));
  }
  updateConnUi();
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
  expanded.add(id);
  liveProps = null;
  liveCounters = [];
  refresh();
}

async function connectLive() {
  if (busy) return;
  busy = true;
  const btn = document.getElementById("hm-connect");
  if (btn) btn.disabled = true;
  setStatus("Connecting with Windows IWA…", "info");
  try {
    const auth = await authorizeIwa();
    setStatus(
      `IWA OK (${auth.via}) · loading navigation tree…`,
      "ok"
    );
    const roots = await fetchLiveNavigationTree();
    if (!roots.length) {
      throw new Error("Tree returned empty — check profile permissions");
    }
    mode = "live";
    treeRoots = roots;
    expanded.clear();
    roots.forEach((r) => expanded.add(r.id));
    const first = firstLeafOrRoot(roots);
    selectedId = first?.id || roots[0].id;
    if (first?.children?.length) {
      // expand first level
      first.children.slice(0, 3).forEach((c) => expanded.add(c.id));
    }
    liveProps = null;
    liveCounters = [];
    await refresh();
    setStatus(
      `Connected · ${roots.length} root(s) · IWA via ${auth.via}`,
      "ok"
    );
  } catch (err) {
    console.error("[hm-live] connect", err);
    mode = "mock";
    treeRoots = mockTreeRoots;
    setStatus(`Connect failed: ${err.message}`, "err");
    await refresh();
  } finally {
    busy = false;
    if (btn) btn.disabled = false;
    updateConnUi();
  }
}

function disconnectLive() {
  clearToken();
  mode = "mock";
  treeRoots = mockTreeRoots;
  selectedId = "core";
  expanded.clear();
  ["io-model", "system", "core", "server-model"].forEach((id) =>
    expanded.add(id)
  );
  liveProps = null;
  liveCounters = [];
  setStatus("Using mock data", "info");
  refresh();
}

function useManualToken() {
  const raw = window.prompt(
    "Paste Bearer access_token (from WebStudio Network → authorize / token):"
  );
  if (!raw) return;
  try {
    setManualToken(raw);
    setStatus("Manual token saved — click Connect to load tree", "ok");
    updateConnUi();
    // Try load with existing token (skip IWA)
    connectWithExistingToken();
  } catch (err) {
    setStatus(err.message, "err");
  }
}

async function connectWithExistingToken() {
  if (!getStoredToken()) return connectLive();
  if (busy) return;
  busy = true;
  setStatus("Loading tree with stored token…", "info");
  try {
    const roots = await fetchLiveNavigationTree();
    if (!roots.length) throw new Error("Tree returned empty");
    mode = "live";
    treeRoots = roots;
    expanded.clear();
    roots.forEach((r) => expanded.add(r.id));
    selectedId = roots[0].id;
    liveProps = null;
    liveCounters = [];
    await refresh();
    setStatus(`Connected with stored token · ${roots.length} root(s)`, "ok");
  } catch (err) {
    console.error(err);
    setStatus(`Token/tree failed: ${err.message} — try Connect (IWA)`, "err");
  } finally {
    busy = false;
    updateConnUi();
  }
}

export function initHealthMonitorPage() {
  const tree = document.getElementById("hm-tree");
  if (!tree) return;

  if (tree.dataset.ready !== "1") {
    tree.dataset.ready = "1";
    tree.addEventListener("click", onTreeClick);

    document.getElementById("hm-connect")?.addEventListener("click", () => {
      connectLive();
    });
    document
      .getElementById("hm-disconnect")
      ?.addEventListener("click", disconnectLive);
    document
      .getElementById("hm-token-paste")
      ?.addEventListener("click", useManualToken);

    const submit = document.getElementById("hm-submit");
    if (submit && !submit.dataset.bound) {
      submit.dataset.bound = "1";
      submit.addEventListener("click", () => {
        console.info("[Health Monitor] Submit clicked (chart wiring next)");
        submit.classList.add("btn-submit-flash");
        setTimeout(() => submit.classList.remove("btn-submit-flash"), 400);
      });
    }
  }

  if (getStoredToken() && mode === "mock") {
    setStatus("Token in session — click Connect to load live tree", "info");
  } else if (mode === "mock") {
    setStatus("Mock data · click Connect for live Health Monitor", "info");
  }
  refresh();
}
