import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  // Responsive image sizes for the card thumbnails. Cards display at ~274px
  // (desktop 4-up), ~290px (tablet 2-up) and up to ~full-width on phones, so a
  // flat 750px was oversized on mobile. Serve a smaller file to narrow screens
  // and a moderate one to wide screens (never the 2000px full-bleed size).
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [
    { media: '(min-width: 900px)', width: '500' },
    { width: '600' },
  ])));
  block.replaceChildren(ul);
}
