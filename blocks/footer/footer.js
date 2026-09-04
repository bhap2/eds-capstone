import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment — metadata-independent dual-fetch. Probe the path
  // that exists for the current environment FIRST so we don't emit a guaranteed
  // 404: local `aem up` serves fragments under /content, deployed
  // aem.page/aem.live serve them at the DA/EDS root (/footer).
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const paths = isLocal ? ['/content/footer', '/footer'] : ['/footer', '/content/footer'];
  const fragment = (await loadFragment(paths[0])) || (await loadFragment(paths[1]));

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // The WKND logo is a code asset (/icons/wknd-logo.svg). DA rewrites the
  // fragment's <img src> to about:error, so point it at the served path here.
  const logo = footer.querySelector('img');
  if (logo) {
    logo.src = '/icons/wknd-logo.svg';
    logo.removeAttribute('width');
    logo.removeAttribute('height');
  }

  // Turn the "Follow Us" social links into WKND icon-square buttons. The
  // network is derived from the href so no copy is hardcoded here.
  const NETWORKS = ['facebook', 'twitter', 'instagram'];
  footer.querySelectorAll('a[href]').forEach((a) => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    const label = a.textContent.trim().toLowerCase();
    const net = NETWORKS.find((n) => href.includes(n) || label === n);
    if (!net) return;
    a.classList.add('footer-social', `footer-social-${net}`);
    a.setAttribute('aria-label', a.textContent.trim());
    const icon = document.createElement('span');
    icon.className = 'footer-social-icon';
    a.textContent = '';
    a.append(icon);
  });

  block.append(footer);
}
