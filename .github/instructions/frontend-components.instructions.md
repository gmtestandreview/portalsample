---
description: 'Use when creating or editing frontend component files in react-components. Enforces named exports, token-only styling, RTL+Vitest+a11y tests, stories, and component accessibility notes.'
name: 'Frontend Component Standards'
applyTo:
  - 'packages/react-components/src/components/**/*.{tsx,scss,md}'
---

# Frontend Component Standards

Apply these rules to component work under `packages/react-components/src/components/**`.

## File Set Expectations

For each component folder, keep this complete file set aligned:

- `ComponentName.tsx`
- `ComponentName.types.ts`
- `ComponentName.module.scss`
- `ComponentName.test.tsx`
- `ComponentName.stories.tsx`
- `ComponentName.a11y.md`
- `index.ts`

If you add or rename a component, update all affected companion files in the same change.

## Exports And Typing

- Use named exports only. Do not introduce default exports.
- Define explicit props interfaces in `ComponentName.types.ts` and import them in `ComponentName.tsx`.
- Do not use `React.FC`.
- Keep `index.ts` as named re-exports only; no component logic in barrel files.

## Styling Rules

- Use SCSS modules for component styles (`ComponentName.module.scss`).
- Use `var(--nmi-*)` design token variables only.
- Do not add hardcoded color values (`#hex`, `rgb()`, `hsl()`) in component SCSS.
- Focus styles must use `--nmi-focus-outline-width`, `--nmi-focus-outline-style`, and `--nmi-focus-outline-color`.

## Tests And Accessibility Checks

- Use RTL + Vitest for `ComponentName.test.tsx`.
- Include at least one accessibility assertion (for example with `jest-axe`) and keep critical/serious violations at zero.
- Prefer behavior-driven assertions (roles, labels, keyboard interactions) over implementation details.

## Stories And A11y Notes

- Add or update `ComponentName.stories.tsx` with one story per meaningful state.
- Keep `ComponentName.a11y.md` current with:
  - ARIA roles and naming
  - Keyboard interaction expectations
  - Screen-reader behavior notes

## Source References

- Canonical standards: [CONTRIBUTING.md](../../CONTRIBUTING.md)
- Existing baseline guidance: [AGENTS.md](../../AGENTS.md)
