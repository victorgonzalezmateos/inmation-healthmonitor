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

export function renderHealthGauge(canvas, score) {
  // Semi-donut: green/yellow/red arc + transparent half
  const good = Math.max(0, score);
  const mid = Math.max(0, Math.min(20, 100 - good));
  const bad = Math.max(0, 100 - good - mid);
  return new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Good", "Warn", "Bad", "_"],
      datasets: [
        {
          data: [good, mid, bad, good + mid + bad],
          backgroundColor: ["#89d329", "#eab308", "#ef4444", "rgba(0,0,0,0)"],
          borderWidth: 0,
          circumference: 180,
          rotation: 270,
        },
      ],
    },
    options: {
      ...baseOpts,
      cutout: "72%",
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
    },
  });
}

export function renderDonut(canvas, { labels, values, colors }) {
  return new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      ...baseOpts,
      cutout: "62%",
    },
  });
}

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
          backgroundColor: "rgba(239,68,68,0.1)",
          tension: 0.3,
          fill: false,
          pointRadius: 2,
        },
        {
          label: "Warnings",
          data: data.warnings,
          borderColor: "#eab308",
          backgroundColor: "rgba(234,179,8,0.1)",
          tension: 0.3,
          fill: false,
          pointRadius: 2,
        },
        {
          label: "Info",
          data: data.info,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.1)",
          tension: 0.3,
          fill: false,
          pointRadius: 2,
        },
      ],
    },
    options: {
      ...baseOpts,
      plugins: {
        legend: { display: true, position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
      },
    },
  });
}

export function renderTopTypes(canvas, data) {
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
        },
      ],
    },
    options: {
      ...baseOpts,
      indexAxis: "y",
      scales: {
        x: { beginAtZero: true, grid: { color: "#f1f5f9" } },
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
