import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

type CoverageModule = {
  writeInventoryRegions(input: {
    inventory: { regions: Record<string, string> };
    root: string;
  }): void;
};

const moduleUnderTest =
  // @ts-expect-error The maintained writer is JavaScript and has no declaration file.
  (await import('../../../scripts/storybook-coverage.mjs')) as CoverageModule;

describe('Storybook inventory writer', () => {
  it('replaces exactly the generated region in all inventory documents', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'storybook-inventory-'));
    try {
      await Promise.all([
        mkdir(path.join(root, 'ClientApp/src/components'), { recursive: true }),
        mkdir(path.join(root, 'ClientApp/src/routes'), { recursive: true }),
        mkdir(path.join(root, 'ClientApp/src/storybook'), { recursive: true }),
      ]);
      const documents = [
        'ClientApp/src/components/ComponentInventory.docs.mdx',
        'ClientApp/src/routes/RouteInventory.docs.mdx',
        'ClientApp/src/storybook/CoverageMatrix.docs.mdx',
      ];
      await Promise.all(
        documents.map((document) =>
          writeFile(
            path.join(root, document),
            [
              'before',
              '<!-- storybook-coverage:generated:start -->',
              'old generated content',
              '<!-- storybook-coverage:generated:end -->',
              'after',
            ].join('\n')
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
        readFile(
          path.join(
            root,
            'ClientApp/src/components/ComponentInventory.docs.mdx'
          ),
          'utf8'
        )
      ).resolves.toContain('component generated content');
      await expect(
        readFile(
          path.join(root, 'ClientApp/src/routes/RouteInventory.docs.mdx'),
          'utf8'
        )
      ).resolves.toContain('route generated content');
      await expect(
        readFile(
          path.join(root, 'ClientApp/src/storybook/CoverageMatrix.docs.mdx'),
          'utf8'
        )
      ).resolves.toContain('matrix generated content');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
