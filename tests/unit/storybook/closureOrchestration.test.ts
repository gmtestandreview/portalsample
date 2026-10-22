import { describe, expect, it, vi } from 'vitest';

type Gate = {
  name: string;
  ok: boolean;
  inputDigest: string;
  producerIdentityDigest: string;
  freezeId: string;
};

type ClosureResult = {
  ok: boolean;
  code?: string;
  message?: string;
  phases: string[];
};

type ClosureModule = {
  runClosure(
    options: {
      checkout: string;
      url: string;
      serverMode: 'managed' | 'external';
      receipts: string;
      mcpTimeoutMs?: number;
      signal?: AbortSignal;
    },
    adapters: Record<string, unknown>
  ): Promise<ClosureResult>;
};

const moduleUnderTest =
  // @ts-expect-error The maintained launcher is JavaScript and has no declaration file.
  (await import('../../../scripts/storybook-closure.mjs')) as ClosureModule;

const makeAdapters = (overrides: Record<string, unknown> = {}) => {
  const calls: string[] = [];
  const freeze = {
    freezeId: 'freeze-1',
    inputDigest: 'sha256:inputs',
    protectedPaths: ['ClientApp', '.storybook'],
    denialProbes: [
      { operation: 'overwrite', denied: true },
      { operation: 'append', denied: true },
      { operation: 'create', denied: true },
      { operation: 'delete', denied: true },
      { operation: 'rename', denied: true },
    ],
    restored: false,
  };
  const producer = {
    producerId: 'producer-1',
    producerIdentityDigest: 'sha256:producer',
    mcpURL: 'http://localhost:6007/mcp',
    inputDigest: freeze.inputDigest,
  };
  const receipt = {
    producerId: producer.producerId,
    producerIdentityDigest: producer.producerIdentityDigest,
    inputDigest: freeze.inputDigest,
    freezeId: freeze.freezeId,
    childEpoch: { pid: 101, createdAt: '2026-10-19T00:00:01.000Z' },
    observedChildEpoch: { pid: 101, createdAt: '2026-10-19T00:00:01.000Z' },
  };
  const adapters = {
    resolveTarget: vi.fn(() => ({
      baseURL: 'http://localhost:6007',
      mcpURL: 'http://localhost:6007/mcp',
      command: 'storybook',
      webServer: undefined,
    })),
    assertOwnedPaths: vi.fn(async () => calls.push('paths')),
    acquireFreeze: vi.fn(async () => {
      calls.push('freeze');
      return freeze;
    }),
    releaseFreeze: vi.fn(async () => calls.push('release-freeze')),
    establishProducer: vi.fn(async () => {
      calls.push('producer');
      return producer;
    }),
    stopOwnedServer: vi.fn(async () => calls.push('stop-server')),
    runGate: vi.fn(async (gate: string) => {
      calls.push(gate);
      return {
        name: gate,
        ok: true,
        inputDigest: freeze.inputDigest,
        producerIdentityDigest: producer.producerIdentityDigest,
        freezeId: freeze.freezeId,
      } satisfies Gate;
    }),
    assertStableIdentity: vi.fn(async () => undefined),
    writeAwaitingMcp: vi.fn(async () => calls.push('awaiting-mcp')),
    produceMcpReceipts: vi.fn(async () => {
      calls.push('mcp-receipts');
      return {
        freezeId: freeze.freezeId,
        producerId: producer.producerId,
        receiptFiles: ['receipt-cold.json', 'receipt-warm.json'],
      };
    }),
    readReceipt: vi.fn(async () => receipt),
    normalizeReceipt: vi.fn(({ value }: { value: typeof receipt }) => ({
      ok: true,
      receipt: value,
    })),
    observeChildEpoch: vi.fn(
      async ({ receipt: observedReceipt }: { receipt: typeof receipt }) =>
        observedReceipt.observedChildEpoch
    ),
    validateFreezeRecord: vi.fn(() => ({ ok: true, errors: [] })),
    validateProducerIdentity: vi.fn(() => ({ ok: true, errors: [] })),
    ...overrides,
  };

  return { adapters, calls, freeze, producer };
};

const options = {
  checkout: 'C:/owned/storybook-checkout',
  url: 'http://localhost:6007',
  serverMode: 'managed' as const,
  receipts: 'reports/storybook-coverage',
  mcpTimeoutMs: 5_000,
};

