# Smart Sentinel · User Guide

In-app guide: click the green **User Guide** button in the top bar.  
This file mirrors that content for GitHub readers.

Requires Windows IWA reachability to the plant Web API host when running live.

---

## Dashboard

**What it is for:** a global view of inmation fleet health. At a glance you see the health score, the split across Good / Problems / Warnings / Unknown / Disabled, and status by site.

### Filters

- **Time range** — sets the window for the *Issues Over Time* chart (e.g. last day / week / month).
- **Site** — filters KPIs, tables, and charts to one site (or All / Global).
- **Auto refresh** — reloads data every 5 minutes while this page is visible.

### KPIs

- **Health Score** — percentage of Good objects (doughnut).
- **Total Components / Sites** — size of the filtered fleet.
- **Good, Problems, Warnings, Unknown, Disabled** — counts by health class from inmation state flags.

### Components by Site

Chart of component counts per site. Use it to see where the fleet is concentrated.

### Active Critical Issues

Table of objects in Problem state. Sort by column headers and page with First / Previous / Page / Next / Last.

### Site Summary

Per-site summary: health score and G / P / W / U / D counts. Sortable and paged.

### Issues Over Time

Problem trend over time for the selected Time range.

---

## Health Monitor

**What it is for:** an operator console close to the DataStudio Health Monitor. Browse objects, read properties, and work with performance counters, chart, and values.

### Navigation

Use this panel to open the inmation tree (I/O Model / Server Model) and select an object. The two buttons at the top switch between:

- **Tree** — hierarchical tree (expand/collapse with ▸/▾).
- **List** — flat table of objects (Name, Type, Object, Comm.), sortable and paged.

### Object Properties

When you select an object, this panel shows its properties.

### Performance Counters

The right-hand panel shows the performance counters for the selected object. You can:

- Select one or more counters (checkbox) and click **Submit** to load them into the chart / values views.
- Switch views with the header icons: **counters table**, **trend chart**, or **values table**.
- In chart and values, use **maximize / restore** to fill almost the whole screen.
- In the chart, open **Time Period Settings** to set Start / End, Length, and Max. rows (same idea as DataStudio).

---

## Health Overview

**What it is for:** operational lists of everything that is not Good, plus connector certificates that are expired or about to expire.

### Site filter

Filters all four panels to one site (includes Global when the path does not match Bayer naming).

### Problems

Objects in Problem (Bad) state. Columns: Severity, Site, Component, Type, Message. Sort by clicking a header and move with the pager.

### Warnings

Same layout for objects in Warning state.

### Unknown & Disabled

Unknown objects (e.g. relays with empty state) and Disabled / powered-off objects.

### Connector Certificates

Certificates from the Health Monitor Report that are expired or expire within 30 days. Row color shows urgency (red / yellow; more critical under 15 days). Columns include Valid to, Status, and Expires.

---

## Trends

**What it is for:** view saved historical trend pens for an object over a selected time range.

> This page is **under development**. The layout is already in place; live content will follow.

### Time range

Top selector (1d, 7d, 1m, 2m) for the trend window.

### Navigation

Tree on the left to pick the object whose trend you want to see.

### Trend

Right panel with the chart and pen legend when data is available.

---

## Diagnostics

**What it is for:** drill from site / type / severity down to a specific object and review its Error / Warning logs from the last 24 hours.

### Filters

- **Site / Type / Severity** — narrow the Hierarchy health table.
- **Show non-Good only** — hides Good objects (on by default).

### Hierarchy health

Object table with Site, Component, Type, Worst State, Score, and Message. Sortable and paged. Selecting a row loads that object’s logs on the right.

### Recent Logs (Last 24h)

- Lists Timestamp (UTC), Severity, and Message for Error / Warning logs.
- **Double-click** a row to open *Log Details* (Name / Value sections like DataStudio), with arrow navigation between logs and Copy / Close.
- The header **maximize / restore** button expands the logs panel to almost full screen (Esc restores).

---

## Reports

**What it is for:** view the host Health Monitor Report (inventory, datasources, certificates) rendered inside Smart Sentinel — not Stimulsoft.

### Filters and actions

- **Site** — filters report tables by site.
- **State** — defaults to *Not Good* (hides Good). Also All / Bad / Warning / Disabled / Good.
- **Reload** — fetches the report from the host again.
- **Open Report** — opens the report on the host / WebStudio in a new tab.

### Report content

Health doughnuts, inventory / datasource tables, and certificates. Tables are sortable and paged. If everything is Good for the current filter, you see the green “all Good” message.

---

## Configuration

**What it is for:** manage the *EAM Critical Objects* list (path, type, standby, local contact) and apply changes to the host.

### Filters

**Site** and **Type** filter the local table. **Reload** reloads from the host. **Apply** writes local changes to inmation (asks for confirmation).

### EAM Critical Objects

- Select a row with the control on the left.
- **Add** — create an object. For Path you can use **Browse…** to pick from the I/O tree or type the path manually.
- **Edit** — edit the selected row (e.g. Local Contact).
- **Delete** — remove the selected row from the local list (not persisted on the host until Apply).

The table is sortable and paged. Until you click Apply, changes stay local to this session.
