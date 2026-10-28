import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const moduleUnderTest =
  // @ts-expect-error The maintained validator is JavaScript and has no declaration file.
  await import('../../../scripts/storybook-coverage.mjs');

const fixtureRoot = path.resolve(
  __dirname,
  '../../fixtures/storybook/module-coverage',
);

describe('storybook coverage closure CLI', () => {
  it('rejects a receipt symlink that resolves outside the receipt directory', async () => {
    expect.hasAssertions();

    const sandbox = await mkdtemp(
      path.join(os.tmpdir(), 'storybook-coverage-'),
    );
    const previousCwd = process.cwd();
    const index = {
      entries: {
        'components-field': { id: 'components-field', type: 'docs' },
        'components-field--default': {
          id: 'components-field--default',
          type: 'story',
        },
      },
    };
    const freeze = {
      freezeId: 'freeze-1',
      inputDigest: 'sha256:inputs',
      fullIndexDigest: moduleUnderTest.computeIndexDigest(index),
      docsIndexDigest: moduleUnderTest.computeIndexDigest(index),
    };
    const producer = {
      producerId: 'producer-1',
      producerIdentityDigest: 'sha256:producer',
    };
    const receipt = {
      verdict: 'passed',
      freezeId: freeze.freezeId,
      producerId: producer.producerId,
      inputDigest: freeze.inputDigest,
      producerIdentityDigest: producer.producerIdentityDigest,
      requestedStoryIds: ['components-field--default'],
      executedStoryIds: ['components-field--default'],
      componentTestStatuses: [
        {
          storyId: 'components-field--default',
          status: 'status-value:success',
        },
      ],
      a11yStatuses: [
        {
          storyId: 'components-field--default',
          status: 'status-value:success',
        },
      ],
    };

    try {
      process.chdir(sandbox);
      await mkdir('receipts', { recursive: true });
      await mkdir('external', { recursive: true });
      await writeFile('index.json', JSON.stringify(index));
      await writeFile('docs-index.json', JSON.stringify(index));
      await writeFile('receipts/freeze.json', JSON.stringify(freeze));
      await writeFile('receipts/producer.json', JSON.stringify(producer));
      await writeFile('external/receipt.json', JSON.stringify(receipt));
      await symlink(
        '../external/receipt.json',
        'receipts/receipt-escape.json',
        'file',
      );

      const result = moduleUnderTest.main([
        '--mode',
        'closure',
        '--manifest',
        path.join(fixtureRoot, 'coverageManifest.json'),
        '--source-root',
        fixtureRoot,
        '--index',
        path.join(sandbox, 'index.json'),
        '--docs-index',
        path.join(sandbox, 'docs-index.json'),
        '--receipts',
        'receipts',
      ]);

      expect(result).toMatchObject({
        exitCode: 1,
        errors: expect.arrayContaining([
          expect.objectContaining({
            code: 'EXECUTION_INCOMPLETE',
            message: expect.stringContaining('receipt file escapes directory'),
          }),
        ]),
      });
    } finally {
      process.chdir(previousCwd);
      await rm(sandbox, { recursive: true, force: true });
    }
  });
});
