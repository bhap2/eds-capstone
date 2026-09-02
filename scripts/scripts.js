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
 * Groups the flat "About Us" contributor content (image + name + role +
 * social links) into `contributors` profile-grid blocks. The imported content
 * has no block wrapper, so each contributor renders as a full-bleed image and
 * buttonized links; this rebuilds it into the source's card grid.
 * @param {Element} main The container element
 */
function buildContributorAutoBlocks(main) {
  const markers = [...main.querySelectorAll('h2')].filter((h) => /our contributors|wknd guides/i.test(h.textContent));
  markers.forEach((h2) => {
    const container = h2.parentElement;
    if (!container) return;
    const isGuides = /guides/i.test(h2.textContent);

    // Collect the contributor cards that follow this h2 (up to the next h2).
    const cards = [];
    let card = null;
    let node = h2.nextElementSibling;
    while (node && node.tagName !== 'H2') {
      const next = node.nextElementSibling;
      const isAvatar = node.querySelector && node.querySelector('picture, img');
      if (isAvatar) {
        // a new avatar starts a new card
        card = document.createElement('div');
        cards.push(card);
        card.append(node);
      } else if (card && (node.tagName === 'H3' || node.tagName === 'H5' || node.querySelector('a[href]'))) {
        card.append(node);
      }
      // else: intro paragraph before the first avatar — leave in place
      node = next;
    }
    if (!cards.length) return;

    const block = buildBlock('contributors', cards.map((c) => [{ elems: [...c.childNodes] }]));
    if (isGuides) block.classList.add('guides');
    // Insert right after the section's intro paragraph (or the h2).
    const intro = h2.nextElementSibling && h2.nextElementSibling.tagName === 'P'
      ? h2.nextElementSibling : h2;
    intro.after(block);
  });
}

/**
 * Wraps the "Current Adventures" category list (an <ol>/<ul> of category names
 * that precedes the per-category `.cards` grids) into an `adventure-filter`
 * block so it decorates into functional filter tabs. Without this the list
 * renders as plain bullets and every category grid shows at once.
 * @param {Element} main The container element
 */
function buildAdventureFilterAutoBlock(main) {
  const CATEGORIES = ['all', 'climbing', 'cycling', 'skiing', 'surfing', 'travel'];
  main.querySelectorAll(':scope > div ol, :scope > div ul').forEach((list) => {
    if (list.closest('.block')) return;
    const items = [...list.querySelectorAll(':scope > li')].map((li) => li.textContent.trim().toLowerCase());
    // Only the adventures filter: a short list matching the category labels,
    // immediately followed by a .cards grid in the same section.
    const isFilter = items.length >= 3
      && items.every((t) => CATEGORIES.includes(t))
      && (list.parentElement?.querySelector('.cards')
        || list.closest('.section')?.querySelector('.cards'));
    if (!isFilter) return;

    const block = buildBlock('adventure-filter', { elems: [list.cloneNode(true)] });
    list.replaceWith(block);
  });
}

/**
 * Wraps an imported breadcrumb list into a `breadcrumb` block. Detail/article
 * pages (adventures/*, magazine/*) import their trail as an <ol> whose items
 * are links plus a final plain-text current page; without a block it renders
 * as a numbered list. Detected structurally: every item except the last is a
 * link, the last is plain text, and no item links to a page-relative image/
 * cards grid (so the adventures category filter is not matched).
 * @param {Element} main The container element
 */
function buildBreadcrumbAutoBlock(main) {
  main.querySelectorAll(':scope > div > ol, :scope > div > ul').forEach((list) => {
    if (list.closest('.block')) return;
    const lis = [...list.querySelectorAll(':scope > li')];
    if (lis.length < 2) return;
    // Ancestor items are single links; the final item is the plain-text page.
    const ancestorsAreLinks = lis.slice(0, -1).every((li) => {
      const a = li.querySelector(':scope > a');
      return a && li.textContent.trim() === a.textContent.trim();
    });
    const lastIsText = !lis[lis.length - 1].querySelector('a');
    // Skip the adventures filter list (category labels + a following .cards).
    const looksLikeFilter = list.closest('.section')?.querySelector('.cards')
      && lis.every((li) => !li.querySelector('a'));
    if (!ancestorsAreLinks || !lastIsText || looksLikeFilter) return;

    const block = buildBlock('breadcrumb', { elems: [list.cloneNode(true)] });
    list.replaceWith(block);
  });
}

/**
 * Groups the flat "Members Only" teasers (Magazine page) into a `teaser` block
 * so they render as side-by-side cards. The imported content is a run of
 * heading + description + "Read More" + image after the "Members Only" intro;
 * without a block each teaser stacks full-width. Each teaser (an h2/h3 and the
 * paragraphs up to the next heading) becomes one row of the block.
 * @param {Element} main The container element
 */
