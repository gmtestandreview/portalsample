# Design Platform Inputs — NMI Portal SCSS/UI Migration (Batch E)

**Document type:** Working form — owner-fill-in  
**Date created:** 2026-05-31  
**Status:** RESOLVED — all decisions received 2026-06-04 from Expert Design Lead (items 1–10, 13), Backend Architect (items 11–12, 14–15), and Architecture-structural recommendation (items 16–22). See MASTER-CHANGE-RECORD.md CRD-034.  
**Migration batch gated:** Batch E (SCSS/UI migration) + test/Storybook infrastructure migration  
**Source reference:** Open Items Backlog (`docs/change-record/OPEN-ITEMS-BACKLOG.md`) — Priority 2, items 1–13

---

## Purpose

This document is the working form for the 13 design-platform and infrastructure inputs identified in the migration readiness assessment (Open Items Backlog, Section: Priority 2). Each input is an open decision that blocks one or more Batch E migration tasks.

**Owners must fill in the Answer field for their assigned items and update the status table below.** When all 13 items are resolved, notify the migration team so Batch E work can be scheduled.

---

## How to Use This Document

1. Locate your items by owner role in Sections 1 and 2.
2. Read the Current Implementation Detail so your decision is grounded in the actual codebase.
3. Read the Decision Options — these are concrete, not generic. Choose one, adapt one, or propose a fourth option.
4. Record your answer in the `**Answer:**` field. Be specific: name files, component names, or system choices as applicable.
5. Update the Status Summary Table at the top of this file (change `UNRESOLVED` to `RESOLVED`).
6. Notify the migration team lead (email or comment on the migration plan document) when your items are complete.

**Do not leave the Answer field blank when you have reached a decision.** A recorded decision — even a provisional one — unblocks engineering. An empty field is a blocker.

---

## Status Summary Table

| # | Input | Owner | Gate | Status |
|---|---|---|---|---|
| 1 | Design-platform colour tokens | Design Lead | Batch E — SCSS migration | **RESOLVED 2026-06-04** — Replace `_variables.scss` with `var(--nmi-*)` CSS custom properties |
| 2 | Typography tokens and font stack | Design Lead | Batch E — SCSS migration | **RESOLVED 2026-06-04** — Retain Public Sans; already in design system |
| 3 | Spacing, grid, and breakpoint rules | Design Lead | Batch E — SCSS migration | **RESOLVED 2026-06-04** — Drop Bootstrap grid; CSS Grid/Flexbox + design token spacing |
| 4 | Form control components | Design Lead | Batch E — SCSS migration | **RESOLVED 2026-06-04** — Direct substitution with `react-components` equivalents |
| 5 | Validation state and error patterns | Design Lead | Batch E — SCSS migration | **RESOLVED 2026-06-04** — Target ErrorSummary + FormField error prop |
| 6 | Wizard/stepper pattern | Design Lead | Batch E — SCSS migration | **RESOLVED 2026-06-04** — Adapt into ApplicationWizard; pre-req: WAF-TYPE-001 |
| 7 | Modal/dialog components | Design Lead | Batch E — SCSS migration | **RESOLVED 2026-06-04** — Replace with target Modal (native `<dialog>`) |
| 8 | Icon system | Design Lead | Batch E — SCSS migration | **RESOLVED 2026-06-04** — Retire icon font; SVG React components from packages/icons |
| 9 | Accessibility component requirements | Design Lead | Batch E — SCSS migration | **RESOLVED 2026-06-04** — AppShell covers skipLinks; pre-req: add useRouteAccessibility hook |
| 10 | Print styles | Design Lead | Batch E — SCSS migration | **RESOLVED 2026-06-04** — Port as print.css global import |
| 11 | Backend OpenAPI spec availability | Backend Team | API client migration | **RESOLVED 2026-06-04** — Generate + commit docs/api/openapi.json |
| 12 | Target CI configuration | DevOps | Test infrastructure migration | **RESOLVED 2026-06-04** — GitHub Actions pipeline confirmed |
| 13 | Storybook adapter in target repo | Architect | Storybook migration | **RESOLVED 2026-06-04** — Vite; migrate .storybook/ as-is |

---

## Section 1 — Design-Platform Decisions (Items 1–10)

**Owner for all items in this section:** Design Lead

---

### Item 1 — Design-Platform Colour Tokens

**Input question:** Can `_variables.scss` colour token names and values be adapted into the target design platform's token system, or must the NMI colour set be replaced entirely with tokens defined by the target platform?

**Current implementation detail:**
`ClientApp/src/styles/_variables.scss` (lines 5–50) defines 25 custom NMI colour variables:

- Brand primaries: `$nmi-primary: #285576`, `$nmi-header-primary: #a6192e`
- Accent/interaction: `$nmi-active: #007079`, `$nmi-interactive: #B33C4D`, `$interactive: rgba(#285576, 0.85)`
- Supporting: `$nmi-secondary: #58595b`, `$nmi-dark-gray: #8e8e8e`, `$nmi-blue-20: #d4dde4`, `$nmi-secondary-green: #71cc98`, `$nmi-light-grey: #d8d8d8`
- DISR shared: `$disr-light-blue: #9CD9E0`, `$disr-light-blue-tint: #6ac5cf`
- Semantic: `$body-color: #3f3b3b`, `$dashboard-background: #f5f5f5`
- State: `$success: #219520`, `$success-dark: #297e28`, `$danger: #d50501`, `$danger-lighter: #f5b5b5`, `$danger-light: #fce9e9`

