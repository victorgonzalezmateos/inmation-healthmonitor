/**
 * Health Monitor Report certificates via app-reportviewer.
 * Shared by Reports and Issues & Alerts.
 */

import { fetchReportData } from "./inmation.js";
import { siteLabelFromRow } from "./hm-live.js";

export const HM_REPORT_PATH =
  "/System/Core/_Global Core Logic/System Monitoring/Report/Health Monitor/Health Monitor Report";

export function certExpiryDays(row) {
  const n = Number(row?.expiresIn);
  if (Number.isFinite(n)) return n;
  if (row?.validTo) {
    const t = new Date(row.validTo).getTime();
    if (!Number.isNaN(t)) {
      return Math.ceil((t - Date.now()) / (24 * 60 * 60 * 1000));
    }
  }
  return null;
}

/** Expired or expiring within 30 days. */
export function filterExpiringCerts(rows) {
  return (rows || []).filter((r) => {
    const d = certExpiryDays(r);
    return d != null && d < 30;
  });
}

/**
 * Expired → red class. 15–30 → warn class.
 * Under 15 → inline yellow→red blend.
 */
export function certRowAppearance(days) {
  if (!Number.isFinite(days)) return { cls: "", style: "" };
  if (days < 0) return { cls: "is-bad", style: "" };
  if (days >= 15) return { cls: "is-warn", style: "" };
  const t = Math.min(1, Math.max(0, 1 - days / 15));
  const r = Math.round(255 + (254 - 255) * t);
  const g = Math.round(251 + (226 - 251) * t);
  const b = Math.round(235 + (226 - 235) * t);
  return {
    cls: "is-cert-urgent",
    style: `background-color: rgb(${r},${g},${b})`,
  };
}

export function parseCertificatesXml(xmlStr) {
  const doc = new DOMParser().parseFromString(xmlStr, "text/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("Invalid report XML");
  }
  return [...doc.getElementsByTagName("Certificates")].map((el) => {
    const o = {};
    for (const child of el.children) {
      o[child.tagName] = child.textContent ?? "";
    }
    return o;
  });
}

function formatValidTo(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Map raw certificate rows → Issues & Alerts list rows
 * (expired / &lt;30 days only).
 */
export function certificatesToIssueRows(rawRows, now = Date.now()) {
  return filterExpiringCerts(rawRows)
    .map((r) => {
      const days = certExpiryDays(r);
      const expired = Number.isFinite(days) && days < 0;
      const { cls, style } = certRowAppearance(days);
      const site = siteLabelFromRow({
        name: r.name,
        path: r.path,
        ObjectName: r.name,
        Path: r.path,
      });
      const validMs = r.validTo ? new Date(r.validTo).getTime() : NaN;
      return {
        id: `cert:${r.path || r.name || Math.random()}`,
        path: r.path || "",
        time: formatValidTo(r.validTo),
        timeMs: Number.isFinite(validMs) ? validMs : 0,
        severity: expired ? "High" : "Medium",
        site,
        component: r.name || "—",
        type: "Certificate",
        message: expired
          ? `Expired ${Math.abs(days)} day(s) ago`
          : `Expires in ${days} day(s)`,
        status: expired ? "Expired" : "Expiring",
        duration: Number.isFinite(days)
          ? expired
            ? `${Math.abs(days)} d overdue`
            : `${days} d left`
          : "—",
        durationMs: Number.isFinite(days) ? days : 9999,
        daysLeft: days,
        rowClass: cls,
        rowStyle: style,
        health: expired ? "bad" : "warning",
        _now: now,
      };
    })
    .sort(
      (a, b) =>
        (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999) ||
        String(a.site).localeCompare(String(b.site))
    );
}

/**
 * Fetch HM Report certificates (XML only) and return Issues rows.
 */
export async function fetchExpiringCertificateIssues(options = {}) {
  const report = await fetchReportData(HM_REPORT_PATH, "Report", {
    omitReportDesign: true,
    signal: options.signal,
  });
  const xml = report?.data;
  if (!xml || typeof xml !== "string") {
    throw new Error("reportdata: missing report.data XML");
  }
  const raw = parseCertificatesXml(xml);
  return {
    raw,
    issues: certificatesToIssueRows(raw),
  };
}
