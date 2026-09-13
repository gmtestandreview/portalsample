# Security Review Guide

Use this guide when a change touches authentication, authorization, input handling, sensitive data, persistence, redirects, file handling, external integrations, logging, or dependency execution.

## Review Priorities

1. Protect authentication and authorization boundaries.
2. Prevent injection and unsafe interpretation of untrusted input.
3. Avoid data exposure in responses, logs, telemetry, or client state.
4. Keep secrets out of source, builds, and runtime output.
5. Ensure security-sensitive behavior is tested.

## Authentication

- [ ] Login, logout, refresh, and session expiry behavior is explicit.
- [ ] Tokens and cookies use secure storage and transport.
- [ ] Session invalidation works after password reset, role changes, or logout where required.
- [ ] Authentication failures do not leak whether an account exists unless intended.
- [ ] MFA or step-up flows are not bypassed by alternate routes.

## Authorization

- [ ] Every protected read and write checks the actor, action, and resource.
- [ ] Object-level access checks are present, not only route-level checks.
- [ ] Tenant, account, organization, or project scoping is enforced in queries.
- [ ] Background jobs, webhooks, and internal APIs cannot bypass required checks.
- [ ] Role or permission changes are tested for least privilege.

## Input Handling

- [ ] Input is validated at trust boundaries.
- [ ] Validation rejects unknown or dangerous fields when appropriate.
- [ ] File names, paths, URLs, redirects, and commands are constrained by allowlists or safe builders.
- [ ] Numeric limits prevent oversized payloads, pagination abuse, and resource exhaustion.
- [ ] User-controlled values are encoded for the output context.

## Injection

- SQL uses parameterized queries or ORM-safe patterns.
- Shell commands avoid string concatenation and `shell=True`.
- HTML output is encoded or sanitized for the correct context.
- LDAP, XPath, NoSQL, template, and expression-language inputs are not built by string concatenation.

See `../cross-cutting/sql-injection-prevention.md` and `../cross-cutting/xss-prevention.md` for deeper guidance.

## Sensitive Data

- [ ] Secrets are not committed, logged, sent to clients, or exposed in errors.
- [ ] Personal or regulated data is minimized in responses and telemetry.
- [ ] Debug endpoints and verbose errors are disabled in production.
- [ ] Exports, downloads, and reports enforce authorization and audit requirements.
- [ ] Data retention and deletion behavior matches policy where relevant.

## Web Security

- [ ] State-changing browser requests have CSRF protection or same-site guarantees.
- [ ] CORS allows only intended origins, methods, and headers.
- [ ] Redirects validate destinations.
- [ ] Content Security Policy is considered for script injection risk.
- [ ] Cookies use appropriate `Secure`, `HttpOnly`, and `SameSite` attributes.

## Security Finding Template

```text
Severity: Blocking | Important
Location: <file:line or artifact>
Risk: <what an attacker or unauthorized user can do>
Evidence: <specific code path or missing check>
Fix: <minimal safe remediation>
Tests: <case that should prove the fix>
```
