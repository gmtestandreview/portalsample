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
const runGuardedTest = async (body: () => void | Promise<void>): Promise<GuardedRun> => {
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

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** Explicit branch because `no-console` cannot resolve a computed `console[level]`. */
const emit = (level: GuardedConsoleLevel, message: string): void => {
    if (level === 'warn') {
        console.warn(message);

        return;
    }

    console.error(message);
};

const ARIA_LABEL_WARNING = 'If you do not provide a visible label, you must specify an aria-label or aria-labelledby attribute for accessibility';

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

describe('installUnexpectedConsoleGuard', () => {
    it('registers exactly one beforeEach and one afterEach so failures attach to the emitting test', () => {
        const hooks = captureHooks();

        expect(hooks.before).toHaveLength(1);
        expect(hooks.after).toHaveLength(1);
    });

    it('re-emits the original output verbatim', async () => {
        await runGuardedTest(() => {
            console.warn('render warning', { detail: 42 });
        });

        expect(warnSpy).toHaveBeenCalledWith('render warning', { detail: 42 });
    });

    it('restores the original console methods at teardown', async () => {
        const before = console.warn;

        await runGuardedTest(() => {});

        expect(console.warn).toBe(before);
    });

    it('passes when the test emits nothing', async () => {
        const { teardownError } = await runGuardedTest(() => {});

        expect(teardownError).toBeUndefined();
    });

    it('fails the emitting test on an unconsumed warning', async () => {
        const { teardownError } = await runGuardedTest(() => {
            console.warn('an unexpected warning');
        });

        expect(messageOf(teardownError)).toContain('an unexpected warning');
    });

    it('fails the emitting test on an unconsumed error', async () => {
        const { teardownError } = await runGuardedTest(() => {
            console.error('an unexpected error');
        });

        expect(messageOf(teardownError)).toContain('an unexpected error');
    });

    it('restores the console even when it fails at teardown', async () => {
        const before = console.warn;

        await runGuardedTest(() => {
            console.warn('an unexpected warning');
        });

        expect(console.warn).toBe(before);
    });

    it.each([
        ['warn', 'Warning: An update to Foo inside a test was not wrapped in act(...).'],
        ['warn', ARIA_LABEL_WARNING],
        ['error', '[env] Missing required runtime variable: REACT_APP_GA_TRACKINGID'],
    ] as const)('treats the known %s signature as unexpected when unconsumed', async (level, message) => {
        const { teardownError } = await runGuardedTest(() => {
            emit(level, message);
        });

        expect(messageOf(teardownError)).toContain(message);
    });
});

describe('console argument formatting', () => {
    /**
     * React 18 emits its act warning as a format string with `%s` placeholders,
     * so a pattern written against the text a human reads in the log only
     * matches if the guard interpolates first. Node `util.format` is not
     * available in Storybook browser mode, so the guard carries its own.
     */
    it.each([
        ['%s substitution', ['An update to %s was not wrapped', 'ComboBoxInner'], 'An update to ComboBoxInner was not wrapped'],
        ['%d substitution', ['retry %d of %d', 2, 3], 'retry 2 of 3'],
        ['%o substitution', ['payload %o', { id: 7 }], 'payload {"id":7}'],
        ['%% escape', ['coverage at 80%% of target'], 'coverage at 80% of target'],
        ['unconsumed placeholder', ['missing %s here'], 'missing %s here'],
        ['surplus arguments appended', ['a warning', 'extra', 1], 'a warning extra 1'],
        ['no format string', [{ id: 7 }, 'tail'], '{"id":7} tail'],
    ])('matches against the formatted message for %s', async (_label, args, expected) => {
        const { teardownError } = await runGuardedTest(() => {
            (console.warn as (...values: unknown[]) => void)(...args);
        });

        expect(messageOf(teardownError)).toContain(expected);
    });

    it('consumes a message whose pattern only matches after interpolation', async () => {
        const { bodyError, teardownError } = await runGuardedTest(async () => {
            await expectConsoleMessage('error', /An update to ComboBoxInner/, 1, () => {
                console.error('Warning: An update to %s inside a test was not wrapped in act(...).', 'ComboBoxInner');
            });
        });

        expect(bodyError).toBeUndefined();
        expect(teardownError).toBeUndefined();
    });
});

describe('expectConsoleMessage', () => {
    it('consumes a matching message so teardown passes', async () => {
        const { bodyError, teardownError } = await runGuardedTest(async () => {
            await expectConsoleMessage('warn', /not wrapped in act/, 1, () => {
                console.warn('Warning: An update to Foo was not wrapped in act(...).');
            });
        });

        expect(bodyError).toBeUndefined();
        expect(teardownError).toBeUndefined();
    });

    it('still re-emits a consumed message', async () => {
        await runGuardedTest(async () => {
            await expectConsoleMessage('warn', /not wrapped in act/, 1, () => {
                console.warn('Warning: not wrapped in act(...).');
            });
        });

        expect(warnSpy).toHaveBeenCalledWith('Warning: not wrapped in act(...).');
    });

    it('awaits an asynchronous action before counting', async () => {
        const { bodyError, teardownError } = await runGuardedTest(async () => {
            await expectConsoleMessage('warn', /late/, 1, async () => {
                await Promise.resolve();
                console.warn('a late warning');
            });
        });

        expect(bodyError).toBeUndefined();
        expect(teardownError).toBeUndefined();
    });

    it('consumes only the requested level, leaving the other level unexpected', async () => {
        const { bodyError, teardownError } = await runGuardedTest(async () => {
            await expectConsoleMessage('warn', /shared text/, 1, () => {
                console.error('shared text');
            });
        });

        expect(messageOf(bodyError)).toContain('expected 1');
        expect(messageOf(teardownError)).toContain('shared text');
    });

    it('consumes only the requested pattern, leaving other messages unexpected', async () => {
        const { bodyError, teardownError } = await runGuardedTest(async () => {
            await expectConsoleMessage('warn', /expected signature/, 1, () => {
                console.warn('expected signature');
                console.warn('a different warning');
            });
        });

        expect(bodyError).toBeUndefined();
        expect(messageOf(teardownError)).toContain('a different warning');
    });

    it('rejects when fewer messages match than the exact count requested', async () => {
        const { bodyError } = await runGuardedTest(async () => {
            await expectConsoleMessage('warn', /missing signature/, 1, () => {});
        });

        expect(messageOf(bodyError)).toContain('expected 1');
        expect(messageOf(bodyError)).toContain('got 0');
    });

    it('rejects when more messages match than the exact count requested', async () => {
        const { bodyError } = await runGuardedTest(async () => {
            await expectConsoleMessage('warn', /repeated signature/, 1, () => {
                console.warn('repeated signature');
                console.warn('repeated signature');
            });
        });

        expect(messageOf(bodyError)).toContain('expected 1');
        expect(messageOf(bodyError)).toContain('got 2');
    });

    it('rejects a nested expectation', async () => {
        const { bodyError } = await runGuardedTest(async () => {
            await expectConsoleMessage('warn', /outer/, 1, async () => {
                await expectConsoleMessage('warn', /inner/, 1, () => {});
            });
        });

        expect(messageOf(bodyError)).toMatch(/nest/i);
    });

    it('does not consume matching messages emitted after the action window', async () => {
        const { bodyError, teardownError } = await runGuardedTest(async () => {
            await expectConsoleMessage('warn', /windowed signature/, 1, () => {
                console.warn('windowed signature');
            });

            console.warn('windowed signature');
        });

        expect(bodyError).toBeUndefined();
        expect(messageOf(teardownError)).toContain('windowed signature');
    });

    it('clears the expectation in finally when the action throws, and stays usable afterwards', async () => {
        const actionFailure = new Error('action blew up');
        const { bodyError, teardownError } = await runGuardedTest(async () => {
            await expect(
                expectConsoleMessage('warn', /first/, 1, () => {
                    console.warn('first signature');
                    throw actionFailure;
                }),
            ).rejects.toBe(actionFailure);

            await expectConsoleMessage('warn', /second/, 1, () => {
                console.warn('second signature');
            });
        });

        expect(bodyError).toBeUndefined();
        expect(teardownError).toBeUndefined();
    });

    it('fails teardown when an expectation is still open', async () => {
        let release = () => {};
        const pending = new Promise<void>((resolve) => {
            release = resolve;
        });

        const { teardownError } = await runGuardedTest(() => {
            void expectConsoleMessage('warn', /never settles/, 1, () => pending).catch(() => {});

            return Promise.resolve();
        });

        release();

        expect(messageOf(teardownError)).toMatch(/open expectation|still open|leaked/i);
    });

    it('rejects when the guard was never installed for the current test', async () => {
        await expect(
            expectConsoleMessage('warn', /orphan/, 1, () => {}),
        ).rejects.toThrow(/installUnexpectedConsoleGuard/);
    });
});
