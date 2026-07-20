import { countersForNode, treeRoots } from "./hm-mock-data.js";
import { renderObjectTrend } from "./charts.js";

const PEN_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#ca8a04",
  "#7c3aed",
  "#0891b2",
  "#ea580c",
  "#4f46e5",
];

let selectedId = "core";
const expanded = new Set(["io-model", "system", "core", "server-model"]);
let chartInstance = null;

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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

/** Build mock historical series for every counter saved on the object. */
function buildTrendSeries(nodeId, rangeKey) {
  const counters = countersForNode(nodeId);
  const { labels, pointCount } = timeLabels(rangeKey);
  // Stable pseudo-random per node so re-renders don't jump
  let seed = [...nodeId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd = () => {
    seed = (seed * 16807 + 7) % 2147483647;
    return (seed % 1000) / 1000;
  };

  const pens = counters.map((c, i) => {
    const base = Number(c.Value) || 0;
    const values = [];
    let v = base * (0.85 + rnd() * 0.1);
    for (let t = 0; t < pointCount; t++) {
      const drift = (rnd() - 0.48) * (Math.abs(base) * 0.04 + 0.5);
      v = Math.max(0, v + drift);
      const blend = t / Math.max(1, pointCount - 1);
      values.push(+(v * (1 - blend) + base * blend).toFixed(3));
    }
    return {
      name: c.ObjectName,
      unit: c.Unit,
      penName: c.penName,
      color: PEN_COLORS[i % PEN_COLORS.length],
      values,
      current: c.Value,
    };
  });

  return { labels, pens };
}

function timeLabels(rangeKey) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const configs = {
    "1d": { ms: 1 * day, points: 96, stepMs: 15 * 60 * 1000 },
    "7d": { ms: 7 * day, points: 84, stepMs: 2 * 60 * 60 * 1000 },
    "1m": { ms: 30 * day, points: 90, stepMs: 8 * 60 * 60 * 1000 },
    "2m": { ms: 60 * day, points: 90, stepMs: 16 * 60 * 60 * 1000 },
  };
  const cfg = configs[rangeKey] || configs["1d"];
  const labels = [];
  const longRange = rangeKey === "7d" || rangeKey === "1m" || rangeKey === "2m";
  for (let i = 0; i < cfg.points; i++) {
    const t = new Date(now - cfg.ms + i * cfg.stepMs);
    labels.push(
      longRange
        ? t.toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            hour: rangeKey === "7d" ? "2-digit" : undefined,
            minute: rangeKey === "7d" ? "2-digit" : undefined,
          })
        : t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
  }
  return { labels, pointCount: cfg.points };
}

function renderPensList(pens) {
  const el = document.getElementById("trends-pens");
  if (!el) return;
  el.hidden = pens.length === 0;
  el.innerHTML = pens
    .map(
      (p) => `<div class="trends-pen">
        <i class="swatch" style="background:${p.color}"></i>
        <span class="trends-pen-name">${escapeHtml(p.name)}</span>
        <span class="trends-pen-meta">${escapeHtml(String(p.current))} ${escapeHtml(p.unit || "")}</span>
      </div>`
    )
    .join("");
}

function renderTrend() {
  const list = document.getElementById("trends-tree");
  if (list) list.innerHTML = renderTreeNodes(treeRoots);

  const node = findNode(treeRoots, selectedId);
  const title = document.getElementById("trends-chart-title");
  const empty = document.getElementById("trends-empty");
  const wrap = document.getElementById("trends-chart-wrap");
  const pensEl = document.getElementById("trends-pens");
  const canvas = document.getElementById("chart-trends");
  const range = document.getElementById("trends-range")?.value || "1d";

  if (title) {
    title.textContent = node
      ? `Trend — ${node.name}`
      : "Trend";
  }

  if (!node || !canvas) {
    if (empty) empty.hidden = false;
    if (wrap) wrap.hidden = true;
    if (pensEl) pensEl.hidden = true;
    return;
  }

  const { labels, pens } = buildTrendSeries(selectedId, range);

  if (!pens.length) {
    if (empty) {
      empty.hidden = false;
      empty.textContent = "No saved counters/history for this object.";
    }
    if (wrap) wrap.hidden = true;
    if (pensEl) pensEl.hidden = true;
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }

  if (empty) empty.hidden = true;
  if (wrap) wrap.hidden = false;
  renderPensList(pens);

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  // Defer so layout has size when panel becomes visible
  requestAnimationFrame(() => {
    chartInstance = renderObjectTrend(canvas, { labels, pens });
  });
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
  renderTrend();
}

export function initTrendsPage() {
  const tree = document.getElementById("trends-tree");
  if (!tree) return;

  if (tree.dataset.ready !== "1") {
    tree.dataset.ready = "1";
    tree.addEventListener("click", onTreeClick);
    const range = document.getElementById("trends-range");
    if (range && !range.dataset.bound) {
      range.dataset.bound = "1";
      range.addEventListener("change", () => renderTrend());
    }
  }

  renderTrend();
}
