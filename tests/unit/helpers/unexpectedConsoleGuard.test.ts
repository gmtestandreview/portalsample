import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  expectConsoleMessage,
  installUnexpectedConsoleGuard,
  type GuardedConsoleLevel,
} from '../../helpers/unexpectedConsoleGuard';

/**
 * Contract tests for the Task C1 unexpected-console guard.
 *
 * The guard has to fail the *emitting* test, which means its check runs in an
 * `afterEach`. A test that deliberately emits an unconsumed warning would
 * therefore fail itself, so `installUnexpectedConsoleGuard` accepts the hook
 * registrar as an argument. These tests capture the real callbacks the guard
 * would register with Vitest and drive them by hand, so the production code
 * path is exercised rather than a parallel reimplementation.
 */

type CapturedHooks = {
  before: Array<() => void>;
  after: Array<() => void>;
};

/** Registers the guard against a fake registrar and returns its callbacks. */
const captureHooks = (): CapturedHooks => {
  const captured: CapturedHooks = { before: [], after: [] };

  installUnexpectedConsoleGuard({
    beforeEach: (fn) => captured.before.push(fn),
    afterEach: (fn) => captured.after.push(fn),
  });

  return captured;
};

type GuardedRun = {
  bodyError: unknown;
  teardownError: unknown;
};

/**
 * Simulates one guarded test: run the registered `beforeEach`, run `body`, then
 * run the registered `afterEach`. Both phases capture rather than propagate, so
 * an assertion can inspect which phase failed.
 */
const runGuardedTest = async (
  body: () => void | Promise<void>,
): Promise<GuardedRun> => {
  const hooks = captureHooks();
  let bodyError: unknown;
  let teardownError: unknown;

  hooks.before.forEach((fn) => fn());

  try {
    await body();
  } catch (error) {
    bodyError = error;
  }

  try {
    hooks.after.forEach((fn) => fn());
  } catch (error) {
    teardownError = error;
  }

  return { bodyError, teardownError };
};

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** Explicit branch because `no-console` cannot resolve a computed `console[level]`. */
const emit = (level: GuardedConsoleLevel, message: string): void => {
  if (level === 'warn') {
    console.warn(message);

    return;
  }

  console.error(message);
};

const ARIA_LABEL_WARNING =
  'If you do not provide a visible label, you must specify an aria-label or aria-labelledby attribute for accessibility';

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // The guard patches over these spies, so re-emitted output lands here
  // instead of the terminal, keeping this suite own output pristine.
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe(installUnexpectedConsoleGuard, () => {
  it('registers exactly one beforeEach and one afterEach so failures attach to the emitting test', () => {
    expect.assertions(2);
    const hooks = captureHooks();

    expect(hooks.before).toHaveLength(1);
    expect(hooks.after).toHaveLength(1);
  });
});

describe(installUnexpectedConsoleGuard, () => {
  it('re-emits the original output verbatim', async () => {
    expect.assertions(1);
    await runGuardedTest(() => {
      console.warn('render warning', { detail: 42 });
    });

    expect(warnSpy).toHaveBeenCalledWith('render warning', { detail: 42 });
  });
});

describe(installUnexpectedConsoleGuard, () => {
  it('restores the original console methods at teardown', async () => {
    expect.assertions(1);
    const before = console.warn;

    await runGuardedTest(() => {});

    expect(console.warn).toBe(before);
  });
});

describe(installUnexpectedConsoleGuard, () => {
  it('passes when the test emits nothing', async () => {
    expect.assertions(1);
    const { teardownError } = await runGuardedTest(() => {});

    expect(teardownError).toBeUndefined();
  });
});
