import { describe, expect, it } from 'vitest';

type ProducerModule = {
  validateProducerIdentity(input: {
    producer: Record<string, unknown>;
    receipt: Record<string, unknown>;
    expectedMcpURL: string;
    expectedFreezeId: string;
    expectedChildEpoch: { pid: number; createdAt: string };
  }): { ok: boolean; errors: Array<{ code: string; message: string }> };
};

const moduleUnderTest =
  // @ts-expect-error The maintained validator is JavaScript and has no declaration file.
  (await import('../../../scripts/storybook-coverage.mjs')) as ProducerModule;

const producer = {
  producerId: 'producer-1',
  producerIdentityDigest: 'sha256:producer',
  checkout: 'C:/owned/checkout',
  commit: 'commit-1',
  inputDigest: 'sha256:inputs',
  freezeId: 'freeze-1',
  mcpURL: 'http://localhost:6007/mcp',
  serverPid: 100,
  serverStartedAt: '2026-10-19T00:00:00.000Z',
  cwd: 'C:/owned/checkout',
  launchArguments: ['storybook', '--port', '6007'],
};

const receipt = {
  producerId: 'producer-1',
  producerIdentityDigest: 'sha256:producer',
  inputDigest: 'sha256:inputs',
  freezeId: 'freeze-1',
  mcpURL: 'http://localhost:6007/mcp',
  childEpoch: { pid: 101, createdAt: '2026-10-19T00:00:01.000Z' },
};

describe('validateProducerIdentity', () => {
  it('accepts a receipt joined to the owned producer and freeze', () => {
    expect(
      moduleUnderTest.validateProducerIdentity({
        producer,
        receipt,
        expectedMcpURL: 'http://localhost:6007/mcp',
        expectedFreezeId: 'freeze-1',
        expectedChildEpoch: receipt.childEpoch as {
          pid: number;
          createdAt: string;
        },
      })
    ).toEqual({ ok: true, errors: [] });
  });

  type Overrides = {
    receipt?: Record<string, unknown>;
    expectedMcpURL?: string;
    expectedFreezeId?: string;
    expectedChildEpoch?: { pid: number; createdAt: string };
  };

  it.each<[string, Overrides]>([
    ['wrong native URL', { expectedMcpURL: 'http://localhost:6006/mcp' }],
    ['different source freeze', { expectedFreezeId: 'freeze-2' }],
    [
      'missing child provenance',
      { receipt: { ...receipt, childEpoch: undefined } },
    ],
    [
      'PID reuse',
      {
        expectedChildEpoch: { pid: 101, createdAt: '2026-10-19T00:01:00.000Z' },
      },
    ],
  ])('rejects %s', (_name, overrides) => {
    expect(
      moduleUnderTest.validateProducerIdentity({
        producer,
        receipt: overrides.receipt ?? receipt,
        expectedMcpURL: overrides.expectedMcpURL ?? 'http://localhost:6007/mcp',
        expectedFreezeId: overrides.expectedFreezeId ?? 'freeze-1',
        expectedChildEpoch:
          overrides.expectedChildEpoch ??
          (receipt.childEpoch as { pid: number; createdAt: string }),
      })
    ).toMatchObject({ ok: false, errors: expect.any(Array) });
  });
});
