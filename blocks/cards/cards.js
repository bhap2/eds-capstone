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
  // Make the card image clickable — the source links the thumbnail to the same
  // article as the title. The title link lives in the card body; mirror its
  // href onto the image by wrapping the picture in an anchor.
  ul.querySelectorAll('li').forEach((li) => {
    const imageCell = li.querySelector('.cards-card-image');
    const picture = imageCell && imageCell.querySelector('picture');
    const titleLink = li.querySelector('.cards-card-body a[href]');
    if (picture && titleLink && !imageCell.querySelector('a')) {
      const imageLink = document.createElement('a');
      imageLink.href = titleLink.getAttribute('href');
      if (titleLink.getAttribute('title')) imageLink.title = titleLink.getAttribute('title');
      imageLink.setAttribute('aria-label', titleLink.textContent.trim());
      imageLink.append(picture);
      imageCell.append(imageLink);
    }
  });
  block.replaceChildren(ul);
}
