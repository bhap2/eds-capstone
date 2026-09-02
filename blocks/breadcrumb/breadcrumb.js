/*
 * Breadcrumb block — WKND adventure/article trail (e.g. Adventures › Bali Surf
 * Camp). The imported content is an <ol> of links + a final plain-text current
 * page; this marks up the list for accessible, styled breadcrumb rendering.
 */

export default function decorate(block) {
  const list = block.querySelector('ol, ul');
  if (!list) return;

  list.setAttribute('aria-label', 'Breadcrumb');
  list.querySelectorAll(':scope > li').forEach((li, i, items) => {
    li.classList.add('breadcrumb-item');
    // The last item (no link) is the current page.
    if (i === items.length - 1 && !li.querySelector('a')) {
      li.classList.add('breadcrumb-item-active');
      li.setAttribute('aria-current', 'page');
    }
  });

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  nav.append(list);
  block.textContent = '';
  block.append(nav);
}
