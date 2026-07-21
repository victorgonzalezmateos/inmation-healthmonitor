/**
 * Trend series helpers for Health Monitor Performance Counters → Chart.
 */

import {
  DEFAULT_PERIOD,
  estimatePointsForPeriod,
  periodDurationMs,
  resolvePeriodInstant,
} from "./hm-chart-period.js";
import { formatHmTimestamp } from "./hm-time-format.js";

const PEN_COLORS = [
  "#00bcff",
  "#89d329",
  "#10384f",
  "#dc2626",
  "#ca8a04",
  "#7c3aed",
  "#0891b2",
  "#ea580c",
];

function timeSeriesForPeriod(period) {
  const ms = periodDurationMs(period);
  const pointCount = estimatePointsForPeriod(period);
  const stepMs = ms / Math.max(1, pointCount - 1);
  const end = resolvePeriodInstant(period.end || "*").getTime();
  const start = end - ms;
  const times = [];
  const labels = [];
  for (let i = 0; i < pointCount; i++) {
    const t = start + i * stepMs;
    times.push(t);
    labels.push(formatHmTimestamp(t));
  }
  return { labels, times, pointCount };
}

function seedFrom(str) {
  let s = 0;
  for (const c of String(str)) s = (s + c.charCodeAt(0) * 17) % 2147483647;
  return s || 1;
}

/**
 * Mock / offline fallback series anchored on current Value.
 * @param {Array} rows
 * @param {object} [period]
 */
export function buildSeriesFromSelectedCounters(rows, period = DEFAULT_PERIOD) {
  const { labels, times, pointCount } = timeSeriesForPeriod(period);
  const pens = (rows || []).map((c, i) => {
    const key = c.path || c.penName || c.ObjectName || String(i);
    let seed = seedFrom(key);
    const rnd = () => {
      seed = (seed * 16807 + 7) % 2147483647;
      return (seed % 1000) / 1000;
    };
    const base = Number(c.Value);
    const baseN = Number.isFinite(base) ? base : 0;
    let v = baseN * (0.85 + rnd() * 0.1);
    const values = [];
    for (let t = 0; t < pointCount; t++) {
      const drift = (rnd() - 0.48) * (Math.abs(baseN) * 0.04 + 0.5);
      v = Math.max(0, v + drift);
      const blend = t / Math.max(1, pointCount - 1);
      values.push(+(v * (1 - blend) + baseN * blend).toFixed(3));
    }
    return {
      name: c.penName || c.ObjectName || `Pen ${i + 1}`,
      unit: c.Unit || "",
      penName: c.penName,
      path: c.path,
      color: PEN_COLORS[i % PEN_COLORS.length],
      values,
      current: c.Value,
    };
  });
  return {
    labels,
    times,
    pens,
    empty: !pens.length,
    period: { ...period },
  };
}
