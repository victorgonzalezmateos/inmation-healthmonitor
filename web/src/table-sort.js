/**
 * Shared sortable-table helpers (use for any new table going forward).
 */

/**
 * @param {unknown} av
 * @param {unknown} bv
 * @param {number} dir 1 | -1
 */
export function compareSortValues(av, bv, dir = 1) {
  const aEmpty = av == null || String(av).trim() === "";
  const bEmpty = bv == null || String(bv).trim() === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  const an = Number(av);
  const bn = Number(bv);
  if (
    String(av).trim() !== "" &&
    String(bv).trim() !== "" &&
    Number.isFinite(an) &&
    Number.isFinite(bn)
  ) {
    return dir * (an - bn);
  }

  return (
    dir *
    String(av).localeCompare(String(bv), undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
}

/**
 * @template T
 * @param {T[]} rows
 * @param {string} key
 * @param {number} dir
 * @param {(row: T, key: string) => unknown} [getValue]
 */
export function sortRowsBy(rows, key, dir = 1, getValue) {
  const getter =
    getValue ||
    ((row, k) => (row && typeof row === "object" ? row[k] : undefined));
  return [...(rows || [])].sort((a, b) =>
    compareSortValues(getter(a, key), getter(b, key), dir)
  );
}

/**
 * Toggle sort state: same key flips dir; new key starts ascending.
 * @param {{ key: string, dir: number }} current
 * @param {string} nextKey
 */
export function nextSortState(current, nextKey) {
  if (current?.key === nextKey) {
    return { key: nextKey, dir: current.dir * -1 };
  }
  return { key: nextKey, dir: 1 };
}

/**
 * Update header button labels with ▲/▼ for active column.
 * @param {ParentNode} root
 * @param {string} attrName e.g. "data-cfg-sort"
 * @param {{ key: string, dir: number }} sort
 */
export function paintSortHeaders(root, attrName, sort) {
  root.querySelectorAll(`th[${attrName}]`).forEach((th) => {
    const key = th.getAttribute(attrName);
    const btn = th.querySelector(".hm-sort-btn");
    if (!btn || !key) return;
    const label = btn.dataset.label || btn.textContent.replace(/\s*[▲▼]\s*$/, "").trim();
    btn.dataset.label = label;
    const active = key === sort.key;
    th.classList.toggle("is-sorted", active);
    btn.textContent = active
      ? `${label} ${sort.dir === 1 ? "▲" : "▼"}`
      : label;
  });
}
