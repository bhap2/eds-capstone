/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel.js
  function parse(element, { document: document2 }) {
    const slides = Array.from(
      element.querySelectorAll('.cmp-carousel__item, [class*="carousel__item"]')
    );
    const cells = [];
    slides.forEach((slide) => {
      const image = slide.querySelector(".cmp-teaser__image img, .cmp-image img, img");
      const contentCell = [];
      const title = slide.querySelector('.cmp-teaser__title, h1, h2, h3, [class*="title"]');
      if (title) contentCell.push(title);
      const description = slide.querySelector('.cmp-teaser__description, [class*="description"]');
      if (description) contentCell.push(description);
      const cta = slide.querySelector(".cmp-teaser__action-link, .cmp-teaser__action-container a, a");
      if (cta) contentCell.push(cta);
      if (image || contentCell.length) {
        cells.push([image || "", contentCell]);
      }
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  function parse2(element, { document: document2 }) {
    const contentCell = [];
    const pretitle = element.querySelector('.cmp-teaser__pretitle, [class*="pretitle"]');
    if (pretitle) contentCell.push(pretitle);
    const title = element.querySelector('.cmp-teaser__title, h1, h2, h3, [class*="title"]');
    if (title) contentCell.push(title);
    const description = element.querySelector('.cmp-teaser__description, [class*="description"]');
    if (description) contentCell.push(description);
    const cta = element.querySelector(".cmp-teaser__action-link, .cmp-teaser__action-container a");
    if (cta) contentCell.push(cta);
    const image = element.querySelector(".cmp-teaser__image img, .cmp-image img, img");
    if (!contentCell.length && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[contentCell, image || ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  function parse3(element, { document: document2 }) {
    const items = Array.from(
      element.querySelectorAll(".cmp-image-list__item, li")
    );
    const cells = [];
    items.forEach((item) => {
      const image = item.querySelector(".cmp-image-list__item-image img, .cmp-image img, img");
      const contentCell = [];
      const titleLink = item.querySelector(".cmp-image-list__item-title-link");
      const titleText = item.querySelector('.cmp-image-list__item-title, [class*="title"]');
      if (titleLink) {
        const title = titleText ? (titleText.textContent || "").trim() : (titleLink.textContent || "").trim();
        const heading = document2.createElement("h3");
        const link = document2.createElement("a");
        link.href = titleLink.getAttribute("href");
        link.textContent = title;
        heading.append(link);
        contentCell.push(heading);
      } else if (titleText) {
        const heading = document2.createElement("h3");
        heading.textContent = (titleText.textContent || "").trim();
        contentCell.push(heading);
      }
      const description = item.querySelector('.cmp-image-list__item-description, [class*="description"]');
      if (description) {
        const p = document2.createElement("p");
        p.textContent = (description.textContent || "").trim();
        contentCell.push(p);
      }
      if (image || contentCell.length) {
        cells.push([image || "", contentCell]);
      }
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero.js
  function parse4(element, { document: document2 }) {
    const image = element.querySelector(".cmp-teaser__image img, .cmp-image img, img");
    const title = element.querySelector('.cmp-teaser__title, h1, h2, h3, [class*="title"]');
    const description = element.querySelector('.cmp-teaser__description, [class*="description"]');
    const cta = element.querySelector(".cmp-teaser__action-link, .cmp-teaser__action-container a");
    if (!title && !description && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (image) cells.push([image]);
    const contentCell = [];
    if (title) contentCell.push(title);
    if (description) contentCell.push(description);
    if (cta) contentCell.push(cta);
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // AEM header experience-fragment (wraps sign-in, language nav, header nav, search).
        // cleaned.html L5-L161: <header class="... cmp-experiencefragment--header">
        "header",
        ".cmp-experiencefragment--header",
        // AEM footer experience-fragment (footer logo, nav, social buttons, copyright).
        // cleaned.html L471-L562: <footer class="... cmp-experiencefragment--footer">
        "footer",
        ".cmp-experiencefragment--footer",
        // Utility chrome that also lives inside the header shell (explicit for intent).
        ".sign-in-buttons",
        // cleaned.html L14
        ".languagenavigation",
        // cleaned.html L21
        ".cmp-search--header",
        // cleaned.html L134 (header search widget)
        // Mobile navigation toggle + drawer (site shell, not page content).
        "#toggleNav",
        // cleaned.html L568
        "#mobileNav",
        // cleaned.html L574
        // Adobe ID syncing iframe (tracking, non-authorable). cleaned.html L566
        "iframe",
        // Empty separator divider wrappers between blocks (cmp-separator cruft).
        // Targets the specific wrapper div, NOT bare <hr>, so section-transformer
        // <hr> breaks survive. cleaned.html L351, L460, L542
        ".separator",
        // Stray empty <meta> tags left inside cmp-image wrappers. cleaned.html L183, L204...
        "meta",
        // Safe leftover elements.
        "noscript",
        "link"
      ]);
      element.querySelectorAll("[data-cmp-data-layer], [data-cmp-data-layer-enabled], [data-cmp-hook-image], [data-cmp-link-accessibility-enabled], [data-cmp-link-accessibility-text]").forEach((el) => {
        el.removeAttribute("data-cmp-data-layer");
        el.removeAttribute("data-cmp-data-layer-enabled");
        el.removeAttribute("data-cmp-hook-image");
        el.removeAttribute("data-cmp-link-accessibility-enabled");
        el.removeAttribute("data-cmp-link-accessibility-text");
      });
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function selectorFor(section) {
    const sel = section.selector;
    if (Array.isArray(sel)) return sel.join(", ");
    return sel;
  }
  function resolveElement(element, selector, used) {
    const matches = Array.from(element.querySelectorAll(selector));
    for (let j = matches.length - 1; j >= 0; j -= 1) {
      if (!used.has(matches[j])) return matches[j];
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload.template && payload.template.sections || [];
    if (hookName === TransformHook2.beforeTransform) {
      const used = /* @__PURE__ */ new Set();
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const sectionEl = resolveElement(element, selectorFor(section), used);
        if (!sectionEl) continue;
        used.add(sectionEl);
        if (i === 0 && !section.style) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === TransformHook2.afterTransform) {
      const used = /* @__PURE__ */ new Set();
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || resolveElement(element, selectorFor(section), used);
        if (!anchor) continue;
        used.add(anchor);
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-homepage.js
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Landing page with full-bleed hero banner, teaser/feature sections, and card grids of featured content",
    urls: [
      "https://wknd.site/us/en.html"
    ],
    blocks: [
      { name: "carousel", instances: [".cmp-carousel--hero"] },
      { name: "columns", instances: [".cmp-teaser--featured"] },
      { name: "cards", instances: [".image-list.list"] },
      { name: "hero", instances: [".cmp-teaser--imagebottom"] }
    ],
    sections: [
      { id: "hero-carousel", name: "Hero Carousel", selector: [".cmp-carousel--hero"], style: null, blocks: ["carousel"], defaultContent: [] },
      { id: "featured-teaser", name: "Featured Article Teaser", selector: [".cmp-teaser--featured"], style: "grey", blocks: ["columns"], defaultContent: [] },
      { id: "recent-articles", name: "Recent Articles", selector: [".image-list.list"], style: null, blocks: ["cards"], defaultContent: [".cmp-title--underline .cmp-title__text"] },
      { id: "next-adventures", name: "Next Adventures - Climbing NZ", selector: [".cmp-teaser--imagebottom"], style: null, blocks: ["hero"], defaultContent: [] },
      { id: "adventures-grid", name: "Where do you want to go", selector: [".image-list.list"], style: null, blocks: ["cards"], defaultContent: [] }
    ]
  };
  var parsers = {
    carousel: parse,
    columns: parse2,
    cards: parse3,
    hero: parse4
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
