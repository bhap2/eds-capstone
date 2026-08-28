/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs.
 * Base block: tabs (vanilla EDS Block Collection tabs)
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html (.tabs.panelcontainer .cmp-tabs)
 * Generated: 2026-08-28
 *
 * EDS tabs content model (blocks/tabs/tabs.js) — 2 columns, multiple rows:
 *   Row 1: block name (handled by createBlock)
 *   Each subsequent row = one tab:
 *     Cell 1: tab label (mandatory) — text becomes the tab button
 *     Cell 2: tab content (mandatory) — panel rich content shown when selected
 *
 * Source is an AEM Core cmp-tabs: labels live in <li.cmp-tabs__tab> inside
 * <ol.cmp-tabs__tablist>; panels are sibling <div.cmp-tabs__tabpanel> elements,
 * paired to labels by document order.
 */
export default function parse(element, { document }) {
  // Tab labels (in document order).
  const tabs = Array.from(
    element.querySelectorAll('.cmp-tabs__tablist .cmp-tabs__tab'),
  );

  // Tab panels (in document order). Pair with labels by index.
  const panels = Array.from(
    element.querySelectorAll('.cmp-tabs__tabpanel'),
  );

  const cells = [];

  const count = Math.max(tabs.length, panels.length);
  for (let i = 0; i < count; i += 1) {
    const tab = tabs[i];
    const panel = panels[i];

    // Cell 1: label text. Wrap in a <p> so the label text survives as content.
    const labelText = tab ? (tab.textContent || '').trim() : '';
    const labelCell = document.createElement('p');
    labelCell.textContent = labelText;

    // Cell 2: panel rich content. Prefer the content-fragment body (holds the
    // real paragraphs, lists and images); fall back to the whole panel.
    let contentSource = null;
    if (panel) {
      contentSource = panel.querySelector('.cmp-contentfragment__elements')
        || panel.querySelector('.contentfragment')
        || panel;
    }

    // Collect meaningful content nodes (skip empty AEM grid scaffolding).
    const contentCell = [];
    if (contentSource) {
      const nodes = Array.from(
        contentSource.querySelectorAll('p, ul, ol, img'),
      );
      nodes.forEach((node) => {
        // Skip nodes already covered by an ancestor we added.
        const covered = contentCell.some((added) => added.contains(node));
        if (covered) return;
        // Skip empty paragraphs (AEM grid scaffolding leaves blanks).
        if (node.tagName === 'P' && !(node.textContent || '').trim() && !node.querySelector('img')) return;
        contentCell.push(node);
      });
      // Fallback: if nothing extracted, take the raw content source children.
      if (!contentCell.length) {
        contentCell.push(...Array.from(contentSource.childNodes));
      }
    }

    // Only add a row if there is a label or content.
    if (labelText || contentCell.length) {
      cells.push([labelCell, contentCell.length ? contentCell : '']);
    }
  }

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs', cells });
  element.replaceWith(block);
}
