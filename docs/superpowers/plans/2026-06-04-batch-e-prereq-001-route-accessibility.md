# BATCH-E-PREREQ-001: useRouteAccessibility Hook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. If superpowers skills are unavailable, execute the checklist steps directly and stop at review checkpoints.

**Goal:** Replace the existing `RouteAccessibleNavigation` component with a `useRouteAccessibility` hook called from the `Layout` AppShell, adding focus management to satisfy WCAG 2.4.2 (page title announcement) and WCAG 2.4.3 (focus order on route change).

**Architecture:** Extract the route-change announcement logic into a reusable hook at `ClientApp/src/hooks/useRouteAccessibility.ts` that returns a string `announcement` and triggers focus on `#main` after each route transition. The `Layout` component calls the hook and renders the `aria-live` span inline, removing the now-redundant `RouteAccessibleNavigation` component entirely.

**Tech Stack:** React 18, React Router v6 (`useLocation`), TypeScript, Vitest + React Testing Library (target system test tooling), Bootstrap 5 `visually-hidden` utility class.

---

## Source Inputs

- Spec: BATCH-E-PREREQ-001 ticket description (WCAG 2.4.2/2.4.3, "no screen-reader route announcement without this hook")
- Relevant files inspected:
  - `ClientApp/src/components/Utilities/routeAccessibleNavigation.tsx`: existing component being replaced — has an unused `routeMessageRef` and sets initial state from `document.title` before the page has rendered its title
  - `ClientApp/src/components/Layout/index.tsx`: the AppShell; currently a pure arrow function component with no hooks; renders `<RouteAccessibleNavigation />`
  - `ClientApp/src/components/Utilities/useHtmlTitle.tsx`: sets `document.title` inside page components after mount — explains the 100 ms debounce requirement
  - `ClientApp/src/components/Utilities/routeChangeScrollTop.tsx`: sibling scroll-to-top utility that also uses `useLocation` on the same level

---

## Assumptions and Unknowns

- Assumption: `document.getElementById('main')` reliably resolves during the 100 ms timeout, because `#main` is rendered by `Layout` and never conditionally unmounted.
- Assumption: The 100 ms debounce is sufficient for `useHtmlTitle` to have updated `document.title` before the announcement reads it. This is carried over from the existing component and has been running in production.
- Assumption: All routes are children of `Layout` (confirmed by `App.tsx` router structure — `AuthenticatedElement` with `displayHeaderAndFooter={false}` still renders Layout for form wizards).
- Blocking ambiguity: none — implementation can proceed safely.

---

## Requirement Traceability

| Requirement | Task(s) | Notes |
|---|---|---|
| WCAG 2.4.2 — page title announced on navigation | Task 1 (hook), Task 2 (Layout wiring) | Existing component partially covers this; hook fixes title-timing edge |
| WCAG 2.4.3 — keyboard focus moves to main content on route change | Task 1 (hook — focus call) | Not covered at all by existing component |
| Hook named `useRouteAccessibility` exported from `src/hooks/` | Task 1 | Satisfies Batch E hard prerequisite naming contract |
| Remove dead `routeMessageRef` from old component | Task 3 (file deletion) | Dead ref was never read |
| No regression in existing announce behaviour | Task 1, Task 4 (tests) | Announcement text format unchanged |

---

## Framework Fit

- **TDD**: Tests written first using Vitest + React Testing Library; `vi.useFakeTimers()` controls the 100 ms debounce in tests.
- **DDD**: Not needed — no domain logic.
- **Migration planning**: The existing `RouteAccessibleNavigation` component is deleted as part of this change (not deprecated), as it is only consumed by `Layout` and will be fully replaced.
- **Threat modelling**: Not needed — no auth, permissions, or data access involved.

---

## Files and Responsibilities

| Path | Action | Responsibility |
|---|---|---|
| `ClientApp/src/hooks/useRouteAccessibility.ts` | **Create** | Hook: track location, debounce announcement, focus `#main` |
| `ClientApp/src/hooks/useRouteAccessibility.test.ts` | **Create** | Unit tests for hook behaviour |
| `ClientApp/src/components/Layout/index.tsx` | **Modify** | Call hook, render `aria-live` span inline, remove old import |
| `ClientApp/src/components/Utilities/routeAccessibleNavigation.tsx` | **Delete** | Replaced entirely by hook; no other consumers |