describe('runClosure', () => {
  it('runs gates in order, validates the native handoff, and cleans up', async () => {
    const { adapters, calls, freeze, producer } = makeAdapters();

    const result = await moduleUnderTest.runClosure(options, adapters);

    expect(result).toEqual({
      ok: true,
      phases: [
        'paths',
        'freeze',
        'producer',
        'gate-1-type-check',
        'gate-2-lint',
        'gate-3-unit',
        'gate-4-source',
        'gate-5-storybook-build',
        'awaiting-mcp',
        'mcp-receipts',
        'gate-6-storybook-bdd',
        'gate-7-docs',
        'gate-8-closure',
        'release-freeze',
        'stop-server',
      ],
    });
    expect(adapters.validateFreezeRecord).toHaveBeenCalledWith({
      freeze,
      expectedInputDigest: freeze.inputDigest,
      selectedPaths: freeze.protectedPaths,
    });
    expect(adapters.validateProducerIdentity).toHaveBeenCalledWith({
      producer,
      receipt: expect.any(Object),
      expectedMcpURL: 'http://localhost:6007/mcp',
      expectedFreezeId: freeze.freezeId,
      expectedChildEpoch: expect.any(Object),
    });
    expect(calls).toEqual([
      'paths',
      'freeze',
      'producer',
      'gate-1-type-check',
      'gate-2-lint',
      'gate-3-unit',
      'gate-4-source',
      'gate-5-storybook-build',
      'awaiting-mcp',
      'mcp-receipts',
      'gate-6-storybook-bdd',
      'gate-7-docs',
      'gate-8-closure',
      'release-freeze',
      'stop-server',
    ]);
  });

  it('fails before qualifying gates when the handoff is stale', async () => {
    const { adapters, calls } = makeAdapters({
      produceMcpReceipts: vi.fn(async () => ({
        freezeId: 'old-freeze',
        producerId: 'producer-1',
        receiptFiles: ['receipt-cold.json'],
      })),
    });

    const result = await moduleUnderTest.runClosure(options, adapters);

    expect(result).toMatchObject({
      ok: false,
      code: 'EXECUTION_INCOMPLETE',
    });
    expect(result.message).toContain('handoff');
    expect(calls).toEqual([
      'paths',
      'freeze',
      'producer',
      'gate-1-type-check',
      'gate-2-lint',
      'gate-3-unit',
      'gate-4-source',
      'gate-5-storybook-build',
      'awaiting-mcp',
      'release-freeze',
      'stop-server',
    ]);
    expect(adapters.produceMcpReceipts).toHaveBeenCalledOnce();
  });

  it('fails closed when a pre-freeze gate is reported', async () => {
    const { adapters, calls } = makeAdapters({
      runGate: vi.fn(async (gate: string) => ({
        name: gate,
        ok: gate !== 'gate-3-unit',
        inputDigest: 'sha256:inputs',
        producerIdentityDigest: 'sha256:producer',
        freezeId: 'freeze-1',
      })),
    });

    const result = await moduleUnderTest.runClosure(options, adapters);

    expect(result).toMatchObject({
      ok: false,
      code: 'EXECUTION_INCOMPLETE',
    });
    expect(calls).toEqual([
      'paths',
      'freeze',
      'producer',
      'release-freeze',
      'stop-server',
    ]);
    expect(adapters.runGate).toHaveBeenCalledTimes(3);
    expect(adapters.runGate).toHaveBeenNthCalledWith(
      3,
      'gate-3-unit',
      expect.any(Object)
    );
  });

  it('releases the freeze and owned server when cancellation is signalled', async () => {
    const controller = new AbortController();
    const { adapters, calls, producer } = makeAdapters();
    adapters.establishProducer = vi.fn(async () => {
      calls.push('producer');
      controller.abort(new Error('closure interrupted by SIGTERM'));
      return producer;
    });

    const result = await moduleUnderTest.runClosure(
      { ...options, signal: controller.signal },
      adapters
    );

    expect(result).toMatchObject({
      ok: false,
      code: 'EXECUTION_INCOMPLETE',
      message: 'closure interrupted by SIGTERM',
    });
    expect(calls).toEqual([
      'paths',
      'freeze',
      'producer',
      'release-freeze',
      'stop-server',
    ]);
    expect(adapters.runGate).not.toHaveBeenCalled();
  });

  it('rejects invalid timeout values without touching the checkout', async () => {
    const { adapters, calls } = makeAdapters();

    const result = await moduleUnderTest.runClosure(
      { ...options, mcpTimeoutMs: 0 },
      adapters
    );

    expect(result).toMatchObject({
      ok: false,
      code: 'INVALID_INVOCATION',
    });
    expect(calls).toEqual([]);
  });
});
