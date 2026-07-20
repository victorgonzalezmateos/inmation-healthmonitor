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

const baseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

/** Rainbow semicircle + needle for Health Score (0–100). */
export function renderHealthGauge(canvas, score) {
  const steps = 48;
  const values = Array(steps).fill(1);
  const colors = [];
  for (let i = 0; i < steps; i++) {
    // Red (0) → yellow (60) → green (120)
    const hue = (i / (steps - 1)) * 120;
    colors.push(`hsl(${hue} 90% 48%)`);
  }
  // Transparent lower half so only the top arc shows
  values.push(steps);
  colors.push("rgba(0,0,0,0)");

  const clamped = Math.max(0, Math.min(100, score));

  const needlePlugin = {
    id: "healthNeedle",
    afterDatasetsDraw(chart) {
      const meta = chart.getDatasetMeta(0);
      if (!meta?.data?.length) return;
      const first = meta.data[0];
      const cx = first.x;
      const cy = first.y;
      // Semicircle: Chart.js doughnut rotation 270°, circumference 180°
      // Score 0 = left (π), score 100 = right (0) in standard math; with rotation 270:
      const angle = Math.PI + (clamped / 100) * Math.PI; // π → 2π
      const inner = first.innerRadius ?? 0;
      const outer = first.outerRadius ?? 0;
      const r = (inner + outer) / 2;
      const ctx = chart.ctx;
      ctx.save();
      ctx.strokeStyle = "#0f172a";
      ctx.fillStyle = "#0f172a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  };

  return new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: [...Array(steps).fill(""), ""],
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 0,
          circumference: 180,
          rotation: 270,
        },
      ],
    },
    options: {
      ...baseOpts,
      cutout: "68%",
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
    plugins: [needlePlugin],
  });
}

/** Full pie chart (Components, Severity, Alerts). */
export function renderPie(canvas, { labels, values, colors }) {
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
      ...baseOpts,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
              const v = ctx.parsed;
              const pct = ((v / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${v.toLocaleString()} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

/** Multi-line trend chart (Issues over time). */
export function renderTimeline(canvas, data) {
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
          pointHoverRadius: 5,
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
          pointHoverRadius: 5,
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
          pointHoverRadius: 5,
          borderWidth: 2,
        },
      ],
    },
    options: {
      ...baseOpts,
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

/** Horizontal bar chart (Top issue types). */
export function renderTopTypes(canvas, data) {
  const max = Math.max(...data.values, 1);
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
      ...baseOpts,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const pct = ((ctx.parsed.x / max) * 100).toFixed(0);
              return ` ${ctx.parsed.x} (${pct}% of top)`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "#f1f5f9" },
          ticks: { precision: 0 },
        },
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
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
    },
  });
}

export function fillLegend(el, labels, values, colors) {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  el.innerHTML = labels
    .map((label, i) => {
      const pct = ((values[i] / total) * 100).toFixed(1);
      return `<span><i class="swatch" style="background:${colors[i]}"></i>${label} · ${values[i].toLocaleString()} (${pct}%)</span>`;
    })
    .join("");
}
