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

  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3, [class*="title"]');
  if (title) contentCell.push(title);

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
