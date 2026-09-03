import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Testimonials block.
 *
 * Authored as one row per testimonial with up to three cells:
 *   | avatar (image) | quote (text)        | name (text) |
 * Cells are matched by content, not position, so authors can omit the avatar
 * or reorder within reason:
 *   - a cell containing a picture  -> avatar
 *   - the name is the last text cell (short, no sentence punctuation) or a cell
 *     wrapped in a heading; everything else text is the quote.
 *
 * Renders a responsive grid of cards, each: circular avatar, quote, name.
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'testimonials-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;

    const item = document.createElement('li');
    item.className = 'testimonials-item';

    // avatar = the cell that holds a picture/img
    const avatarCell = cells.find((c) => c.querySelector('picture, img'));

    // remaining text cells, in author order
    const textCells = cells.filter((c) => c !== avatarCell
      && (c.textContent || '').trim());

    // name = a heading cell if present, else the last text cell; quote = the rest
    let nameCell = textCells.find((c) => c.querySelector('h1, h2, h3, h4, h5, h6'));
    if (!nameCell && textCells.length > 1) nameCell = textCells[textCells.length - 1];
    const quoteCells = textCells.filter((c) => c !== nameCell);

    if (avatarCell) {
      const avatar = document.createElement('div');
      avatar.className = 'testimonials-avatar';
      const img = avatarCell.querySelector('img');
      if (img) {
        avatar.append(
          createOptimizedPicture(img.src, img.alt || '', false, [{ width: '200' }]),
        );
      }
      item.append(avatar);
    }

    const quote = document.createElement('blockquote');
    quote.className = 'testimonials-quote';
    quoteCells.forEach((c) => {
      while (c.firstChild) quote.append(c.firstChild);
    });
    if (quote.textContent.trim()) item.append(quote);

    if (nameCell) {
      const name = document.createElement('p');
      name.className = 'testimonials-name';
      name.textContent = (nameCell.textContent || '').trim();
      item.append(name);
    }

    list.append(item);
  });

  block.replaceChildren(list);
}
