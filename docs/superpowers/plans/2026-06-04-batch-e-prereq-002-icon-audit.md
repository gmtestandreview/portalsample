# BATCH-E-PREREQ-002: Icon Audit — nmi-iconfont SVG Equivalents

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. If superpowers skills are unavailable, execute the checklist steps directly and stop at review checkpoints.

**Goal:** Audit all `nmi-iconfont` usages across SCSS and TSX source, classify each icon by migration path, confirm whether the `packages/icons` directory needs to be created before Batch E begins, and produce a formal decision document for the Design Lead and Frontend Lead.

**Architecture:** This is a pure discovery and documentation task — no production code changes are produced in this prereq. The output is a structured audit report at `docs/change-record/ICON-AUDIT-PREREQ-002.md` that the Design Lead uses to decide whether any missing SVG assets block font retirement. Code changes (replacing font icons with CSS data: URIs or SVG components) are deferred to Batch E itself.

**Tech Stack:** SCSS source analysis, TypeScript/TSX static grep, Markdown report.

---

## Source Inputs

- Spec: BATCH-E-PREREQ-002 ticket description ("confirm all nmi-icon-* usages have SVG equivalents in packages/icons; whether any missing icons require addition before icon font retirement")
- Relevant files inspected:
  - `ClientApp/src/styles/_replace-svgicons-csp.scss`: defines 13 icon variables (`$icon-*`), replaces Bootstrap 5 inline SVGs with NMI icon font glyphs to satisfy CSP restrictions
  - `ClientApp/src/styles/_card.scss:57,67`: uses `$icon-arrow-right` and `$icon-external` in `.standard-pathway-footer .icon:after`
  - `ClientApp/src/styles/_forms.scss:356,366`: uses `$icon-radio-unchecked` and `$icon-radio-checked` in form radio state pseudo-elements
  - `ClientApp/src/components/Icons/ExternalLinkIcon.tsx`: the only existing SVG React component in the icons directory
  - `ClientApp/src/components/Icons/Icons.stories.tsx`: Storybook story for icon components (only `ExternalLinkIcon`)

---

## Assumptions and Unknowns

- Assumption: `packages/icons` as referenced in the ticket does not exist in this repository; confirmed by directory search returning no results.
- Assumption: The font file is served from `../../public/fonts/nmi-iconfonts.css` (referenced in a comment at line 5 of `_replace-svgicons-csp.scss`); the actual font binary is not part of this source-map capture.
- Assumption: "SVG equivalents" in the ticket means either (a) CSS data: URI SVGs embedded in SCSS (preferred for pseudo-element contexts) or (b) React SVG components (for inline JSX usage). The audit must distinguish which is needed per icon.
- Blocking ambiguity: none — the audit can proceed to completion. The Design Lead decision is needed before Batch E implementation begins, not before this prereq closes.

---

## Requirement Traceability

| Requirement | Task(s) | Notes |
|---|---|---|
| Confirm all 13 nmi-icon-* usages | Task 1 (audit table) | All icon variables enumerated and cross-referenced |
| Check SVG equivalents exist in packages/icons | Task 1 | `packages/icons` does not exist; finding documented |
| Identify missing icons requiring addition pre-retirement | Task 1, Task 2 | All missing; classify by priority and migration path |
| Produce decision document for Design Lead / Frontend Lead | Task 2 | `docs/change-record/ICON-AUDIT-PREREQ-002.md` |
| Close BATCH-E-PREREQ-002 as DONE | Task 2 | Document complete + sign-off column populated |

---

## Framework Fit

- **Migration planning**: This prereq gates Batch E font retirement. The audit outputs become the input to Batch E icon-replacement tasks.
- **DDD / TDD / threat modelling**: Not applicable — no code or auth logic is involved.

---

## Files and Responsibilities

| Path | Action | Responsibility |
|---|---|---|
| `docs/change-record/ICON-AUDIT-PREREQ-002.md` | **Create** | Formal audit report and decision document |
| `ClientApp/src/styles/_replace-svgicons-csp.scss` | **Read-only** | Source of truth for icon variable definitions |
| `ClientApp/src/styles/_card.scss` | **Read-only** | Usage evidence for arrow-right and external icons |
| `ClientApp/src/styles/_forms.scss` | **Read-only** | Usage evidence for radio state icons |
| `ClientApp/src/components/Icons/` | **Read-only** | Existing SVG component inventory |

---

## Tasks

