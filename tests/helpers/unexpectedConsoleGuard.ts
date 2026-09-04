import { afterEach as vitestAfterEach, beforeEach as vitestBeforeEach } from 'vitest';

/**
 * Unexpected-console guard for Task C1.
 *
 * Any `console.warn` or `console.error` emitted during a guarded test fails
 * *that* test unless a surrounding `expectConsoleMessage` claimed it. Output is
 * always re-emitted, so CI logs keep the original message.
 *
 * This module deliberately does not install itself. Task C7 owns wiring it into
 * `vitest.setup.ts` and `vitest.storybook.setup.ts`, and only once every owner
 * named in `reports/stabilisation/warnings.md` is clean.
 *
 * It runs in jsdom and in Storybook browser mode, so it uses no Node built-ins.
 */

export type GuardedConsoleLevel = 'warn' | 'error';

/** The subset of the Vitest hook API the guard needs, injectable for testing. */
export type ConsoleGuardHooks = {
    beforeEach: (fn: () => void) => void;
    afterEach: (fn: () => void) => void;
};

type CapturedMessage = {
    level: GuardedConsoleLevel;
    text: string;
    consumed: boolean;
};

type ActiveExpectation = {
    level: GuardedConsoleLevel;
    pattern: RegExp;
    matched: number;
};

type GuardState = {
    captured: CapturedMessage[];
    original: Record<GuardedConsoleLevel, (...args: unknown[]) => void>;
    expectation: ActiveExpectation | null;
};

const GUARDED_LEVELS: readonly GuardedConsoleLevel[] = ['warn', 'error'];

/** Hoisted so the default parameter is not a fresh object literal (S7737). */
const VITEST_HOOKS: ConsoleGuardHooks = {
    beforeEach: vitestBeforeEach,
    afterEach: vitestAfterEach,
};

/** Only one guard is active at a time - a test file installs it once. */
let state: GuardState | null = null;

const stringify = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return value.stack ?? `${value.name}: ${value.message}`;
    // Each non-object kind is narrowed positively rather than by excluding
    // `object`, so no branch can reach `String()` with a value that would
    // collapse to "[object Object]" and lose detail the census needs (S6551).
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
    if (typeof value === 'symbol') return value.toString();
    if (typeof value === 'function') return value.name === '' ? '[Function]' : `[Function ${value.name}]`;

    try {
        return JSON.stringify(value) ?? '[unserialisable]';
    } catch {
        return '[unserialisable]';
    }
};

/**
 * A `util.format`-compatible subset. `node:util` is unavailable in Storybook
 * browser mode, and React 18 emits its act warning as a `%s` format string, so
 * the guard has to interpolate before a pattern can match what the log shows.
 */
export const formatConsoleArguments = (args: readonly unknown[]): string => {
    if (args.length === 0) return '';

    const [first, ...rest] = args;

    if (typeof first !== 'string') return args.map(stringify).join(' ');

    let consumedArgs = 0;
    const formatted = first.replace(/%[sdifjoO%]/g, (token) => {
        if (token === '%%') return '%';
        if (consumedArgs >= rest.length) return token;

        const value = rest[consumedArgs];
        consumedArgs += 1;

        switch (token) {
            case '%d':
            case '%f':
                return String(Number(value));
            case '%i':
                return String(Number.parseInt(stringify(value), 10));
            default:
                return stringify(value);
        }
    });

    return [formatted, ...rest.slice(consumedArgs).map(stringify)].join(' ');
};

const requireState = (caller: string): GuardState => {
    if (state === null) {
        throw new Error(
            `${caller} requires an active guard. Call installUnexpectedConsoleGuard() at the top of the test file.`,
        );
    }

    return state;
};

const describeUnconsumed = (messages: readonly CapturedMessage[]): string => messages
    .map(({ level, text }, index) => `  ${index + 1}. console.${level}: ${text}`)
    .join('\n');

