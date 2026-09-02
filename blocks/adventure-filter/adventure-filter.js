/*
 * Adventure filter — WKND "Current Adventures" category tabs.
 * The imported content is an <ol> of category names followed by one `.cards`
 * grid per category (All, Climbing, Cycling, Skiing, Surfing, Travel), all
 * rendered at once. This turns the list into a tablist and shows only the
 * selected category's grid at a time (default "All"), matching the source.
 */

export default function decorate(block) {
  const section = block.closest('.section') || block.parentElement;
  if (!section) return;

  // Category labels from the imported <ol>.
  const labels = [...block.querySelectorAll('li')].map((li) => li.textContent.trim());
  if (!labels.length) return;

  // The category grids: the .cards blocks that follow, in document order.
  const grids = [...section.querySelectorAll('.cards')];
  if (!grids.length) return;

  // Build the tablist.
  const tablist = document.createElement('div');
  tablist.className = 'adventure-filter-tabs';
  tablist.setAttribute('role', 'tablist');

  const activate = (index) => {
    tablist.querySelectorAll('button').forEach((btn, i) => {
      const selected = i === index;
      btn.setAttribute('aria-selected', selected);
      btn.classList.toggle('is-active', selected);
    });
    grids.forEach((grid, i) => {
      grid.hidden = i !== index;
    });
  };

  labels.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.setAttribute('role', 'tab');
    btn.addEventListener('click', () => activate(i));
    tablist.append(btn);
  });

  // Replace the <ol> with the tablist.
  const ol = block.querySelector('ol, ul');
  if (ol) ol.replaceWith(tablist);
  else block.prepend(tablist);

  // Default: show the first category ("All").
  activate(0);
}