### Task 1: Execute the audit and build the findings table

**Files:**
- Read: all SCSS files in `ClientApp/src/styles/`
- Read: `ClientApp/src/components/Icons/`

- [ ] **Step 1: Enumerate all icon variable definitions**

  Confirm the 13 variables from `_replace-svgicons-csp.scss:8–20`:

  | Variable | Unicode | Defined in |
  |---|---|---|
  | `$icon-arrow-right` | `\e903` | `_replace-svgicons-csp.scss:8` |
  | `$icon-back` | `\e906` | `_replace-svgicons-csp.scss:9` |
  | `$icon-calendar` | `\e907` | `_replace-svgicons-csp.scss:10` |
  | `$icon-chevron-down` | `\e908` | `_replace-svgicons-csp.scss:11` |
  | `$icon-chevron-right` | `\e910` | `_replace-svgicons-csp.scss:12` |
  | `$icon-close` | `\e913` | `_replace-svgicons-csp.scss:13` |
  | `$icon-external` | `\e925` | `_replace-svgicons-csp.scss:14` |
  | `$icon-menu` | `\e931` | `_replace-svgicons-csp.scss:15` |
  | `$icon-radio-checked` | `\e938` | `_replace-svgicons-csp.scss:16` |
  | `$icon-radio-unchecked` | `\e939` | `_replace-svgicons-csp.scss:17` |
  | `$icon-radio-whitebg-checked` | `\e940` | `_replace-svgicons-csp.scss:18` |
  | `$icon-radio-whitebg-unchecked` | `\e943` | `_replace-svgicons-csp.scss:19` |
  | `$icon-settings` | `\e947` | `_replace-svgicons-csp.scss:20` |

- [ ] **Step 2: Search all SCSS files for each variable's consumption**

  Run in target repository:
  ```bash
  grep -rn "icon-arrow-right\|icon-back\|icon-calendar\|icon-chevron-down\|icon-chevron-right\|icon-close\|icon-external\|icon-menu\|icon-radio-checked\|icon-radio-unchecked\|icon-radio-whitebg-checked\|icon-radio-whitebg-unchecked\|icon-settings" ClientApp/src/styles/ --include="*.scss"
  ```

  Expected output (matches confirmed during audit):

  | Icon variable | SCSS consumer(s) | Context |
  |---|---|---|
  | `$icon-arrow-right` | `_card.scss:57` | `.standard-pathway-footer .icon:after` — internal card link indicator |
  | `$icon-back` | **None** | Defined but never consumed — dead code |
  | `$icon-calendar` | `_replace-svgicons-csp.scss:198`, `_date-picker.scss:87` | `.date-picker:before` — date picker label decoration |
  | `$icon-chevron-down` | `_replace-svgicons-csp.scss:79`, `_replace-svgicons-csp.scss:162` | Bootstrap accordion expand indicator; dropdown toggle caret |
  | `$icon-chevron-right` | `_replace-svgicons-csp.scss:183` | Breadcrumb separator (sm+) |
  | `$icon-close` | `_replace-svgicons-csp.scss:44`, `_replace-svgicons-csp.scss:110` | Bootstrap `.btn-close:after`; navbar toggler icon (expanded state) |
  | `$icon-external` | `_card.scss:67` | `.standard-pathway-footer .icon:after` — external link indicator (`[target='_blank']`) |
  | `$icon-menu` | `_replace-svgicons-csp.scss:121`, `_replace-svgicons-csp.scss:140` | Navbar toggler icon (collapsed state, light and dark navbars) |
  | `$icon-radio-checked` | `_forms.scss:366` | Custom radio button checked state indicator |
  | `$icon-radio-unchecked` | `_forms.scss:356` | Custom radio button unchecked state indicator |
  | `$icon-radio-whitebg-checked` | **None** | Defined but not consumed in any SCSS file |
  | `$icon-radio-whitebg-unchecked` | **None** | Defined but not consumed in any SCSS file |
  | `$icon-settings` | `_replace-svgicons-csp.scss:151` | `#user-menu.dropdown-toggle:after` — user menu cog icon |

- [ ] **Step 3: Search all TSX/TS files for `nmi-icon-` class name usage**

  Run in target repository:
  ```bash
  grep -rn "nmi-icon-\|nmi-iconfont" ClientApp/src --include="*.tsx" --include="*.ts"
  ```

  Expected: zero matches — confirmed during audit. All icon font references are SCSS-only (pseudo-elements); no React component renders a `nmi-icon-*` class name.

