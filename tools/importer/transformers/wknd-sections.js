/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section breaks + Section Metadata.
 *
 * Homepage template has 5 sections (page-templates.json). Inserts a <hr>
 * before each non-first section and a "Section Metadata" block after each
 * section that carries a style. Only the "featured-teaser" section is styled
 * ("grey"); all others have style: null.
 *
 * Section boundary selectors come from page-templates.json (DOM-verified in
 * page analysis) and are stored as arrays there, so they are normalized to a
 * comma-joined string here. Two sections (recent-articles, adventures-grid)
 * share the identical selector ".image-list.list" — there are two matching
 * elements in the DOM — so resolution tracks already-used nodes to avoid
 * anchoring both sections to the same element.
 *
 * Uses BOTH hooks per the reference implementation: breaks are inserted in
 * beforeTransform (while every section element still exists, before parsers
 * call replaceWith) and metadata is inserted in afterTransform, anchored to a
 * marker <hr>. Sections are processed in reverse so live-element inserts never
 * disturb not-yet-processed sections. Bare <hr> is inserted (never a wrapper
 * div), so it does not affect any parser's :nth-of-type selectors, and the
 * cleanup transformer only removes ".separator" wrappers, not bare <hr>.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// page-templates.json stores selectors as arrays; normalize to a query string.
function selectorFor(section) {
  const sel = section.selector;
  if (Array.isArray(sel)) return sel.join(', ');
  return sel;
}

// Resolve a section's boundary element, skipping nodes already claimed by an
// earlier-resolved section (handles duplicate selectors like .image-list.list).
// Processing runs in reverse, so prefer the LAST unused DOM match.
function resolveElement(element, selector, used) {
  const matches = Array.from(element.querySelectorAll(selector));
  for (let j = matches.length - 1; j >= 0; j -= 1) {
    if (!used.has(matches[j])) return matches[j];
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload.template && payload.template.sections) || [];

  if (hookName === TransformHook.beforeTransform) {
    const used = new Set();
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const sectionEl = resolveElement(element, selectorFor(section), used);
      if (!sectionEl) continue; // selector didn't match on this page — skip, never guess
      used.add(sectionEl);

      // First section gets no leading break unless it is styled (would need a
      // metadata anchor marker); featured-teaser is section index 1, so the
      // first section (hero-carousel) is unstyled and correctly skipped.
      if (i === 0 && !section.style) continue;

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === TransformHook.afterTransform) {
    const used = new Set();
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || resolveElement(element, selectorFor(section), used);
      if (!anchor) continue; // neither survived — skip, never guess
      used.add(anchor);

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // first section never keeps a leading break
      }
    }
  }
}
