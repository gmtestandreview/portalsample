# Go Review Guide

Use this guide for Go code reviews, with emphasis on error handling, concurrency, and resource lifecycle.

## Error Handling

- [ ] Error returns are checked, not discarded with `_`, on non-trivial paths.
- [ ] Errors are wrapped with context (`fmt.Errorf("...: %w", err)`) rather than returned bare.
- [ ] Sentinel errors are compared with `errors.Is`; typed errors with `errors.As`.

```go
if err != nil {
    return fmt.Errorf("load user %s: %w", id, err)
}
```

## Concurrency

- [ ] Goroutines have a clear termination/cancellation path — `context.Context` is propagated and honored.
- [ ] No goroutine leaks: channels are closed by the sender; receivers do not block forever.
- [ ] Shared state is protected by a mutex or confined to a single goroutine.
- [ ] Spawned work is awaited with `sync.WaitGroup` or `errgroup`.

## Resource Lifecycle

- [ ] `defer` is not used inside loops — it runs only when the surrounding function returns, so close per-iteration resources explicitly.
- [ ] `Close()` on files, rows, response bodies, and connections is deferred right after acquisition and its error is handled.

## Idioms

- [ ] Exported identifiers are documented; names follow Go conventions (no stutter, short receivers).
- [ ] Zero values are usable where practical; constructors are reserved for enforcing invariants.
