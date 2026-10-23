import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import {
  makeDirectory,
  readTextFile,
  writeTextFile,
} from '../../helpers/safeTestFilesystem';

type CoverageModule = {
  writeInventoryRegions(input: {
    inventory: { regions: Record<string, string> };
    root: string;
  }): void;
};

const moduleUnderTest =
  // @ts-expect-error The maintained writer is JavaScript and has no declaration file.
  (await import('../../../scripts/storybook-coverage.mjs')) as CoverageModule;

describe('storybook inventory writer', () => {
  it('replaces exactly the generated region in all inventory documents', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'storybook-inventory-'));
    try {
      await Promise.all([
        makeDirectory(path.join(root, 'ClientApp/src/components'), root),
        makeDirectory(path.join(root, 'ClientApp/src/routes'), root),
        makeDirectory(path.join(root, 'ClientApp/src/storybook'), root),
      ]);
      const documents = [
        'ClientApp/src/components/ComponentInventory.docs.mdx',
        'ClientApp/src/routes/RouteInventory.docs.mdx',
        'ClientApp/src/storybook/CoverageMatrix.docs.mdx',
      ];
      await Promise.all(
        documents.map((document) =>
          writeTextFile(
            path.join(root, document),
            [
              'before',
              '<!-- storybook-coverage:generated:start -->',
              'old generated content',
              '<!-- storybook-coverage:generated:end -->',
              'after',
            ].join('\n'),
            root
          )
        )
      );

      moduleUnderTest.writeInventoryRegions({
        root,
        inventory: {
          regions: {
            components: 'component generated content',
            routes: 'route generated content',
            matrix: 'matrix generated content',
          },
        },
      });

      await expect(
        readTextFile(
          path.join(
            root,
            'ClientApp/src/components/ComponentInventory.docs.mdx'
          ),
          root
        )
      ).resolves.toContain('component generated content');
      await expect(
        readTextFile(
          path.join(root, 'ClientApp/src/routes/RouteInventory.docs.mdx'),
          root
        )
      ).resolves.toContain('route generated content');
      await expect(
        readTextFile(
          path.join(root, 'ClientApp/src/storybook/CoverageMatrix.docs.mdx'),
          root
        )
      ).resolves.toContain('matrix generated content');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
