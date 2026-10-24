# Rust Review Guide

Use this guide for Rust code reviews, with emphasis on error handling, `unsafe`, and ownership.

## Error Handling

- [ ] `.unwrap()` and `.expect()` do not appear outside tests — use `?` propagation or an explicit `match`.
- [ ] `Result` and `Option` are propagated or handled, not silently discarded with `let _ =`.
- [ ] Error types carry context (via an established crate or a `std::error::Error` impl).
- [ ] Panics are reserved for genuinely unrecoverable states, not ordinary failures.

```rust
let config = load_config().map_err(ConfigError::from)?;
```

## Unsafe

- [ ] Every `unsafe` block carries a `// SAFETY:` comment explaining the invariant being upheld.
- [ ] The unsafe surface is minimal and wrapped in a safe, documented API.
- [ ] Raw pointer dereferences, transmutes, and FFI boundaries are justified and bounded.

## Ownership and Lifetimes

- [ ] Public API functions returning references have correct, explicit lifetime annotations where inference is ambiguous.
- [ ] Borrows do not outlive their owners; no needless `.clone()` to sidestep the borrow checker.
- [ ] `Arc`/`Mutex`/`RwLock` appear only where shared ownership or interior mutability is genuinely required.

## Idioms

- [ ] Iterator combinators are preferred over manual index loops where they read more clearly.
- [ ] `From`/`Into` conversions are used instead of ad-hoc constructors where idiomatic.
