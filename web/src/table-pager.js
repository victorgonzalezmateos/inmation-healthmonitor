/**
 * Shared First / Previous / Page input / Next / Last pager helpers.
 */

export function pageCount(total, pageSize) {
  const size = Math.max(1, Number(pageSize) || 15);
  return Math.max(1, Math.ceil(Math.max(0, total) / size));
}

export function clampPage(page1Based, total, pageSize) {
  const pages = pageCount(total, pageSize);
  const n = Number(page1Based);
  if (!Number.isFinite(n)) return 1;
  return Math.min(pages, Math.max(1, Math.floor(n)));
}

export function sliceRows(rows, page1Based, pageSize) {
  const list = Array.isArray(rows) ? rows : [];
  const page = clampPage(page1Based, list.length, pageSize);
  const size = Math.max(1, Number(pageSize) || 15);
  const start = (page - 1) * size;
  return {
    page,
    pages: pageCount(list.length, size),
    total: list.length,
    slice: list.slice(start, start + size),
  };
}

/**
 * Update a full pager (First · Previous · Page [n] of N · Next · Last).
 * @param {{
 *   pager?: HTMLElement | null,
 *   first?: HTMLElement | null,
 *   prev?: HTMLElement | null,
 *   next?: HTMLElement | null,
 *   last?: HTMLElement | null,
 *   pageInput?: HTMLInputElement | null,
 *   pageOf?: HTMLElement | null,
 * }} els
 * @param {{ page: number, pages: number, total: number, pageSize: number }} state
 */
export function updateFullPager(els, state) {
  const { page, pages, total, pageSize } = state;
  const show = total > pageSize;
  if (els.pager) els.pager.hidden = !show;

  if (els.pageInput) {
    els.pageInput.max = String(Math.max(1, pages));
    els.pageInput.value = String(page);
  }
  if (els.pageOf) {
    els.pageOf.textContent =
      total === 0 ? "of 0" : `of ${pages} · ${total} total`;
  }

  const atStart = page <= 1 || total === 0;
  const atEnd = page >= pages || total === 0;
  if (els.first) els.first.disabled = atStart;
  if (els.prev) els.prev.disabled = atStart;
  if (els.next) els.next.disabled = atEnd;
  if (els.last) els.last.disabled = atEnd;
}

/** Build markup for a full pager (caller inserts into DOM). */
export function fullPagerHtml({
  pagerId,
  firstAttr,
  prevAttr,
  nextAttr,
  lastAttr,
  inputId,
  inputAttr,
  ofId,
  ariaLabel = "Page",
}) {
  return `<div class="hm-values-pager" id="${pagerId}" hidden>
  <button type="button" class="hm-pager-btn" ${firstAttr} title="First page">First</button>
  <button type="button" class="hm-pager-btn" ${prevAttr}>Previous</button>
  <label class="hm-values-page-jump">
    Page
    <input
      id="${inputId}"
      class="hm-values-page-input"
      type="number"
      min="1"
      value="1"
      title="Go to page"
      aria-label="${ariaLabel}"
      ${inputAttr}
    />
    <span id="${ofId}" class="hm-values-page-of">of 1</span>
  </label>
  <button type="button" class="hm-pager-btn" ${nextAttr}>Next</button>
  <button type="button" class="hm-pager-btn" ${lastAttr} title="Last page">Last</button>
</div>`;
}
