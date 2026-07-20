import "./styles.css";
import * as mock from "./mock-data.js";
import {
  fillLegend,
  renderHealthGauge,
  renderPie,
  renderSparkline,
  renderTimeline,
  renderTopTypes,
} from "./charts.js";

function fmt(n) {
  return n.toLocaleString("en-US");
}

function scoreColor(score) {
  if (score >= 80) return "#16a34a";
  if (score >= 70) return "#89d329";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

function tickClock() {
  const now = new Date();
  const s = now.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  document.getElementById("system-time").textContent = s;
  document.getElementById("last-refresh").textContent = s;
}

function fillKpis() {
  const k = mock.kpis;
  document.getElementById("kpi-score").textContent = String(k.healthScore);
  document.getElementById("kpi-score-label").textContent = k.healthLabel;
  document.getElementById("kpi-total").textContent = fmt(k.totalComponents);
  document.getElementById("kpi-problems").textContent = String(k.problems);
  document.getElementById("kpi-problems-pct").textContent =
    `${k.problemsPct}% of components`;
  document.getElementById("kpi-warnings").textContent = String(k.warnings);
  document.getElementById("kpi-warnings-pct").textContent =
    `${k.warningsPct}% of components`;
  document.getElementById("kpi-info").textContent = String(k.info);
  document.getElementById("kpi-info-pct").textContent =
    `${k.infoPct}% of components`;
  document.getElementById("kpi-sites").textContent = String(k.sitesImpacted);
  document.getElementById("kpi-sites-of").textContent =
    `of ${k.sitesTotal} sites`;
}

function fillCriticalTable() {
  const tbody = document.querySelector("#table-critical tbody");
  tbody.innerHTML = mock.criticalIssues
    .map(
      (r) => `<tr class="critical">
      <td>${r.time}</td><td>${r.site}</td><td>${r.component}</td>
      <td>${r.type}</td><td>${r.message}</td></tr>`
    )
    .join("");
}

function fillSitesTable() {
  const tbody = document.querySelector("#table-sites tbody");
  tbody.innerHTML = mock.siteSummary
    .map((r, i) => {
      const color = scoreColor(r.score);
      return `<tr>
        <td>${r.site}</td>
        <td><span class="score-pill"><i class="score-dot" style="background:${color}"></i>${r.score}</span></td>
        <td>${r.total}</td>
        <td>${r.problems}</td>
        <td>${r.warnings}</td>
        <td>${r.info}</td>
        <td><canvas class="spark" id="spark-${i}" width="72" height="28"></canvas></td>
      </tr>`;
    })
    .join("");

  mock.siteSummary.forEach((r, i) => {
    const el = document.getElementById(`spark-${i}`);
    if (el) renderSparkline(el, r.trend);
  });
}

function fillAlertsTable() {
  const tbody = document.querySelector("#table-alerts tbody");
  tbody.innerHTML = mock.recentAlerts
    .map((r) => {
      const sev = r.severity.toLowerCase();
      return `<tr>
        <td>${r.time}</td>
        <td><span class="badge ${sev}">${r.severity}</span></td>
        <td>${r.site}</td>
        <td>${r.component}</td>
        <td>${r.message}</td>
        <td>${r.status}</td>
        <td>${r.duration}</td>
        <td>${r.ack}</td>
      </tr>`;
    })
    .join("");
}

function wireNav() {
  const overview = document.getElementById("page-overview");
  const other = document.getElementById("page-other");
  const title = document.getElementById("other-title");

  document.querySelectorAll(".nav-list button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".nav-list button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const page = btn.dataset.page;
      if (page === "overview") {
        overview.classList.add("visible");
        other.classList.remove("visible");
      } else {
        overview.classList.remove("visible");
        other.classList.add("visible");
        title.textContent = btn.textContent.trim();
      }
    });
  });
}

function initCharts() {
  renderHealthGauge(
    document.getElementById("chart-health"),
    mock.kpis.healthScore
  );

  renderPie(document.getElementById("chart-components"), mock.componentsByType);
  fillLegend(
    document.getElementById("legend-components"),
    mock.componentsByType.labels,
    mock.componentsByType.values,
    mock.componentsByType.colors
  );

  renderPie(document.getElementById("chart-severity"), mock.issuesBySeverity);
  fillLegend(
    document.getElementById("legend-severity"),
    mock.issuesBySeverity.labels,
    mock.issuesBySeverity.values,
    mock.issuesBySeverity.colors
  );

  renderTimeline(document.getElementById("chart-timeline"), mock.issuesOverTime);
  renderTopTypes(document.getElementById("chart-top-types"), mock.topIssueTypes);

  renderPie(document.getElementById("chart-alerts"), mock.alertsBySeverity);
  fillLegend(
    document.getElementById("legend-alerts"),
    mock.alertsBySeverity.labels,
    mock.alertsBySeverity.values,
    mock.alertsBySeverity.colors
  );
}

fillKpis();
fillCriticalTable();
fillSitesTable();
fillAlertsTable();
initCharts();
wireNav();
tickClock();
setInterval(tickClock, 1000);
