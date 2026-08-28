/**
 * Hero (WKND "imagebottom" teaser): full-bleed image with an overlapping
 * white content card (heading + body + CTA). Also used on adventure-detail
 * pages, so classification is content-driven and defensive.
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const hasHeading = row.querySelector('h1, h2, h3, h4, h5, h6');
    const hasPicture = row.querySelector('picture');
    if (hasPicture && !hasHeading) {
      row.classList.add('hero-image');
    } else {
      row.classList.add('hero-content');
    }
  });

  // Ensure the CTA renders as a button even if core button decoration
  // did not run on this content (standalone <p><a>).
  const content = block.querySelector('.hero-content');
  if (content) {
    content.querySelectorAll('p > a:only-child').forEach((a) => {
      const p = a.parentElement;
      if (p.childNodes.length === 1 && !a.classList.contains('button')) {
        a.classList.add('button');
        p.classList.add('button-container');
      }
    });
  }
}
