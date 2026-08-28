/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel.
 * Base block: carousel
 * Source: https://wknd.site/us/en.html (.cmp-carousel--hero)
 * Generated: 2026-08-28
 *
 * Block library structure (2 columns, multiple rows):
 *   Row 1: block name (handled by createBlock)
 *   Each subsequent row = one slide:
 *     Cell 1: image (mandatory)
 *     Cell 2: text content (title heading, description, CTA link)
 *
 * Source is an AEM Core carousel: each .cmp-carousel__item holds a
 * .cmp-teaser with a content block (title/description/action) and an image block.
 */
export default function parse(element, { document }) {
  // Each slide is a carousel item. Fallback to teaser panels if class differs.
  const slides = Array.from(
    element.querySelectorAll('.cmp-carousel__item, [class*="carousel__item"]'),
  );

  const cells = [];

  slides.forEach((slide) => {
    // Image cell (mandatory).
    const image = slide.querySelector('.cmp-teaser__image img, .cmp-image img, img');

    // Text content cell.
    const contentCell = [];
    const title = slide.querySelector('.cmp-teaser__title, h1, h2, h3, [class*="title"]');
    if (title) contentCell.push(title);

    const description = slide.querySelector('.cmp-teaser__description, [class*="description"]');
    if (description) contentCell.push(description);

    const cta = slide.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a, a');
    if (cta) contentCell.push(cta);

    // Only add a slide row if it has at least an image or text content.
    if (image || contentCell.length) {
      cells.push([image || '', contentCell]);
    }
  });

  // Empty-block guard: nothing extracted, unwrap the element.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel', cells });
  element.replaceWith(block);
}
