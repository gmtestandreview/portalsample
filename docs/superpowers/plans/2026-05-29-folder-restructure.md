# NMI Portal Folder Restructure: static/ → ClientApp/ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganise the React frontend from a flat `static/` tree into a standard `ClientApp/` layout with `src/`, `public/`, and co-located component styles — matching the conventional ASP.NET Core SPA Services pattern.

**Architecture:** The workspace root represents the `NMI.Portal.Client.Web` project. `static/` is renamed to `ClientApp/`; within it `js/` becomes `src/` and `css/styles/` moves under `src/styles/`. Root-level `public/` and `fonts/` are relocated into `ClientApp/public/`. Config files (`webpack.config.js`, `tsconfig.json`, `vitest.config.ts`, `.storybook/main.ts`) stay at project root with updated path strings.

**Tech Stack:** React 18 · TypeScript · Webpack 5 · Dart Sass · Formik/Yup · Azure MSAL · Vitest · Playwright · Storybook (Vite)

---

## ⚠️ Pre-flight: Critical CI Discrepancy

**Read this before starting any task.**

`pr.yml` (`.github/workflows/pr.yml`) contains steps like:

```yaml
- name: Build SPA
  working-directory: apps/portal-spa   # ← NOT ClientApp/
  run: npm run build
  env:
    VITE_APP_ENVIRONMENT: local         # ← Vite, NOT webpack
    VITE_ENTRA_CLIENT_ID: ...
```

The CI was written for a **future monorepo state** (`apps/portal-spa/` + Vite) that differs from both:
- The **current** state (`static/` + webpack)
- The **target** state in this plan (`ClientApp/` + webpack)

**Decision required before executing any task:**

| Option | Description | Risk |
|--------|-------------|------|
| A — Proceed as specified | Restructure to `ClientApp/` as the plan describes; treat the CI divergence as a separate ticket | CI will still be broken at the end of this plan |
| B — Align CI now | Update `pr.yml` alongside the restructure so CI passes after this plan completes | Scope creep; CI references Vite which this codebase doesn't use yet |
| C — Stop and re-scope | Treat the CI as the authoritative target; restructure toward `apps/portal-spa/` instead | Larger refactor; potentially involves Vite migration too |

**This plan implements Option A.** Confirm your choice before proceeding.

---

## Impact Assessment

### Config files — content changes required

| File | Change count | What changes |
|------|-------------|--------------|
| `webpack.config.js` | 7 references | Entry path, exclude patterns, vendor alias keys, `devServer.static.directory` |
| `tsconfig.json` | 5 references | `paths`, `include`, `exclude` (3 entries) |
| `vitest.config.ts` | 13 references | All `coverage.include` paths |
| `.storybook/main.ts` | 3 references | `stories` globs (2), `staticDirs` (1) |
| `CLAUDE.md` | ~16 references | Architecture table, edit boundaries, critical-patterns examples |

### Source files — import path changes required

| File (current path) | Old import | New import |
|---------------------|-----------|-----------|
| `static/js/App.tsx` | `'../css/styles/index.scss'` | `'./styles/index.scss'` |
| `static/js/components/Utilities/ViewPdfQuoteTerms.tsx` | `'../../../css/styles/media-print.scss'` | `'../../styles/media-print.scss'` |
| `static/js/components/Utilities/ViewPdfButton.tsx` | `'../../../css/styles/media-print.scss'` | `'../../styles/media-print.scss'` |
| `static/js/components/Utilities/mailingLabel.tsx` | `'../../../css/styles/media-print.scss'` | `'../../styles/media-print.scss'` |
| `static/js/components/Utilities/ContactLink.tsx` | `'../../../css/styles/media-print.scss'` | `'../../styles/media-print.scss'` |

### Files that DO NOT need changes after moves

- All `@/`-aliased imports inside `static/js/**` — the alias target changes in `tsconfig.json`; the individual import strings stay as-is
- All relative imports within `static/js/**` that reference sibling files — relative paths are self-healing during the rename
- `static/css/styles/_date-picker.scss` line 66: `url('../../media/icon-invalid.png')` — the relative depth from `styles/` to `media/` is identical in both the old and new layout (two levels up lands on the `ClientApp/` root, then into `media/`)
- `index.html` — stays at project root; webpack `template` path is unchanged
- `package.json` — no file paths in scripts; stays as-is
- `playwright.config.ts` — references base URL only, no file paths

### Files to delete (duplicates / webpack artifacts)

