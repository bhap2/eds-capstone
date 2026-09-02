import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
  readBlockConfig,
} from './aem.js';

/**
 * Applies section metadata as classes/styles on the parent section.
 * This project's vendored aem.js `decorateSections` omits the standard
 * `.section-metadata` handling, so we process it here before sections are
 * decorated. Each `.section-metadata` block's rows become section-scoped:
 * a `style` key adds space-separated classes; other keys become data-*.
 * @param {Element} main The main container element
 */
function decorateSectionMetadata(main) {
  main.querySelectorAll(':scope > div > div.section-metadata').forEach((meta) => {
    const section = meta.parentElement;
    if (!section) return;
    const config = readBlockConfig(meta);
    Object.entries(config).forEach(([key, value]) => {
      if (!value) return;
      if (key === 'style') {
        value.split(',').forEach((s) => {
          const cls = s.trim().toLowerCase().replace(/[^0-9a-z]+/g, '-').replace(/(^-+|-+$)/g, '');
          if (cls) section.classList.add(cls);
        });
      } else {
        section.dataset[key.replace(/-([a-z])/g, (m, c) => c.toUpperCase())] = value;
      }
    });
    meta.remove();
  });
}

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    const strong = a.closest('strong');
    const em = a.closest('em');

    // A plain link (no strong/em) is only buttonized when it is a standalone
    // section call-to-action in main page content. Skip plain links inside a
    // block (the block styles its own CTAs) and inside the header/footer/nav
    // fragments (utility links, footer nav — not buttons).
    if (!strong && !em && (a.closest('.block') || a.closest('header, footer, nav'))) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else if (em) {
      a.classList.add('secondary');
      em.replaceWith(a);
    } else {
      // Standalone default-content link = section call-to-action (WKND
      // "All Articles" / "All Trips" / "read our articles") → primary button.
      a.classList.add('primary');
    }
  });
}

/**
 * Strips the legacy `.html` extension from internal links. Content imported
 * from wknd.site keeps `/us/en/...html` hrefs, but EDS pages are served
 * without an extension, so those links 404. Runs on every page so it also
 * covers already-imported content without a re-import.
 * @param {Element} main The main container element
 */
function normalizeInternalLinks(main) {
  main.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    // only same-origin / root-relative links ending in .html (ignore anchors, mailto, external)
    if (/^(https?:)?\/\//i.test(href) && !href.includes(window.location.hostname)) return;
    if (/\.html($|[?#])/i.test(href)) {
      a.setAttribute('href', href.replace(/\.html($|[?#])/i, '$1'));
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSectionMetadata(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
  normalizeInternalLinks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