/**
 * Assigns by explicit branch rather than `console[level]`. The repository's
 * `no-console` rule allows `warn` and `error` by name, and a computed key
 * defeats that check, so the loop is unrolled here instead of suppressed.
 */
const setConsoleMethod = (level: GuardedConsoleLevel, fn: (...args: unknown[]) => void): void => {
    if (level === 'warn') {
        console.warn = fn;

        return;
    }

    console.error = fn;
};

const start = (): void => {
    // Kept unbound so teardown restores the identical reference. Binding here
    // would leave a fresh wrapper in place of the original, which stacks across
    // install cycles and defeats a consumer's `vi.restoreAllMocks()`.
    const original = {
        warn: console.warn as (...args: unknown[]) => void,
        error: console.error as (...args: unknown[]) => void,
    };

    const active: GuardState = { captured: [], original, expectation: null };

    GUARDED_LEVELS.forEach((level) => {
        setConsoleMethod(level, (...args: unknown[]): void => {
            const text = formatConsoleArguments(args);
            const { expectation } = active;
            const claimed = expectation !== null
                && expectation.level === level
                && expectation.pattern.test(text);

            if (claimed && expectation !== null) expectation.matched += 1;

            active.captured.push({ level, text, consumed: claimed });

            // Re-emit so the original output still reaches the reporter.
            original[level].apply(console, args);
        });
    });

    state = active;
};

const stop = (): { unconsumed: CapturedMessage[]; openExpectation: ActiveExpectation | null } => {
    const active = requireState('The unexpected-console guard teardown');

    try {
        GUARDED_LEVELS.forEach((level) => {
            setConsoleMethod(level, active.original[level]);
        });

        return {
            unconsumed: active.captured.filter((message) => !message.consumed),
            openExpectation: active.expectation,
        };
    } finally {
        state = null;
    }
};

/**
 * Registers the guard for every test in the calling file.
 *
 * The check runs in `afterEach` so an unexpected message fails the test that
 * emitted it rather than a later one. `hooks` is injectable so the guard's own
 * contract tests can drive that lifecycle without failing themselves.
 */
export function installUnexpectedConsoleGuard(
    hooks: ConsoleGuardHooks = VITEST_HOOKS,
): void {
    hooks.beforeEach(start);

    hooks.afterEach(() => {
        const { unconsumed, openExpectation } = stop();

        if (openExpectation !== null) {
            throw new Error(
                'Unexpected console guard: an open expectation leaked past the test. '
                + `Awaiting expectConsoleMessage('${openExpectation.level}', ${String(openExpectation.pattern)}) `
                + 'is required before the test ends.',
            );
        }

        if (unconsumed.length > 0) {
            throw new Error(
                `Unexpected console output (${unconsumed.length}). Fix the owner, or claim it with `
                + `expectConsoleMessage(...):\n${describeUnconsumed(unconsumed)}`,
            );
        }
    });
}

/**
 * Claims exactly `count` messages at `level` matching `pattern`, emitted while
 * `action` runs. Messages outside that window, at another level, or not
 * matching stay unexpected and fail the test at teardown.
 */
export async function expectConsoleMessage(
    level: GuardedConsoleLevel,
    pattern: RegExp,
    count: number,
    action: () => void | Promise<void>,
): Promise<void> {
    const active = requireState('expectConsoleMessage');

    if (active.expectation !== null) {
        throw new Error(
            'expectConsoleMessage cannot be nested. Await the outer expectation before opening another.',
        );
    }

    const expectation: ActiveExpectation = { level, pattern, matched: 0 };

    active.expectation = expectation;

    try {
        await action();
    } finally {
        active.expectation = null;
    }

    if (expectation.matched !== count) {
        throw new Error(
            `expectConsoleMessage(${String(pattern)}) on console.${level}: `
            + `expected ${count}, got ${expectation.matched}.`,
        );
    }
}