These are mapped into Bootstrap 5's `$theme-colors` map (`primary`, `secondary`, `info`, `danger`, `success`). The mapping is one-to-one and the NMI vars are the authoritative source. Any target-platform token system that does not accept these hex values verbatim will require a manual translation pass.

**Decision options:**
- **Option A — Adapt:** Extract the 25 NMI variables into a target-platform token file (e.g., a design token JSON or CSS custom properties file) preserving the same hex values and semantic names. SCSS references are rewritten to consume the new tokens. Lowest disruption; NMI brand fidelity maintained.
- **Option B — Audit and consolidate:** Map the 25 variables to the target platform's existing token set. Where target-platform tokens match NMI intent (e.g., primary brand colour), use the platform token. Where there is no match, add NMI-specific overrides. Reduces token proliferation; may require Figma token sync.
- **Option C — Replace entirely:** Retire all `$nmi-*` variables and rebuild the colour palette from the target platform's design system. All component SCSS files referencing NMI vars must be audited for visual regression. Highest disruption; highest long-term consistency with the target platform.

**Migration risk if unresolved:** Batch E cannot begin. Every SCSS partial in `ClientApp/src/styles/` imports `_variables.scss` as its first dependency. Without a decided token strategy the target-platform SCSS scaffold cannot be started.

**Owner:** [Design Lead — answer here]

**Answer:** Replace `_variables.scss` entirely with `var(--nmi-*)` CSS custom properties. Import `@nmi/design-tokens/dist/css/variables.css` once in the app entry point. Values are identical to source — zero visual regressions. Every migrated SCSS module switches from `$nmi-*` variables to `var(--nmi-*)`. *(Expert Design Lead, 2026-06-04)*

---

### Item 2 — Typography Tokens and Font Stack

**Input question:** Is "Public Sans" retained as the primary typeface in the target platform, or is it replaced? If replaced, what is the target typeface and how are the 8 heading-scale sizes remapped?

**Current implementation detail:**
`ClientApp/src/styles/_variables.scss` (lines 111–120) establishes the font stack:

```
$font-family-sans-serif: "Public Sans", "Segoe UI", Roboto, "Helvetica Neue", Arial, ...
$font-size-base: 1rem  (assumed browser default 16px)
```

`ClientApp/src/styles/_typography.scss` defines 8 responsive heading sizes using `math.div()` for mobile and `rfs-value()` for fluid scaling at 14 call sites:

| Heading | Mobile size | Desktop size |
|---------|-------------|--------------|
| h1 | `$h1-font-size / 1.375` ≈ 32px | `$h1-font-size` (Bootstrap default 44px) |
| h2 | `$h2-font-size / 1.333` ≈ 24px | `$h2-font-size` (Bootstrap default 35px) |
| h3–h6 | `$h3`–`$h6-font-size` (Bootstrap scale) | same Bootstrap scale |

Custom utility classes: `.fs-7` (14px), `.fs-75` (13px), `.fs-8` (12px), `.fs-9` (10px), `.fs-10` (8px) extend Bootstrap's `.fs-1`–`.fs-6`.

The "Public Sans" font is currently served as TTF files only (no woff2). If the target platform requires woff2 or uses a CDN font delivery, the font files must be converted or sourced anew.

**Decision options:**
- **Option A — Retain "Public Sans" with current scale:** Port the font files (or source woff2 equivalents) to the target platform. Keep the 8-heading scale and `rfs-value()` fluid sizing. Requires `sass:math` module usage and `rfs` dependency to be available in the target build.
- **Option B — Retain "Public Sans", replace the scale:** Keep the typeface but replace the Bootstrap-derived heading scale with the target platform's typographic rhythm. Requires a visual audit of all 20+ route pages for text hierarchy consistency.
- **Option C — Replace typeface and scale:** Adopt the target platform's typeface (e.g. a GOV.AU design system font if applicable) and its heading scale. Requires visual regression testing across all pages and Storybook story updates for all components with heading elements.

**Migration risk if unresolved:** The `_typography.scss` partial is imported by `index.scss` and affects every rendered page. Font-loading strategy (TTF vs woff2, self-hosted vs CDN) must be confirmed before the target-repo HTML template is finalised.

**Owner:** [Design Lead — answer here]

**Answer:** Retain Public Sans. Target system already declares it as `--nmi-font-family-body`. Self-hosted font files carry over unchanged. Remove source `@font-face` declarations — the design token CSS handles font loading. *(Expert Design Lead, 2026-06-04)*

---

### Item 3 — Spacing, Grid, and Breakpoint Rules

**Input question:** Is Bootstrap 5's 12-column grid and breakpoint set retained in the target platform, or is it replaced by a different grid system? Is the NMI custom spacer 6 preserved?

**Current implementation detail:**
`ClientApp/src/styles/_variables.scss` (lines 56–68) extends Bootstrap's `$spacers` map with a custom spacer:

```scss
$spacers: (
  0: 0,
  1: $spacer * 0.25,   // 4px
  2: $spacer * 0.5,    // 8px
  3: $spacer,          // 16px
  4: $spacer * 1.5,    // 24px
  5: $spacer * 3,      // 48px
  6: $spacer * 2,      // 32px  ← NMI custom addition
)
```

Bootstrap 5's standard breakpoints (`xs`/`sm`/`md`/`lg`/`xl`/`xxl`) are used throughout all route components and layout partials. The `_layout.scss` partial uses `@include media-breakpoint-up(md)` and `@include media-breakpoint-down(sm)` extensively. The `$enable-negative-margins: false` setting (line 56) disables negative utility classes.

