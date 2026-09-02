/*
 * Contributors block — WKND "About Us" profile grid.
 * Each contributor is a card: circular avatar, name (serif), role (uppercase),
 * and a row of social icon links. Cards are laid out in a responsive grid.
 *
 * The block is auto-built in scripts.js from the flat imported content
 * (image + h3 + h5 + social-link paragraphs). This decorate() only styles the
 * already-grouped card markup, so it is defensive about missing cells.
 */

const SOCIAL = [
  { key: 'facebook', match: /facebook/i },
  { key: 'twitter', match: /twitter/i },
  { key: 'instagram', match: /insta/i },
];

export default function decorate(block) {
  block.querySelectorAll(':scope > div').forEach((card) => {
    card.classList.add('contributor');

    // avatar image
    const pic = card.querySelector('picture, img');
    if (pic) {
      const wrap = pic.closest('p') || pic.parentElement;
      (wrap || pic).classList.add('contributor-avatar');
    }

    // social links row: gather the standalone link paragraphs into one row
    const socialLinks = [...card.querySelectorAll('p > a[href]')].filter((a) => {
      const p = a.closest('p');
      return p && p.textContent.trim() === a.textContent.trim();
    });
    if (socialLinks.length) {
      const row = document.createElement('p');
      row.className = 'contributor-social';
      socialLinks.forEach((a) => {
        const label = (a.textContent + a.getAttribute('href')).toLowerCase();
        const net = SOCIAL.find((s) => s.match.test(label));
        a.classList.add('contributor-social-link');
        if (net) a.classList.add(`contributor-social-${net.key}`);
        a.setAttribute('aria-label', a.textContent.trim());
        a.textContent = '';
        const icon = document.createElement('span');
        icon.className = 'contributor-social-icon';
        a.append(icon);
        row.append(a);
        const oldP = a.closest('p');
        if (oldP && oldP !== row && oldP.parentElement) oldP.remove();
      });
      card.append(row);
    }

    // drop any empty paragraphs left behind by moved links
    card.querySelectorAll('p').forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector('picture, img, a')) p.remove();
    });
  });
}
