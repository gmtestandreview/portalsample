---
name: test-context-fixtures
description: Test context, custom fixtures with test.extend
---

# Test Context & Fixtures

**Load when:** Build or use Vitest test fixtures, scopes and context hooks. **Boundary:** Do not use deprecated test.scoped where test.override is available.
 These are generic Vitest examples; inspect the installed version and
 applicable project config before applying them.

**Expected outcome:** Fixtures provide scoped values and guaranteed teardown. **Acceptance check:** Check lazy/auto behavior, scope hierarchy and `test.override` only where supported.

## Built-in Context

Every test receives context as first argument:

```ts
test('context', ({ task, expect, skip }) => {
  console.log(task.name); // Test name
  expect(1).toBe(1); // Context-bound expect
  skip(); // Skip test dynamically
});
```

### Context Properties

- `task` - Test metadata (name, file, etc.)
- `expect` - Expect bound to this test (important for concurrent tests)
- `skip(condition?, message?)` - Skip the test
- `onTestFinished(fn)` - Cleanup after test
- `onTestFailed(fn)` - Run on failure only

## Custom Fixtures with test.extend

Create reusable test utilities:

```ts
import { test as base } from 'vitest';

// Define fixture types
interface Fixtures {
  db: Database;
  user: User;
}

// Create extended test
export const test = base.extend<Fixtures>({
  // Fixture with setup/teardown
  db: async ({}, use) => {
    const db = await createDatabase();
    await use(db); // Provide to test
    await db.close(); // Cleanup
  },

  // Fixture depending on another fixture
  user: async ({ db }, use) => {
    const user = await db.createUser({ name: 'Test' });
    await use(user);
    await db.deleteUser(user.id);
  },
});
```

Using fixtures:

```ts
test('query user', async ({ db, user }) => {
  const found = await db.findUser(user.id);
  expect(found).toEqual(user);
});
```

## Fixture Initialization

Fixtures only initialize when accessed:

```ts
const test = base.extend({
  expensive: async ({}, use) => {
    console.log('initializing'); // Only runs if test uses it
    await use('value');
  },
});

test('no fixture', () => {}); // expensive not called
test('uses fixture', ({ expensive }) => {}); // expensive called
```

## Auto Fixtures

Run fixture for every test:

```ts
const test = base.extend({
  setup: [
    async ({}, use) => {
      await globalSetup();
      await use();
      await globalTeardown();
    },
    { auto: true }, // Always run
  ],
});
```

## Scoped Fixtures

File- and worker-scoped fixtures may depend only on equal or longer-lived
fixtures, never test-scoped context; verify scope access when composing.

### File Scope

Initialize once per file:

```ts
const test = base.extend({
  connection: [
    async ({}, use) => {
      const conn = await connect();
      await use(conn);
      await conn.close();
    },
    { scope: 'file' },
  ],
});
```

### Worker Scope

Initialize once per worker:

```ts
const test = base.extend({
  sharedResource: [
    async ({}, use) => {
      await use(globalResource);
    },
    { scope: 'worker' },
  ],
});
```

## Injected Fixtures (from Config)

Override fixtures per project:

```ts
// test file
const test = base.extend({
  apiUrl: ['/default', { injected: true }],
});

// vitest.config.ts
defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'prod',
          provide: { apiUrl: 'https://api.prod.com' },
        },
      },
    ],
  },
});
```

## Scoped Values per Suite

In Vitest 5 use `test.override()` for suite-local fixture values;
`test.scoped()` is deprecated. Scope applies within the enclosing suite,
not globally.

Override fixture for specific suite:

```ts
const test = base.extend({
  environment: 'development',
});

describe('production tests', () => {
  test.override({ environment: 'production' });

  test('uses production', ({ environment }) => {
    expect(environment).toBe('production');
  });
});

test('uses default', ({ environment }) => {
  expect(environment).toBe('development');
});
```

## Extended Test Hooks

Type-aware hooks with fixtures:

```ts
const test = base.extend<{ db: Database }>({
  db: async ({}, use) => {
    const db = await createDb();
    await use(db);
    await db.close();
  },
});

// Hooks know about fixtures
test.beforeEach(({ db }) => {
  db.seed();
});

test.afterEach(({ db }) => {
  db.clear();
});
```

## Composing Fixtures

Extend from another extended test:

```ts
// base-test.ts
export const test = base.extend<{ db: Database }>({
  db: async ({}, use) => {
    /* ... */
  },
});

// admin-test.ts
import { test as dbTest } from './base-test';

export const test = dbTest.extend<{ admin: User }>({
  admin: async ({ db }, use) => {
    const admin = await db.createAdmin();
    await use(admin);
  },
});
```

## Key Points

- Use `{ }` destructuring to access fixtures
- Ordinary fixtures are lazy; `{ auto: true }` opts out of lazy initialization
- In object-syntax fixtures, put teardown **after** `await use(value)`;
  for builder-style fixtures, register cleanup using `onCleanup`
- Use `{ auto: true }` for setup fixtures
- Use `{ scope: 'file' }` for expensive shared resources
- Fixtures compose - extend from extended tests

<!--
Source references:
- https://vitest.dev/guide/test-context.html
-->
