/**
 * Reliable trend drawing for Health Monitor Submit → Chart.
 * Uses Chart.js when possible; falls back to raw Canvas 2D so the panel is never blank.
 */

import { Chart } from "chart.js/auto";
import { buildSeriesFromSelectedCounters } from "./hm-counter-chart.js";

export { buildSeriesFromSelectedCounters };

/**
 * Destroy any Chart.js instance on this canvas and return a fresh canvas node.
 * Recreating the element avoids "canvas already in use" / 0×0 reuse bugs.
 */
export function resetChartCanvas(box) {
  if (!box) return null;
  box.innerHTML = "";
  const canvas = document.createElement("canvas");
  canvas.id = "chart-hm-counters";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Performance counter trend");
  box.appendChild(canvas);
  return canvas;
}

export function destroyChartInstance(instance) {
  if (!instance) return null;
  try {
    instance.destroy();
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * @returns {{ chart: import('chart.js').Chart | null, mode: 'chartjs' | 'canvas2d', error?: string }}
 */
export function paintTrendChart(canvas, payload) {
  if (!canvas || !payload?.pens?.length) {
    return { chart: null, mode: "canvas2d", error: "No pen data" };
  }

  const box = canvas.parentElement;
  const width = Math.max(box?.clientWidth || 0, 640);
  const height = Math.max(box?.clientHeight || 0, 360);
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = "100%";
  canvas.style.height = `${height}px`;

  // Prefer Chart.js
  try {
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();

    const chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: payload.labels || [],
        datasets: payload.pens.map((p) => ({
          label: p.unit ? `${p.name} (${p.unit})` : p.name,
          data: p.values || [],
          borderColor: p.color || "#00bcff",
          backgroundColor: "transparent",
          tension: 0.25,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: 2,
          spanGaps: true,
        })),
      },
      options: {
        responsive: false,
        animation: false,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          // External #hm-chart-pens legend handles show/hide toggles
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
              font: { size: 10 },
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: "#f1f5f9" },
            ticks: { font: { size: 11 } },
          },
        },
      },
    });
    return { chart, mode: "chartjs" };
  } catch (err) {
    console.warn("[hm-chart] Chart.js failed, using canvas2d", err);
    drawCanvas2dTrend(canvas, payload);
    return { chart: null, mode: "canvas2d", error: String(err?.message || err) };
  }
}

/** Always-visible fallback — no Chart.js dependency. */
export function drawCanvas2dTrend(canvas, payload) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const pad = { t: 24, r: 16, b: 40, l: 48 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  const pens = payload.pens || [];
  let minV = 0;
  let maxV = 1;
  for (const p of pens) {
    for (const v of p.values || []) {
      if (v == null || Number.isNaN(Number(v))) continue;
      const n = Number(v);
      if (n < minV) minV = n;
      if (n > maxV) maxV = n;
    }
  }
  if (maxV <= minV) maxV = minV + 1;

  // axes
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t);
  ctx.lineTo(pad.l, pad.t + plotH);
  ctx.lineTo(pad.l + plotW, pad.t + plotH);
  ctx.stroke();

  for (const p of pens) {
    const vals = p.values || [];
    if (vals.length < 2) continue;
    ctx.strokeStyle = p.color || "#00bcff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    vals.forEach((v, i) => {
      const x = pad.l + (i / (vals.length - 1)) * plotW;
      const y =
        pad.t + plotH - ((Number(v) - minV) / (maxV - minV)) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  // legend text
  ctx.font = "12px Segoe UI, sans-serif";
  let lx = pad.l;
  const ly = h - 14;
  for (const p of pens) {
    ctx.fillStyle = p.color || "#00bcff";
    ctx.fillRect(lx, ly - 8, 10, 10);
    ctx.fillStyle = "#334155";
    const label = p.name || "Pen";
    ctx.fillText(label, lx + 14, ly);
    lx += ctx.measureText(label).width + 28;
  }
}
