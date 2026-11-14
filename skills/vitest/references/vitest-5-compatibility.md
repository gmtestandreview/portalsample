# Vitest 5.0.5 compatibility guard

**Load when:** a request is about Vitest 5 (including the supplied `nmi-portal`
project), migration, concurrency, Browser Mode, coverage, or any possibly
obsolete API in an older reference. Check the actual installed version where
available; the package manifest pins `5.0.5` but cannot prove installation. This
file records version-specific _constraints_, not current project policy.

## Reject known removed constructs

| Do not recommend for Vitest 5.0.5                                                                                                     | Supported replacement / decision                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test.sequential(...)`, `describe.sequential(...)`, or `sequential: true`                                                             | `test(name, { concurrent: false }, fn)` or `describe(name, { concurrent: false }, fn)` to opt out of inherited concurrency                              |
| `test.poolOptions` / `poolOptions.threads.maxThreads`, `poolOptions.forks.maxForks`                                                   | Top-level `test.maxWorkers` and `test.pool`; use `test.isolate` when needed                                                                             |
| `test.minWorkers`                                                                                                                     | Removed in Vitest 4; `maxWorkers` is supported                                                                                                          |
| `coverage.all` / `coverage.extensions`                                                                                                | Explicit `coverage.include` and `coverage.exclude`; an include glob can report uncovered eligible files                                                 |
| `browser: { name: 'chromium', provider: 'playwright' }`                                                                               | Browser Mode `provider: playwright({})` imported from `@vitest/browser-playwright`, `instances: [{ browser: 'chromium' }]`, and `enabled: true`         |
| Removed entrypoints `vitest/coverage`, `vitest/reporters`, `vitest/environments`, `vitest/snapshot`, `vitest/runners`, `vitest/suite` | Use current documented `vitest/node`, `vitest/runtime`, or `vitest` exports **only for the specific API**; verify the actual replacement before editing |

These removals are supported by the official Vitest 4 and 5 migration guides. Do
not take a removed API appearing in a generated January 2026 reference as
evidence that it works in the supplied November 2026 dependency set.

## Other Vitest 5 behavior changes worth checking

- **Hoisted mocks:** `vi.mock`, `vi.unmock`, and `vi.hoisted` must be
  module-top-level calls in Vitest 5; use `vi.doMock` for dynamic calls.
- **Clear mocks:** `clearMocks` defaults to `true` in Vitest 5 (call history
  clears between tests, implementation does not).
- **Project inheritance:** inline projects inherit root config by default
  (`extends: true`); projects referenced as config files/directories do not.
- **Tags:** tags are config-defined objects with `name`; `strictTags` defaults
  to true. Use `--tags-filter` for CLI filtering, not `--tags`.
- **Fixtures:** prefer `test.override()` over deprecated `test.scoped()`;
  object-syntax fixture cleanup belongs after `await use(value)`.

- **Async assertions:** `resolves`, `rejects`, and asynchronous
  `toMatchFileSnapshot` assertions must be awaited. Vitest 5 fails tests for
  unawaited async assertions rather than merely warning.
- **Browser text assertions:** Vitest Browser Mode's
  `expect.element(...).toHaveTextContent(...)` uses exact text equality;
  `toMatchTextContent` covers partial text and regex matching. Do not conflate
  this with jsdom plus jest-dom's matchers.
- **Browser locator matching:** Browser Mode locators default to exact matching.
- **Coverage globs:** `coverage.include` and `exclude` match relative to the
  project root more precisely; inspect the actual included-file set. Top-level
  `thresholds.perFile` does not automatically apply to glob-specific thresholds
  in Vitest 5.
- **Config discovery:** Vitest 5 does not search parent directories for config
  files when launched from a subdirectory; select the intended config.
- **Version fallback:** when a detail is not established by the 5.0.5 API or
  installed typings, consult official version-appropriate docs and report an
  unresolved gap if unavailable. Current _latest_ docs may include APIs
  introduced after 5.0.5 (for example pages marked `5.1.0+`).

## Minimal verified configuration shapes

```ts
// Vitest 5 — concurrency
defineConfig({
  test: { pool: 'forks', maxWorkers: 2 },
});
```

```ts
// Vitest 5 — Browser Mode; do not substitute for @playwright/test BDD
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({}),
      instances: [{ browser: 'chromium' }],
    },
  },
});
```

```ts
// Vitest 5 — eligible uncovered files with explicit include
defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', '**/*.test.{ts,tsx}'],
    },
  },
});
```

Generic examples above are **not** replacements for project configurations.

## Sources and boundary

- [Vitest 5 migration](https://vitest.dev/guide/migration/)
- [Vitest 4 migration (pool and coverage changes)](https://v4.vitest.dev/guide/migration.html)
- [Vitest Browser Mode provider](https://vitest.dev/config/browser/provider)
- [Vitest parallelism](https://vitest.dev/guide/parallelism.html)
- [Vitest coverage config](https://vitest.dev/config/coverage)
- [Vitest Browser Mode](https://vitest.dev/guide/browser/)
- [Official guide](https://vitest.dev/guide/)
- [Test tags](https://vitest.dev/guide/test-tags)
- [Test context and fixtures](https://vitest.dev/guide/test-context)
- [Test projects](https://vitest.dev/guide/projects)

The linked live guide and migration pages were reviewed on 2026-11-06. Any
source documented as newer than the target version must be gated. The installed
Vitest 5.0.5 package and typings were not available for executable confirmation;
API examples remain subject to runtime validation.
