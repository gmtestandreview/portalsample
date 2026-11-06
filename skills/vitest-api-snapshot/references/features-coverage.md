---
name: code-coverage
description: Code coverage with V8 or Istanbul providers
---

# Code Coverage

**Load when:** Configure Vitest coverage providers, globs, reports or thresholds. **Boundary:** Do not reduce existing coverage or silently enable auto-update.
 These are generic Vitest examples; inspect the installed version and
 applicable project config before applying them.

**Expected outcome:** Reports contain intended source files and thresholds remain enforced. **Acceptance check:** Check included and excluded files, relevant reporter outputs, and four metrics where locally required.

## Setup

```bash
# Run tests with coverage
vitest run --coverage
```

## Configuration

```ts
// vitest.config.ts
defineConfig({
  test: {
    coverage: {
      // Provider: 'v8' (default, faster) or 'istanbul' (more compatible)
      provider: 'v8',

      // Enable coverage
      enabled: true,

      // Reporters
      reporter: ['text', 'json', 'html'],

      // Files to include
      include: ['src/**/*.{ts,tsx}'],

      // Files to exclude
      exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.test.ts'],

      // Explicit include above also reports matching uncovered source files.
      // Vitest 4+ removed coverage.all.

      // Thresholds
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

## Providers

### V8 (Default)

```bash
npm i -D @vitest/coverage-v8
```

- Faster, no pre-instrumentation
- Uses V8's native coverage
- Recommended for most projects

### Istanbul

```bash
npm i -D @vitest/coverage-istanbul
```

- Pre-instruments code
- Works in any JS runtime
- More overhead but widely compatible

## Reporters

```ts
coverage: {
  reporter: [
    'text',           // Terminal output
    'text-summary',   // Summary only
    'json',           // JSON file
    'html',           // HTML report
    'lcov',           // For CI tools
    'cobertura',      // XML format
  ],
  reportsDirectory: './coverage',
}
```

## Thresholds

Fail tests if coverage is below threshold:

```ts
coverage: {
  thresholds: {
    // Global thresholds
    lines: 80,
    functions: 75,
    branches: 70,
    statements: 80,

    // Per-file thresholds
    perFile: true,

    // Threshold auto-update is deliberately off unless policy explicitly permits it.
    autoUpdate: false,
  },
}
```

## Ignoring Code

### V8

```ts
/* v8 ignore next -- @preserve */
function ignored() {
  return 'not covered';
}

/* v8 ignore start -- @preserve */
// All code here ignored
/* v8 ignore stop -- @preserve */
```

### Istanbul

```ts
/* istanbul ignore next -- @preserve */
function ignored() {}

/* istanbul ignore if -- @preserve */
if (condition) {
  // ignored
}
```

Note: `@preserve` keeps comments through esbuild.

## Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:coverage:watch": "vitest --coverage"
  }
}
```

## Vitest UI Coverage

Enable HTML coverage in Vitest UI:

```ts
coverage: {
  enabled: true,
  reporter: ['text', 'html'],
}
```

Run with `vitest --ui` to view coverage visually.

## CI Integration

```yaml
# GitHub Actions
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Coverage with Sharding

Merge coverage from sharded runs:

```bash
vitest run --shard=1/3 --coverage --reporter=blob
vitest run --shard=2/3 --coverage --reporter=blob
vitest run --shard=3/3 --coverage --reporter=blob

vitest --merge-reports --coverage --reporter=json
```

## Key Points

- V8 is faster, Istanbul is more compatible
- Use `--coverage` flag or `coverage.enabled: true`
- Set `coverage.include` to include eligible uncovered source files; never use removed `coverage.all`
- Set thresholds to enforce minimum coverage; never lower thresholds,
  change exclusions, or enable threshold auto-update merely to produce green CI
- In Vitest 5 inspect actual included-file sets after coverage glob changes
- Use `@preserve` comment to keep ignore hints

<!--
Source references:
- https://vitest.dev/guide/coverage.html
-->