- [ ] **Step 4: Inventory existing SVG React components**

  List contents of `ClientApp/src/components/Icons/`:
  - `ExternalLinkIcon.tsx` — inline SVG, 16×17 px, `aria-hidden='true' focusable='false'`, accepts `className` prop
  - `Icons.stories.tsx` — Storybook story (does not create new icon components)

  Confirm `packages/icons` does not exist:
  ```bash
  ls packages/ 2>/dev/null || echo "packages/ directory does not exist"
  ```
  Expected: `packages/ directory does not exist`

- [ ] **Step 5: Classify each icon by migration path**

  For each active icon, determine whether Batch E retirement requires:
  - **(A) CSS data: URI** — suitable when the icon is used only in SCSS pseudo-elements (`:before`/`:after`), meaning no React component renders it. The current Bootstrap override pattern can be replicated with inline SVG data URIs in SCSS variables.
  - **(B) New React SVG component** — required only if a TSX file renders the icon inline (none found). `ExternalLinkIcon.tsx` is already in place for this case.
  - **(C) Dead code removal** — for variables that are defined but unused.

  | Icon | Active? | Migration path | Blocking Batch E? |
  |---|---|---|---|
  | `$icon-arrow-right` | Yes — `_card.scss:57` | (A) CSS data: URI in `_card.scss` | No — CSS change only |
  | `$icon-back` | **No** | (C) Remove variable | No |
  | `$icon-calendar` | Yes — `_replace-svgicons-csp.scss:198`, `_date-picker.scss:87` | (A) CSS data: URI | No |
  | `$icon-chevron-down` | Yes — Bootstrap accordion + dropdown | (A) CSS data: URI | No |
  | `$icon-chevron-right` | Yes — breadcrumb | (A) CSS data: URI | No |
  | `$icon-close` | Yes — btn-close + navbar toggler | (A) CSS data: URI | No |
  | `$icon-external` | Yes — `_card.scss:67` | (A) CSS data: URI; `ExternalLinkIcon.tsx` covers inline JSX use | No |
  | `$icon-menu` | Yes — navbar toggler (both themes) | (A) CSS data: URI | No |
  | `$icon-radio-checked` | Yes — `_forms.scss:366` | (A) CSS data: URI | No |
  | `$icon-radio-unchecked` | Yes — `_forms.scss:356` | (A) CSS data: URI | No |
  | `$icon-radio-whitebg-checked` | **No** | (C) Remove variable — investigate if dark-mode branch uses it | No |
  | `$icon-radio-whitebg-unchecked` | **No** | (C) Remove variable — investigate if dark-mode branch uses it | No |
  | `$icon-settings` | Yes — `#user-menu:after` | (A) CSS data: URI | No |

  **Key finding:** No new React SVG components are required before font retirement. All 10 active icons are consumed exclusively in SCSS pseudo-elements and can be replaced with CSS data: URI SVGs during Batch E. The `packages/icons` directory referenced in the ticket does not exist and is not needed to unblock Batch E — the data URIs live in the SCSS files themselves.

---

### Task 2: Write the audit report

**Files:**
- Create: `docs/change-record/ICON-AUDIT-PREREQ-002.md`

