/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns.
 * Base block: columns
 * Source: https://wknd.site/us/en.html (.cmp-teaser--featured)
 * Generated: 2026-08-28
 *
 * Block library structure (multiple columns/rows; column count based on the
 * natural visual grouping of the content):
 *   Row 1: block name (handled by createBlock)
 *   Row 2: one cell per column.
 *
 * Source is a featured AEM Core teaser rendered side-by-side: a text content
 * column (pretitle, title, description, CTA) and an image column.
 * => a single 2-column content row.
 */
export default function parse(element, { document }) {
  // --- Definition-list variant (adventure-detail meta) ---
  // The adventure-detail template reuses this parser for the content-fragment
  // metadata, which is a <dl> of label/value pairs (Activity/Surfing, Trip
  // Length/6 Days, Price/5000.0, …) rather than a featured teaser. Emit one
  // block row per pair: [label, value]. Without this the teaser logic below
  // finds no .cmp-teaser__* nodes and the whole meta is dropped.
  const isDefinitionList = element.tagName === 'DL'
    || element.matches?.('dl, .cmp-contentfragment__elements')
    || element.querySelector(':scope > .cmp-contentfragment__element, :scope dt');
  if (isDefinitionList) {
    const pairs = [];
    // Pairs may be wrapped (…__element > dt+dd) or bare dt/dd siblings.
    const wrappers = element.querySelectorAll('.cmp-contentfragment__element, dl > div');
    const scopes = wrappers.length ? [...wrappers] : [element];
    scopes.forEach((scope) => {
      const dts = [...scope.querySelectorAll('dt, .cmp-contentfragment__element-title')];
      const dds = [...scope.querySelectorAll('dd, .cmp-contentfragment__element-value')];
      dts.forEach((dt, i) => {
        const label = (dt.textContent || '').trim();
        const value = ((dds[i] && dds[i].textContent) || '').trim();
        if (label) pairs.push([label, value]);
      });
    });
    if (pairs.length) {
      const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells: pairs });
      element.replaceWith(block);
      return;
    }
    // no pairs found — unwrap rather than emit an empty block
    element.replaceWith(...element.childNodes);
    return;
  }

  // Text content column.
  const contentCell = [];
  const pretitle = element.querySelector('.cmp-teaser__pretitle, [class*="pretitle"]');
  if (pretitle) contentCell.push(pretitle);

  // Note: avoid a broad [class*="title"] match — it also catches
  // .cmp-teaser__pretitle (substring "title") and querySelector returns the
  // earliest DOM match, clobbering the real title with the eyebrow text.
  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  if (title && (title.textContent || '').trim()) {
    // Rebuild as a clean heading so whitespace-only text nodes / wrapper markup
    // in the source don't cause the title to be dropped during md conversion.
    const tag = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h2';
    const heading = document.createElement(tag);
    heading.textContent = (title.textContent || '').trim();
    contentCell.push(heading);
  }

  const description = element.querySelector('.cmp-teaser__description, [class*="description"]');
  if (description) contentCell.push(description);

  const cta = element.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a');
  if (cta) contentCell.push(cta);

  // Image column.
  const image = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  // Empty-block guard.
  if (!contentCell.length && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[contentCell, image || '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