The `negativify-map()` blocker at `_variables.scss:68` (a Bootstrap 5 internal function) means full `@use`-based SCSS module migration is deferred until Bootstrap 6. This constraint is inherited by the target platform unless Bootstrap is retired.

**Decision options:**
- **Option A — Retain Bootstrap 5 grid and spacers:** Migrate all Bootstrap grid classes and utilities into the target platform. The custom spacer 6 (`$spacer * 2 = 32px`) is preserved. The `negativify-map()` blocker remains deferred until Bootstrap 6.
- **Option B — Adopt target platform grid, keep Bootstrap breakpoints:** Replace Bootstrap grid columns with the target platform's grid system but preserve breakpoint names and widths (`sm: 576px`, `md: 768px`, `lg: 992px`, `xl: 1200px`) to minimise the impact on responsive layout code in route components.
- **Option C — Full grid replacement:** Adopt the target platform's native grid and breakpoint system. All `media-breakpoint-up/down` mixins and Bootstrap grid class names in ~50 SCSS partials and React components must be audited and replaced.

**Migration risk if unresolved:** Grid and breakpoint decisions determine which layout SCSS partials can be ported as-is versus which require rewrite. This affects scope estimation for all ~97 SCSS files.

**Owner:** [Design Lead — answer here]

**Answer:** Drop Bootstrap 5 grid. Replace `.container`/`.row`/`.col-*` with CSS Grid or Flexbox in component-scoped SCSS modules. Breakpoints are identical to Bootstrap defaults — replace `@include media-breakpoint-up(md)` with `@media (min-width: var(--nmi-breakpoint-md))` find-replace. Spacing maps directly: Bootstrap `$spacer * n` → `var(--nmi-space-*)`. *(Expert Design Lead, 2026-06-04)*

---

### Item 4 — Form Control Components

**Input question:** Are the `ClientApp/src/components/Inputs/` React components and their `_forms.scss` styles adapted into the target platform, or replaced with target-platform form primitives?

**Current implementation detail:**
`ClientApp/src/styles/_forms.scss` (692 lines) provides extensive Bootstrap form overrides including:
- Custom `.form-control` and `.form-field` padding using `$input-padding-y` and `$input-padding-x` variables
- Focus ring: `outline: solid 3px $input-focus-border-color; outline-offset: -3px`
- Invalid state: `outline-color: #f5b5b5; outline-width: 6px` (pink glow)
- Custom checkbox/radio implementations using `position: absolute; left: -9999px` (hidden native control + custom label pseudo-elements)
- Radio buttons rendered via icon font codepoints (`$icon-radio-checked: "\e938"`, `$icon-radio-unchecked: "\e939"`)
- AutoSuggest/combobox styles (`.suggestions-container`, `.suggestion-options`, `.suggestion-option`)

The React component set in `ClientApp/src/components/Inputs/` includes: `TextInput`, `TextAreaInput`, `TextReadOnly`, `SelectInput`, `Checkbox`, `RadioButton`, `RadioButtonGroup`, `DatePicker/CustomDateInput`, `AutoSuggest` (with `AutoSuggestContainer`, `AutoSuggestOptions`, `AutoSuggestOption`), `AddressLookup` (with `ManualAddressInput`), and `OrganisationNameLookup`.

All form components use Formik's `useField` or `useFormikContext`; replacing them requires maintaining Formik integration or migrating away from Formik.

**Decision options:**
- **Option A — Adapt existing components:** Port the 11 Input components and `_forms.scss` to the target platform. Retain Formik. The custom checkbox/radio implementations (icon-font-based) are kept with CSP-safe PNG icon fallback approach preserved.
- **Option B — Replace with target-platform form primitives:** Substitute target-platform form components for each NMI Input component. Requires a mapping table (NMI component → target component), verification that each replacement supports WCAG 2.1 AA, and Formik integration testing for each substitution.
- **Option C — Hybrid:** Replace standard controls (text, textarea, select) with target-platform equivalents; retain custom controls (AutoSuggest, AddressLookup, DatePicker) where no target-platform equivalent exists.

**Migration risk if unresolved:** Forms appear in all 6 wizard flows and the dashboard. Without this decision, the `ClientApp/src/components/Inputs/` directory scope (11 components) cannot be assigned to a migration batch and Formik dependency decisions remain open.

**Owner:** [Design Lead — answer here]

**Answer:** Direct substitution with `packages/react-components` equivalents: TextInput, Textarea, Select, Checkbox, Radio, FormField. FormField replaces the source FormGroup/FieldWrapper pattern. No className overrides needed as design tokens carry styling. *(Expert Design Lead, 2026-06-04)*

---

### Item 5 — Validation State and Error Patterns

**Input question:** Are the NMI validation state visual patterns (Bootstrap `is-invalid`/`is-valid` classes, danger/success colours, icon PNG fallbacks) adopted as-is in the target platform, or replaced with target-platform error display components?

**Current implementation detail:**
`ClientApp/src/styles/_forms.scss` defines the invalid-field visual pattern:
- Invalid border: `border: solid 1px $danger` (`#d50501`)
- Invalid focus glow: `outline-color: #f5b5b5; outline-width: 6px` (pink, 6px)
- Invalid select: dual `background-image` layering of `$form-select-indicator` + `$form-feedback-icon-invalid` (comment: "temp fix for BS5.3+")
- Invalid date-picker: `background-position: center right 5.25rem` (positioning the icon)

