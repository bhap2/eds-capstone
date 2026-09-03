/**
 * Hero (WKND "imagebottom" teaser): full-bleed image with an overlapping
 * white content card (heading + body + CTA). Also used on adventure-detail
 * pages, so classification is content-driven and defensive.
 */
// A cell is a video source when it links to (or names) a video file, or
// already contains a <video>/<source>.
const VIDEO_RE = /\.(mp4|webm|ogv|mov)(\?.*)?$/i;

function findVideoSrc(row) {
  if (row.querySelector('video, source')) return null; // already a video element
  const link = [...row.querySelectorAll('a')].find((a) => VIDEO_RE.test(a.href));
  if (link) return link.href;
  const text = (row.textContent || '').trim();
  if (VIDEO_RE.test(text)) return text;
  return null;
}

// Build a muted, looping, autoplaying background <video> (with an optional
// poster picture behind it for the first paint / reduced-motion / load error).
function buildVideoBackground(row, src) {
  const wrapper = document.createElement('div');
  wrapper.className = 'hero-video';

  const poster = row.querySelector('picture');
  if (poster) {
    poster.classList.add('hero-video-poster');
    wrapper.append(poster);
  }

  const video = document.createElement('video');
  video.className = 'hero-video-media';
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.setAttribute('tabindex', '-1');
  if (poster) {
    const posterImg = poster.querySelector('img');
    if (posterImg) video.poster = posterImg.src;
  }
  const source = document.createElement('source');
  source.src = src;
  source.type = `video/${(src.match(VIDEO_RE)[1] || 'mp4').toLowerCase().replace('mov', 'mp4')}`;
  video.append(source);
  wrapper.append(video);

  // Respect reduced-motion: don't autoplay, show the poster.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.autoplay = false;
    video.removeAttribute('autoplay');
  } else {
    // Some browsers ignore the attribute; kick playback explicitly.
    const play = video.play();
    if (play && typeof play.catch === 'function') play.catch(() => {});
  }

  return wrapper;
}

export default function decorate(block) {
  const isVideo = block.classList.contains('video');

  [...block.children].forEach((row) => {
    const hasHeading = row.querySelector('h1, h2, h3, h4, h5, h6');
    const hasPicture = row.querySelector('picture');
    const videoSrc = isVideo && !hasHeading ? findVideoSrc(row) : null;

    if (videoSrc) {
      row.classList.add('hero-image', 'hero-image-video');
      row.replaceChildren(buildVideoBackground(row, videoSrc));
    } else if (hasPicture && !hasHeading) {
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
