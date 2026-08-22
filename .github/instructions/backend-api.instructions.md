---
description: 'Use when creating or editing API-layer and backend project files. Enforces Nmi.Portal.Api conventions for endpoint shape, auth, rate limiting, error handling, and service-layer boundaries.'
name: 'Backend API Conventions'
applyTo:
  - 'src/Nmi.Portal.Api/**/*.{cs,csproj,json}'
  - 'src/Nmi.Portal.Application/**/*.{cs,csproj}'
  - 'src/Nmi.Portal.Contracts/**/*.{cs,csproj}'
  - 'src/Nmi.Portal.Infrastructure/**/*.{cs,csproj}'
  - 'tests/Nmi.Portal.Api.Tests/**/*.{cs,csproj}'
---

# Backend API Conventions

Apply these rules to backend work in API, Application, Contracts, Infrastructure, and API test projects.

## Layer Boundaries

- Keep responsibilities separated:
  - Contracts: DTOs and interfaces only.
  - Application: business orchestration against contract interfaces.
  - Infrastructure: external adapters and DI wiring.
  - API: HTTP concerns and endpoint composition.
- Do not move infrastructure dependencies into Contracts or Application.

## Endpoint Conventions (Minimal API)

- Keep routes under `/api/*`.
- For every endpoint, set explicit metadata:
  - `.WithName(...)`
  - `.WithTags(...)`
- Pass `CancellationToken` through async call chains.
- Prefer explicit `Results.*` responses and predictable status codes.

## Authentication And Authorization

- Default to requiring authorization for endpoints unless there is a clear public requirement.
- Use `.AllowAnonymous()` only when intentional and safe (for example health checks or public catalogue reads).
- Identity-sensitive endpoints must validate authenticated principals before reading claims.

## Rate-Limiting Expectations

- Apply rate limiting to all endpoints.
- Use existing policies in `Program.cs`:
  - `api-default` for standard reads and non-sensitive operations.
  - `api-strict` for mutating/sensitive operations (for example access requests).
- Avoid introducing per-endpoint ad-hoc limits unless policy-level updates are required.

## Error-Handling Expectations

- Return API-safe errors (for example `BadRequest`, `NotFound`, `Unauthorized`, `UnprocessableEntity`, `Problem`) instead of leaking internal exception details.
- Validate inputs at the API boundary and return meaningful 4xx responses for client errors.
- Keep exception details out of response payloads in production paths.
- Preserve correlation behavior (`X-Correlation-Id`) when touching middleware or request pipeline code.

## Middleware And Security

- Preserve existing pipeline intent in `src/Nmi.Portal.Api/Program.cs`:
  - security headers middleware
  - authentication/authorization
  - rate limiter
  - response compression
- Keep CSP and security header behavior in `SecurityHeadersMiddleware` strict by default; loosen only with explicit endpoint need.

## Infrastructure Wiring

- Register integrations through `AddInfrastructure(...)` and keep null-adapter fallback behavior for missing config.
- Do not introduce startup hard-fail behavior for optional integrations that currently have null adapters.

## Testing Expectations

- Keep `ApiProgram.cs` partial `Program` support so `WebApplicationFactory`-based tests continue to work.
- For API behavior changes, update/add tests in `tests/Nmi.Portal.Api.Tests` covering:
  - auth outcomes (401/403)
  - rate-limit behavior where relevant
  - expected error status codes and payload shape

## Source References

- API composition and policies: [src/Nmi.Portal.Api/Program.cs](../../src/Nmi.Portal.Api/Program.cs)
- Security headers middleware: [src/Nmi.Portal.Api/Middleware/SecurityHeadersMiddleware.cs](../../src/Nmi.Portal.Api/Middleware/SecurityHeadersMiddleware.cs)
- Infrastructure registration patterns: [src/Nmi.Portal.Infrastructure/InfrastructureServiceExtensions.cs](../../src/Nmi.Portal.Infrastructure/InfrastructureServiceExtensions.cs)
- Contribution gate: [CONTRIBUTING.md](../../CONTRIBUTING.md)
