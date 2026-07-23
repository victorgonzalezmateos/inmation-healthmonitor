/**
 * Smart Sentinel User Guide — almost full-screen popup.
 */

const SECTIONS = [
  {
    id: "ug-dashboard",
    title: "Dashboard",
    html: `
      <p class="ug-purpose"><strong>What it is for:</strong> a global view of inmation fleet health. At a glance you see the health score, the split across Good / Problems / Warnings / Unknown / Disabled, and status by site.</p>
      <h4>Filters</h4>
      <ul>
        <li><strong>Time range</strong> — sets the window for the <em>Issues Over Time</em> chart (e.g. last day / week / month).</li>
        <li><strong>Site</strong> — filters KPIs, tables, and charts to one site (or All / Global).</li>
        <li><strong>Auto refresh</strong> — reloads data every 5 minutes while this page is visible.</li>
      </ul>
      <h4>KPIs</h4>
      <ul>
        <li><strong>Health Score</strong> — percentage of Good objects (doughnut).</li>
        <li><strong>Total Components / Sites</strong> — size of the filtered fleet.</li>
        <li><strong>Good, Problems, Warnings, Unknown, Disabled</strong> — counts by health class from inmation state flags.</li>
      </ul>
      <h4>Components by Site</h4>
      <p>Chart of component counts per site. Use it to see where the fleet is concentrated.</p>
      <h4>Active Critical Issues</h4>
      <p>Table of objects in Problem state. Sort by column headers and page with First / Previous / Page / Next / Last.</p>
      <h4>Site Summary</h4>
      <p>Per-site summary: health score and G / P / W / U / D counts. Sortable and paged.</p>
      <h4>Issues Over Time</h4>
      <p>Problem trend over time for the selected Time range.</p>
    `,
  },
  {
    id: "ug-health-monitor",
    title: "Health Monitor",
    html: `
      <p class="ug-purpose"><strong>What it is for:</strong> an operator console close to the DataStudio Health Monitor. Browse objects, read properties, and work with performance counters, chart, and values.</p>
      <h4>Navigation</h4>
      <p>Use this panel to open the inmation tree (I/O Model / Server Model) and select an object. The two buttons at the top switch between:</p>
      <ul>
        <li><strong>Tree</strong> — hierarchical tree (expand/collapse with ▸/▾).</li>
        <li><strong>List</strong> — flat table of objects (Name, Type, Object, Comm.), sortable and paged.</li>
      </ul>
      <h4>Object Properties</h4>
      <p>When you select an object, this panel shows its properties.</p>
      <h4>Performance Counters</h4>
      <p>The right-hand panel shows the performance counters for the selected object. You can:</p>
      <ul>
        <li>Select one or more counters (checkbox) and click <strong>Submit</strong> to load them into the chart / values views.</li>
        <li>Switch views with the header icons: <strong>counters table</strong>, <strong>trend chart</strong>, or <strong>values table</strong>.</li>
        <li>In chart and values, use <strong>maximize / restore</strong> to fill almost the whole screen.</li>
        <li>In the chart, open <strong>Time Period Settings</strong> to set Start / End, Length, and Max. rows (same idea as DataStudio).</li>
      </ul>
    `,
  },
  {
    id: "ug-health-overview",
    title: "Health Overview",
    html: `
      <p class="ug-purpose"><strong>What it is for:</strong> operational lists of everything that is not Good, plus connector certificates that are expired or about to expire.</p>
      <h4>Site filter</h4>
      <p>Filters all four panels to one site (includes Global when the path does not match Bayer naming).</p>
      <h4>Problems</h4>
      <p>Objects in Problem (Bad) state. Columns: Severity, Site, Component, Type, Message. Sort by clicking a header and move with the pager.</p>
      <h4>Warnings</h4>
      <p>Same layout for objects in Warning state.</p>
      <h4>Unknown &amp; Disabled</h4>
      <p>Unknown objects (e.g. relays with empty state) and Disabled / powered-off objects.</p>
      <h4>Connector Certificates</h4>
      <p>Certificates from the Health Monitor Report that are expired or expire within 30 days. Row color shows urgency (red / yellow; more critical under 15 days). Columns include Valid to, Status, and Expires.</p>
    `,
  },
  {
    id: "ug-trends",
    title: "Trends",
    html: `
      <p class="ug-purpose"><strong>What it is for:</strong> view saved historical trend pens for an object over a selected time range.</p>
      <p class="ug-note">This page is <strong>under development</strong>. The layout is already in place; live content will follow.</p>
      <h4>Time range</h4>
      <p>Top selector (1d, 7d, 1m, 2m) for the trend window.</p>
      <h4>Navigation</h4>
      <p>Tree on the left to pick the object whose trend you want to see.</p>
      <h4>Trend</h4>
      <p>Right panel with the chart and pen legend when data is available.</p>
    `,
  },
  {
    id: "ug-diagnostics",
    title: "Diagnostics",
    html: `
      <p class="ug-purpose"><strong>What it is for:</strong> drill from site / type / severity down to a specific object and review its Error / Warning logs from the last 24 hours.</p>
      <h4>Filters</h4>
      <ul>
        <li><strong>Site / Type / Severity</strong> — narrow the Hierarchy health table.</li>
        <li><strong>Show non-Good only</strong> — hides Good objects (on by default).</li>
      </ul>
      <h4>Hierarchy health</h4>
      <p>Object table with Site, Component, Type, Worst State, Score, and Message. Sortable and paged. Selecting a row loads that object’s logs on the right.</p>
      <h4>Recent Logs (Last 24h)</h4>
      <ul>
        <li>Lists Timestamp (UTC), Severity, and Message for Error / Warning logs.</li>
        <li><strong>Double-click</strong> a row to open <em>Log Details</em> (Name / Value sections like DataStudio), with arrow navigation between logs and Copy / Close.</li>
        <li>The header <strong>maximize / restore</strong> button expands the logs panel to almost full screen (Esc restores).</li>
      </ul>
    `,
  },
  {
    id: "ug-reports",
    title: "Reports",
    html: `
      <p class="ug-purpose"><strong>What it is for:</strong> view the host Health Monitor Report (inventory, datasources, certificates) rendered inside Smart Sentinel — not Stimulsoft.</p>
      <h4>Filters and actions</h4>
      <ul>
        <li><strong>Site</strong> — filters report tables by site.</li>
        <li><strong>State</strong> — defaults to <em>Not Good</em> (hides Good). Also All / Bad / Warning / Disabled / Good.</li>
        <li><strong>Reload</strong> — fetches the report from the host again.</li>
        <li><strong>Open Report</strong> — opens the report on the host / WebStudio in a new tab.</li>
      </ul>
      <h4>Report content</h4>
      <p>Health doughnuts, inventory / datasource tables, and certificates. Tables are sortable and paged. If everything is Good for the current filter, you see the green “all Good” message.</p>
    `,
  },
  {
    id: "ug-configuration",
    title: "Configuration",
    html: `
      <p class="ug-purpose"><strong>What it is for:</strong> manage the <em>EAM Critical Objects</em> list (path, type, standby, local contact) and apply changes to the host.</p>
      <h4>Filters</h4>
      <p><strong>Site</strong> and <strong>Type</strong> filter the local table. <strong>Reload</strong> reloads from the host. <strong>Apply</strong> writes local changes to inmation (asks for confirmation).</p>
      <h4>EAM Critical Objects</h4>
      <ul>
        <li>Select a row with the control on the left.</li>
        <li><strong>Add</strong> — create an object. For Path you can use <strong>Browse…</strong> to pick from the I/O tree or type the path manually.</li>
        <li><strong>Edit</strong> — edit the selected row (e.g. Local Contact).</li>
        <li><strong>Delete</strong> — remove the selected row from the local list (not persisted on the host until Apply).</li>
      </ul>
      <p>The table is sortable and paged. Until you click Apply, changes stay local to this session.</p>
    `,
  },
];