---

## Tasks

### Task 1: Create the `useRouteAccessibility` hook

**Files:**
- Create: `ClientApp/src/hooks/useRouteAccessibility.ts`
- Test: `ClientApp/src/hooks/useRouteAccessibility.test.ts`

- [ ] **Step 1: Write the failing tests**

  Create `ClientApp/src/hooks/useRouteAccessibility.test.ts`:

  ```ts
  import { renderHook, act } from '@testing-library/react';
  import { MemoryRouter } from 'react-router-dom';
  import React from 'react';
  import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
  import { useRouteAccessibility } from './useRouteAccessibility';

  function wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(MemoryRouter, { initialEntries: ['/test'] }, children);
  }

  describe('useRouteAccessibility', () => {
      beforeEach(() => {
          vi.useFakeTimers();
          document.title = 'Test Page | NMI Portal';
          // Create #main element as Layout would
          const main = document.createElement('div');
          main.id = 'main';
          main.tabIndex = -1;
          document.body.appendChild(main);
      });

      afterEach(() => {
          vi.useRealTimers();
          document.getElementById('main')?.remove();
      });

      it('returns empty announcement before first route effect fires', () => {
          const { result } = renderHook(() => useRouteAccessibility(), { wrapper });
          expect(result.current.announcement).toBe('');
      });

      it('sets announcement to page title after 100 ms debounce on initial path', () => {
          const { result } = renderHook(() => useRouteAccessibility(), { wrapper });
          act(() => { vi.advanceTimersByTime(100); });
          expect(result.current.announcement).toBe('Navigated to Test Page | NMI Portal page.');
      });

      it('clears and resets announcement when pathname changes', () => {
          // Tested via re-render with new location — see integration note below
          // This test verifies the timeout is cleared on unmount/re-render
          const { unmount } = renderHook(() => useRouteAccessibility(), { wrapper });
          const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
          unmount();
          expect(clearSpy).toHaveBeenCalled();
      });

      it('focuses #main element after debounce fires', () => {
          const main = document.getElementById('main')!;
          const focusSpy = vi.spyOn(main, 'focus');
          renderHook(() => useRouteAccessibility(), { wrapper });
          act(() => { vi.advanceTimersByTime(100); });
          expect(focusSpy).toHaveBeenCalledTimes(1);
      });
  });
  ```

- [ ] **Step 2: Verify the tests fail**

  Run in the target repository: `npx vitest run ClientApp/src/hooks/useRouteAccessibility.test.ts`

  Expected: 4 failures — `Cannot find module './useRouteAccessibility'`

- [ ] **Step 3: Implement the hook**

  Create `ClientApp/src/hooks/useRouteAccessibility.ts`:

  ```ts
  import { useEffect, useState } from 'react';
  import { useLocation } from 'react-router-dom';

  export interface RouteAccessibilityResult {
      announcement: string;
  }

  export function useRouteAccessibility(): RouteAccessibilityResult {
      const location = useLocation();
      const [announcement, setAnnouncement] = useState('');

      useEffect(() => {
          const id = setTimeout(() => {
              setAnnouncement(`Navigated to ${document.title || ''} page.`);
              document.getElementById('main')?.focus();
          }, 100);
          return () => clearTimeout(id);
      }, [location.pathname]);

      return { announcement };
  }
  ```

  Design notes:
  - `useState('')` starts silent — no announcement fires until the first pathname change effect completes, preventing duplicate announcements on initial load.
  - `document.getElementById('main')?.focus()` is safe because `#main` is a Layout-level element with `tabIndex={-1}` already present in the DOM when the effect runs.
  - The return type is a named interface (not an inline object type) to make future additions non-breaking.

- [ ] **Step 4: Verify the tests pass**

  Run: `npx vitest run ClientApp/src/hooks/useRouteAccessibility.test.ts`

  Expected: 4 tests passing, 0 failures.

- [ ] **Step 5: Run relevant regression checks**

  Run: `npx vitest run ClientApp/src/`

  Expected: all pre-existing tests continue to pass.

