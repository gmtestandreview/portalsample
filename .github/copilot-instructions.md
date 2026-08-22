# Copilot Instructions — NMI Customer Portal (source-map snapshot)

This workspace is a **read/study snapshot** of portal.measurement.gov.au captured via source maps. It is **not** a normal buildable repository. No root `package.json` exists — do not suggest `npm`/`pnpm`/`yarn` commands from the workspace root.

## What to edit

| Edit | Path |
|---|---|
| Application source | `static/js/**/*.ts`, `static/js/**/*.tsx` |
| Styles | `static/css/styles/**/*.scss` |

**Never edit:** `static/js/main.*.js`, `static/css/main.*.css`, `static/source-map-http-downloads/**`, `static/js/external/**`, `static/webpack/**`

## Critical conventions

- **Env vars** come from `window.*` at runtime. Import from `static/js/env.ts`, never `process.env`.
- **Yup custom validators** (`.allowedFormat()`, `.maxLength()`, `.minEntered()`, `.fixedDigits()`, `.phone()`, `.postcode()`) live in `static/js/validationSchemas/yupExtensions/stringExtensions.ts`. Any schema file using them **must** add: `import '../../validationSchemas/yupExtensions';`
- **Auth guard**: protect routes with `<AuthenticatedElement>` from `static/js/authentication/AuthenticatedElement.tsx`.
- **Account state**: use hooks in `static/js/authentication/hooks.tsx`; do not import `AccountContext` directly.
- **Unsaved form prompts**: use `<UnsavedFormPrompt>` — do not re-implement `RouteLeavingGuard`.

## Key architecture

See [AGENTS.md](../AGENTS.md) for the full architecture map, tech-stack table, edit boundaries, and validation guidance.