let wired = false;
/** While true, ignore scroll-spy so a nav click does not fight smooth scroll. */
let programmaticScroll = false;
let programmaticTimer = 0;

function renderGuideBody() {
  const nav = document.getElementById("ug-nav");
  const content = document.getElementById("ug-content");
  if (!nav || !content) return;

  nav.innerHTML = SECTIONS.map(
    (s, i) =>
      `<button type="button" class="ug-nav-btn${i === 0 ? " is-active" : ""}" data-ug-target="${s.id}">${s.title}</button>`
  ).join("");

  content.innerHTML = SECTIONS.map(
    (s) =>
      `<section class="ug-section" id="${s.id}">
        <h3>${s.title}</h3>
        ${s.html}
      </section>`
  ).join("");
}

function setActiveNav(sectionId) {
  document.querySelectorAll(".ug-nav-btn").forEach((btn) => {
    btn.classList.toggle(
      "is-active",
      btn.getAttribute("data-ug-target") === sectionId
    );
  });
}

/** Scroll offset of `el` inside `#ug-content` (not offsetTop vs wrong offsetParent). */
function sectionScrollTop(scroller, el) {
  const sRect = scroller.getBoundingClientRect();
  const eRect = el.getBoundingClientRect();
  return eRect.top - sRect.top + scroller.scrollTop;
}

function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  const scroller = document.getElementById("ug-content");
  if (!el || !scroller) return;

  setActiveNav(sectionId);
  programmaticScroll = true;
  window.clearTimeout(programmaticTimer);

  const top = Math.max(0, sectionScrollTop(scroller, el));
  scroller.scrollTo({ top, behavior: "smooth" });

  programmaticTimer = window.setTimeout(() => {
    programmaticScroll = false;
    // Snap precisely after smooth scroll (sub-pixel / layout drift)
    scroller.scrollTop = Math.max(0, sectionScrollTop(scroller, el));
    setActiveNav(sectionId);
  }, 450);
}

function updateActiveFromScroll() {
  if (programmaticScroll) return;
  const scroller = document.getElementById("ug-content");
  if (!scroller) return;

  const marker = scroller.scrollTop + 24;
  let current = SECTIONS[0]?.id;
  for (const s of SECTIONS) {
    const el = document.getElementById(s.id);
    if (!el) continue;
    if (sectionScrollTop(scroller, el) <= marker) current = s.id;
  }
  setActiveNav(current);
}

export function openUserGuide(sectionId = "ug-dashboard") {
  const modal = document.getElementById("ug-modal");
  if (!modal) return;
  modal.hidden = false;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => scrollToSection(sectionId));
  });
}

export function closeUserGuide() {
  const modal = document.getElementById("ug-modal");
  if (modal) modal.hidden = true;
}

export function initUserGuide() {
  if (wired) return;
  wired = true;
  renderGuideBody();

  document
    .querySelector(".btn-guide")
    ?.addEventListener("click", () => openUserGuide());

  document.querySelectorAll("[data-ug-close]").forEach((el) => {
    el.addEventListener("click", () => closeUserGuide());
  });

  document.getElementById("ug-nav")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".ug-nav-btn");
    if (!btn) return;
    scrollToSection(btn.getAttribute("data-ug-target"));
  });

  document
    .getElementById("ug-content")
    ?.addEventListener("scroll", updateActiveFromScroll, { passive: true });

  document.addEventListener("keydown", (e) => {
    const modal = document.getElementById("ug-modal");
    if (!modal || modal.hidden) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeUserGuide();
    }
  });
}
