import { mkdir, mkdtemp, rm, stat, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

type Parsed =
  | { ok: true; options: Record<string, unknown> }
  | { ok: false; message: string };

const cli = (await import(
  // @ts-expect-error The maintained launcher modules are JavaScript.
  '../../../scripts/storybook-closure/cli.mjs'
)) as { parseArguments(argv: string[]): Parsed };
const pathsModule = (await import(
  // @ts-expect-error The maintained launcher modules are JavaScript.
  '../../../scripts/storybook-closure/paths.mjs'
)) as {
  createOwnedPaths(): { checkout?: string; receipts?: string };
  establishOwnedPaths(
    paths: object,
    args: { checkout: string; receipts: string },
  ): Promise<void>;
};
const receiptStore = (await import(
  // @ts-expect-error The maintained launcher modules are JavaScript.
  '../../../scripts/storybook-closure/receipt-store.mjs'
)) as {
  assertReceiptFileName(name: unknown): void;
  assertRequestId(id: unknown): void;
};
const acl = (await import(
  // @ts-expect-error The maintained launcher modules are JavaScript.
  '../../../scripts/storybook-closure/windows-acl.mjs'
)) as { assertProbePath(probePath: string): void };

const inventory = (await import(
  // @ts-expect-error The maintained launcher modules are JavaScript.
  '../../../scripts/storybook-closure/input-inventory.mjs'
)) as {
  STORYBOOK_INPUT_ROOTS: string[];
  collectInputFiles(checkout: string): { path: string }[];
};
const mcpReceipts = (await import(
  // @ts-expect-error The maintained launcher modules are JavaScript.
  '../../../scripts/storybook-closure/mcp-receipts.mjs'
)) as { remainingMcpTime(deadline: number, now?: number): number };

const OWNER_ENV = 'STORYBOOK_CLOSURE_OWNED_CHECKOUT';

const exists = async (target: string) =>
  stat(target).then(
    () => true,
    () => false,
  );

describe('closure cli argument pairs', () => {
  const valid = [
    '--checkout',
    '.',
    '--url',
    'http://localhost:6007',
    '--server-mode',
    'managed',
    '--receipts',
    'reports/run',
  ];

  it('accepts a complete flag/value list', () => {
    expect.hasAssertions();
    expect(cli.parseArguments(valid).ok).toBe(true);
  });

  it.each([
    ['unknown flag', [...valid, '--bogus', 'x']],
    ['dangling flag', [...valid, '--mcp-timeout-ms']],
    ['flag used as value', ['--checkout', '--url']],
  ])('rejects %s', (_label, argv) => {
    expect.hasAssertions();

    const parsed = cli.parseArguments(argv);

    expect(parsed.ok).toBe(false);
  });

  it('lets a repeated flag take its last value', () => {
    expect.hasAssertions();

    const parsed = cli.parseArguments([...valid, '--receipts', 'other']);

    expect(parsed).toMatchObject({
      ok: true,
      options: { receipts: 'other' },
    });
  });
});

describe('collectInputFiles', () => {
  it('ignores denial probes left behind by the ACL freeze', async () => {
    expect.hasAssertions();

    const sandbox = await mkdtemp(path.join(os.tmpdir(), 'closure-inputs-'));
    try {
      for (const root of inventory.STORYBOOK_INPUT_ROOTS) {
        await mkdir(path.join(sandbox, root), { recursive: true });
        await writeFile(path.join(sandbox, root, 'source.txt'), 'source');
      }
      const before = inventory.collectInputFiles(sandbox).map((f) => f.path);

      for (const root of inventory.STORYBOOK_INPUT_ROOTS) {
        await writeFile(
          path.join(sandbox, root, '.storybook-closure-probe-delete-1'),
          'probe',
        );
      }
      const after = inventory.collectInputFiles(sandbox).map((f) => f.path);

      expect(after).toStrictEqual(before);
    } finally {
      await rm(sandbox, { recursive: true, force: true });
    }
  });
});

describe('remainingMcpTime', () => {
  it('caps a request at the time left before the deadline', () => {
    expect.hasAssertions();
    expect(mcpReceipts.remainingMcpTime(1_500, 1_000)).toBe(500);
  });

  it('never exceeds the per-request ceiling', () => {
    expect.hasAssertions();
    expect(mcpReceipts.remainingMcpTime(10_000_000, 0)).toBe(150_000);
  });

  it('fails once the overall deadline has passed', () => {
    expect.hasAssertions();
    expect(() => mcpReceipts.remainingMcpTime(1_000, 1_000)).toThrow(
      'exceeded the configured timeout',
    );
  });
});

describe('closure receipt guards', () => {
  it.each(['../x.json', 'a/b.json', 'a\\b.json', 'x.txt', '', 7])(
    'rejects receipt name %j',
    (name) => {
      expect.hasAssertions();
      expect(() => receiptStore.assertReceiptFileName(name)).toThrow(
        'not permitted',
      );
    },
  );

  it('accepts generated receipt names', () => {
    expect.hasAssertions();
    expect(() =>
      receiptStore.assertReceiptFileName('receipt-mcp-1.json'),
    ).not.toThrow();
  });

  it.each([0, -1, 1.5, '../1', undefined])(
    'rejects requestId %j',
    (requestId) => {
      expect.hasAssertions();
      expect(() => receiptStore.assertRequestId(requestId)).toThrow(
        'not permitted',
      );
    },
  );

  it('refuses probe paths that are not disposable probes', () => {
    expect.hasAssertions();
    expect(() => acl.assertProbePath('/repo/src/App.tsx')).toThrow(
      'registered denial probe',
    );
    expect(() =>
      acl.assertProbePath('/repo/src/.storybook-closure-probe-delete-1'),
    ).not.toThrow();
  });
});

const withOwnedCheckout = async (
  run: (dirs: { checkout: string; external: string }) => Promise<void>,
) => {
  const sandbox = await mkdtemp(path.join(os.tmpdir(), 'closure-paths-'));
  const checkout = path.join(sandbox, 'checkout');
  const external = path.join(sandbox, 'external');
  try {
    await mkdir(checkout);
    await mkdir(external);
    vi.stubEnv(OWNER_ENV, path.resolve(checkout));

    await run({ checkout, external });
  } finally {
    vi.unstubAllEnvs();
    await rm(sandbox, { recursive: true, force: true });
  }
};

describe('establishOwnedPaths', () => {
  it('creates a nested receipts directory inside the checkout', async () => {
    expect.hasAssertions();

    await withOwnedCheckout(async ({ checkout }) => {
      const paths = pathsModule.createOwnedPaths();

      await pathsModule.establishOwnedPaths(paths, {
        checkout,
        receipts: 'reports/run',
      });

      await expect(exists(path.join(checkout, 'reports', 'run'))).resolves.toBe(
        true,
      );
      expect(paths.receipts).toBeDefined();
    });
  });

  it('rejects a symlinked parent before creating anything outside', async () => {
    expect.hasAssertions();

    await withOwnedCheckout(async ({ checkout, external }) => {
      await symlink(external, path.join(checkout, 'reports'), 'junction');
      const paths = pathsModule.createOwnedPaths();

      await expect(
        pathsModule.establishOwnedPaths(paths, {
          checkout,
          receipts: 'reports/nested/run',
        }),
      ).rejects.toThrow('outside the owned root');
      await expect(exists(path.join(external, 'nested'))).resolves.toBe(false);
    });
  });
});

const ownedFsModule = (await import(
  // @ts-expect-error The maintained launcher modules are JavaScript.
  '../../../scripts/storybook-closure/owned-fs.mjs'
)) as {
  openOwnedRoot(root: string): Promise<{
    writeFile(target: string, data: string): Promise<void>;
    mkdir(target: string): Promise<unknown>;
    rename(from: string, to: string): Promise<void>;
    readJson(target: string): Promise<unknown>;
  }>;
  isOutsideRoot(relative: string): boolean;
};

describe('owned-fs containment', () => {
  it.each(['..', `..${path.sep}x`, path.resolve('/abs')])(
    'treats %j as outside the root',
    (relative) => {
      expect.hasAssertions();
      expect(ownedFsModule.isOutsideRoot(relative)).toBe(true);
    },
  );

  it('does not mistake a dotted name for traversal', () => {
    expect.hasAssertions();
    expect(ownedFsModule.isOutsideRoot('..foo')).toBe(false);
  });

  it('rejects traversal and sibling-prefix targets', async () => {
    expect.hasAssertions();

    await withOwnedCheckout(async ({ checkout }) => {
      const owned = await ownedFsModule.openOwnedRoot(checkout);

      await expect(owned.writeFile('../escape.txt', 'x')).rejects.toThrow(
        'outside the owned root',
      );
      await expect(
        owned.writeFile(`${checkout}-evil/x.txt`, 'x'),
      ).rejects.toThrow('outside the owned root');
    });
  });

  it('writes nothing through a junction that leaves the root', async () => {
    expect.hasAssertions();

    await withOwnedCheckout(async ({ checkout, external }) => {
      await symlink(external, path.join(checkout, 'link'), 'junction');
      const owned = await ownedFsModule.openOwnedRoot(checkout);

      await expect(owned.writeFile('link/new.txt', 'x')).rejects.toThrow(
        'outside the owned root',
      );
      await expect(exists(path.join(external, 'new.txt'))).resolves.toBe(false);
    });
  });

  it('rejects a rename whose destination leaves the root', async () => {
    expect.hasAssertions();

    await withOwnedCheckout(async ({ checkout, external }) => {
      const owned = await ownedFsModule.openOwnedRoot(checkout);
      await owned.writeFile('a.txt', 'x');

      await expect(
        owned.rename('a.txt', path.join(external, 'a.txt')),
      ).rejects.toThrow('outside the owned root');
      await expect(exists(path.join(checkout, 'a.txt'))).resolves.toBe(true);
    });
  });

  it('creates nested directories that do not exist yet', async () => {
    expect.hasAssertions();

    await withOwnedCheckout(async ({ checkout }) => {
      const owned = await ownedFsModule.openOwnedRoot(checkout);

      await owned.mkdir('a/b/c');

      await expect(exists(path.join(checkout, 'a', 'b', 'c'))).resolves.toBe(
        true,
      );
    });
  });
});
