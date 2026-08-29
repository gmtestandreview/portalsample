import { stat, readFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(__dirname, '../../..');
const publicDirectory = path.join(repositoryRoot, 'ClientApp/public');

const getPublicAsset = async (document: Document, selector: string) => {
    const element = document.querySelector<HTMLLinkElement | HTMLMetaElement>(selector);
    const publicUrl = element instanceof HTMLLinkElement
        ? element.getAttribute('href')
        : element?.getAttribute('content');

    expect(publicUrl).toMatch(/^\/[A-Za-z0-9.-]+$/);

    const assetPath = path.join(publicDirectory, publicUrl!.slice(1));
    const asset = await stat(assetPath);

    expect(asset.isFile()).toBe(true);

    return publicUrl;
};

describe('application shell identity assets', () => {
    it('publishes favicon and tile metadata backed by public files', async () => {
        const html = await readFile(path.join(repositoryRoot, 'index.html'), 'utf8');
        const document = new DOMParser().parseFromString(html, 'text/html');

        await expect(getPublicAsset(document, 'link[rel="icon"]')).resolves.toBe('/favicon.ico');
        await expect(getPublicAsset(document, 'meta[property="og:image"]')).resolves.toBe('/NMI-tile.png');
        await expect(getPublicAsset(document, 'link[rel="apple-touch-icon"]')).resolves.toBe('/NMI-tile.png');
        await expect(getPublicAsset(document, 'meta[name="msapplication-TileImage"]')).resolves.toBe('/NMI-tile.png');
    });
});
