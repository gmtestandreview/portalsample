# Align Live Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the local portal shell and base typography to match the current live portal styling.

**Architecture:** Update the centralized SCSS theme sources that control the shared shell and typography scale instead of layering one-off overrides on components. Verify the rollback by comparing computed styles from the local Storybook portal shell against the live site and by running the repository lint gate.

**Tech Stack:** React 18, TypeScript, SCSS, Bootstrap 5, Storybook, Playwright

---

### Task 1: Restore Shared Theme Tokens

**Files:**
- Modify: `ClientApp/src/styles/_variables.scss`
- Modify: `ClientApp/src/styles/_footer.scss`
- Modify: `ClientApp/src/styles/index.scss`

- [ ] **Step 1: Update the header token to the live portal value**

```scss
$nmi-header-primary: #A6192E;
```

- [ ] **Step 2: Restore the footer background to the live portal value**

```scss
.nmi-footer {
    background-color: $black;
    color: $white;
    margin-top: 5rem;
    .btn-link {
      color: $white;
    }
}
```

- [ ] **Step 3: Restore the root font size to the live portal scale**

```scss
html {
  scroll-behavior: smooth;
  font-size: 100%;
  font-family: $font-family-sans-serif;
}
```

- [ ] **Step 4: Review dependent shell behavior**

Check that header, footer, focus styles, and shared typography still inherit from the same tokens without requiring component-level overrides.

### Task 2: Verify The Rollback

**Files:**
- Verify: `docs/superpowers/specs/2026-06-19-align-live-theme-design.md`
- Verify: `docs/superpowers/plans/2026-06-19-align-live-theme.md`

- [ ] **Step 1: Run a computed-style comparison against live**

Run local Storybook and compare:

```text
Live site: https://portal.measurement.gov.au/
Local shell: http://127.0.0.1:6006/iframe.html?id=components-layout--portal-shell&viewMode=story
```

Verify these values:

```text
header background-color: rgb(166, 25, 46)
footer background-color: rgb(0, 0, 0)
html font-size: 16px
```

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected:

```text
Exit code 0
```

- [ ] **Step 3: Summarize any remaining drift**

If any computed styles still differ from live after the token rollback, list the exact selector and value mismatch before making further changes.
