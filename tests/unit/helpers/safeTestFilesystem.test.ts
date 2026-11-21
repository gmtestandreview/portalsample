import { mkdtemp, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  makeDirectory,
  makeDirectorySync,
  pathExists,
  readDirectory,
  readDirectorySync,
  readTextFile,
  readTextFileSync,
  statPath,
  writeTextFile,
  writeTextFileSync,
} from '../../helpers/safeTestFilesystem';

const unsafePathCases = [
  ['parent traversal', (root: string) => path.join(root, '..', 'outside.txt')],
  [
    'absolute outside path',
    (root: string) => path.join(path.dirname(root), 'outside.txt'),
  ],
  ['sibling prefix', (root: string) => `${root}-sibling`],
] as const;

describe('safe test filesystem helpers', () => {
  it('permits absolute files inside the declared root', async () => {
    expect.hasAssertions();

    const root = await mkdtemp(path.join(os.tmpdir(), 'safe-test-filesystem-'));
    const file = path.join(root, 'fixture.txt');

    try {
      await writeTextFile(file, 'fixture', root);

      await expect(readTextFile(file, root)).resolves.toBe('fixture');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('resolves relative paths against the declared root consistently', async () => {
    expect.hasAssertions();

    const root = await mkdtemp(path.join(os.tmpdir(), 'safe-test-filesystem-'));
    const nestedDirectory = path.join(root, 'nested');
    const nestedFile = path.join(nestedDirectory, 'fixture.txt');

    try {
      await makeDirectory(nestedDirectory, root);
      await writeTextFile(nestedFile, 'fixture', root);

      const asyncContents = await readTextFile('nested/fixture.txt', root);
      const syncContents = readTextFileSync('nested/fixture.txt', root);
      const asyncEntries = await readDirectory('nested', root);
      const syncEntries = readDirectorySync('nested', root);

      await writeTextFile('nested/async-output.txt', 'async', root);
      writeTextFileSync('nested/sync-output.txt', 'sync', root);

      expect({
        asyncContents,
        syncContents,
        asyncEntryCount: asyncEntries.length,
        syncEntryCount: syncEntries.length,
        asyncOutputExists: pathExists('nested/async-output.txt', root),
        syncOutputIsFile: statPath('nested/sync-output.txt', root).isFile(),
      }).toStrictEqual({
        asyncContents: 'fixture',
        syncContents: 'fixture',
        asyncEntryCount: 1,
        syncEntryCount: 1,
        asyncOutputExists: true,
        syncOutputIsFile: true,
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects symlinked paths for every filesystem operation', async () => {
    expect.hasAssertions();

    const root = await mkdtemp(path.join(os.tmpdir(), 'safe-test-filesystem-'));
    const outsideRoot = await mkdtemp(
      path.join(os.tmpdir(), 'safe-test-filesystem-outside-'),
    );
    const linkedDirectory = path.join(root, 'linked');

    try {
      await writeTextFile(
        path.join(outsideRoot, 'fixture.txt'),
        'outside',
        outsideRoot,
      );
      await symlink(outsideRoot, linkedDirectory, 'junction');

      const operations: (() => Promise<unknown>)[] = [
        () => readTextFile('linked/fixture.txt', root),
        () => Promise.resolve(readTextFileSync('linked/fixture.txt', root)),
        () => writeTextFile('linked/async-output.txt', 'unsafe', root),
        () =>
          Promise.resolve().then(() => {
            writeTextFileSync('linked/sync-output.txt', 'unsafe', root);
          }),
        () => readDirectory('linked', root),
        () => Promise.resolve(readDirectorySync('linked', root)),
        () => makeDirectory('linked/async-created/nested', root),
        () =>
          Promise.resolve().then(() => {
            makeDirectorySync('linked/sync-created/nested', root);
          }),
        () => Promise.resolve(pathExists('linked/fixture.txt', root)),
        () => Promise.resolve(statPath('linked/fixture.txt', root)),
      ];

      const blockedOperations = await Promise.all(
        operations.map(async (operation) => {
          try {
            await operation();
            return false;
          } catch (error) {
            return (
              error instanceof Error &&
              error.message.includes('outside the allowed root')
            );
          }
        }),
      );
      const outsideEntries = await readDirectory('', outsideRoot);

      expect({
        blockedOperations,
        outsideEntryNames: outsideEntries.map((entry) => entry.name).sort(),
      }).toStrictEqual({
        blockedOperations: new Array(operations.length).fill(true),
        outsideEntryNames: ['fixture.txt'],
      });
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(outsideRoot, { recursive: true, force: true });
    }
  });

  it('permits allowed nested paths, including names beginning with two dots', async () => {
    expect.hasAssertions();

    const root = await mkdtemp(path.join(os.tmpdir(), 'safe-test-filesystem-'));
    const nestedDirectory = path.join(root, '..allowed', 'nested');
    const nestedFile = path.join(nestedDirectory, 'fixture.txt');

    try {
      await makeDirectory(nestedDirectory, root);
      await writeTextFile(nestedFile, 'nested fixture', root);

      expect(pathExists(nestedFile, root)).toBe(true);
      expect(readTextFileSync(nestedFile, root)).toBe('nested fixture');
      expect(statPath(nestedFile, root).isFile()).toBe(true);
      expect(readDirectorySync(nestedDirectory, root)).toHaveLength(1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it.each(unsafePathCases)(
    'rejects %s for read and write operations',
    async (_label, getPath) => {
      expect.hasAssertions();

      const root = await mkdtemp(
        path.join(os.tmpdir(), 'safe-test-filesystem-'),
      );
      const unsafePath = getPath(root);

      try {
        await expect(readTextFile(unsafePath, root)).rejects.toThrow(
          'outside the allowed root',
        );
        expect(() => readTextFileSync(unsafePath, root)).toThrow(
          'outside the allowed root',
        );
        await expect(writeTextFile(unsafePath, 'unsafe', root)).rejects.toThrow(
          'outside the allowed root',
        );
        expect(() => {
          writeTextFileSync(unsafePath, 'unsafe', root);
        }).toThrow('outside the allowed root');
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    },
  );

  it.each(unsafePathCases)(
    'rejects %s for directory operations',
    async (_label, getPath) => {
      expect.hasAssertions();

      const root = await mkdtemp(
        path.join(os.tmpdir(), 'safe-test-filesystem-'),
      );
      const unsafePath = getPath(root);

      try {
        await expect(readDirectory(unsafePath, root)).rejects.toThrow(
          'outside the allowed root',
        );
        expect(() => readDirectorySync(unsafePath, root)).toThrow(
          'outside the allowed root',
        );
        await expect(makeDirectory(unsafePath, root)).rejects.toThrow(
          'outside the allowed root',
        );
        expect(() => {
          makeDirectorySync(unsafePath, root);
        }).toThrow('outside the allowed root');
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    },
  );

  it.each(unsafePathCases)(
    'rejects %s for existence and stat operations',
    async (_label, getPath) => {
      expect.hasAssertions();

      const root = await mkdtemp(
        path.join(os.tmpdir(), 'safe-test-filesystem-'),
      );
      const unsafePath = getPath(root);

      try {
        expect(() => pathExists(unsafePath, root)).toThrow(
          'outside the allowed root',
        );
        expect(() => statPath(unsafePath, root)).toThrow(
          'outside the allowed root',
        );
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    },
  );
});
