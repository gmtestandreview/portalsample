---
description: 'Use when creating or editing frontend React tests. Enforces stable React Testing Library patterns, accessibility assertions, and deterministic test behavior.'
name: 'Frontend Test Quality Standards'
applyTo:
  - 'packages/react-components/src/components/**/*.test.tsx'
  - 'packages/react-components/src/test/**/*.ts'
  - 'apps/portal-spa/src/**/*.test.tsx'
  - 'apps/portal-spa/src/test/**/*.ts'
---

# Frontend Test Quality Standards

Apply these rules to React unit/component tests.

## RTL-First Assertions

- Use React Testing Library queries by role, label, and visible text.
- Prefer `getByRole`/`findByRole` over class or implementation-detail selectors.
- Avoid assertions against internal component state.
- Validate behavior from a user perspective (rendered output, interaction outcomes, accessibility semantics).

## Accessibility Assertions (Mandatory)

- Include at least one accessibility assertion per component test file.
- Use `jest-axe` with `toHaveNoViolations` for rendered containers.
- For interactive components, include keyboard and accessible-name expectations when relevant.
- Do not merge changes that introduce critical/serious accessibility violations.

## Interaction Stability

- Use `userEvent.setup()` for user interactions.
- Await async interactions and async UI updates.
- Prefer resilient expectations after interaction rather than timing-based waits.
- Avoid arbitrary sleeps/timeouts; rely on RTL async utilities when needed.

## Environment And Mocking

- Reuse shared setup files for environment mocks instead of duplicating global stubs.
- Keep mocks minimal and behavior-focused.
- For browser API gaps in jsdom (for example dialog, matchMedia, IntersectionObserver), stub only what the scenario needs.

## Test Design Quality

- Use descriptive test names that encode behavior and expected outcome.
- Keep one primary behavior per test.
- Cover positive, negative, and edge paths for component props and interactions.
- Prefer focused assertions over broad snapshots.

## Change Coverage Expectations

- Component behavior changes should update/add tests for:
  - new visible behavior
  - interaction or event behavior
  - accessibility impact
- If the component contract changes, update existing tests instead of layering contradictory expectations.

## Source References

- Global Vitest config: [vitest.config.ts](../../vitest.config.ts)
- Component test setup: [packages/react-components/src/test/setup.ts](../../packages/react-components/src/test/setup.ts)
- SPA test setup: [apps/portal-spa/src/test/setupTests.ts](../../apps/portal-spa/src/test/setupTests.ts)
- Example high-quality tests: [packages/react-components/src/components/Button/Button.test.tsx](../../packages/react-components/src/components/Button/Button.test.tsx)
