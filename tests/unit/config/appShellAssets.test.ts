import { expect, describe, it } from 'vitest';
import path from 'node:path';

import { readTextFileSync, statPath } from '../../helpers/safeTestFilesystem';

const repositoryRoot = path.resolve(__dirname, '../../..');
const publicDirectory = path.join(repositoryRoot, 'ClientApp/public');

describe('application shell identity assets', () => {
  it('publishes favicon and tile metadata backed by public files', () => {
    expect.hasAssertions();

    const rootSource = readTextFileSync(
      path.join(repositoryRoot, 'ClientApp', 'src', 'root.tsx'),
      repositoryRoot,
    );

    expect([
      /rel='icon'[\s\S]*?href='\/favicon\.ico'/u.test(rootSource),
      rootSource.includes(
        "meta name='msapplication-TileImage' content='/NMI-tile.png'",
      ),
      rootSource.includes("meta property='og:image' content='/NMI-tile.png'"),
      rootSource.includes("link rel='apple-touch-icon' href='/NMI-tile.png'"),
      statPath(
        path.join(publicDirectory, 'favicon.ico'),
        publicDirectory,
      ).isFile(),
      statPath(
        path.join(publicDirectory, 'NMI-tile.png'),
        publicDirectory,
      ).isFile(),
    ]).toStrictEqual([true, true, true, true, true, true]);
  });
});
