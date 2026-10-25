import { expect, describe, it } from 'vitest';
import path from 'node:path';

import { readTextFile, statPath } from '../../helpers/safeTestFilesystem';

const repositoryRoot = path.resolve(__dirname, '../../..');
const publicDirectory = path.join(repositoryRoot, 'ClientApp/public');

const getPublicAsset = async (document: Document, selector: string) => {
  const element = document.querySelector<HTMLLinkElement | HTMLMetaElement>(
    selector,
  );

  if (element === null) {
    throw new Error(`index.html declares no element matching ${selector}`);
  }

  const publicUrl =
    element instanceof HTMLLinkElement
      ? element.getAttribute('href')
      : element?.getAttribute('content');

  if (publicUrl === null || !/^\/[A-Za-z0-9.-]+$/.test(publicUrl)) {
    throw new Error(`Invalid public asset URL for ${selector}: ${publicUrl}`);
  }

  const assetPath = path.join(publicDirectory, publicUrl!.slice(1));
  const asset = statPath(assetPath, publicDirectory);

  if (!asset.isFile()) {
    throw new Error(`Public asset is not a file: ${assetPath}`);
  }

  return publicUrl;
};

describe('application shell identity assets', () => {
  it('publishes favicon and tile metadata backed by public files', async () => {
    expect.assertions(4);
    const html = await readTextFile(
      path.join(repositoryRoot, 'index.html'),
      repositoryRoot,
    );
    const document = new DOMParser().parseFromString(html, 'text/html');

    await expect(getPublicAsset(document, 'link[rel="icon"]')).resolves.toBe(
      '/favicon.ico',
    );
    await expect(
      getPublicAsset(document, 'meta[property="og:image"]'),
    ).resolves.toBe('/NMI-tile.png');
    await expect(
      getPublicAsset(document, 'link[rel="apple-touch-icon"]'),
    ).resolves.toBe('/NMI-tile.png');
    await expect(
      getPublicAsset(document, 'meta[name="msapplication-TileImage"]'),
    ).resolves.toBe('/NMI-tile.png');
  });
});
