# Migration Verifier Scaffold

This folder turns the migration checklist and test plan into a concrete, portable verifier layout for the real application repository.

It is **not runnable in this snapshot** because this workspace has no root `package.json`, no test runner, and no .NET host project. The intent is:

1. Copy this folder into the real repo
2. Promote the config files to repo root or wire them into the existing test harness
3. Implement the fixture apps and route/page smoke flows
4. Run the verifier against React 19, TypeScript 6, and .NET 10 migrations

## Layout

```text
.github/migration-verifier/
  README.md
  playwright.config.ts
  vitest.config.ts
  jest.config.ts
  package.example.json
  scripts/
    verify-dotnet10.ps1
  fixtures/
    green/
      clean-react19/
      strictmode-clean/
      ts6-clean/
      dotnet10-clean/
    red/
      render-side-effects/
      broken-selector/
      bare-useref/
      loading-flicker/
      legacy-api-regression/
      dotnet10-host-regression/
    edge/
      partial-selector-fix/
      helper-hidden-side-effect/
      fake-useref-fix/
      helper-loading-race/
      unstable-listener-cleanup/
      strictmode-remount-duplication/
      relaxed-tsconfig/
      publish-only-host-failure/
  tests/
    static/
      checklist.static.spec.ts
    runtime/
      checklist.runtime.spec.ts
    host/
      checklist.host.spec.ts
```

## Runner Split

- `Vitest`: static verifier and lightweight source-contract tests
- `Playwright`: runtime and browser behavior verification under `StrictMode`
- `Jest`: optional if the real repo already uses Jest; otherwise prefer Vitest
- `PowerShell + dotnet`: host-side build/publish/auth/SSR checks

## Suggested Commands In The Real Repo

```bash
pnpm vitest run -c .github/migration-verifier/vitest.config.ts
pnpm playwright test -c .github/migration-verifier/playwright.config.ts
pnpm jest -c .github/migration-verifier/jest.config.ts
powershell -ExecutionPolicy Bypass -File .github/migration-verifier/scripts/verify-dotnet10.ps1
```

## Mapping To The Checklist

- `tests/static/checklist.static.spec.ts`
  - Phase 1
  - Phase 2 source-shape checks
- `tests/runtime/checklist.runtime.spec.ts`
  - Phase 2 runtime behavior
  - Phase 4 `StrictMode` and flow checks
- `tests/host/checklist.host.spec.ts`
  - wraps or asserts output from `verify-dotnet10.ps1`
  - Phase 5/6 repo and host integration checks

## Fixture Intent

### `fixtures/green`

Known-good migration states. These should pass.

### `fixtures/red`

Known-bad migration states. These should fail a targeted checklist phase.

### `fixtures/edge`

Devil's-advocate partial fixes or deceptive fixes. These should also fail.

## Integration Guidance

- If the real repo already has Vitest, Playwright, or Jest conventions, merge these files into existing root config instead of duplicating runners.
- Keep the verifier tests isolated from feature tests.
- Prefer AST-based static assertions over regex-only checks when practical.

## Minimum Success Criteria

- All green fixtures pass
- All red fixtures fail for the intended reason
- All edge fixtures fail until the verifier is intentionally weakened
- Host script validates `dotnet build`, `dotnet publish`, auth wiring, and SSR/prerender if used
