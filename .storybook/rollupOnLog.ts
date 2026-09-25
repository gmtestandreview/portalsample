export type RollupLog = { code?: string; message?: string };
export type RollupLogHandler = (level: string, log: RollupLog) => void;

/**
 * Rollup/Rolldown log filter for the Storybook build (`viteFinal` →
 * `build.rollupOptions.onLog`). It drops two classes of noise we cannot act on
 * and that have no functional effect, and forwards everything else untouched so
 * no first-party warning or error can be swallowed:
 *
 *  - vendor `INVALID_ANNOTATION` — the Application Insights ES5 builds put a
 *    pure-call annotation inside parentheses before a string literal. Rolldown
 *    (Vite 8's bundler) reports it but cannot act on it. Gated on `node_modules`
 *    appearing in the message, so a first-party annotation problem still
 *    surfaces. Mirrors the Sass `quietDeps` layer.
 *  - `PLUGIN_TIMINGS` — opt-in perf-timing output, INFO level.
 *
 * Extracted from `main.ts` so the pass-through guarantee is unit-tested
 * directly (see `tests/unit/storybook/rollupOnLog.test.ts`) rather than
 * asserted textually against the config source.
 */
export function onLog(
  level: string,
  log: RollupLog,
  handler: RollupLogHandler,
): void {
  const isVendorPureNoise =
    log.code === 'INVALID_ANNOTATION' &&
    (log.message ?? '').includes('node_modules');

  if (isVendorPureNoise || log.code === 'PLUGIN_TIMINGS') {
    return;
  }

  handler(level, log);
}
