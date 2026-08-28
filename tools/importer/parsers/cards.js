/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards (two variants: image-list grid + no-image cmp-list).
 * Base block: cards
 * Source: https://wknd.site/us/en.html (.image-list.list)
 * Generated: 2026-08-28
 *
 * Block library structure (2 columns, multiple rows):
 *   Row 1: block name (handled by createBlock)
 *   Each subsequent row = one card:
 *     Cell 1: image (mandatory)
 *     Cell 2: text content (title heading/link, description, optional CTA)
 *
 * Source is an AEM Core image-list: each <li.cmp-image-list__item> holds an
 * image link, a title link, and a description.
 */
export default function parse(element, { document }) {
  // Variant B: "Cards (no images)" — AEM cmp-list (e.g. .cmp-list--upnext).
  // Each <li.cmp-list__item> is a linked title + date, no thumbnail. Emit a
  // single-column card (linked heading + date paragraph).
  const listItems = Array.from(element.querySelectorAll('.cmp-list__item'));
  if (listItems.length) {
    const cells = [];
    listItems.forEach((item) => {
      const link = item.querySelector('.cmp-list__item-link, a');
      const title = item.querySelector('.cmp-list__item-title, [class*="title"]');
      const date = item.querySelector('.cmp-list__item-date, [class*="date"]');
      const content = [];
      const titleText = title ? (title.textContent || '').trim() : (link ? (link.textContent || '').trim() : '');
      if (titleText) {
        const heading = document.createElement('h3');
        if (link && link.getAttribute('href')) {
          const a = document.createElement('a');
          a.href = link.getAttribute('href');
          a.textContent = titleText;
          heading.append(a);
        } else {
          heading.textContent = titleText;
        }
        content.push(heading);
      }
      if (date && (date.textContent || '').trim()) {
        const p = document.createElement('p');
        p.textContent = (date.textContent || '').trim();
        content.push(p);
      }
      if (content.length) cells.push([content]);
    });
    if (cells.length) {
      const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
      element.replaceWith(block);
      return;
    }
  }

  // Variant A: image-list grid (homepage / listings). Each list item is a card
  // with an image + text content.
  const items = Array.from(
    element.querySelectorAll('.cmp-image-list__item, li'),
  );

  const cells = [];

  items.forEach((item) => {
    // Image cell (mandatory). Use the raw <img> so the importer localizes it.
    const image = item.querySelector('.cmp-image-list__item-image img, .cmp-image img, img');

    // Text content cell.
    const contentCell = [];

    // Title: prefer the title link (preserves the destination href) so the
    // card remains clickable; fall back to the plain title span.
    const titleLink = item.querySelector('.cmp-image-list__item-title-link');
    const titleText = item.querySelector('.cmp-image-list__item-title, [class*="title"]');
    if (titleLink) {
      const title = titleText ? (titleText.textContent || '').trim() : (titleLink.textContent || '').trim();
      const heading = document.createElement('h3');
      const link = document.createElement('a');
      link.href = titleLink.getAttribute('href');
      link.textContent = title;
      heading.append(link);
      contentCell.push(heading);
    } else if (titleText) {
      const heading = document.createElement('h3');
      heading.textContent = (titleText.textContent || '').trim();
      contentCell.push(heading);
    }

    const description = item.querySelector('.cmp-image-list__item-description, [class*="description"]');
    if (description) {
      const p = document.createElement('p');
      p.textContent = (description.textContent || '').trim();
      contentCell.push(p);
    }

    if (image || contentCell.length) {
      cells.push([image || '', contentCell]);
    }
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
