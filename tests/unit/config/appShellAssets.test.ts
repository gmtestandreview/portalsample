import { expect, describe, it } from 'vitest';
import path from 'node:path';

import { readTextFile, statPath } from '../../helpers/safeTestFilesystem';

const repositoryRoot = path.resolve(__dirname, '../../..');
const publicDirectory = path.join(repositoryRoot, 'ClientApp/public');

const getPublicAsset = (document: Document, selector: string): string => {
  const element = document.querySelector<HTMLLinkElement | HTMLMetaElement>(
    selector,
  );

  expect(
    element,
    `index.html declares no element matching ${selector}`,
  ).not.toBeNull();

  const publicUrl =
    element instanceof HTMLLinkElement
      ? element.getAttribute('href')
      : element?.getAttribute('content');

  expect(publicUrl).toMatch(/^\/[A-Za-z0-9.-]+$/);

  if (publicUrl === null || publicUrl === undefined) {
    throw new Error(`Expected a URL for ${selector}`);
  }

  const assetPath = path.join(publicDirectory, publicUrl.slice(1));
  const asset = statPath(assetPath, publicDirectory);

  expect(asset.isFile()).toBe(true);

  return publicUrl;
};

describe('application shell identity assets', () => {
  it('publishes favicon and tile metadata backed by public files', async () => {
    expect.hasAssertions();

    const html = await readTextFile(
      path.join(repositoryRoot, 'index.html'),
      repositoryRoot,
    );
    const document = new DOMParser().parseFromString(html, 'text/html');

    expect(getPublicAsset(document, 'link[rel="icon"]')).toBe('/favicon.ico');
    expect(getPublicAsset(document, 'meta[property="og:image"]')).toBe(
      '/NMI-tile.png',
    );
    expect(getPublicAsset(document, 'link[rel="apple-touch-icon"]')).toBe(
      '/NMI-tile.png',
    );
    expect(
      getPublicAsset(document, 'meta[name="msapplication-TileImage"]'),
    ).toBe('/NMI-tile.png');
  });
});