function buildMembersTeaserAutoBlock(main) {
  const intro = [...main.querySelectorAll('h2, h3')].find((h) => /members only/i.test(h.textContent));
  if (!intro) return;

  // Teasers begin at the first heading after the intro's sign-in paragraph.
  const teasers = [];
  let current = null;
  let node = intro.nextElementSibling;
  while (node) {
    const next = node.nextElementSibling;
    if (/^H[2-6]$/.test(node.tagName)) {
      // A heading that starts a teaser (has following image) opens a new card.
      current = [];
      teasers.push(current);
      current.push(node);
    } else if (current) {
      current.push(node);
    }
    // else: the sign-in intro paragraph before the first teaser — leave it.
    node = next;
  }
  // Only teasers that carry an image are real cards.
  const cards = teasers.filter((c) => c.some((el) => el.querySelector && el.querySelector('picture, img')));
  if (cards.length < 2) return;

  // Anchor before the first card so we can place the block where it sat; the
  // card element references are then moved into the block by buildBlock.
  const anchor = cards[0][0].previousElementSibling;
  const parent = cards[0][0].parentElement;
  const block = buildBlock('teaser', cards.map((c) => [{ elems: c }]));
  if (anchor) anchor.after(block);
  else parent.prepend(block);
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
    buildBreadcrumbAutoBlock(main);
    buildContributorAutoBlocks(main);
    buildAdventureFilterAutoBlock(main);
    buildMembersTeaserAutoBlock(main);
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
 * Marks the FAQ-style two-column section. The source FAQs page lays out the
 * main content (title, image, intro, accordion) in a wide left column and the
 * "Need more help?" contact block as a narrow right sidebar. That section is
 * an accordion-faq wrapper with a trailing default-content-wrapper; here we
 * tag it `faq-layout` and its sidebar so CSS can place them side by side.
 * @param {Element} main The main container element
 */
function decorateFaqLayout(main) {
  main.querySelectorAll(':scope > .section').forEach((section) => {
    const accordion = section.querySelector(':scope > .accordion-faq-wrapper');
    if (!accordion) return;
    // The sidebar is a default-content-wrapper that follows the accordion.
    const wrappers = [...section.children];
    const sidebar = wrappers
      .slice(wrappers.indexOf(accordion) + 1)
      .find((el) => el.classList.contains('default-content-wrapper'));
    if (!sidebar) return;
    section.classList.add('faq-layout');
    sidebar.classList.add('faq-sidebar');
  });
}

/**
 * Restructures a magazine article page into the source's two-column layout:
 * a full-width hero and breadcrumb, then the article body in a wide left
 * column with a "SHARE THIS STORY" + related-articles sidebar on the right,
 * and the author bio as a card at the foot of the article. The imported
 * content arrives as one flat default-content-wrapper (title, body, author
 * bio, share heading) plus a trailing related-articles cards block.
 * @param {Element} main The main container element
 */
function decorateArticleLayout(main) {
  const section = [...main.querySelectorAll(':scope > .section')].find((s) => s.querySelector(':scope > .breadcrumb-wrapper')
    && [...s.querySelectorAll('h5')].some((h) => /share this story/i.test(h.textContent)));
  if (!section) return;

  // The article copy lives in the default-content-wrapper that holds the H1.
  const content = [...section.querySelectorAll(':scope > .default-content-wrapper')]
    .find((w) => w.querySelector('h1'));
  if (!content) return;

  const h1 = content.querySelector('h1');
  const cards = section.querySelector(':scope > .cards-wrapper');
  const shareHeading = [...content.querySelectorAll('h5')].find((h) => /share this story/i.test(h.textContent));

  // Drop the duplicate title (an H3 repeating the H1) the import leaves behind.
  content.querySelectorAll('h3').forEach((h3) => {
    if (h3.textContent.trim() === h1.textContent.trim()) h3.remove();
  });

  // Group the author bio (avatar image, name, role, social links) that trails
  // the article body into a card. It starts at the H2 whose text matches the
  // byline (H4 "By <name>") and includes the image immediately before it.
  const byline = [...content.querySelectorAll('h4')].find((h) => /^by\s+/i.test(h.textContent));
  const authorName = byline ? byline.textContent.trim().replace(/^by\s+/i, '') : '';
  const bioHeading = authorName
    && [...content.querySelectorAll('h2')].find((h) => h.textContent.trim() === authorName);
  if (bioHeading) {
    const bio = document.createElement('div');
    bio.className = 'article-bio';
    // pull in the avatar image that immediately precedes the name
    const avatar = bioHeading.previousElementSibling;
    if (avatar && avatar.querySelector('picture, img')) {
      avatar.classList.add('article-bio-avatar');
      bio.append(avatar);
    }
    let node = bioHeading;
    while (node && node !== shareHeading) {
      const next = node.nextElementSibling;
      bio.append(node);
      node = next;
    }
    // Turn the trailing Facebook/Twitter/Instagram text links into a row of
    // dark social icon squares (matching the About Us contributor cards).
    const socialLinks = [...bio.querySelectorAll('p > a[href]')]
      .filter((a) => /facebook|twitter|instagram/i.test(a.textContent.trim()));
    if (socialLinks.length) {
      const social = document.createElement('div');
      social.className = 'article-bio-social';
      socialLinks.forEach((a) => {
        const network = a.textContent.trim().toLowerCase();
        a.className = `article-bio-social-link article-bio-social-${network}`;
        a.setAttribute('aria-label', a.textContent.trim());
        a.textContent = '';
        const icon = document.createElement('span');
        icon.className = 'article-bio-social-icon';
        a.append(icon);
        const p = a.closest('p');
        social.append(a);
        if (p && !p.textContent.trim() && !p.children.length) p.remove();
      });
      bio.append(social);
    }
    content.append(bio);
  }

  // Build the two-column grid: article body (left) + share/related (right).
  const layout = document.createElement('div');
  layout.className = 'article-layout';
  const aside = document.createElement('aside');
  aside.className = 'article-aside';
  if (shareHeading) aside.append(shareHeading);
  if (cards) aside.append(cards);

  content.classList.add('article-main');
  section.insertBefore(layout, content);
  layout.append(content, aside);
  section.classList.add('article-page');
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
  decorateFaqLayout(main);
  decorateArticleLayout(main);
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
