# C# and .NET Review Guide

Use this guide for C#, .NET, ASP.NET Core, Entity Framework Core, and async code reviews.

## Nullability and Types

- [ ] Nullable reference types are enabled or null handling is explicit.
- [ ] Public APIs distinguish nullable and non-nullable values.
- [ ] Null-forgiving operators are justified and rare.
- [ ] Value objects or enums are used where raw strings create invalid states.
- [ ] Records are used for immutable data where appropriate.

```csharp
var name = user.Profile?.DisplayName ?? "Unknown";
```

## Async and Concurrency

- [ ] Async methods are awaited all the way up; no `.Result` or `.Wait()` on request paths.
- [ ] `async void` is limited to event handlers.
- [ ] Cancellation tokens are accepted and passed through I/O calls.
- [ ] Fire-and-forget work has explicit error handling and lifecycle ownership.
- [ ] Shared mutable state is protected or avoided.

```csharp
var result = await client.GetAsync(url, cancellationToken);
```

## ASP.NET Core

- [ ] Controllers or minimal API handlers are thin and delegate business behavior.
- [ ] Model validation failures return consistent responses.
- [ ] Authorization attributes and policy checks match the protected resource.
- [ ] Dependency injection lifetimes are correct.
- [ ] Request-scoped services are not captured by singletons or background workers.
- [ ] Error contracts are consistent.

## Entity Framework Core

- [ ] Queries are server-side where possible.
- [ ] `Include` and projection are used intentionally.
- [ ] Large read queries use `AsNoTracking()` when entities are not updated.
- [ ] Pagination is applied before materialization.
- [ ] Migrations are backward compatible with rolling deploys when required.
- [ ] Transactions cover related writes.

```csharp
var active = await context.Users
    .Where(u => u.IsActive)
    .ToListAsync(cancellationToken);
```

See `../cross-cutting/n-plus-one-queries.md` for N+1 review guidance.

## Resource Management

- [ ] Disposable and async-disposable resources are disposed.
- [ ] Streams are not buffered entirely unless size is bounded.
- [ ] HTTP clients are created through `IHttpClientFactory` or another approved lifetime strategy.
- [ ] Timers, subscriptions, and background tasks are stopped on shutdown.

## Security

- [ ] Authorization is checked for object-level access, not only route access.
- [ ] SQL uses LINQ or parameterized commands.
- [ ] User input is validated before file, path, redirect, or command use.
- [ ] Browser state-changing flows have appropriate anti-forgery or same-site protection.
- [ ] Secrets are loaded from configuration or secret stores, never hardcoded.

## Tests

Unit tests should cover domain behavior. Integration tests should cover routing, authorization, serialization, and database behavior where relevant. EF tests should use a provider that preserves the behavior under review.