The form-level `ErrorSummary` component (referenced in `Open Items Backlog` issue #6 as `SB-011`) provides an aggregate error list at the top of wizard steps. The component is a known gap in the Storybook coverage matrix.

At the field level, Formik's `meta.error` and `meta.touched` drive the `is-invalid` class on inputs. The `_forms.scss` `.form-validation-message` selector (`color: $danger`) renders Formik error strings inline.

The PNG icon fallbacks for form validation icons exist because Bootstrap 5 embeds SVGs inline in its form feedback CSS, which violates the active Trusted Types CSP policy. These PNG fallbacks (`_variables.scss` sets `$form-feedback-icon-valid` and `$form-feedback-icon-invalid`) are a permanent workaround for the current CSP configuration, not a temporary measure.

**Decision options:**
- **Option A — Adopt current pattern in target platform:** Port the Bootstrap `is-invalid`/`is-valid` approach, the danger/success colour tokens, and the PNG icon fallback strategy. The CSP constraint is inherited — SVG-embedding form feedback icons from Bootstrap must be replaced or suppressed in the target platform as well.
- **Option B — Replace with target-platform error display:** Implement the target platform's error pattern (e.g., a design system `ErrorMessage` primitive, an inline alert component). This requires updating Formik integration at every field site and replacing `ErrorSummary` with a target-platform summary component. PNG workarounds can be retired if the target platform uses non-inline SVGs or icon fonts.
- **Option C — Retain field-level errors, replace summary:** Keep the Bootstrap `is-invalid` field pattern; replace only the form-level `ErrorSummary` with a target-platform notification/alert component (see also Item 7 — Modals/Dialogs).

**Migration risk if unresolved:** The `ErrorSummary` story gap (issue #6) is already a Sprint 1 blocker. Without a decided validation pattern, the story cannot be written to match the target platform's eventual implementation, creating rework. This decision also affects all 6 wizard flows.

**Owner:** [Design Lead — answer here]

**Answer:** Use target ErrorSummary from `@nmi/react-components` and FormField `error` prop for field-level display. Wire Yup errors into `ErrorSummary.errors` prop (array of `{ id, message }`). The target ErrorSummary matches the source's `role="alert"` ARIA pattern. axe-core tests already verify WCAG 2.1 AA SC 1.3.1 and SC 3.3.1. *(Expert Design Lead, 2026-06-04)*

---

### Item 6 — Wizard/Stepper Pattern

**Input question:** Is the NMI `WizardForm`/`SteppedNavigation` compound component engine adapted for the target platform's visual layer, or rebuilt from scratch using target-platform primitives?

**Current implementation detail:**
The wizard engine comprises:
- `ClientApp/src/components/forms/WizardForm/index.tsx` — orchestrator
- `ClientApp/src/components/forms/WizardForm/WizardRoutedStep.tsx` — 45-decision-branch stateful step engine (the highest-risk single component in the codebase); handles `validateHard`/`validateSoft`/`loadStepValues`/`onSaveAndNext`/`onSaveAndExit` callbacks with implicit ordering contracts
- `ClientApp/src/components/forms/WizardForm/WizardStep.tsx` — individual step wrapper
- `ClientApp/src/components/forms/WizardForm/PreviousStepButton.tsx` — back-navigation
- `ClientApp/src/components/SteppedNavigation/index.tsx` — visual progress indicator
- `ClientApp/src/styles/_step-nav.scss` — step indicator visual styles (completed: `$nmi-primary` filled circle with SVG tick; current: `$nmi-primary` border; inactive: `#c7c7c7` border)

The compound component is used in 6 wizard flows: RFQ creation, RFQ copy, quote acceptance, account creation, account update, and contact management. A planned refactor of `WizardRoutedStep.tsx` into a `useWizardStep()` hook is documented at `docs/superpowers/plans/2026-05-30-wizard-routed-step-refactor.md` — this refactor is compatible with either adaptation or rebuild.

**Decision options:**
- **Option A — Adapt the existing engine:** Port `WizardForm` and `SteppedNavigation` to the target platform. Replace `_step-nav.scss` styles with target-platform equivalents. The `useWizardStep()` refactor (planned but not yet executed) should be completed first to reduce porting risk.
- **Option B — Rebuild from target-platform primitives:** If the target platform provides a stepper or multi-step form component, rewrite the 6 wizard flows to use it. Requires establishing behavioral equivalence for all callback contracts (`validateHard`, `validateSoft`, etc.) before migration. Higher risk due to `WizardRoutedStep.tsx`'s complexity and zero current test coverage.
- **Option C — Adapt engine, replace visual layer only:** Keep the `WizardRoutedStep` state machine and callback contracts; replace only `_step-nav.scss` and `SteppedNavigation/index.tsx` visual rendering with target-platform step indicator components. Lower risk than Option B; cleanest separation between behaviour and presentation.

**Migration risk if unresolved:** The wizard engine touches all 6 flows and `WizardRoutedStep.tsx` has 45 decision branches with no unit tests. The rebuild option (B) cannot be safely sized without this decision. If adaptation is chosen (A or C), the `useWizardStep()` refactor becomes a pre-migration prerequisite.

**Owner:** [Design Lead — answer here]

**Answer:** Adapt — port state-machine logic into `ApplicationWizard` in `packages/portal-patterns`. Do not rebuild. Map: step definitions → ApplicationWizard `steps` prop; per-step Yup schema → WizardStep `schema` prop; back/forward navigation → FormStepNavigator; form state → React Hook Form useFormContext; WizardRoutedStep URL-driven navigation → ApplicationWizard + React Router v7 nested routes. **Pre-requisite:** Resolve WAF-TYPE-001 (typed WAF detection guard) before porting WAF logic. *(Expert Design Lead, 2026-06-04)*

---

### Item 7 — Modal/Dialog Components

**Input question:** Are the 5 react-bootstrap `Modal` usages replaced by target-platform dialog primitives, or is react-bootstrap Modal retained in the target platform?

**Current implementation detail:**
`ClientApp/src/styles/_modals.scss` overrides Bootstrap modal styles. The application has 5 modal variants managed through `ClientApp/src/components/modals/ModalContext.tsx`:

1. `TermsAndCondition/` — shown on first login and terms-version mismatch; includes a `TermsAndConditionModal` with a known bug fixed in Sprint 0 (see Master Change Record)
2. `BranchSelectorModal/` — 22-decision-branch modal for multi-organisation switching; triggered from the masthead; writes to `sessionStorage` key `targetOrganisation`
3. `RFQDeleteModal/` — confirmation dialog for RFQ deletion from the dashboard
4. `ConfirmationModal/` — generic confirmation dialog used in wizard exit paths
5. `ContentModal/` — generic content wrapper modal used for footer legal content (Terms of Use, Privacy, Accessibility pages)

All modals use react-bootstrap's `<Modal>`, `<Modal.Header>`, `<Modal.Body>`, `<Modal.Footer>` components. The `ModalContext` uses a React context + `useReducer` pattern to manage which modal is open. `PreConditions.tsx` (mounted on every authenticated route) is the provider.

**Decision options:**
- **Option A — Retain react-bootstrap Modal:** Keep the react-bootstrap dependency and the existing modal architecture. Replace only `_modals.scss` visual styles with target-platform tokens. Lowest disruption; `BranchSelectorModal` (highest complexity) is unchanged.
- **Option B — Replace with target-platform dialog primitives:** Substitute each modal with the target platform's dialog component. Requires remapping `ModalContext` dispatch actions to the target platform's open/close API. `BranchSelectorModal` (22 decision branches) must be regression-tested against the full org-switching lifecycle (documented at `docs/architecture/org-switching-lifecycle.md`).
- **Option C — Replace only simple modals, retain complex ones:** Migrate `ConfirmationModal` and `ContentModal` to target-platform dialogs; retain `BranchSelectorModal` and `TermsAndCondition` in react-bootstrap due to their complexity and session-storage side effects.

**Migration risk if unresolved:** The `TermsAndConditionModal` was the source of a critical bug (fixed in Sprint 0). Any modal replacement must be regression-tested against the terms-version check flow documented in `docs/architecture/org-switching-lifecycle.md`. The `BranchSelectorModal` drives organisation context for all subsequent API calls — incorrect implementation creates a data isolation risk.

**Owner:** [Design Lead — answer here]

**Answer:** Replace all `import { Modal } from 'react-bootstrap'` with `import { Modal } from '@nmi/react-components'`. API map: `show` → `isOpen`, `onHide` → `onClose`, `<Modal.Header>/<Modal.Title>` → `title` prop, `<Modal.Body>` → `children`, `<Modal.Footer>` → `footer` render prop. The target Modal wraps native `<dialog>` with focus trap and `aria-modal` (WCAG SC 4.1.2). TermsAndConditionModal animation uses `--nmi-motion-duration-fast`; existing `waitFor()` Storybook assertion remains appropriate. *(Expert Design Lead, 2026-06-04)*

---

### Item 8 — Icon System

**Input question:** Can the NMI icon font (`nmi-iconfont`, woff only, 55 icons) and its CSP workaround layer (`_replace-svgicons-csp.scss`) be retired in the target platform, and if so, what replaces it?

**Current implementation detail:**
`ClientApp/src/styles/_replace-svgicons-csp.scss` (199 lines) defines 13 icon codepoint variables and uses them to replace Bootstrap's inline SVGs with icon font rendering:

```scss
$icon-arrow-right: "\e903"   $icon-back: "\e906"      $icon-calendar: "\e907"
$icon-chevron-down: "\e908"  $icon-chevron-right: "\e910" $icon-close: "\e913"
$icon-external: "\e925"      $icon-menu: "\e931"      $icon-radio-checked: "\e938"
$icon-radio-unchecked: "\e939" $icon-radio-whitebg-checked: "\e940"
$icon-radio-whitebg-unchecked: "\e943" $icon-settings: "\e947"
```

These 13 icons are used in SCSS pseudo-elements (`::before`/`::after`) to replace: `.btn-close`, accordion expand/collapse, navbar hamburger/close, `#user-menu` dropdown caret, `.dropdown-toggle` caret, `.breadcrumb` separator, and `.date-picker` calendar icon.

The icon font is only available in woff format (not woff2). The `_replace-svgicons-csp.scss` file exists solely because Bootstrap 5 embeds SVGs as data URIs in CSS, which violates the `trusted-types` CSP policy active in this application (see `ClientApp/src/trustedtypes.ts`). If the target platform does not embed SVG data URIs in CSS, this entire workaround layer can be retired.

**Decision options:**
- **Option A — Retire icon font, adopt target-platform icons:** Replace all 13 icon usages with target-platform icons (SVG sprites, inline SVGs via React components, or a target design system icon set). `_replace-svgicons-csp.scss` is deleted. Requires audit of every component and SCSS pseudo-element that references `font-family: 'nmi-iconfont'`.
- **Option B — Convert icon font to woff2 and retain:** Convert the existing font file to woff2 format for performance; retain the icon font approach and `_replace-svgicons-csp.scss`. Only viable if the target platform's CSS does not introduce new inline-SVG CSP violations.
- **Option C — Replace pseudo-element icons with React icon components:** Convert the 13 icon usages from CSS pseudo-elements to React `<svg>` or icon library components (e.g., `<ChevronDownIcon />`). This eliminates icon-font dependency and allows tree-shaking but requires touching every component that currently uses icon-font pseudo-elements via SCSS.

**Migration risk if unresolved:** The icon font is embedded throughout both SCSS (pseudo-elements) and React components (`ClientApp/src/components/Icons/ExternalLinkIcon.tsx`). Without a decided replacement, the CSP policy outcome in the target platform is unknown — Bootstrap's inline SVG problem may resurface if the CSS is not audited.

**Owner:** [Design Lead — answer here]

**Answer:** Retire NMI icon font and `_replace-svgicons-csp.scss`. Replace all icon usages with SVG React components from `packages/icons`. **Pre-requisite:** Audit all `nmi-icon-*` usages (`rg -n "nmi-icon-" ClientApp/src`), confirm each icon name exists in `packages/icons`, add any missing SVGs before Batch E begins. Replace `<i className="nmi-icon-*">` with `<IconName aria-hidden />` or `<IconName aria-label="..." />`. Delete `_replace-svgicons-csp.scss` and icon font files after all usages are migrated. *(Expert Design Lead, 2026-06-04)*

---

### Item 9 — Accessibility Component Requirements

**Input question:** Are the NMI accessibility utility components (`skipLinks`, `routeAccessibleNavigation`, `useHtmlTitle`, `useBodyClass`) preserved in the target platform, or replaced with target-platform accessibility infrastructure?

**Current implementation detail:**
The following accessibility utilities exist in the codebase:

| Component/Hook | File | Role |
|---|---|---|
| `skipLinks` | `ClientApp/src/components/Utilities/skipLinks.tsx` | Skip-to-main-content link rendered at top of DOM; targets `#main` |
| `useRouteAccessibility` | `ClientApp/src/hooks/useRouteAccessibility.ts` — **CREATED 2026-06-05 (CRD-037)**; replaces deleted `routeAccessibleNavigation.tsx` | Hook that announces navigation via `aria-live` and moves focus to `#main` on route change (WCAG 2.4.2/2.4.3) |
| `useHtmlTitle` | `ClientApp/src/components/Utilities/useHtmlTitle.tsx` | Hook that sets `document.title` per page for screen reader page announcements |
| `useBodyClass` | `ClientApp/src/components/Utilities/useBodyClass.tsx` | Hook that applies page-specific body classes (`wizard`, `dashboard`, etc.) which drive SCSS variants in `index.scss` |
| `backToTopButton` | `ClientApp/src/components/Utilities/backToTopButton.tsx` | Keyboard-accessible back-to-top control |
| `hashLink` | `ClientApp/src/components/Utilities/hashLink.tsx` | Smooth-scroll hash navigation for in-page anchors |

`useBodyClass` is tightly coupled to `index.scss` (lines 59–85), which contains body-class-conditional SCSS rules that change layout background colour and button widths depending on the current page type. If `useBodyClass` is replaced, these SCSS rules must also be replaced with an equivalent context mechanism.

`useRouteAccessibility` (the hook that replaced the deleted `routeAccessibleNavigation.tsx`) uses React Router v7's `useLocation` hook. It must survive any router change in the target platform. The hook is already wired into both `Layout` and `PreConditions` as of CRD-037.

**Decision options:**
- **Option A — Preserve all six utilities as-is:** Port the utilities unchanged. Confirm WCAG 2.1 AA compliance is maintained. `useBodyClass` retains its `index.scss` coupling; the target platform inherits the same body-class-driven layout pattern.
- **Option B — Audit and selectively replace:** Audit each utility against the target platform's accessibility infrastructure. Where the target platform provides an equivalent (e.g., built-in skip-link component, route change focus management), retire the NMI implementation. Where no equivalent exists, port the NMI utility.
- **Option C — Replace with Australian Government Design System (AGDS) accessibility components:** If the target platform adopts the AGDS, its accessibility primitives may cover all six utilities. Requires a gap analysis against AGDS component inventory before any retirement of NMI utilities.

**Migration risk if unresolved:** Removing any of these utilities without a confirmed replacement creates a WCAG 2.1 AA compliance risk. The NMI portal serves a government audience with mandatory accessibility obligations. Any regression in skip-link, focus management, or page title announcement behaviour must be caught in UAT before production deployment.

**Owner:** [Design Lead — answer here]

**Answer:** AppShell already handles skipLinks (renders `<a href="#main-content">Skip to main content</a>`). ARIA landmarks in AppShell are ready. **Gap — must close before Batch E:** Add a `useRouteAccessibility` hook to `packages/portal-patterns/src/AppShell/` that on each route change (1) updates `document.title`, (2) moves focus to `<main>` or an `h1` inside it, and (3) posts a polite live-region announcement (`<div role="status" aria-live="polite">`). Without this, WCAG 2.4.2 (Page Titled) and 2.4.3 (Focus Order) are violated for screen-reader users. *(Expert Design Lead, 2026-06-04)*

---

### Item 10 — Print Styles

**Input question:** What is the migration approach for `media-print.scss`? The file is not currently imported by `index.scss` and may be orphaned. Should it be retired, verified and adopted, or replaced?

**Current implementation detail:**
`ClientApp/src/styles/media-print.scss` (25 lines) contains a `@media print` block that:
- Sets `font-family: Arial, Helvetica, Sans-serif; font-size: 14pt; line-height: 165%; color: black`
- Hides all content (`visibility: hidden; height: 0`) then selectively reveals `.printable-card` and `#printable-label` elements
- Sizes `#printable-label` text to `font-size: 36pt` for large-format label printing

**Critically: this file is NOT imported by `index.scss`.** The `index.scss` import list (lines 1–34) does not include `./media-print`. Whether this omission is intentional (the print styles may be injected via a separate mechanism) or an oversight (the styles are dead code) is unconfirmed.

The `#printable-label` selector suggests a print-to-label flow exists or was planned, likely in the measurement report domain (`routes/measurementReport/`). No corresponding React component with `id="printable-label"` was found in the current snapshot.

**Decision options:**
- **Option A — Investigate then adopt:** Before migration, confirm whether `media-print.scss` is loaded by any mechanism other than `index.scss` (e.g., a separate `<link>` in `public/index.html`, or a dynamic import in `reportDetails.tsx`). If it is actively used, import it into `index.scss` and include it in Batch E. If it is confirmed orphaned, proceed to Option B.
- **Option B — Retire the file:** If confirmed orphaned and no print requirement exists in scope, delete `media-print.scss`. Document the decision in the Master Change Record.
- **Option C — Replace with a target-platform print strategy:** If a print requirement exists for measurement reports or labels, implement it using the target platform's print stylesheet approach. The NMI `media-print.scss` content may serve as a reference for the visual intent.

**Migration risk if unresolved:** Low, provided the orphan status is confirmed. If the file is silently in use (e.g., `public/index.html` has a `<link>` to a compiled print CSS bundle), omitting it from Batch E creates a functional regression in print workflows. The investigation in Option A is low-cost and should be completed before Batch E starts.

**Owner:** [Design Lead — answer here]

**Answer:** Port `media-print.scss` verbatim to `apps/portal-spa/src/styles/print.css`. Import after the design token CSS import in `apps/portal-spa/src/main.tsx`. No SCSS processing required — pure `@media print {}` CSS. Before Batch E: replace any Bootstrap print selectors (`.d-print-none`, `.d-print-block`) with direct element/class selectors. *(Expert Design Lead, 2026-06-04)*

---

## Section 2 — Infrastructure Inputs (Items 11–13)

---

### Item 11 — Backend OpenAPI Spec Availability

**Input question:** Is the backend OpenAPI specification available and at which URL, so that `web-api-client.ts` can be regenerated for the target environment?

**Current implementation detail:**
`ClientApp/src/api/web-api-client.ts` is auto-generated by NSwag v14.5.0.0 from the backend OpenAPI spec. The generation procedure is documented at `docs/architecture/nswag-regeneration.md`. Key constraints:

- The file begins with a hand-authored `AuthorizedApiBase` class (lines 10–35) that must be preserved through every regeneration. It reads `sessionStorage.getItem('targetOrganisation')` at construction time, which is the mechanism for multi-organisation API context switching.
- The generated client contains 337 decision branches (per assessment) — it is the most complex single file in the codebase.
- No NSwag config file (`*.nswag` or `nswag.json`) was found in the project snapshot. Regeneration requires the spec URL and manual flag reconstruction from the file header comments.
- The current snapshot was captured at a point in time; the backend API may have drifted. Any regeneration for the target environment must be tested against a running backend instance.

The regeneration procedure requires: `curl http://<backend-host>/swagger/v1/swagger.json`, then NSwag CLI invocation with TypeScript client flags matching the existing file's style.

**Decision options:**
- **Option A — Provide spec URL from target backend:** Backend team provides the OpenAPI spec URL for the target environment. The frontend team runs the NSwag regeneration procedure before Batch E API client migration. If the spec has changed, component usages of renamed/removed client methods must be updated.
- **Option B — Provide spec file directly:** Backend team exports `swagger.json` and provides it as a file artefact. Useful if the target backend is not yet publicly accessible during migration.
- **Option C — Defer and use existing client:** Accept that `web-api-client.ts` may be slightly out-of-date for the duration of the migration. Regenerate only when a breaking API change is confirmed. Lowest effort; carries risk if the backend has already drifted.

**Migration risk if unresolved:** The test infrastructure (Vitest unit tests and MSW mock handlers in `.storybook/msw-handlers.ts`) depends on the API client's method signatures. A stale client that does not match the target backend will cause integration test failures. This is a hard dependency for Phase E completion.

**Owner:** [Backend Team — answer here]

**Answer:** Generate and commit the OpenAPI spec to `docs/api/openapi.json` before test migration begins: `dotnet run --project src/Nmi.Portal.Api -- --openapi-output docs/api/openapi.json`. This enables reproducible NSwag client regeneration in CI without a running API server. If the BFF is unchanged, the current `web-api-client.ts` remains valid; regeneration is only needed if endpoint shapes change. Backend team to confirm which endpoints (if any) change shape — gates Item 15 action. *(Backend Architect, 2026-06-04)*

---

### Item 12 — Target CI Configuration

**Input question:** Can the existing Playwright + Vitest + bddgen test pipeline be reproduced in the target CI system without modification, or does it require adaptation?

**Current implementation detail:**
The current test pipeline (per assessment and `docs/TESTING.md`) consists of three independent test systems that must all pass before a migration phase is considered complete:

1. **Vitest unit tests** — 1,169 tests across 114 files covering components, validation schemas, utilities, auth, routes, runtime services, and migration enforcement. Runner: `npm run test:unit`. Config: `vitest.unit.config.ts`.
2. **Playwright BDD E2E tests** — 20+ `.feature` files processed by `playwright-bdd` (`bddgen` CLI) to generate test files, then run via Playwright. Requires a running application or Storybook server. `playwright.config.ts` sets `baseURL` to the Storybook dev server.
3. **Storybook story tests** — Play function tests within Storybook stories; run via `@storybook/test-runner`. Currently blocked on Sprint 1 story remediation (issues #1–#15 in Open Items Backlog).

CI compatibility concerns:
- Playwright requires a browser binary (Chromium/Firefox/WebKit); CI must have either pre-installed browsers or Playwright's `--with-deps` install step.
- `bddgen` is a code-generation step that must run before Playwright; the pipeline order is `bddgen → playwright`.
- The Storybook test runner requires a running Storybook server; CI must start Storybook as a background service before running tests.
- Node ≥ 20.0.0 is required (package.json engine constraint).

**Decision options:**
- **Option A — Reproduce pipeline in target CI as-is:** Target CI (e.g., Azure DevOps, GitHub Actions, other) configures the same three-phase pipeline: Vitest, bddgen + Playwright, Storybook test runner. No changes to test code; only CI YAML configuration differs.
- **Option B — Adapt pipeline for target CI constraints:** If the target CI system has restrictions (e.g., no GUI browser support, different Node version policy, restricted npm registry), adapt individual steps. Document which constraints require test code changes versus CI configuration changes only.
- **Option C — Phase the pipeline:** Initially configure only Vitest unit tests in CI (lowest dependency). Add Playwright BDD and Storybook test runner stages after the target environment's browser support and service startup patterns are confirmed.

**Migration risk if unresolved:** Without a confirmed CI pipeline, the migration cannot use automated gates to verify that each batch has not introduced regressions. Manual verification is not a viable substitute for the current unit, Storybook, regression, and BDD suites running on every merge.

**Owner:** [DevOps — answer here]

**Answer:** GitHub Actions pipeline in order: `pnpm typecheck` → `pnpm lint` → `pnpm test` (Vitest unit + component) → `pnpm test:storybook` (Storybook build + play function tests) → `pnpm test:e2e` (Playwright, with `bddgen` as pre-step in same job) → `dotnet test`. Playwright requires separate job with `playwright install --with-deps`. The `npm run migration-check` combined gate defines the minimum PR merge bar — replicate as the branch protection gate. *(Backend Architect, 2026-06-04)*

---

### Item 13 — Storybook Adapter in Target Repository

**Input question:** In the target repository, does Storybook use the Vite adapter (current: `@storybook/react-vite` v10.4.0) or the webpack 5 adapter, and is Storybook co-located in the app repo or in a separate workspace package?

**Current implementation detail:**
The current snapshot has a split build configuration:

| Concern | Adapter | Config file |
|---|---|---|
| Production bundle | webpack 5 | `ClientApp/webpack/webpack.config.js` |
| Storybook (dev/test) | Vite via `@storybook/react-vite` | `.storybook/main.ts` |

This split is documented at `docs/architecture/storybook-vs-webpack-runtime.md` and `docs/architecture/target-repo-storybook-placement.md`. The architecture decision record at the latter document describes three placement options:

- **Option A — Co-located, Vite production:** Migrate the production bundler from webpack to Vite, aligning with the Storybook adapter already in use. Eliminates the Vite/webpack split entirely.
- **Option B — Monorepo separation:** Storybook moves to `packages/storybook/`; production app stays in its own package. Isolates build environments; adds monorepo tooling overhead (npm workspaces / Turborepo / Nx).
- **Option C — webpack Storybook adapter:** Switch `.storybook/main.ts` to `@storybook/react-webpack5`. Eliminates the split but degrades Storybook developer experience; the webpack Storybook adapter is less actively maintained than the Vite adapter.

The architecture document recommends **Option A (Vite production)** if webpack is not required by the .NET host; **Option B (monorepo)** if webpack must be retained.

The Playwright BDD config (`playwright.config.ts`) sets `baseURL` pointing to the Storybook server. If Storybook moves to a separate package, the `baseURL` and any Storybook startup scripts must be updated accordingly.

The Storybook Vitest harness now includes jsdom-only shims in `vitest.storybook.setup.ts` for APIs that are browser-native in real Storybook (`scrollTo`, canvas `getContext`, and pseudo-element `getComputedStyle`). The harness also suppresses only the deliberate ErrorBoundary demonstration errors. Any target adapter or package split must preserve equivalent setup so Storybook tests remain signal-bearing and do not reintroduce noisy false alarms.

**Decision options:**
(See Options A, B, C described under Current Implementation Detail above.)

**Migration risk if unresolved:** The Storybook sprint 1 remediation issues (#1–#15 in Open Items Backlog) are producing play-function tests and story fixtures that will need to be compatible with the target Storybook configuration. If the adapter or placement changes between now and migration, the MSW handler configuration (`.storybook/msw-handlers.ts`), the `preview.js` file, and potentially the story import glob patterns must all be re-tested. Deciding this early avoids rework.

**Owner:** [Architect — answer here]

**Answer:** Vite. Target monorepo uses `@storybook/react-vite`. Migrate `.storybook/` directory (storybookHarness.tsx, preview.ts, MSW handlers) as-is. No webpack config or custom loader migration needed. BDD story tests remain framework-agnostic at the test layer. *(Architect, 2026-06-04)*

---

## Completion Checklist

When all 13 items have a recorded answer:

- [ ] Update every row in the Status Summary Table from `UNRESOLVED` to `RESOLVED`
- [ ] Notify the migration team lead that this document is complete
- [ ] Confirm the Open Items Backlog (`docs/change-record/OPEN-ITEMS-BACKLOG.md`) Priority 2 rows are updated to reflect resolution
- [ ] Schedule Batch E planning session — design-platform decisions (items 1–10) must be socialised with both Design Lead and Frontend Lead before sprint planning begins
- [ ] Confirm infrastructure decisions (items 11–13) are reflected in the target-repo setup checklist before any code is moved to the target repository
