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
