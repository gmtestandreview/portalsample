import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { readTextFile, writeTextFile } from '../../helpers/safeTestFilesystem';

describe('safe test filesystem helpers', () => {
  it('permits files inside the declared root and rejects paths outside it', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'safe-test-filesystem-'));
    const file = path.join(root, 'fixture.txt');

    try {
      await writeTextFile(file, 'fixture', root);

      await expect(readTextFile(file, root)).resolves.toBe('fixture');
      await expect(
        readTextFile(path.join(root, '..', 'outside.txt'), root)
      ).rejects.toThrow('outside the allowed root');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