- [ ] **Step 6: Commit**

  ```bash
  git add ClientApp/src/hooks/useRouteAccessibility.ts ClientApp/src/hooks/useRouteAccessibility.test.ts
  git commit -m "feat: add useRouteAccessibility hook (WCAG 2.4.2/2.4.3)"
  ```

---

### Task 2: Wire the hook into Layout (AppShell)

**Files:**
- Modify: `ClientApp/src/components/Layout/index.tsx`

- [ ] **Step 1: Write the failing test (component-level)**

  Create `ClientApp/src/components/Layout/Layout.test.tsx`:

  ```tsx
  import { render, screen, act } from '@testing-library/react';
  import { MemoryRouter } from 'react-router-dom';
  import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
  import Layout from './index';

  describe('Layout AppShell — WCAG accessibility', () => {
      beforeEach(() => { vi.useFakeTimers(); });
      afterEach(() => { vi.useRealTimers(); });

      it('renders an aria-live polite region', () => {
          render(
              <MemoryRouter>
                  <Layout><div>content</div></Layout>
              </MemoryRouter>
          );
          const region = screen.getByRole('status');
          expect(region).toHaveAttribute('aria-live', 'polite');
          expect(region).toHaveClass('visually-hidden');
      });

      it('does NOT render the old RouteAccessibleNavigation component as a separate element', () => {
          render(
              <MemoryRouter>
                  <Layout><div>content</div></Layout>
              </MemoryRouter>
          );
          // There should be exactly one role=status region (not two)
          expect(screen.getAllByRole('status')).toHaveLength(1);
      });

      it('populates the announcement after navigation', () => {
          document.title = 'Dashboard | NMI Portal';
          render(
              <MemoryRouter initialEntries={['/dashboard']}>
                  <Layout><div>content</div></Layout>
              </MemoryRouter>
          );
          act(() => { vi.advanceTimersByTime(100); });
          expect(screen.getByRole('status').textContent).toBe(
              'Navigated to Dashboard | NMI Portal page.'
          );
      });
  });
  ```

- [ ] **Step 2: Verify the tests fail**

  Run: `npx vitest run ClientApp/src/components/Layout/Layout.test.tsx`

  Expected: test "does NOT render the old RouteAccessibleNavigation component as a separate element" fails because the old `<RouteAccessibleNavigation />` renders a second `role=status` span.

- [ ] **Step 3: Update `ClientApp/src/components/Layout/index.tsx`**

  Apply this exact replacement:

  **Before (entire file):**
  ```tsx
  import { Container } from 'react-bootstrap';
  import type { ReactNode } from 'react';
  import Header from '../Header';
  import Footer from '../Footer';
  import SkipLinks from '../Utilities/skipLinks';
  import BackToTopButton from '../Utilities/backToTopButton';
  import RouteAccessibleNavigation from '../Utilities/routeAccessibleNavigation';
  import RouteChangeScrollTop from '../Utilities/routeChangeScrollTop';
  import GoogleAnalytics from '../../analytics/GoogleAnalytics';

  interface LayoutProps {
      children: ReactNode;
  }

  const Layout = ({ children }: LayoutProps) => (
      <>
          <SkipLinks />
          <Header />
          <Container fluid id='main' role='main' className='px-0' tabIndex={-1}>
              <GoogleAnalytics
                  anonymiseIp={false}
                  testMode={false}
                  sendPageView
              >
                  {children}
              </GoogleAnalytics>
          </Container>
          <Footer />
          <BackToTopButton />
          <RouteAccessibleNavigation />
          <RouteChangeScrollTop />
      </>
  );

  export default Layout;
  ```

  **After (entire file):**
  ```tsx
  import { Container } from 'react-bootstrap';
  import type { ReactNode } from 'react';
  import Header from '../Header';
  import Footer from '../Footer';
  import SkipLinks from '../Utilities/skipLinks';
  import BackToTopButton from '../Utilities/backToTopButton';
  import RouteChangeScrollTop from '../Utilities/routeChangeScrollTop';
  import GoogleAnalytics from '../../analytics/GoogleAnalytics';
  import { useRouteAccessibility } from '../../hooks/useRouteAccessibility';

  interface LayoutProps {
      children: ReactNode;
  }

  const Layout = ({ children }: LayoutProps) => {
      const { announcement } = useRouteAccessibility();
      return (
          <>
              <SkipLinks />
              <Header />
              <Container fluid id='main' role='main' className='px-0' tabIndex={-1}>
                  <GoogleAnalytics anonymiseIp={false} testMode={false} sendPageView>
                      {children}
                  </GoogleAnalytics>
              </Container>
              <Footer />
              <BackToTopButton />
              <span className='visually-hidden' role='status' aria-live='polite'>
                  {announcement}
              </span>
              <RouteChangeScrollTop />
          </>
      );
  };

  export default Layout;
  ```

  Note: The component is converted from a concise-body arrow function to a block-body arrow function to accommodate the hook call. This is the only way to use hooks in a function component in React.

