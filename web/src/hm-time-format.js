/**
 * inmation / Health Monitor timestamp display:
 * 20-Jul-26 17:35:12.786
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function toEpochMs(t) {
  if (t == null || t === "") return null;
  if (typeof t === "number" && Number.isFinite(t)) {
    // seconds vs ms
    return t < 1e12 ? t * 1000 : t;
  }
  const n = Number(t);
  if (Number.isFinite(n) && String(t).trim() !== "") {
    return n < 1e12 ? n * 1000 : n;
  }
  const parsed = Date.parse(t);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatHmTimestamp(t) {
  const ms = toEpochMs(t);
  if (ms == null) return t == null ? "" : String(t);
  const d = new Date(ms);
  if (!Number.isFinite(d.getTime())) return String(t);
  return formatHmParts(d, false);
}

/** Same layout as formatHmTimestamp, using UTC components (Log Details Timestamp UTC). */
export function formatHmTimestampUtc(t) {
  const ms = toEpochMs(t);
  if (ms == null) return t == null ? "" : String(t);
  const d = new Date(ms);
  if (!Number.isFinite(d.getTime())) return String(t);
  return formatHmParts(d, true);
}

function formatHmParts(d, utc) {
  const get = utc
    ? {
        date: d.getUTCDate(),
        month: d.getUTCMonth(),
        year: d.getUTCFullYear(),
        h: d.getUTCHours(),
        m: d.getUTCMinutes(),
        s: d.getUTCSeconds(),
        ms: d.getUTCMilliseconds(),
      }
    : {
        date: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        h: d.getHours(),
        m: d.getMinutes(),
        s: d.getSeconds(),
        ms: d.getMilliseconds(),
      };
  const dd = String(get.date).padStart(2, "0");
  const mon = MONTHS[get.month];
  const yy = String(get.year).slice(-2);
  const hh = String(get.h).padStart(2, "0");
  const mi = String(get.m).padStart(2, "0");
  const ss = String(get.s).padStart(2, "0");
  const mmm = String(get.ms).padStart(3, "0");
  return `${dd}-${mon}-${yy} ${hh}:${mi}:${ss}.${mmm}`;
}
