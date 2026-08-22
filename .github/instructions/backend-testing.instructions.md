---
description: 'Use when creating or editing backend API tests. Enforces WebApplicationFactory test patterns, auth assertions, rate-limit assertions, and stable API response verification.'
name: 'Backend API Testing Standards'
applyTo:
  - 'tests/Nmi.Portal.Api.Tests/**/*.{cs,csproj}'
  - 'src/Nmi.Portal.Api/ApiProgram.cs'
  - 'src/Nmi.Portal.Api/Program.cs'
---

# Backend API Testing Standards

Apply these rules when writing or updating API integration tests.

## Test Host Pattern

- Use `WebApplicationFactory<Program>` as the API host.
- Keep `ApiProgram.cs` partial `Program` support intact for test hosting.
- Prefer one shared factory per test class via `IClassFixture<WebApplicationFactory<Program>>`.
- Use `factory.CreateClient()` and test endpoints over HTTP rather than calling services directly.

## Assertion Priorities

- Assert exact HTTP status codes first.
- Then assert response contract shape and key payload fields.
- For error responses, assert the intended status and stable response keys relevant to clients.
- For headers that are part of contract behavior, assert presence and expected value shape (for example `X-Correlation-Id`).

## Auth And Authorization Assertions

- For protected endpoints, include unauthenticated assertions (expect `401` where applicable).
- When authorization rules are introduced, include negative-path coverage for forbidden access (`403`) when applicable.
- For anonymous endpoints, verify they remain accessible without auth tokens.

## Rate-Limit Assertions

- For endpoints tagged with `api-default` or `api-strict`, add tests that validate policy behavior when feasible.
- Prefer deterministic rate-limit tests:
  - isolate to a dedicated test endpoint or test host configuration when needed
  - avoid brittle timing assumptions
- At minimum, verify that sensitive mutations remain mapped to strict policy in `Program.cs` when changing endpoint wiring.

## Test Stability Rules

- Keep tests deterministic and side-effect free.
- Avoid assertions tied to incidental ordering unless ordering is an API contract.
- Avoid over-asserting large payload snapshots; assert key contract elements.
- Use clear naming pattern: `Action_State_ExpectedResult`.

## Change Coverage Expectations

- Endpoint additions/changes should include:
  - success-path test
  - auth-path test (if protected)
  - failure-path test (`404`, `400`, `422`, or domain-appropriate status)
- Middleware/pipeline changes should include tests for impacted behavior (for example headers, auth, health response shape).

## Source References

- Existing API tests: [tests/Nmi.Portal.Api.Tests/ApiEndpointTests.cs](../../tests/Nmi.Portal.Api.Tests/ApiEndpointTests.cs)
- Test host entry point: [src/Nmi.Portal.Api/ApiProgram.cs](../../src/Nmi.Portal.Api/ApiProgram.cs)
- API endpoint wiring: [src/Nmi.Portal.Api/Program.cs](../../src/Nmi.Portal.Api/Program.cs)
