/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 *
 * Removes non-authorable site shell / chrome so the import contains only
 * page-level authorable content. Every selector below was verified against
 * migration-work/cleaned.html (WKND homepage DOM).
 *
 * Header/nav and footer are migrated separately (navigation & footer
 * orchestrators), so the AEM header/footer experience-fragments are stripped
 * here.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    WebImporter.DOMUtils.remove(element, [
      // AEM header experience-fragment (wraps sign-in, language nav, header nav, search).
      // cleaned.html L5-L161: <header class="... cmp-experiencefragment--header">
      'header',
      '.cmp-experiencefragment--header',
      // AEM footer experience-fragment (footer logo, nav, social buttons, copyright).
      // cleaned.html L471-L562: <footer class="... cmp-experiencefragment--footer">
      'footer',
      '.cmp-experiencefragment--footer',
      // Utility chrome that also lives inside the header shell (explicit for intent).
      '.sign-in-buttons',        // cleaned.html L14
      '.languagenavigation',     // cleaned.html L21
      '.cmp-search--header',     // cleaned.html L134 (header search widget)
      // Mobile navigation toggle + drawer (site shell, not page content).
      '#toggleNav',              // cleaned.html L568
      '#mobileNav',              // cleaned.html L574
      // Adobe ID syncing iframe (tracking, non-authorable). cleaned.html L566
      'iframe',
      // Empty separator divider wrappers between blocks (cmp-separator cruft).
      // Targets the specific wrapper div, NOT bare <hr>, so section-transformer
      // <hr> breaks survive. cleaned.html L351, L460, L542
      '.separator',
      // Stray empty <meta> tags left inside cmp-image wrappers. cleaned.html L183, L204...
      'meta',
      // Safe leftover elements.
      'noscript',
      'link',
    ]);

    // Strip non-authorable AEM data-layer / accessibility instrumentation attributes.
    element.querySelectorAll('[data-cmp-data-layer], [data-cmp-data-layer-enabled], [data-cmp-hook-image], [data-cmp-link-accessibility-enabled], [data-cmp-link-accessibility-text]').forEach((el) => {
      el.removeAttribute('data-cmp-data-layer');
      el.removeAttribute('data-cmp-data-layer-enabled');
      el.removeAttribute('data-cmp-hook-image');
      el.removeAttribute('data-cmp-link-accessibility-enabled');
      el.removeAttribute('data-cmp-link-accessibility-text');
    });
  }
}
