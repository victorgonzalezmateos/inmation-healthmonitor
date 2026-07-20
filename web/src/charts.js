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
    const w = parent.clientWidth || 300;
    const h = parent.clientHeight || 180;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
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

/** Full pie chart. */
export function renderPie(canvas, { labels, values, colors }) {
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
        },
        {
          label: "Warnings",
          data: data.warnings,
          borderColor: "#eab308",
          backgroundColor: "rgba(234,179,8,0.12)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          borderWidth: 2,
        },
        {
          label: "Info",
          data: data.info,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.12)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          borderWidth: 2,
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
          title: { display: true, text: "Time (24h)", font: { size: 11 } },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Count", font: { size: 11 } },
          grid: { color: "#f1f5f9" },
        },
      },
    },
  });
}

/** Horizontal bar chart. */
export function renderTopTypes(canvas, data) {
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
