# Icon Audit — BATCH-E-PREREQ-002

**Status:** COMPLETE — awaiting Design Lead sign-off on SVG source files before Batch E begins
**Date:** 2026-06-05
**Reference:** BATCH-E-PREREQ-002 · CRD-038 · design decision Item 8 (CRD-034)
**Reviewers:** Design Lead, Frontend Lead

---

## Summary

13 icon variables are defined in `ClientApp/src/styles/_replace-svgicons-csp.scss`.

- **10 are actively used** — all exclusively via `font-family: 'nmi-iconfont'` in SCSS pseudo-element rules (`::before` / `::after`).
- **3 are dead code** — `$icon-back`, `$icon-radio-whitebg-checked`, and `$icon-radio-whitebg-unchecked` are defined but not consumed in any SCSS file. Confirm with Design Lead that no unreleased dark-mode or white-background variant uses them before removing.
- **0 icons are referenced as class names in any TSX or TS file** — all icon font usage is SCSS-only.

`packages/icons` does not exist in this repository. No new React SVG components are required before Batch E begins.

**Migration path for all 10 active icons:** CSS data: URI values embedded in SCSS (replacing `font-family: 'nmi-iconfont'` pseudo-element rules). This work is scoped to Batch E itself, not to this prerequisite. SVG source files from the Design Lead are the only prerequisite blocker.

---

## Findings Table

| Icon variable | Unicode | Active SCSS consumer(s) | Context | React component | Migration path | Batch E blocker? |
|---|---|---|---|---|---|---|
| `$icon-arrow-right` | `\e903` | `_card.scss:57` | `.standard-pathway-footer .icon::after` — internal card link indicator | None needed | CSS data: URI in `_card.scss` | No |
| `$icon-back` | `\e906` | **Unused** | Defined but not consumed in any SCSS file | None needed | Remove variable | No |
| `$icon-calendar` | `\e907` | `_replace-svgicons-csp.scss:198` | `.date-picker::before` — date picker label decoration | None needed | CSS data: URI | No |
| `$icon-chevron-down` | `\e908` | `_replace-svgicons-csp.scss:79`, `_replace-svgicons-csp.scss:162` | Bootstrap accordion expand indicator; dropdown toggle caret | None needed | CSS data: URI | No |
| `$icon-chevron-right` | `\e910` | `_replace-svgicons-csp.scss:183` | Breadcrumb separator (viewport ≥ sm) | None needed | CSS data: URI | No |
| `$icon-close` | `\e913` | `_replace-svgicons-csp.scss:44`, `_replace-svgicons-csp.scss:110` | Bootstrap `.btn-close::after`; navbar toggler icon (expanded state) | None needed | CSS data: URI | No |
| `$icon-external` | `\e925` | `_card.scss:67` | `.standard-pathway-footer .icon::after` on `[target='_blank']` cards | `ExternalLinkIcon.tsx` ✓ (inline JSX only) | CSS data: URI for SCSS; existing component covers inline JSX | No |
| `$icon-menu` | `\e931` | `_replace-svgicons-csp.scss:121`, `_replace-svgicons-csp.scss:140` | Navbar toggler icon (collapsed state, light and dark navbars) | None needed | CSS data: URI | No |
| `$icon-radio-checked` | `\e938` | `_forms.scss:366` | Custom radio button checked state indicator (`input:checked + label::before`) | None needed | CSS data: URI | No |
| `$icon-radio-unchecked` | `\e939` | `_forms.scss:356` | Custom radio button unchecked state indicator (`input:not(:checked) + label::before`) | None needed | CSS data: URI | No |
| `$icon-radio-whitebg-checked` | `\e940` | **Unused** | Defined but not consumed — possible white-background radio variant | None needed | Remove variable (confirm with Design Lead) | No |
| `$icon-radio-whitebg-unchecked` | `\e943` | **Unused** | Defined but not consumed — possible white-background radio variant | None needed | Remove variable (confirm with Design Lead) | No |
| `$icon-settings` | `\e947` | `_replace-svgicons-csp.scss:151` | `#user-menu.dropdown-toggle::after` — user menu cog icon | None needed | CSS data: URI | No |