| File | Reason |
|------|--------|
| `static/css/components/BlockUISpinner/index.scss` | Byte-for-byte duplicate of `static/js/components/BlockUISpinner/index.scss` |
| `static/css/components/BlockUISpinner/startup.cs` | Webpack bootstrap artifact mis-suffixed as `.cs`; not source code |
| `static/css/components/` (folder) | Empty after above deletions |

### CI pipeline — out-of-scope but documented

`pr.yml` and `release.yml` reference `apps/portal-spa` (a Vite monorepo target that doesn't exist yet). **This plan does not touch those files.** See pre-flight section.

---

## Rubric

An implementation is **complete and correct** when every item below is true:

| # | Criterion | How to verify |
|---|-----------|--------------|
| R1 | TypeScript compiles with zero errors | `npm run typecheck` exits 0 |
| R2 | Webpack bundles without errors in production mode | `npm run build` exits 0 and produces `dist/` |
| R3 | Webpack dev server starts | `npm start` serves on port 3000 with no "Module not found" errors |
| R4 | Unit tests pass | `npm run test:unit` exits 0 |
| R5 | Storybook builds | `npm run build-storybook` exits 0 |
| R6 | `@/` alias resolves | TypeScript can resolve `@/components/SomeComponent` after `tsconfig.json` change |
| R7 | SCSS compiles | No Sass errors about missing `../../media/icon-invalid.png` |
| R8 | `BlockUISpinner` CSS is present exactly once | `ClientApp/src/components/BlockUISpinner/index.scss` exists; no copy under `ClientApp/css/` |
| R9 | `fonts/` is in `ClientApp/public/fonts/` | `ls ClientApp/public/fonts/` shows `.ttf`, `.woff`, and `.css` files |
| R10 | `public/` MSW worker is accessible | Dev server serves `mockServiceWorker.js` at `/mockServiceWorker.js` |
| R11 | No stale `static/` or `static/js/` references in config files | `grep -r "static/js\|static/css" webpack.config.js tsconfig.json vitest.config.ts .storybook/main.ts` returns empty |

---

## Test Plan

Run these commands in order. Each gate must pass before proceeding to the next.

### Gate 1 — After folder moves (Tasks 1–6), before config updates
```bash
# Verify no TypeScript files were lost
find ClientApp/src -name "*.tsx" | wc -l
# Compare count to pre-move baseline:
# Old: find static/js -name "*.tsx" | wc -l   (record this BEFORE starting)

# Verify SCSS files landed correctly
find ClientApp/src/styles -name "*.scss" | sort
# Expected: ~25 files matching old static/css/styles/ listing

# Verify fonts
ls ClientApp/public/fonts/
# Expected: fonts.css  nmi-iconfonts.css  nmi-iconfonts.woff  PublicSans-Bold.ttf  PublicSans-Regular.ttf
```

### Gate 2 — After config updates (Tasks 7–11)
```bash
# TypeScript: zero errors
npm run typecheck

# Stale-path check in configs
grep -r "static/js\|static/css\|\"public\"" webpack.config.js tsconfig.json vitest.config.ts .storybook/main.ts
# Expected: zero matches
```

### Gate 3 — After import updates (Tasks 12–13)
```bash
# Stale import check in source files
grep -r "css/styles" ClientApp/src/
# Expected: zero matches

# Full type check + build
npm run typecheck && npm run build
```

### Gate 4 — Full suite
```bash
npm run test:unit
npm run build-storybook
# Optional (requires running server + Playwright browsers):
# npm run test:e2e
```

---

## Devil's Advocate

Arguments **against** doing this restructure, or doing it this way:

### 1. "The CI is already pointing somewhere else"
`pr.yml` expects `apps/portal-spa` and Vite. If the team is already planning a Vite migration, this webpack-era restructure will be undone in the next sprint. You'd be moving files twice.

**Counter:** The CI divergence is pre-emptive — someone wrote CI for the future state before the code got there. Restructuring `static/` → `ClientApp/` is still a necessary intermediate step unless you jump straight to the full Vite/monorepo migration.

### 2. "Renaming js/ → src/ is churn with zero functional benefit"
`src/` vs `js/` is a naming preference. It breaks all bookmarks, IDE jump-to-file history, and any PR comments referencing old paths. On a large team this causes review friction for weeks.

**Counter:** Worth the one-time pain to align with every React project convention (CRA, Vite, Next.js all use `src/`). New contributors will expect `src/`.

### 3. "Moving CSS into src/ co-mingles two concerns"
The original separation of `css/` and `js/` had a logic: design assets vs. code. Moving SCSS under `src/` groups it with TypeScript and can blur ownership.

**Counter:** The `_date-picker.scss` file already references mixins defined in `_variables.scss`; these are design tokens owned by the frontend team. The separation was never truly enforced — `BlockUISpinner` already had a duplicate SCSS under both folders, proving the dual-folder pattern wasn't maintained.

### 4. "git mv preserves history but the history is still confusing"
After renaming, `git log --follow` works per-file, but `git log` on the directory will show only post-rename activity. Blame and bisect on pre-rename code will require extra flags.

**Counter:** This is true of all folder restructures. Document the restructure commit SHA in the team wiki and move on. The clarity benefit outweighs the history cost.

### 5. "The BlockUISpinner startup.cs artifact suggests git hygiene is already poor"
If a webpack artifact is committed to the CSS folder, there may be other misplaced files not captured here. A quick restructure won't fix underlying contributor process issues.

**Counter:** Agreed. The restructure removes the artifact. Consider adding a `.gitignore` rule for `*.js.map` and webpack output in the same PR to prevent recurrence.

### 6. "This is a source-map snapshot — you can't validate any of this locally"
This workspace is explicitly non-buildable (`CLAUDE.md`: "never run npm from this workspace root"). The plan can be written but not verified here.

**Counter:** The plan is for the **real** NMI.Portal.Client.Web repository. The source-map capture informed the analysis; the execution happens in the actual project. Make sure a developer with the real repo runs Gates 1–4 before merging.

---

## File Structure (Before → After)

```
BEFORE                              AFTER
─────────────────────────────────── ──────────────────────────────────────
<project-root>/                     <project-root>/
├── static/                         ├── ClientApp/
│   ├── css/                        │   ├── css/                  (shell, deletable)
│   │   ├── components/             │   ├── media/                (unchanged)
│   │   │   └── BlockUISpinner/  ──►│   ├── public/               (moved from root)
│   │   │       ├── index.scss      │   │   └── fonts/            (moved from root)
│   │   │       └── startup.cs      │   ├── src/                  (was js/)
│   │   └── styles/  ──────────────►│   │   ├── components/
│   ├── js/  ──────────────────────►│   │   │   └── BlockUISpinner/
│   │   ├── App.tsx                 │   │   │       ├── index.tsx
│   │   ├── index.tsx               │   │   │       ├── index.scss (kept)
│   │   ├── components/             │   │   │       └── *.stories.tsx
│   │   │   └── BlockUISpinner/     │   │   ├── styles/           (was css/styles/)
│   │   │       ├── index.tsx       │   │   ├── App.tsx
│   │   │       ├── index.scss      │   │   ├── index.tsx
│   │   │       └── *.stories.tsx   │   │   └── ...all other ts/tsx
│   │   └── ...                     │   └── ...
│   └── media/                      ├── fonts/  ✗ DELETED (moved)
├── public/  ──────────────────────►├── public/ ✗ DELETED (moved)
│   └── mockServiceWorker.js        ├── index.html
├── fonts/  ───────────────────────►├── package.json
│   └── ...                         ├── webpack.config.js
├── index.html                      ├── tsconfig.json
├── package.json                    ├── vitest.config.ts
├── webpack.config.js               └── .storybook/
├── tsconfig.json
├── vitest.config.ts
└── .storybook/
```

---

## Task 1: Record baseline file counts

**Files:**
- Read-only — just run counts before touching anything

- [ ] **Step 1: Count current TSX and SCSS files**

```bash
echo "=== TSX count ===" && find static/js -name "*.tsx" | wc -l
echo "=== TS count ===" && find static/js -name "*.ts" | wc -l
echo "=== SCSS count ===" && find static/css/styles -name "*.scss" | wc -l
echo "=== Font files ===" && ls fonts/
echo "=== public files ===" && ls public/
```

Expected output (approximate — record actual values):
```
=== TSX count ===
~150+
=== TS count ===
~40+
=== SCSS count ===
25
=== Font files ===
fonts.css  nmi-iconfonts.css  nmi-iconfonts.woff  PublicSans-Bold.ttf  PublicSans-Regular.ttf
=== public files ===
mockServiceWorker.js
```

- [ ] **Step 2: Save counts to a scratch note**

Paste the exact numbers somewhere (a comment in a PR description, a local notepad). You'll compare these to the post-move counts in Gate 1.

---

## Task 2: Rename static/ → ClientApp/

**Files:**
- Rename (git mv): `static/` → `ClientApp/`

- [ ] **Step 1: Use git mv to rename the top-level folder**

```bash
git mv static ClientApp
```

Expected output: no output (git mv is silent on success).

- [ ] **Step 2: Verify the rename staged correctly**

```bash
git status --short | head -20
```

Expected: Lines starting with `R` (renamed) for files inside `static/`. Example:
```
R  static/css/styles/index.scss -> ClientApp/css/styles/index.scss
R  static/js/App.tsx -> ClientApp/js/App.tsx
...
```

- [ ] **Step 3: Commit checkpoint**

```bash
git add -A
git commit -m "refactor: rename static/ to ClientApp/"
```

---

## Task 3: Rename ClientApp/js/ → ClientApp/src/

**Files:**
- Rename (git mv): `ClientApp/js/` → `ClientApp/src/`

- [ ] **Step 1: Rename the js folder**

```bash
git mv ClientApp/js ClientApp/src
```

- [ ] **Step 2: Verify**

```bash
ls ClientApp/src/
```

Expected: `App.tsx  authentication/  components/  ...` (the former contents of `static/js/`)

```bash
git status --short | grep "js ->" | head -5
```

Expected: Lines like `R  ClientApp/js/App.tsx -> ClientApp/src/App.tsx`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: rename ClientApp/js/ to ClientApp/src/"
```

---

## Task 4: Move css/styles/ → src/styles/

**Files:**
- Move (git mv): `ClientApp/css/styles/` → `ClientApp/src/styles/`

- [ ] **Step 1: Move the styles directory**

```bash
git mv ClientApp/css/styles ClientApp/src/styles
```

- [ ] **Step 2: Verify**

```bash
ls ClientApp/src/styles/
```

Expected: `_accordion.scss  _alert.scss  _badge.scss  _bootstrap-import.scss  _breadcrumb.scss  _buttons.scss  _card.scss  _date-picker.scss  _dropdown.scss  _footer.scss  _forms.scss  _layout.scss  _mixins.scss  _modals.scss  _nav.scss  _navbar.scss  _pagination.scss  _replace-svgicons-csp.scss  _step-nav.scss  _tables.scss  _tooltips.scss  _typography.scss  _utilities.scss  _variables.scss  index.scss  media-print.scss`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: move ClientApp/css/styles/ to ClientApp/src/styles/"
```

---

## Task 5: Delete duplicate BlockUISpinner CSS and webpack artifact

**Files:**
- Delete: `ClientApp/css/components/BlockUISpinner/index.scss`
- Delete: `ClientApp/css/components/BlockUISpinner/startup.cs`
- Delete (rmdir): `ClientApp/css/components/BlockUISpinner/`
- Delete (rmdir): `ClientApp/css/components/`

The `index.scss` in `ClientApp/css/components/BlockUISpinner/` is byte-for-byte identical to `ClientApp/src/components/BlockUISpinner/index.scss` (verified during analysis). The `startup.cs` is a webpack bootstrap artifact, not C# source code.

- [ ] **Step 1: Confirm the files are identical before deleting**

```bash
diff ClientApp/css/components/BlockUISpinner/index.scss \
     ClientApp/src/components/BlockUISpinner/index.scss
```

Expected output: **empty** (no differences). If there are differences, stop and resolve the conflict manually before deleting.

- [ ] **Step 2: Delete the CSS-only duplicates**

```bash
git rm ClientApp/css/components/BlockUISpinner/index.scss
git rm ClientApp/css/components/BlockUISpinner/startup.cs
```

- [ ] **Step 3: Remove empty directories**

```bash
# These are now empty — remove them
rmdir ClientApp/css/components/BlockUISpinner
rmdir ClientApp/css/components
```

Note: `rmdir` only succeeds on empty directories. If it fails, something unexpected is present — investigate before deleting.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: delete duplicate BlockUISpinner CSS (co-located copy in src/components/ is canonical)"
```

---

## Task 6: Move public/ and fonts/ into ClientApp/public/

**Files:**
- Move (git mv): `public/` → `ClientApp/public/`
- Move (git mv): `fonts/` → `ClientApp/public/fonts/`

- [ ] **Step 1: Move public/**

```bash
git mv public ClientApp/public
```

- [ ] **Step 2: Move fonts/ into the new public/**

```bash
git mv fonts ClientApp/public/fonts
```

- [ ] **Step 3: Verify the final public structure**

```bash
ls ClientApp/public/
# Expected: fonts/  mockServiceWorker.js

ls ClientApp/public/fonts/
# Expected: fonts.css  nmi-iconfonts.css  nmi-iconfonts.woff  PublicSans-Bold.ttf  PublicSans-Regular.ttf
```

- [ ] **Step 4: Run Gate 1 verification (see Test Plan above)**

```bash
echo "=== TSX count (should match baseline) ===" && find ClientApp/src -name "*.tsx" | wc -l
echo "=== SCSS in styles (should match baseline) ===" && find ClientApp/src/styles -name "*.scss" | wc -l
echo "=== Fonts ===" && ls ClientApp/public/fonts/
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: move public/ and fonts/ into ClientApp/public/"
```

---

## Task 7: Update webpack.config.js

**Files:**
- Modify: `webpack.config.js`

- [ ] **Step 1: Update the entry point**

Change line 36:
```js
// BEFORE
entry: './static/js/index.tsx',

// AFTER
entry: './ClientApp/src/index.tsx',
```

- [ ] **Step 2: Update the vendor bundle alias exclusions**

Change lines 53–57:
```js
// BEFORE
alias: {
    'static/js/main': false,
    'static/js/parent/node_modules': false,
    'static/js/external': false,
},

// AFTER
alias: {
    'ClientApp/src/main': false,
    'ClientApp/src/parent/node_modules': false,
    'ClientApp/src/external': false,
},
```

- [ ] **Step 3: Update the TypeScript loader exclude patterns**

Change lines 74–79:
```js
// BEFORE
exclude: [
    /node_modules/,
    /static\/js\/parent/,
    /static\/js\/external/,
    /static\/webpack/,
    /static\/source-map-http-downloads/,
],

// AFTER
exclude: [
    /node_modules/,
    /ClientApp\/src\/parent/,
    /ClientApp\/src\/external/,
    /ClientApp\/webpack/,
    /ClientApp\/source-map-http-downloads/,
],
```

- [ ] **Step 4: Update the devServer staticFiles directory**

Change line 149:
```js
// BEFORE
static: {
    directory: path.resolve(__dirname, 'public'),
},

// AFTER
static: {
    directory: path.resolve(__dirname, 'ClientApp/public'),
},
```

- [ ] **Step 5: Verify no remaining static/ references**

```bash
grep -n "static/" webpack.config.js
```

Expected: zero matches (the word "static" in the comment on line 45 is fine — only file path references matter).

Actually check specifically for path-like references:
```bash
grep -n "'\.\/static\|static\/js\|static\/css\|static\/webpack" webpack.config.js
```

Expected: zero matches.

- [ ] **Step 6: Commit**

```bash
git add webpack.config.js
git commit -m "config: update webpack.config.js paths for ClientApp/src/ layout"
```

---

## Task 8: Update tsconfig.json

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Apply all path changes**

Replace the entire file content with:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": false,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "ignoreDeprecations": "5.0",
    "baseUrl": ".",
    "paths": {
      "@/*": ["ClientApp/src/*"]
    },
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": [
    "ClientApp/src/**/*",
    ".storybook/**/*"
  ],
  "exclude": [
    "ClientApp/src/main.*.js",
    "ClientApp/src/parent/node_modules",
    "ClientApp/src/external",
    "ClientApp/source-map-http-downloads",
    "ClientApp/webpack",
    "node_modules",
    "dist",
    "storybook-static"
  ]
}
```

- [ ] **Step 2: Verify no remaining static/js references**

```bash
grep -n "static" tsconfig.json
```

Expected: zero matches.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "config: update tsconfig.json paths for ClientApp/src/ layout"
```

---

## Task 9: Update vitest.config.ts

**Files:**
- Modify: `vitest.config.ts`

- [ ] **Step 1: Apply all coverage path changes**

Replace the `coverage.include` array:
```ts
// BEFORE
include: [
    'static/js/App.tsx',
    'static/js/components/forms/**/*.tsx',
    'static/js/components/Inputs/DatePicker/**/*.tsx',
    'static/js/components/Alert/**/*.tsx',
    'static/js/components/Accordion/**/*.tsx',
    'static/js/components/SteppedNavigation/**/*.tsx',
    'static/js/components/Utilities/ContactLink.tsx',
    'static/js/components/Utilities/ViewPdfButton.tsx',
    'static/js/components/Utilities/ViewPdfQuoteTerms.tsx',
    'static/js/components/Utilities/mailingLabel.tsx',
    'static/js/instrumentation/**/*.ts',
    'static/js/routes/account/validation.ts',
    'static/js/routes/contact/validation.ts',
    'static/js/routes/requestForQuote/validation.ts',
    'static/js/routes/acceptQuote/validation.ts',
    'webpack.config.js',
],

// AFTER
include: [
    'ClientApp/src/App.tsx',
    'ClientApp/src/components/forms/**/*.tsx',
    'ClientApp/src/components/Inputs/DatePicker/**/*.tsx',
    'ClientApp/src/components/Alert/**/*.tsx',
    'ClientApp/src/components/Accordion/**/*.tsx',
    'ClientApp/src/components/SteppedNavigation/**/*.tsx',
    'ClientApp/src/components/Utilities/ContactLink.tsx',
    'ClientApp/src/components/Utilities/ViewPdfButton.tsx',
    'ClientApp/src/components/Utilities/ViewPdfQuoteTerms.tsx',
    'ClientApp/src/components/Utilities/mailingLabel.tsx',
    'ClientApp/src/instrumentation/**/*.ts',
    'ClientApp/src/routes/account/validation.ts',
    'ClientApp/src/routes/contact/validation.ts',
    'ClientApp/src/routes/requestForQuote/validation.ts',
    'ClientApp/src/routes/acceptQuote/validation.ts',
    'webpack.config.js',
],
```

- [ ] **Step 2: Verify**

```bash
grep -n "static/js" vitest.config.ts
```

Expected: zero matches.

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "config: update vitest.config.ts coverage paths for ClientApp/src/ layout"
```

---

## Task 10: Update .storybook/main.ts

**Files:**
- Modify: `.storybook/main.ts`

- [ ] **Step 1: Update the stories globs**

Find lines 50–57 and change:
```ts
// BEFORE
stories: [
    '../.storybook/introduction.mdx',
    '../.storybook/component-docs-guide.mdx',
    '../.storybook/style-guide.mdx',
    '../static/js/**/*.stories.@(ts|tsx)',
    '../static/js/**/*.{docs,Docs}.mdx',
],

// AFTER
stories: [
    '../.storybook/introduction.mdx',
    '../.storybook/component-docs-guide.mdx',
    '../.storybook/style-guide.mdx',
    '../ClientApp/src/**/*.stories.@(ts|tsx)',
    '../ClientApp/src/**/*.{docs,Docs}.mdx',
],
```

- [ ] **Step 2: Update staticDirs**

Find line 78 and change:
```ts
// BEFORE
staticDirs: ['../public'],

// AFTER
staticDirs: ['../ClientApp/public'],
```

- [ ] **Step 3: Verify**

```bash
grep -n "static/" .storybook/main.ts
```

Expected: zero matches (the word "static" in `staticDirs` is fine — it's the variable name not a path).

Specifically check for old path patterns:
```bash
grep -n "static/js\|'\.\.\/public'" .storybook/main.ts
```

Expected: zero matches.

- [ ] **Step 4: Run Gate 2 (see Test Plan above)**

```bash
# TypeScript compile check
npm run typecheck
```

Expected: exits 0 with zero errors.

- [ ] **Step 5: Commit**

```bash
git add .storybook/main.ts
git commit -m "config: update Storybook stories and staticDirs paths for ClientApp/ layout"
```

---

## Task 11: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the Architecture table**

Find the `| Concern | Path |` table and change all `static/js/` references:
```markdown
<!-- BEFORE -->
| App bootstrap | `static/js/index.tsx` |
| Router | `static/js/App.tsx` |
| Route modules | `static/js/routes/**` |
| Reusable UI | `static/js/components/**` |
| Auth config (MSAL) | `static/js/authentication/authConfig.ts` |
| Auth context / hooks | `static/js/authentication/accountContext.tsx`, `hooks.tsx` |
| Auth guard | `static/js/authentication/AuthenticatedElement.tsx` |
| Runtime env vars | `static/js/env.ts` |
| API client | `static/js/api/web-api-client.ts` |
| Shared types | `static/js/types.ts` |
| Validation schemas | `static/js/validationSchemas/**` |
| Yup custom methods | `static/js/validationSchemas/yupExtensions/stringExtensions.ts` |
| App Insights | `static/js/instrumentation/AppInsightsService.ts` |
| Session storage | `static/js/storage/**` |
| Utilities | `static/js/utils/index.ts` |

<!-- AFTER -->
| App bootstrap | `ClientApp/src/index.tsx` |
| Router | `ClientApp/src/App.tsx` |
| Route modules | `ClientApp/src/routes/**` |
| Reusable UI | `ClientApp/src/components/**` |
| Auth config (MSAL) | `ClientApp/src/authentication/authConfig.ts` |
| Auth context / hooks | `ClientApp/src/authentication/accountContext.tsx`, `hooks.tsx` |
| Auth guard | `ClientApp/src/authentication/AuthenticatedElement.tsx` |
| Runtime env vars | `ClientApp/src/env.ts` |
| API client | `ClientApp/src/api/web-api-client.ts` |
| Shared types | `ClientApp/src/types.ts` |
| Validation schemas | `ClientApp/src/validationSchemas/**` |
| Yup custom methods | `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` |
| App Insights | `ClientApp/src/instrumentation/AppInsightsService.ts` |
| Session storage | `ClientApp/src/storage/**` |
| Utilities | `ClientApp/src/utils/index.ts` |
```

- [ ] **Step 2: Update Edit Boundaries**

Find the `| Edit freely:` section:
```markdown
<!-- BEFORE -->
**Edit freely:**
- `static/js/**/*.ts`
- `static/js/**/*.tsx`
- `static/css/styles/**/*.scss`

**Never edit (generated / vendor):**
- `static/js/main.*.js`
- `static/css/main.*.css`
- `static/source-map-http-downloads/**`
- `static/js/external/**`
- `static/webpack/**`

<!-- AFTER -->
**Edit freely:**
- `ClientApp/src/**/*.ts`
- `ClientApp/src/**/*.tsx`
- `ClientApp/src/styles/**/*.scss`

**Never edit (generated / vendor):**
- `ClientApp/src/main.*.js`
- `ClientApp/css/main.*.css`
- `ClientApp/source-map-http-downloads/**`
- `ClientApp/src/external/**`
- `ClientApp/webpack/**`
```

- [ ] **Step 3: Update Critical Patterns — env vars comment**

Find the comment referencing `static/js/env.ts`:
```markdown
<!-- BEFORE -->
Config is injected at runtime into `window.*` — **not** `process.env`. Always use the `env` object from `static/js/env.ts`:

<!-- AFTER -->
Config is injected at runtime into `window.*` — **not** `process.env`. Always use the `env` object from `ClientApp/src/env.ts`:
```

- [ ] **Step 4: Update Yup import example**

Find the `import '../../validationSchemas/yupExtensions';` comment block and update the surrounding explanation (the import string itself is relative so it stays; only the description path changes):
```markdown
<!-- BEFORE -->
Any schema file that calls one of these methods **must** import the side-effect module ... `static/js/validationSchemas/yupExtensions/stringExtensions.ts` adds...

<!-- AFTER -->
Any schema file that calls one of these methods **must** import the side-effect module ... `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` adds...
```

- [ ] **Step 5: Verify**

```bash
grep -n "static/js\|static/css" CLAUDE.md
```

Expected: zero matches.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md paths for ClientApp/ restructure"
```

---

## Task 12: Update CSS import in App.tsx

**Files:**
- Modify: `ClientApp/src/App.tsx` (was `static/js/App.tsx`)

- [ ] **Step 1: Change the SCSS import on line 1**

```tsx
// BEFORE (line 1)
import '../css/styles/index.scss';

// AFTER
import './styles/index.scss';
```

Explanation: `App.tsx` is now at `ClientApp/src/App.tsx`. The styles are at `ClientApp/src/styles/index.scss`. They're siblings under `src/`, so `./styles/index.scss` is correct.

- [ ] **Step 2: Verify the file**

```bash
head -3 ClientApp/src/App.tsx
```

Expected first line: `import './styles/index.scss';`

- [ ] **Step 3: Commit**

```bash
git add ClientApp/src/App.tsx
git commit -m "fix: update SCSS import path in App.tsx after restructure"
```

---

## Task 13: Update media-print.scss imports in Utilities components

**Files:**
- Modify: `ClientApp/src/components/Utilities/ViewPdfQuoteTerms.tsx`
- Modify: `ClientApp/src/components/Utilities/ViewPdfButton.tsx`
- Modify: `ClientApp/src/components/Utilities/mailingLabel.tsx`
- Modify: `ClientApp/src/components/Utilities/ContactLink.tsx`

All four files are in `ClientApp/src/components/Utilities/` and import the same file. The path changes from three levels up (`../../../`) to two levels up (`../../`).

Old path resolves as: `ClientApp/src/components/Utilities/` → `../../../` = `ClientApp/` → `css/styles/media-print.scss`
New path resolves as: `ClientApp/src/components/Utilities/` → `../../` = `ClientApp/src/` → `styles/media-print.scss`

- [ ] **Step 1: Update ViewPdfQuoteTerms.tsx**

```tsx
// BEFORE (line 1)
import '../../../css/styles/media-print.scss';

// AFTER
import '../../styles/media-print.scss';
```

- [ ] **Step 2: Update ViewPdfButton.tsx**

```tsx
// BEFORE (line 2)
import '../../../css/styles/media-print.scss';

// AFTER
import '../../styles/media-print.scss';
```

- [ ] **Step 3: Update mailingLabel.tsx**

```tsx
// BEFORE (line 5)
import '../../../css/styles/media-print.scss';

// AFTER
import '../../styles/media-print.scss';
```

- [ ] **Step 4: Update ContactLink.tsx**

```tsx
// BEFORE (line 2)
import '../../../css/styles/media-print.scss';

// AFTER
import '../../styles/media-print.scss';
```

- [ ] **Step 5: Verify all four are updated**

```bash
grep -n "css/styles" \
  ClientApp/src/components/Utilities/ViewPdfQuoteTerms.tsx \
  ClientApp/src/components/Utilities/ViewPdfButton.tsx \
  ClientApp/src/components/Utilities/mailingLabel.tsx \
  ClientApp/src/components/Utilities/ContactLink.tsx
```

Expected: zero matches.

- [ ] **Step 6: Run Gate 3 (see Test Plan above)**

```bash
# No stale css/ imports anywhere in src
grep -r "css/styles" ClientApp/src/
# Expected: zero matches

# Full compile + build
npm run typecheck && npm run build
```

Both commands must exit 0.

- [ ] **Step 7: Commit**

```bash
git add \
  ClientApp/src/components/Utilities/ViewPdfQuoteTerms.tsx \
  ClientApp/src/components/Utilities/ViewPdfButton.tsx \
  ClientApp/src/components/Utilities/mailingLabel.tsx \
  ClientApp/src/components/Utilities/ContactLink.tsx
git commit -m "fix: update media-print.scss import paths in Utilities after restructure"
```

---

## Task 14: Full verification suite (Gate 4)

**Files:**
- No file changes — verification only

- [ ] **Step 1: Run unit tests**

```bash
npm run test:unit
```

Expected: all tests pass (exit 0). If any test imports break, the error messages will point to the exact file — fix any remaining stale `static/js/` references.

- [ ] **Step 2: Build Storybook**

```bash
npm run build-storybook
```

Expected: exits 0 and produces `storybook-static/`.

- [ ] **Step 3: Run all rubric checks**

```bash
# R11 — No stale static/js or static/css in config files
grep -r "static/js\|static/css" webpack.config.js tsconfig.json vitest.config.ts .storybook/main.ts CLAUDE.md
# Expected: zero matches

# R8 — BlockUISpinner CSS exists exactly once
find ClientApp -name "index.scss" -path "*/BlockUISpinner/*"
# Expected: one result: ClientApp/src/components/BlockUISpinner/index.scss

# R9 — Fonts in correct location
ls ClientApp/public/fonts/
# Expected: fonts.css  nmi-iconfonts.css  nmi-iconfonts.woff  PublicSans-Bold.ttf  PublicSans-Regular.ttf
```

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve any remaining path references after ClientApp restructure"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|-----------------|------|
| 1. Move Static to NMI.Portal.Client.Web\Static | Task 2 (git mv static → ClientApp) |
| 2. Rename Static = ClientApp | Task 2 (same operation) |
| 3. Rename js = src | Task 3 |
| 4. Move css/components/BlockUISpinner → src/components/BlockUISpinner | Task 5 (delete duplicate; JS copy stays in place, already at correct destination after Task 3) |
| 5. Move styles → src/styles | Task 4 |
| 6. Move public → ClientApp/public | Task 6 |
| 7. Move fonts → ClientApp/public/fonts | Task 6 |

**Note on spec item 4:** The BlockUISpinner SCSS is *already co-located* in `static/js/components/BlockUISpinner/index.scss`. After Task 3 renames `js/` → `src/`, that file is automatically at `ClientApp/src/components/BlockUISpinner/index.scss` — the exact target. Task 5 only deletes the orphan duplicate in `css/components/`. No separate move is needed.

**Placeholder scan:** All steps contain exact file paths, exact commands, and exact code snippets. No TBDs found.

**Import path arithmetic (verified):**

| File | Old path | Old resolves to | New path | New resolves to |
|------|---------|-----------------|---------|-----------------|
| `src/App.tsx` | `../css/styles/index.scss` | `static/css/styles/index.scss` | `./styles/index.scss` | `ClientApp/src/styles/index.scss` ✓ |
| `src/components/Utilities/X.tsx` | `../../../css/styles/media-print.scss` | `static/css/styles/media-print.scss` | `../../styles/media-print.scss` | `ClientApp/src/styles/media-print.scss` ✓ |
| `src/styles/_date-picker.scss` | `../../media/icon-invalid.png` | `static/media/icon-invalid.png` | `../../media/icon-invalid.png` (unchanged) | `ClientApp/media/icon-invalid.png` ✓ |

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-29-folder-restructure.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