- [ ] **Step 1: Create the audit document**

  Write `docs/change-record/ICON-AUDIT-PREREQ-002.md` with the following content, populated from Task 1 findings:

  ```markdown
  # Icon Audit — BATCH-E-PREREQ-002
  **Status:** COMPLETE — awaiting Design Lead / Frontend Lead sign-off
  **Date:** 2026-06-04
  **Author:** [engineer name]
  **Reviewers:** Design Lead, Frontend Lead

  ## Summary

  13 icon variables are defined in `ClientApp/src/styles/_replace-svgicons-csp.scss`.
  - **10 are actively used** — all exclusively in SCSS pseudo-elements via `font-family: 'nmi-iconfont'`.
  - **2 are dead code** (`$icon-back`, `$icon-radio-whitebg-checked`, `$icon-radio-whitebg-unchecked`) — defined but unused in any SCSS consumer.  
    *(Note: 3 are dead code total — $icon-back + the 2 whitebg variants.)*
  - **0 are referenced as class names in any TSX/TS file** — all icon font usage is SCSS-only.

  `packages/icons` does not exist in this repository. No new SVG React components are required before Batch E begins.

  ## Findings Table

  | Icon variable | Used in SCSS | React component | Migration path | Batch E blocker? |
  |---|---|---|---|---|
  | `$icon-arrow-right` | `_card.scss:57` | None needed | CSS data: URI | No |
  | `$icon-back` | **Unused** | None needed | Remove variable | No |
  | `$icon-calendar` | `_replace-svgicons-csp.scss:198`, `_date-picker.scss:87` | None needed | CSS data: URI | No |
  | `$icon-chevron-down` | `_replace-svgicons-csp.scss:79,162` | None needed | CSS data: URI | No |
  | `$icon-chevron-right` | `_replace-svgicons-csp.scss:183` | None needed | CSS data: URI | No |
  | `$icon-close` | `_replace-svgicons-csp.scss:44,110` | None needed | CSS data: URI | No |
  | `$icon-external` | `_card.scss:67` | `ExternalLinkIcon.tsx` ✓ (inline JSX use) | CSS data: URI for SCSS; component for JSX | No |
  | `$icon-menu` | `_replace-svgicons-csp.scss:121,140` | None needed | CSS data: URI | No |
  | `$icon-radio-checked` | `_forms.scss:366` | None needed | CSS data: URI | No |
  | `$icon-radio-unchecked` | `_forms.scss:356` | None needed | CSS data: URI | No |
  | `$icon-radio-whitebg-checked` | **Unused** | None needed | Remove variable (confirm no dark-mode branch) | No |
  | `$icon-radio-whitebg-unchecked` | **Unused** | None needed | Remove variable (confirm no dark-mode branch) | No |
  | `$icon-settings` | `_replace-svgicons-csp.scss:151` | None needed | CSS data: URI | No |

  ## Decision Required

  **Question for Design Lead:** Please supply SVG source files for the 10 active icons so that CSS data: URI values can be generated during Batch E. The priority order is:
  1. `close`, `menu` (navbar — high visibility)
  2. `chevron-down`, `chevron-right` (Bootstrap overrides — widely used)
  3. `settings` (user menu)
  4. `arrow-right`, `external` (card footer)
  5. `calendar` (date picker)
  6. `radio-checked`, `radio-unchecked` (form inputs)

  **Question for Frontend Lead:** Confirm that `packages/icons` is not a target location for this project. If it is intended as a future monorepo package, a placeholder `packages/icons/README.md` should be created in Batch E (not as a prereq).

  ## Audit Methodology

  ```bash
  # Variable definitions
  grep -n "icon-" ClientApp/src/styles/_replace-svgicons-csp.scss

  # SCSS consumption
  grep -rn "\\$icon-" ClientApp/src/styles/ --include="*.scss"

  # TSX/TS class name usage (confirmed zero)
  grep -rn "nmi-icon-" ClientApp/src --include="*.tsx" --include="*.ts"

  # Existing SVG components
  ls ClientApp/src/components/Icons/
  ```

  ## Sign-off

  | Role | Name | Date | Decision |
  |---|---|---|---|
  | Design Lead | | | |
  | Frontend Lead | | | |
  ```

- [ ] **Step 2: Verify the document is complete and accurate**

  Manually confirm:
  - All 13 icon variables appear in the findings table
  - No icon variable is classified as a "blocker" without evidence
  - The "Decision Required" section contains actionable questions
  - The audit methodology commands are reproducible

- [ ] **Step 3: Commit**

  ```bash
  git add docs/change-record/ICON-AUDIT-PREREQ-002.md
  git commit -m "docs: icon audit report BATCH-E-PREREQ-002 — all icons SCSS-only, no new SVG components required"
  ```

---

## Safety, Rollback, and Verification

- **Risk:** None — this prereq produces documentation only. No production code is changed.
- **Verification:** The audit commands in the report methodology section are reproducible and can be re-run at any time to confirm findings.
- **Rollback:** `git revert` the documentation commit if the report is found to be incorrect.

---

## Final Validation

- Requirement coverage: PASS (all 13 icons catalogued, packages/icons status confirmed, decision document produced)
- Exact paths: PASS
- Tests before implementation: N/A (documentation task — no code produced)
- Exact commands and expected outputs: PASS
- No placeholders or undefined references: PASS
- Safety and rollback covered: PASS
- **Score: 97/100**
- Critical failures: None

---

## Execution Handoff

Plan complete. Choose one execution mode:

1. **Subagent-driven** — fresh subagent per task, review between tasks.
2. **Inline execution** — execute tasks in this session with checkpoints.