---

## Key Findings

### 1. `packages/icons` does not exist

The target package directory `packages/icons` referenced in the Batch E design decisions does not exist in this repository. This directory will be created as part of Batch E work, not as a prerequisite. The SVG data: URI values used by the SCSS migration will be embedded directly in the SCSS partials rather than requiring a separate package.

**Action for Design Lead:** Please confirm whether `packages/icons` is intended as an actual monorepo package (containing `.svg` source files and a React export barrel), or whether SVG data: URIs embedded in the target SCSS are the correct approach. This decision affects whether Batch E creates the package or simply replaces font references inline.

### 2. All icon font usages are SCSS pseudo-element only

No `nmi-icon-*` class name or `nmi-iconfont` font-family reference appears in any `.ts` or `.tsx` file. Every font icon in the codebase is rendered via a CSS pseudo-element (`::before` or `::after`) with `font-family: 'nmi-iconfont'` set in a SCSS rule.

This means no JSX component changes are needed as part of icon font retirement — the entire migration is a SCSS find-and-replace from font glyph references to SVG data: URIs.

### 3. One React SVG component already exists

`ClientApp/src/components/Icons/ExternalLinkIcon.tsx` is the only existing SVG React component for icons. It is used in JSX for inline rendering (e.g., within link text or button labels). The corresponding SCSS usage in `_card.scss:67` uses `$icon-external` via `::after` — these are two independent render paths for the same visual icon. Both will continue to coexist after Batch E: the SCSS path migrates to a CSS data: URI, and the React component stays unchanged.

### 4. Dead code — 3 unused variables

`$icon-back`, `$icon-radio-whitebg-checked`, and `$icon-radio-whitebg-unchecked` are defined in `_replace-svgicons-csp.scss:9,18,19` but are not referenced by any SCSS rule. They can be removed during Batch E SCSS cleanup.

**Action for Design Lead:** Please confirm that none of these three variables are used in any unreleased branch, dark-mode variant, or white-background form theme before they are deleted.

---

## Decision Required from Design Lead

| # | Question | Needed before |
|---|---|---|
| D-1 | Please supply SVG source files (or confirm data: URI values) for the 10 active icons listed above. Priority order: `close`, `menu`, `chevron-down`, `chevron-right`, `settings`, `arrow-right`, `external`, `calendar`, `radio-checked`, `radio-unchecked`. | Batch E SCSS migration begins |
| D-2 | Confirm whether `packages/icons` should be a standalone package or whether SVG data: URIs should be embedded directly in the SCSS partials. | Batch E scope finalised |
| D-3 | Confirm that `$icon-back`, `$icon-radio-whitebg-checked`, and `$icon-radio-whitebg-unchecked` are safe to delete (not used in any unreleased branch or variant). | Batch E dead-code removal |

---

## Sign-Off

| Role | Name | Date | Decision |
|---|---|---|---|
| Design Lead | | | |
| Frontend Lead | | | |

---

## Audit Methodology

Commands run to produce these findings:

```bash
# Icon variable definitions
grep -n "icon-" ClientApp/src/styles/_replace-svgicons-csp.scss

# SCSS variable consumption across all style files
grep -rn "\$icon-" ClientApp/src/styles/ --include="*.scss"

# TSX/TS class name usage (confirmed zero matches)
grep -rn "nmi-icon-\|nmi-iconfont" ClientApp/src --include="*.tsx" --include="*.ts"

# Existing SVG React components
ls ClientApp/src/components/Icons/

# packages/icons directory existence
ls packages/ 2>/dev/null || echo "packages/ directory does not exist"
```

All commands confirmed: 13 variables defined, 10 actively consumed in SCSS only, 3 unused, 0 TSX class name references, `packages/icons` absent.

## Later Validation Note

CRD-040 (2026-06-05) established the ESLint gate for this source snapshot. `npm run lint` now passes with 0 errors and 131 accepted warnings documented in `docs/eslint-baseline.md`. This does not change the icon audit inventory or Batch E prerequisite conclusions above.
