import DOMPurify from 'dompurify';
import { describe, expect, it } from 'vitest';

const requireImage = (node: Element | null): HTMLImageElement => {
  if (!(node instanceof HTMLImageElement)) {
    throw new Error('Exploit fixture must contain an image');
  }
  return node;
};

describe('dOMPurify security regressions', () => {
  it('neutralizes a detached descendant after an IN_PLACE hook removes its ancestor', () => {
    expect.hasAssertions();

    const root = document.createElement('div');
    const footer = document.createElement('footer');
    const image = document.createElement('img');
    image.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAAAAACw=');
    image.setAttribute('onload', 'globalThis.exploited = true');
    footer.append(image);
    const safeContent = document.createElement('div');
    safeContent.textContent = 'safe';
    root.append(footer, safeContent);
    const detachedImage = requireImage(root.querySelector('img'));

    DOMPurify.addHook('uponSanitizeElement', (node) => {
      if (node.nodeName === 'FOOTER') {
        (node as Element).remove();
      }
    });

    DOMPurify.sanitize(root, {
      ALLOWED_TAGS: ['div', '#text', 'footer'],
      IN_PLACE: true,
    });

    expect(root.children).toHaveLength(1);
    expect(root.firstElementChild).toBe(safeContent);
    expect(safeContent.textContent).toBe('safe');
    expect(detachedImage).not.toHaveAttribute('onload');

    DOMPurify.removeAllHooks();
  });
});
