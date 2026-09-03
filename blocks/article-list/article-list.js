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
  pageSize: 10,
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
    else if (key === 'page-size' || key === 'limit') {
      const n = parseInt(value, 10);
      if (!Number.isNaN(n) && n > 0) cfg.pageSize = n;
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

  // Filter (by path prefix) and drop the index page / non-article rows.
  let items = data.filter((row) => row.path);
  if (cfg.filter) items = items.filter((row) => row.path.startsWith(cfg.filter));
  // Newest first when a date-like field exists; otherwise keep index order.
  items.sort((a, b) => (Number(b.lastModified || 0) - Number(a.lastModified || 0)));

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
