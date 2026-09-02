/*
 * Teaser block — WKND "Members Only" secure teasers (Magazine page). Each row
 * is one teaser: a title (h2/h3), a description, a "Read More" action, and an
 * image. This groups those parts so the teasers render as side-by-side cards
 * with a dimmed, padlock-badged treatment for locked (members-only) items.
 */

export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('teaser-item');

    const content = document.createElement('div');
    content.className = 'teaser-content';

    // Split the row's parts: heading -> title, image -> image, the "Read More"
    // paragraph -> action chip, everything else -> description.
    [...row.children].forEach((cell) => {
      [...cell.childNodes].forEach((node) => {
        if (node.nodeType !== 1) {
          if (node.textContent.trim()) content.append(node);
          return;
        }
        const el = node;
        if (/^H[1-6]$/.test(el.tagName)) {
          content.append(el);
        } else if (el.querySelector && el.querySelector('picture, img')) {
          const image = document.createElement('div');
          image.className = 'teaser-image';
          image.append(el);
          row.append(image);
        } else if (/read more/i.test(el.textContent.trim())) {
          const link = el.querySelector('a');
          const action = link || document.createElement('span');
          action.classList.add('teaser-action');
          if (!link) action.textContent = el.textContent.trim();
          content.append(action);
        } else {
          el.classList.add('teaser-description');
          content.append(el);
        }
      });
      cell.remove();
    });

    // A locked teaser is the "members only" pattern: a plain-text (non-link)
    // "Read More". Anonymous WKND users can't follow it, so it's dimmed/badged.
    const action = content.querySelector('.teaser-action');
    if (action && action.tagName !== 'A') row.classList.add('teaser-locked');

    row.prepend(content);
  });
}
