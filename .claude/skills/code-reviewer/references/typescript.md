# TypeScript and JavaScript Review Guide

Use this guide for TypeScript, JavaScript, Node.js, browser code, type safety, async behavior, and package changes.

## Type Safety

- [ ] Avoid `any`; prefer precise types or `unknown` with narrowing.
- [ ] Public boundaries have explicit input and output types.
- [ ] Optional values are handled before use.
- [ ] Type assertions are rare and justified.
- [ ] Discriminated unions model state machines and variants.
- [ ] Runtime validation exists for untrusted data; TypeScript types alone do not validate runtime input.

```ts
type Result =
  | { status: 'success'; value: string }
  | { status: 'error'; message: string };
```

## Null and Undefined

- [ ] Strict null assumptions are respected.
- [ ] Optional chaining is not used to hide required data unexpectedly.
- [ ] Defaults are chosen deliberately.
- [ ] Empty string, zero, false, null, and undefined are not conflated.

```ts
const count = input.count ?? 10;
```

## Async and Promises

- [ ] Promises are awaited or returned.
- [ ] Parallel work uses `Promise.all` or a bounded concurrency pattern intentionally.
- [ ] Errors from async work are handled.
- [ ] Cancellation or stale-result protection exists for user-driven requests.
- [ ] Timers, intervals, and subscriptions are cleaned up.

```ts
await Promise.all(items.map((item) => save(item)));
```

## Runtime Validation

- [ ] API, form, message, storage, and environment inputs are parsed and validated.
- [ ] Validation errors are surfaced consistently.
- [ ] Unknown fields are rejected or ignored intentionally.
- [ ] Backend and frontend validation do not contradict each other.

## JavaScript Runtime Pitfalls

- Equality: prefer `===` and `!==`.
- Numeric parsing: handle `NaN`.
- Dates: handle time zones and invalid dates.
- Object iteration: avoid depending on order unless specified.
- Mutation: do not mutate shared inputs unexpectedly.
- Prototype pollution: avoid merging untrusted objects into plain objects.

## Node.js

- [ ] File paths from users are normalized and constrained.
- [ ] Child processes avoid shell interpolation with untrusted input.
- [ ] Streams are used for large files.
- [ ] Environment variables are validated at startup.
- [ ] Server startup fails fast on invalid critical configuration.
- [ ] Resource cleanup occurs on shutdown.

## Package and Build Changes

- [ ] New dependencies are necessary, maintained, and not already available.
- [ ] Lockfile changes match `package.json`.
- [ ] Build output or generated files are intentionally included or excluded.
- [ ] ESM/CommonJS changes are compatible with the runtime and tooling.
- [ ] Tree-shaking and bundle impact are considered for frontend dependencies.

## Tests

- [ ] Unit tests cover edge cases and error paths.
- [ ] Integration tests cover API boundaries and serialization.
- [ ] Async tests await the behavior under test.
- [ ] Fake timers are advanced and restored correctly.
- [ ] Type-level tests are used when the API depends on compile-time behavior.

## Security

- [ ] Input used in HTML, URLs, SQL, shell commands, or file paths is safely handled.
- [ ] Secrets are not exposed to browser bundles or logs.
- [ ] CORS, cookies, and CSRF behavior are intentional.
- [ ] Dependencies and install scripts are reviewed when changed.
