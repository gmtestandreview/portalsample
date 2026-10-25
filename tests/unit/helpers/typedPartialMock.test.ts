import { describe, expect, it, vi } from 'vitest';

interface ExampleModule {
  default: { ready: boolean };
  knownExport: (value: string) => number;
}

const validMock = {
  knownExport: vi.fn(),
} satisfies __ExactMockModule<ExampleModule>;

describe('typed mock module shapes', () => {
  it('accepts known exports', () => {
    expect(validMock.knownExport).toBeDefined();
  });

  it('rejects renamed exports at compile time', () => {
    const invalidMock = {
      // @ts-expect-error Deliberately prove that unknown export names are rejected.
      renamedExport: vi.fn(),
    } satisfies __ExactMockModule<ExampleModule>;

    expect(invalidMock).toBeDefined();
  });
});
