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
  const dd = String(d.getDate()).padStart(2, "0");
  const mon = MONTHS[d.getMonth()];
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const mmm = String(d.getMilliseconds()).padStart(3, "0");
  return `${dd}-${mon}-${yy} ${hh}:${mi}:${ss}.${mmm}`;
}
