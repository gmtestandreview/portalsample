# Security Policy

## Supported Versions

This repository is a private source-map capture snapshot of the NMI Customer Portal with local development, testing, and Storybook tooling. Security review should target the current working tree unless a maintainer explicitly identifies a release branch or tag.

This repository is not a public vulnerability disclosure channel for the live `portal.measurement.gov.au` service. Do not publish exploit details, customer data, authentication tokens, or other sensitive evidence in public issues, comments, commits, or pull requests.

## Reporting Security Issues

Report suspected security issues through the repository owner's private security process. If the issue may affect the live NMI Customer Portal or Australian Government systems, use an approved private disclosure path for that system and avoid sharing operational details in this repository.

Include only the minimum evidence needed to reproduce and assess the issue:

- affected path, component, or route
- expected security property
- observed behavior
- realistic attacker preconditions and impact
- redacted logs, requests, screenshots, or proof-of-concept notes

Do not include secrets, bearer tokens, personal information, customer records, or full exploit chains unless a maintainer explicitly requests them through a private channel.

## System and Scope

The in-scope application code is the React and TypeScript single-page application under `ClientApp/src`, including routing, authentication integration, Formik/Yup validation, client-side storage, instrumentation, reusable components, Storybook fixtures, and tests.

Important security-relevant areas include:

- Azure AD B2C authentication integration in `ClientApp/src/authentication`
- route protection and authenticated user state
- runtime configuration loaded through `ClientApp/src/env.ts`
- generated API client usage at call sites
- form validation and Yup extension usage
- file upload, document, quotation, account, dashboard, measurement report, and pattern approval workflows
- trusted HTML handling, Trusted Types, DOMPurify, and analytics instrumentation
- session storage and other browser-side persistence

The generated API client at `ClientApp/src/api/web-api-client.ts`, captured source-map mirrors, vendored code, built bundles, downloaded third-party source, and dependency directories are out of scope for direct editing. Findings in those areas are reportable only when they create a reachable issue in handwritten application code or repository policy.

## Threat Model and Trust Boundaries

The browser, route parameters, query parameters, form inputs, uploaded file metadata, API responses, runtime `window.*` configuration values, local storage, session storage, and analytics payload inputs must be treated as attacker-controlled unless the code validates or constrains them.

Azure AD B2C, the backend API, browser security controls, dependency package integrity, and deployment-time runtime configuration are external trust boundaries for this snapshot. Client-side route guards and UI visibility are not authorization controls. The backend must enforce authorization, ownership, workflow state, and data access decisions.

The application handles workflows that may expose or submit business contact details, organisation data, ABNs, quotation details, payment and invoice-related information, measurement reports, application messages, and supporting documents. Treat these as sensitive business or personal data when assessing exposure, logging, analytics, rendering, and storage behavior.

## Security Invariants

These properties must hold for handwritten application code:

- Authenticated routes use the established `AuthenticatedElement` pattern.
- Authentication tokens are requested through MSAL flows and are sent only as bearer tokens to intended API clients.
- Client-side checks do not replace server-side authorization or object ownership validation.
- Runtime configuration is read through `ClientApp/src/env.ts`; handwritten code must not depend on `process.env` for browser runtime behavior.
- Attacker-controlled HTML is sanitized before rendering, and Trusted Types policy usage must remain compatible with the project CSP model.
- Form validation must not be treated as the only enforcement for server-side business rules, but it must prevent unsafe or malformed client submissions where the UI owns the constraint.
- Yup custom string validators require the side-effect import from `ClientApp/src/validationSchemas/yupExtensions` wherever they are used.
- Sensitive values, tokens, customer data, and document contents must not be logged, committed, embedded in Storybook fixtures, or sent to analytics.
- Browser storage must not persist bearer tokens, secrets, or unnecessary sensitive workflow data.
- Error handling must not reveal tokens, internal identifiers, stack traces, or sensitive API responses to ordinary users.

## Reportable Findings and Severity Context

Report findings when they are reachable in handwritten code or repository configuration and could plausibly affect confidentiality, integrity, availability, authentication, authorization, privacy, or auditability.

High-impact examples include:

- token leakage or token misuse
- bypassable authenticated route or workflow protection that exposes sensitive data in this client
- unsafe rendering of attacker-controlled HTML or script-capable content
- sending sensitive data to analytics, logs, Storybook, or test artifacts
- insecure handling of uploads, downloaded documents, report links, or message content
- client behavior that encourages unsafe backend authorization assumptions
- runtime configuration mistakes that could direct tokens, API requests, or telemetry to unintended endpoints
- supply-chain or dependency issues that are reachable through application behavior

Dependency vulnerabilities, generated-client issues, and browser compatibility concerns should include reachability through this application before being treated as security findings for this repository.

## Out of Scope, Exclusions, and Accepted Risk

The following are normally out of scope for this repository-level policy:

- direct security assessment of the live production service without explicit authorization
- server-side API implementation details not present in this snapshot
- generated NSwag client edits, unless the fix belongs at a handwritten call site or regenerated source
- vendored, mirrored, downloaded, or built artifacts listed as non-editable in `AGENTS.md`
- dependency advisories with no reachable path from application code
- purely cosmetic UI issues without a security, privacy, or abuse impact
- test-only or Storybook-only mock data issues that cannot affect production and do not contain real sensitive data

Do not use this section to suppress uncertain findings. If reachability, exposure, or ownership is unclear, mark the issue unresolved and ask the repository owner.

## Known Limitations and Compensating Controls

This repository is a frontend snapshot, so it cannot prove backend authorization, object-level access control, workflow state enforcement, upload scanning, rate limiting, server logging, or production CSP headers. Treat those controls as external assumptions unless validated through authorized backend evidence.

Local tests, Storybook scenarios, and source-map reconstruction are useful review evidence, but they do not prove the live service behaves identically. Any finding that may affect the live portal should be validated through an approved private process before disclosure or remediation planning.
