import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Article List block — index-driven.
 *
 * Reads the Edge Delivery query index (a JSON feed auto-generated from
 * published pages) and renders cards, PAGE_SIZE at a time, with a "Load more"
 * button. Because it reads the index at runtime, publishing a new article makes
 * it appear here with no code change.
 *
 * Authoring (all optional, one key/value per row):
 *   | index    | /magazine/query-index.json |   (feed URL; default /query-index.json)
 *   | filter   | /us/en/magazine/           |   (only rows whose path starts with this)
 *   | page-size| 10                         |   (cards per batch; default 10)
 */
const DEFAULTS = {
  index: '/query-index.json',
  filter: '',
  category: '',
  sort: '', // '' = auto (date if present, else title A→Z), 'title', or 'date'
  paths: [], // explicit ordered paths (curated selection); card data still from index
  pageSize: 10,
  more: true,
};

function readConfig(block) {
  const cfg = { ...DEFAULTS };
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const key = (cells[0].textContent || '').trim().toLowerCase().replace(/\s+/g, '-');
    const value = (cells[1].textContent || '').trim();
    if (!value) return;
    if (key === 'index' || key === 'source') cfg.index = value;
    else if (key === 'filter' || key === 'path') cfg.filter = value;
    else if (key === 'category' || key === 'activity') cfg.category = value.toLowerCase();
    else if (key === 'sort' || key === 'order') cfg.sort = value.toLowerCase();
    else if (key === 'paths' || key === 'items') {
      // Curated, ordered list of page paths (comma/newline separated). Selection
      // and order come from here; each card's data is still read from the index.
      cfg.paths = value.split(/[\n,]/).map((p) => p.trim()).filter(Boolean);
    } else if (key === 'page-size' || key === 'limit') {
      const n = parseInt(value, 10);
      if (!Number.isNaN(n) && n > 0) cfg.pageSize = n;
    } else if (key === 'more' || key === 'load-more') {
      // "no"/"false"/"off"/"0" disable the Load more button (e.g. homepage teasers).
      cfg.more = !/^(no|false|off|0)$/i.test(value);
    }
  });
  return cfg;
}

async function fetchIndex(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const json = await resp.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (e) {
    return null;
  }
}

function buildCard(item) {
  const li = document.createElement('li');
  li.className = 'article-list-card';

  const link = item.path || '#';

  if (item.image) {
    const imageLink = document.createElement('a');
    imageLink.className = 'article-list-card-image';
    imageLink.href = link;
    imageLink.append(
      createOptimizedPicture(item.image, item.title || '', false, [{ width: '750' }]),
    );
    li.append(imageLink);
  }

  const body = document.createElement('div');
  body.className = 'article-list-card-body';

  const title = document.createElement('h3');
  const titleLink = document.createElement('a');
  titleLink.href = link;
  titleLink.textContent = item.title || item.path || '';
  title.append(titleLink);
  body.append(title);

  const desc = item.description || '';
  if (desc) {
    const p = document.createElement('p');
    p.textContent = desc;
    body.append(p);
  }

  li.append(body);
  return li;
}

export default async function decorate(block) {
  const cfg = readConfig(block);
  block.replaceChildren();

  const list = document.createElement('ul');
  list.className = 'article-list-cards';
  block.append(list);

  const data = await fetchIndex(cfg.index);

  if (data === null) {
    const msg = document.createElement('p');
    msg.className = 'article-list-empty';
    msg.textContent = 'Articles are not available yet.';
    block.append(msg);
    return;
  }

  // Curated mode: an explicit ordered list of paths. Selection and order come
  // from cfg.paths; each card's title/image/description still comes from the
  // live index row, so editing a page updates its card here automatically.
  if (cfg.paths.length) {
    const byPath = new Map(data.filter((r) => r.path).map((r) => [r.path.replace(/\/$/, ''), r]));
    const items = cfg.paths
      .map((p) => byPath.get(p.replace(/\.html$/, '').replace(/\/$/, '')))
      .filter(Boolean);
    if (!items.length) {
      const msg = document.createElement('p');
      msg.className = 'article-list-empty';
      msg.textContent = 'No articles found.';
      block.append(msg);
      return;
    }
    const capped = cfg.pageSize && cfg.pageSize < items.length;
    (capped ? items.slice(0, cfg.pageSize) : items).forEach((item) => list.append(buildCard(item)));
    return;
  }

  // Filter (by path prefix) and drop the index page / non-article rows.
  let items = data.filter((row) => row.path);
  if (cfg.filter) {
    const base = cfg.filter.replace(/\/$/, '');
    items = items.filter((row) => {
      // Keep only descendants of the filter path, not the listing page itself
      // (e.g. filter=/us/en/magazine/ excludes /us/en/magazine and /us/en/magazine/).
      if (!row.path.startsWith(cfg.filter)) return false;
      const rest = row.path.slice(base.length).replace(/^\//, '');
      return rest.length > 0;
    });
  }
  // Optional category filter — matches a `category`/`activity` index column when
  // present (case-insensitive). No-ops until that column is added to the index.
  if (cfg.category) {
    items = items.filter((row) => {
      const cat = (row.category || row.activity || '').toLowerCase();
      return cat === cfg.category;
    });
  }
  // Order to match the source listings. The WKND source renders these grids
  // alphabetically by title (e.g. Arctic Surfing → San Diego → Ski Touring →
  // Ultimate Guide → Western Australia), so default to a title A→Z sort. When a
  // real publish date exists in the index, prefer newest-first (sort=date).
  const ts = (r) => Number(r.lastModified || r.date || 0);
  const hasDates = items.some((r) => ts(r) > 0);
  if (cfg.sort === 'date' || (cfg.sort !== 'title' && hasDates)) {
    items.sort((a, b) => ts(b) - ts(a));
  } else {
    items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }

  if (!items.length) {
    const msg = document.createElement('p');
    msg.className = 'article-list-empty';
    msg.textContent = 'No articles found.';
    block.append(msg);
    return;
  }

  let shown = 0;
  const renderNext = () => {
    const next = items.slice(shown, shown + cfg.pageSize);
    next.forEach((item) => list.append(buildCard(item)));
    shown += next.length;
  };

  // Homepage teasers set more:false — render one capped batch, no button.
  if (!cfg.more) {
    renderNext();
    return;
  }

  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'article-list-more button';
  more.textContent = 'Load more';
  more.addEventListener('click', () => {
    renderNext();
    if (shown >= items.length) more.remove();
  });

  renderNext();
  if (shown < items.length) block.append(more);
}
