import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

function sized(canvas) {
  // Ensure parent has layout before Chart.js measures it
  const parent = canvas.parentElement;
  if (parent) {
    const w = Math.max(parent.clientWidth || 0, 320);
    const h = Math.max(parent.clientHeight || 0, 260);
    canvas.style.width = "100%";
    canvas.style.height = `${h}px`;
    canvas.width = w;
    canvas.height = h;
  }
  return canvas;
}

/** Rainbow semicircle + needle drawn on canvas (no Chart.js — more reliable). */
export function renderHealthGauge(canvas, score) {
  const parent = canvas.parentElement;
  const w = Math.max(160, parent?.clientWidth || 160);
  const h = 100;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = "100%";
  canvas.style.height = `${h}px`;

  const ctx = canvas.getContext("2d");
  const cx = w / 2;
  const cy = h - 8;
  const radius = Math.min(w / 2 - 8, h - 16);
  const start = Math.PI; // left
  const end = 0; // right
  const steps = 64;
  const clamped = Math.max(0, Math.min(100, score));

  ctx.clearRect(0, 0, w, h);

  // Rainbow arc
  for (let i = 0; i < steps; i++) {
    const a0 = start + (i / steps) * (end - start);
    const a1 = start + ((i + 1) / steps) * (end - start);
    const hue = (i / (steps - 1)) * 120; // red → green
    ctx.beginPath();
    ctx.strokeStyle = `hsl(${hue}, 90%, 48%)`;
    ctx.lineWidth = 14;
    ctx.lineCap = "butt";
    ctx.arc(cx, cy, radius, a0, a1, false);
    ctx.stroke();
  }

  // Needle
  const angle = start + (clamped / 100) * (end - start);
  ctx.strokeStyle = "#0f172a";
  ctx.fillStyle = "#0f172a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(angle) * (radius - 4), cy + Math.sin(angle) * (radius - 4));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();

  return { destroy() {} };
}

/**
 * Doughnut for Overview Health Score — Good / Problems / Warnings / Disabled.
 * Center label is HTML overlay (caller).
 */
export function renderHealthDoughnut(canvas, summary) {
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const labels = [];
  const values = [];
  const colors = [];
  const push = (label, value, color) => {
    if (value > 0) {
      labels.push(label);
      values.push(value);
      colors.push(color);
    }
  };
  push("Good", summary.good || 0, "#16a34a");
  push("Problems", summary.bad || 0, "#ef4444");
  push("Warnings", summary.warning || 0, "#ca8a04");
  push("Disabled", summary.disabled || 0, "#94a3b8");

  if (!values.length) {
    labels.push("No data");
    values.push(1);
    colors.push("#e2e8f0");
  }

  const parent = canvas.parentElement;
  const size = Math.min(Math.max(parent?.clientWidth || 140, 120), 160);
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  canvas.width = size;
  canvas.height = size;

  return new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: true,
      animation: false,
      cutout: "68%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const total =
                ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
              const v = ctx.parsed;
              const pct = ((v / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${Number(v).toLocaleString()} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

/** Full pie chart. */
export function renderPie(canvas, { labels, values, colors }) {
  if (!canvas) return null;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
  sized(canvas);
  return new Chart(canvas, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
              const v = ctx.parsed;
              const pct = ((v / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${Number(v).toLocaleString()} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

/** Multi-line trend chart. */
export function renderTimeline(canvas, data) {
  if (!canvas) return null;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
  sized(canvas);
  return new Chart(canvas, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Problems",
          data: data.problems,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.12)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          borderWidth: 2,
          spanGaps: true,
        },
        {
          label: "Warnings",
          data: data.warnings,
          borderColor: "#ca8a04",
          backgroundColor: "rgba(202,138,4,0.12)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          borderWidth: 2,
          spanGaps: true,
        },
        {
          label: "Disabled",
          data: data.info,
          borderColor: "#64748b",
          backgroundColor: "rgba(100,116,139,0.12)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          borderWidth: 2,
          spanGaps: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: { boxWidth: 10, font: { size: 11 } },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Time (last 24h)", font: { size: 11 } },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Count", font: { size: 11 } },
          grid: { color: "#f1f5f9" },
          ticks: { precision: 0 },
        },
      },
    },
  });
}

/** Horizontal bar chart. */
export function renderTopTypes(canvas, data) {
  if (!canvas) return null;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
  sized(canvas);
  return new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: [
        {
          data: data.values,
          backgroundColor: [
            "#ef4444",
            "#f97316",
            "#eab308",
            "#a855f7",
            "#3b82f6",
            "#94a3b8",
            "#16a34a",
            "#0891b2",
          ],
          borderRadius: 4,
          barThickness: 18,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, grid: { color: "#f1f5f9" }, ticks: { precision: 0 } },
        y: { grid: { display: false } },
      },
    },
  });
}

export function renderSparkline(canvas, values) {
  return new Chart(canvas, {
    type: "line",
    data: {
      labels: values.map((_, i) => i),
      datasets: [
        {
          data: values,
          borderColor: "#64748b",
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.3,
          fill: false,
        },
      ],
    },
    options: {
      responsive: false,
      animation: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
    },
  });
}

/** Multi-pen object trend (Trends page + HM Submit chart). */
export function renderObjectTrend(canvas, { labels, pens }) {
  // Always clear any Chart.js instance bound to this canvas
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const box = canvas.parentElement;
  const w = Math.max(box?.clientWidth || 0, canvas.clientWidth || 0, 480);
  const h = Math.max(box?.clientHeight || 0, 280);
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = "100%";
  canvas.style.height = `${h}px`;

  return new Chart(canvas, {
    type: "line",
    data: {
      labels: labels || [],
      datasets: (pens || []).map((p) => ({
        label: p.unit ? `${p.name} (${p.unit})` : p.name,
        data: p.values || [],
        borderColor: p.color || "#00bcff",
        backgroundColor: "transparent",
        tension: 0.25,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        spanGaps: true,
      })),
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: { boxWidth: 10, font: { size: 11 }, usePointStyle: true },
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              const pen = pens[ctx.datasetIndex];
              const name = pen?.name || ctx.dataset.label;
              const unit = pen?.unit ? ` ${pen.unit}` : "";
              return `${name}: ${ctx.parsed.y}${unit}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10,
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
}

export function fillLegend(el, labels, values, colors) {
  if (!el) return;
  const total = values.reduce((a, b) => a + b, 0) || 1;
  el.innerHTML = labels
    .map((label, i) => {
      const pct = ((values[i] / total) * 100).toFixed(1);
      return `<span><i class="swatch" style="background:${colors[i]}"></i>${label} · ${values[i].toLocaleString()} (${pct}%)</span>`;
    })
    .join("");
}