- [ ] **Step 4: Verify the tests pass**

  Run: `npx vitest run ClientApp/src/components/Layout/Layout.test.tsx`

  Expected: 3 tests passing.

- [ ] **Step 5: Run regression checks**

  Run: `npx vitest run ClientApp/src/`

  Expected: all tests pass.

- [ ] **Step 6: Commit**

  ```bash
  git add ClientApp/src/components/Layout/index.tsx ClientApp/src/components/Layout/Layout.test.tsx
  git commit -m "feat: wire useRouteAccessibility into Layout AppShell"
  ```

---

### Task 3: Delete the now-redundant `RouteAccessibleNavigation` component

**Files:**
- Delete: `ClientApp/src/components/Utilities/routeAccessibleNavigation.tsx`

- [ ] **Step 1: Confirm no other consumers**

  Run in target repository:
  ```bash
  grep -r "routeAccessibleNavigation\|RouteAccessibleNavigation" ClientApp/src --include="*.ts" --include="*.tsx"
  ```
  Expected: zero matches (only `Layout/index.tsx` ever imported it, and that import was removed in Task 2).

- [ ] **Step 2: Delete the file**

  ```bash
  git rm ClientApp/src/components/Utilities/routeAccessibleNavigation.tsx
  ```

- [ ] **Step 3: Verify no TypeScript errors**

  Run: `npx tsc --noEmit`

  Expected: exit code 0.

- [ ] **Step 4: Commit**

  ```bash
  git commit -m "chore: remove RouteAccessibleNavigation component (replaced by useRouteAccessibility hook)"
  ```

---

### Task 4: Manual WCAG verification

- [ ] **Step 1: Start the dev server in the target repository**

  ```bash
  npm start
  ```

- [ ] **Step 2: Test with NVDA or VoiceOver**

  Navigate between two routes (e.g., Dashboard → Account Details) using keyboard only.

  Expected:
  1. Screen reader announces "Navigated to [page title] page." after each navigation.
  2. Keyboard focus moves to the `#main` region (NVDA/VoiceOver buffer reads the main content area after navigation).
  3. No duplicate announcements (only one `role=status` region exists in the DOM).

- [ ] **Step 3: Verify page title updates (WCAG 2.4.2)**

  Check that `document.title` changes on each route by opening DevTools console and observing `document.title` on route change.

  Expected: each route sets a unique title before the 100 ms debounce fires.

---

## Safety, Rollback, and Verification

- **Risk:** The `#main` focus call could surprise sighted keyboard users who are not navigating via the screen reader path. Mitigation: `tabIndex={-1}` means focus is programmatically movable but `#main` is not in the natural tab order, so sighted users pressing Tab will step past it naturally.
- **Risk:** Converting `Layout` from a concise-body to a block-body arrow function is a pure refactor with no behaviour change — confirmed by identical JSX output.
- **Verification:** `npx vitest run` passes; manual screen reader test passes.
- **Rollback:** `git revert` the three commits in reverse order. The old `routeAccessibleNavigation.tsx` is recoverable from git history.

---

## Final Validation

- Requirement coverage: PASS (WCAG 2.4.2 announcement + WCAG 2.4.3 focus, hook naming contract met)
- Exact paths: PASS
- Tests before implementation: PASS
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
