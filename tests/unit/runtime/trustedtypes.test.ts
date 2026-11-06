import { describe, expect, it, vi } from 'vitest';
import { defined } from '../helpers/defined';

const mocks = vi.hoisted(() => ({
  sanitize: vi.fn<(value: string) => string>(
    (value: string) => `sanitized:${value}`,
  ),
}));

vi.mock(
  import('dompurify') as unknown as string,
  () =>
    ({
      default: {
        sanitize: mocks.sanitize,
      },
    }) satisfies __ExactMockModule<__TestMockModule159>,
);

describe('trustedTypes', () => {
  const resetTrustedTypes = () => {
    delete (globalThis as { trustedTypes?: unknown }).trustedTypes;
    vi.restoreAllMocks();
  };

  it('creates a default trusted types policy that sanitizes HTML and script URLs', async () => {
    expect.hasAssertions();

    const createPolicy = vi.fn<
      (
        name: string,
        policy: {
          createScriptURL: (value: string) => string;
          createHTML: (value: string) => string;
          createScript: () => never;
        },
      ) => {
        createScriptURL: (value: string) => string;
        createHTML: (value: string) => string;
        createScript: () => never;
      }
    >();
    (
      globalThis as { trustedTypes?: { createPolicy: typeof createPolicy } }
    ).trustedTypes = { createPolicy };
    const { TrustedTypes } =
      await import('../../../ClientApp/src/trustedtypes');

    TrustedTypes.createTrustedTypePolicy();

    const expectedPolicy: Record<string, unknown> = {
      createScriptURL: expect.any(Function),
      createHTML: expect.any(Function),
      createScript: expect.any(Function),
    };

    expect(createPolicy).toHaveBeenCalledWith('default', expectedPolicy);

    const [, policy] = defined(createPolicy.mock.calls[0], 'createPolicy call');

    expect(policy.createScriptURL('https://example.test/script.js')).toBe(
      'sanitized:https://example.test/script.js',
    );
    expect(policy.createHTML('<p>Hello</p>')).toBe('sanitized:<p>Hello</p>');
    expect(() => policy.createScript()).toThrow(
      'Inline script creation is not allowed',
    );

    resetTrustedTypes();
  });

  it('does nothing when trusted types are unavailable', async () => {
    expect.hasAssertions();

    const { TrustedTypes } =
      await import('../../../ClientApp/src/trustedtypes');

    expect(() => {
      TrustedTypes.createTrustedTypePolicy();
    }).not.toThrow();

    resetTrustedTypes();
  });
});
