/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq.
 * Base block: accordion (vanilla Block Collection accordion)
 * Source: https://wknd.site/us/en/faqs.html (.cmp-accordion)
 * Generated: 2026-08-28
 *
 * accordion-faq content model (blocks/accordion-faq/accordion-faq.js) —
 * 2 columns, multiple rows:
 *   Row 1: block name (handled by createBlock)
 *   Each subsequent row = one accordion item:
 *     Cell 1: title/question (mandatory) — becomes the <summary> label
 *     Cell 2: content/answer (mandatory) — becomes the <details> body
 *
 * Source is an AEM Core cmp-accordion: each <div.cmp-accordion__item> holds a
 * <span.cmp-accordion__title> (question) and a <div.cmp-accordion__panel>
 * whose <div.cmp-text> holds the answer paragraph(s).
 */
export default function parse(element, { document }) {
  // Each accordion item is one row.
  const items = Array.from(
    element.querySelectorAll('.cmp-accordion__item'),
  );

  const cells = [];

  items.forEach((item) => {
    // Cell 1: question/title. Prefer the dedicated title span; fall back to the
    // header/button text.
    const titleEl = item.querySelector('.cmp-accordion__title')
      || item.querySelector('.cmp-accordion__header, .cmp-accordion__button');
    const titleText = titleEl ? (titleEl.textContent || '').trim() : '';
    const summaryCell = document.createElement('p');
    summaryCell.textContent = titleText;

    // Cell 2: answer content. Prefer the rich text inside the panel; fall back
    // to the whole panel.
    const panel = item.querySelector('.cmp-accordion__panel');
    let contentSource = null;
    if (panel) {
      contentSource = panel.querySelector('.cmp-text') || panel;
    }

    const contentCell = [];
    if (contentSource) {
      const nodes = Array.from(
        contentSource.querySelectorAll('p, ul, ol, h1, h2, h3, h4, h5, h6, img'),
      );
      nodes.forEach((node) => {
        const covered = contentCell.some((added) => added.contains(node));
        if (covered) return;
        // Skip empty elements (AEM leaves blank headings/paragraphs behind).
        if (!(node.textContent || '').trim() && !node.querySelector('img') && node.tagName !== 'IMG') return;
        contentCell.push(node);
      });
      // Fallback: raw text if no structured nodes found.
      if (!contentCell.length) {
        const text = (contentSource.textContent || '').trim();
        if (text) {
          const p = document.createElement('p');
          p.textContent = text;
          contentCell.push(p);
        }
      }
    }

    if (titleText || contentCell.length) {
      cells.push([summaryCell, contentCell.length ? contentCell : '']);
    }
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
