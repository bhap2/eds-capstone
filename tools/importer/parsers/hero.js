/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero.
 * Base block: hero
 * Source: https://wknd.site/us/en.html (.cmp-teaser--imagebottom)
 * Generated: 2026-08-28
 *
 * Block library structure (1 column, 3 rows):
 *   Row 1: block name (handled by createBlock)
 *   Row 2: single cell — background image (optional)
 *   Row 3: single cell — title (heading), subheading (text), CTA (link)
 *
 * Source is a full-bleed AEM Core teaser: a content block (title/description/
 * action) plus an image block.
 */
export default function parse(element, { document }) {
  // Background image.
  const image = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  // Text content.
  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3, [class*="title"]');
  const description = element.querySelector('.cmp-teaser__description, [class*="description"]');
  const cta = element.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a');

  // Empty-block guard.
  if (!title && !description && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image (only if present).
  if (image) cells.push([image]);

  // Row 3: single cell holding all text content.
  const contentCell = [];
  if (title) contentCell.push(title);
  if (description) contentCell.push(description);
  if (cta) contentCell.push(cta);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
