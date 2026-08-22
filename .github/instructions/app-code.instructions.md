---
description: 'Application code instructions for the AGDS Starter Kit repository. These guidelines apply to all JavaScript and TypeScript files in the `components/`, `pages/`, and `src/` directories. Follow the existing architecture and coding style when creating or editing application code. This includes adhering to Next.js Pages Router conventions, using AGDS components correctly, and maintaining lint-safe coding practices. Do not edit policy-sensitive files or introduce unsupported patterns unless explicitly required by the task.'
applyTo: 'components/**/*.js,components/**/*.jsx,components/**/*.mjs,components/**/*.cjs,components/**/*.ts,components/**/*.tsx,components/**/*.mts,components/**/*.cts,pages/**/*.js,pages/**/*.jsx,pages/**/*.mjs,pages/**/*.cjs,pages/**/*.ts,pages/**/*.tsx,pages/**/*.mts,pages/**/*.cts,src/**/*.js,src/**/*.jsx,src/**/*.mjs,src/**/*.cjs,src/**/*.ts,src/**/*.tsx,src/**/*.mts,src/**/*.cts'
---

# Application code instructions

These instructions apply to the main app code in `components/`, `pages/`, and `src/`. They complement any more specific AGDS or component instructions already present in the repo.

## Follow the existing architecture

- This repo uses the **Next.js Pages Router**, not the App Router.
- Keep `pages/_app.tsx` as the single place that mounts AGDS `Core`.
- Use `AppLayout` for route-level layout structure.
- Include `DocumentTitle` in page components.
- Use `components/LinkComponent.tsx` when AGDS components need a Next.js-compatible link component.
- Update `components/SiteHeader/SiteHeader.tsx` when adding a new top-level route that belongs in primary navigation.

## Lint-safe coding style

- Write code that satisfies the existing ESLint rules instead of fighting them.
- Prefer explicit, typed props and clear component boundaries.
- Avoid adding broad `eslint-disable` comments. If a narrowly scoped suppression is truly required, keep it local and explain it.
- Keep imports tidy and consistent with the repo's current conventions.
- For AGDS, import from path-specific entry points rather than a root-package barrel import.
- Preserve the existing component-folder pattern where applicable.

## Scope control

- Do not edit repo-policy files from an application-code task unless the task explicitly asks for it.
- Do not add new lint plugins, new lint scripts, or new formatting surfaces from an app-code change.
- Do not treat docs, JSON, YAML, CSS, generated files, or `.copilot-tracking/**` as part of the main ESLint gate.
- Do not invent routes, APIs, environment variables, props, dependencies, or unsupported component behavior unless the task explicitly requires them and the repo supports them.

## Validation

When app code changes are non-trivial, run the relevant checks before finishing:

- `pnpm lint`
- `pnpm format:check`
- targeted tests for the touched area when available

If validation fails, fix the implementation rather than weakening the repo rules.
