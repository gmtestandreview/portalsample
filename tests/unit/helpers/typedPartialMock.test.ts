import { describe, expect, it, vi } from 'vitest';

interface ExampleModule {
  default: { ready: boolean };
  knownExport: (value: string) => number;
}

const validMock = {
  knownExport: vi.fn<(value: string) => number>(),
} satisfies __ExactMockModule<ExampleModule>;

describe('typed mock module shapes', () => {
  it('accepts known exports', () => {
    expect.hasAssertions();

    expect(validMock.knownExport).toBeDefined();
  });

  it('rejects renamed exports at compile time', () => {
    expect.hasAssertions();

    const invalidMock = {
      // @ts-expect-error Deliberately prove that unknown export names are rejected.
      renamedExport: vi.fn<() => void>(),
    } satisfies __ExactMockModule<ExampleModule>;

    expect(invalidMock).toBeDefined();
  });
});
