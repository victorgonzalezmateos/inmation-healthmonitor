/**
 * Health Monitor–style time period (relative * tokens + absolute ISO).
 */

export const DEFAULT_PERIOD = {
  start: "*-1h",
  end: "*",
  intervals: 60,
};

/** Parse inmation-style relative time like *-1h, *-1d, * into Date. */
export function resolvePeriodInstant(token, now = Date.now()) {
  const raw = String(token ?? "*").trim();
  if (!raw || raw === "*") return new Date(now);

  const m = raw.match(/^\*\s*-\s*(\d+)\s*([smhd])$/i);
  if (m) {
    const n = Number(m[1]);
    const u = m[2].toLowerCase();
    const mult =
      u === "s" ? 1000 : u === "m" ? 60_000 : u === "h" ? 3_600_000 : 86_400_000;
    return new Date(now - n * mult);
  }

  const abs = Date.parse(raw);
  if (Number.isFinite(abs)) return new Date(abs);
  return new Date(now);
}

export function periodDurationMs(period, now = Date.now()) {
  const start = resolvePeriodInstant(period.start, now).getTime();
  const end = resolvePeriodInstant(period.end, now).getTime();
  return Math.max(60_000, end - start);
}

export function lengthPartsFromMs(ms) {
  let rem = Math.max(0, Math.floor(ms));
  const d = Math.floor(rem / 86_400_000);
  rem -= d * 86_400_000;
  const h = Math.floor(rem / 3_600_000);
  rem -= h * 3_600_000;
  const m = Math.floor(rem / 60_000);
  rem -= m * 60_000;
  const s = Math.floor(rem / 1000);
  rem -= s * 1000;
  return { d, h, m, s, ms: rem };
}

export function msFromLengthParts({ d = 0, h = 0, m = 0, s = 0, ms = 0 }) {
  return (
    Number(d) * 86_400_000 +
    Number(h) * 3_600_000 +
    Number(m) * 60_000 +
    Number(s) * 1000 +
    Number(ms)
  );
}

export function formatPeriodSummary(period) {
  const start = period?.start || DEFAULT_PERIOD.start;
  const end = period?.end || DEFAULT_PERIOD.end;
  const intervals = period?.intervals ?? DEFAULT_PERIOD.intervals;
  return `${start}  →  ${end}  ·  ${intervals} intervals`;
}

export function toDatetimeLocalValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value) {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? new Date(t) : null;
}

/** Estimate series point count from duration + intervals. */
export function estimatePointsForPeriod(period) {
  const intervals = Math.max(2, Number(period.intervals) || 60);
  return intervals;
}

export function periodToApiTimes(period, now = Date.now()) {
  const startTok = String(period.start || "*").trim();
  const endTok = String(period.end || "*").trim();
  const intervalsNo = Math.max(2, Number(period.intervals) || 60);

  const startIsRel = startTok === "*" || /^\*\s*-/.test(startTok);
  const endIsRel = endTok === "*" || /^\*\s*-/.test(endTok);

  return {
    relative: {
      start_time: startIsRel ? startTok : resolvePeriodInstant(startTok, now).toISOString(),
      end_time: endIsRel ? endTok : resolvePeriodInstant(endTok, now).toISOString(),
      intervals_no: intervalsNo,
    },
    absolute: {
      start_time: resolvePeriodInstant(startTok, now).toISOString(),
      end_time: resolvePeriodInstant(endTok, now).toISOString(),
      intervals_no: intervalsNo,
    },
    ms: periodDurationMs(period, now),
  };
}

export const PRESET_PERIODS = {
  "1h": { start: "*-1h", end: "*", intervals: 60, label: "Last 1 hour" },
  "8h": { start: "*-8h", end: "*", intervals: 96, label: "Last 8 hours" },
  "1d": { start: "*-1d", end: "*", intervals: 100, label: "Last 1 day" },
  "7d": { start: "*-7d", end: "*", intervals: 84, label: "Last 7 days" },
};
