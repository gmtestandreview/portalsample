# WCAG 2.2 AA 98+ Component Plan

## Objective

Create a defensible accessibility compliance program for `ClientApp/src/components`
targeting a weighted score of at least 98/100, with no unresolved critical
keyboard, focus, semantic, or assistive-technology failures.

## Score Caps

Apply these caps before calculating the rubric score.

| Cap trigger | Max score |
| --- | ---: |
| Keyboard trap | 59 |
| Critical flow not keyboard operable | 69 |
| Modal lacks valid focus trap or restoration | 79 |
| Custom combobox does not match the ARIA/APG pattern | 84 |
| Unlabelled interactive control in a critical flow | 89 |
| Undocumented axe violation | 92 |
| No manual screen-reader evidence | 94 |
| No 400% zoom/reflow evidence | 95 |
| No CI regression gate | 96 |

## Rubric

| Area | Points | Evidence required |
| --- | ---: | --- |
| Semantic structure | 10 | Native elements used first; invalid roles and fake links/buttons resolved. |
| Accessible names/descriptions | 12 | Controls are queryable by role/name; help and errors use stable ids. |
| Keyboard operation | 14 | Tab, Shift+Tab, Enter, Space, Escape, and arrow-key paths pass where applicable. |
| Focus management | 12 | Initial, return, route, modal, popover, and error focus are verified. |
| Forms and validation | 12 | Error summary links focus invalid fields; redundant entry is checked. |
| Dynamic status/announcements | 8 | Loading, filtering, search, route changes, and errors announce without noise. |
| Complex widget compliance | 14 | React Aria tester or equivalent APG evidence exists for each complex widget. |
| Visual WCAG 2.2 checks | 10 | Contrast, target size, focus visibility, focus not obscured, and 400% zoom pass. |
| Automation coverage | 6 | Unit, Storybook, Playwright, and axe checks cover critical states. |
| Manual assistive-tech evidence | 2 | Screen-reader evidence is recorded for critical flows. |

## Component Matrix

| Component family | Risk | Pattern | Required evidence | Status |
| --- | --- | --- | --- | --- |
| `Inputs/AutoSuggest` | Critical | Combobox/listbox | Input owns combobox role, labelled by field label, controls listbox, updates `aria-activedescendant`; manual SR evidence still required | Automated APG evidence added |
| `Inputs/OrganisationNameLookup` | Critical | Combobox/listbox | Input owns combobox role, labelled by field label, controls listbox, updates `aria-activedescendant`; manual SR evidence still required | Automated APG evidence added |
| `Inputs/DatePicker` | Critical | Date picker/dialog/grid | Keyboard tab order, calendar opening, date selection, focus return, 400% zoom | In progress |
| `modals/*` | Critical | Dialog | Named dialog, focus trap, initial focus, close path, focus restoration | In progress |
| `Actions` | Critical | Menu/disclosure actions | Trigger name, expanded state, Escape close, route actions as native links, command actions as native buttons; arrow-key/manual SR evidence still required | Automated evidence added |
| `SearchFilter/filterMenu` | Critical | Popover/menu/form | Trigger state, focus containment, close/reset/apply keyboard paths | Open |
| `forms/ErrorSummary` | Critical | Alert/navigation | Live announcement and links focusing invalid fields, including accordion-hidden fields | Existing tests; expand |
| `RouteLeavingGuard` | Critical | Dialog | Named dialog and blocked navigation decisions by keyboard | Open |
| `Pagination` | High | Navigation | Current page state, named arrow buttons, target size, mobile range | Open |
| `RequestList` | High | Card/tabs/actions | Fake button roles removed from recalibration links; non-interactive card and tab-panel tab stops removed; manual keyboard/SR evidence still required | Automated evidence added |
| `Accordion` | High | Disclosure | Header button name, expanded state, keyboard operation, error-link expansion | Open |
| `Header/Footer` | High | Landmarks/navigation/dialog triggers | Landmarks, real links/buttons, modal trigger behavior | In progress |

## Validation Commands

Run these before claiming a 98+ score.

```bash
npm run lint
npm run type-check
npm run test:unit
npm run test:storybook
npm run test:e2e
```

## Current Automated Evidence

Latest component accessibility slice:

- RequestList recalibration links use native link semantics.
- RequestList cards and tab panels no longer add non-interactive `tabIndex={0}` stops.
- AutoSuggest and OrganisationNameLookup expose the labelled text input as the combobox.
- AutoSuggest and OrganisationNameLookup update `aria-activedescendant` during arrow-key navigation.
- Actions icon triggers have stable accessible names with request context.
- Actions route items remain native links and command items render as native buttons, not `href="#"` fake buttons.
- Actions open/close state and Escape close are covered by unit evidence.
- Footer modal triggers use real buttons.
- Content and confirmation modals have `aria-labelledby`.
- Date picker calendar trigger remains in normal tab order.

Verified commands:

```bash
npm run type-check
npm run lint
npm run test:unit
npm run test:storybook
npm run test:e2e
```

Current validation blockers:

- `npm run lint` passes with zero diagnostics as of 2026-06-28; the original 131-warning rollout record remains historical in `docs/eslint-baseline.md`.
- Manual keyboard, screen-reader, 400% zoom, target-size, and focus-not-obscured evidence is still required before any 98+ claim.

## Manual Validation Checklist

- Keyboard-only pass for every critical and high-risk component.
- NVDA + Firefox pass for critical flows.
- NVDA + Chrome pass for critical flows.
- VoiceOver + Safari pass for public-facing flows where available.
- 400% zoom and 320 px viewport reflow pass.
- WCAG 2.2 target size and focus-not-obscured checks pass.
- Any exception has an owner, risk statement, and remediation date.
