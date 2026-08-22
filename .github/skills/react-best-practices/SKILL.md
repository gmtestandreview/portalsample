---
name: react-best-practices
description: >
  React and Next.js (Pages Router) performance optimization guidelines adapted from Vercel
  Engineering. Use when writing, reviewing, or refactoring React components, Next.js pages,
  data fetching, bundle optimization, or performance improvements. Triggers on tasks directly related to
  React components, client-side data fetching, bundle optimization, re-renders, or JavaScript/TypeScript
  performance in a Pages Router application.
---

# React Best Practices

Comprehensive performance optimization guide for React and Next.js (Pages Router) applications.
Adapted from the [Vercel Labs agent-skills repository](https://github.com/vercel-labs/agent-skills)
(MIT licence, author: Vercel Engineering).

**Scope**: This adaptation covers rules applicable to **Next.js Pages Router** with **stable React**.
All React 19+ APIs, including `rendering-activity`, are excluded because this repository uses the Pages Router with stable React.
Server Component rules (`server-*`) are also excluded. If this project migrates to the App Router, add those rules from the reference repo (see [server-side performance rules](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices/rules)).

## When to Apply

Reference these guidelines when:

- Writing new React components or Next.js pages
- Implementing data fetching (client-side `getServerSideProps`, `getStaticProps`, SWR, or `fetch`)
- Reviewing code for performance issues
- Refactoring existing React or Next.js code
- Optimizing bundle size or load times

## Rule Categories by Priority

| Priority | Category                  | Impact      | Prefix       |
| -------- | ------------------------- | ----------- | ------------ |
| 1        | Eliminating Waterfalls    | CRITICAL    | `async-`     |
| 2        | Bundle Size Optimization  | CRITICAL    | `bundle-`    |
| 3        | Client-Side Data Fetching | MEDIUM-HIGH | `client-`    |
| 4        | Re-render Optimization    | MEDIUM      | `rerender-`  |
| 5        | Rendering Performance     | MEDIUM      | `rendering-` |
| 6        | TypeScript Performance    | LOW-MEDIUM  | `js-`        |
| 7        | Advanced Patterns         | LOW         | `advanced-`  |

**Precedence rule:**
If two or more rules have the same impact level, follow the numerical priority order in the table above (lower number = higher priority). If a rule from a higher-priority category conflicts with a lower-priority one, the higher-priority rule takes precedence.

> **Note**: Server-Side Performance (`server-*`) rules from the original Vercel collection are
> omitted here because they require React Server Components (App Router). If this project migrates
> to the App Router, add those rules from the reference repo.

## Quick Reference

### 1. Eliminating Waterfalls (CRITICAL)

- `async-cheap-condition-before-await` — Check cheap sync conditions before awaiting flags or remote values
- `async-defer-await` — Move await into branches where actually used
- `async-parallel` — Use `Promise.all()` for independent operations
- `async-dependencies` — Use `better-all` for partial dependencies
- `async-api-routes` — Start promises early, await late in API routes
- `async-suspense-boundaries` — Use Suspense to stream content

### 2. Bundle Size Optimization (CRITICAL)

- `bundle-barrel-imports` — Import directly; avoid barrel files
- `bundle-analyzable-paths` — Prefer statically analysable import and file-system paths
- `bundle-dynamic-imports` — Use `next/dynamic` for heavy components
- `bundle-defer-third-party` — Load analytics/logging after hydration
- `bundle-conditional` — Load modules only when feature is activated
- `bundle-preload` — Preload on hover/focus for perceived speed

### 3. Client-Side Data Fetching (MEDIUM-HIGH)

- `client-swr-dedup` — Use SWR for automatic request deduplication
- `client-event-listeners` — Deduplicate global event listeners
- `client-passive-event-listeners` — Use passive listeners for scroll
- `client-localstorage-schema` — Version and minimise `localStorage` data

### 4. Re-render Optimization (MEDIUM)

- `rerender-defer-reads` — Don't subscribe to state only used in callbacks
- `rerender-memo` — Extract expensive work into memoised components
- `rerender-memo-with-default-value` — Hoist default non-primitive props
- `rerender-dependencies` — Use primitive dependencies in effects
- `rerender-derived-state` — Subscribe to derived booleans, not raw values
- `rerender-derived-state-no-effect` — Derive state during render, not effects
- `rerender-functional-setstate` — Use functional `setState` for stable callbacks
- `rerender-lazy-state-init` — Pass function to `useState` for expensive values
- `rerender-simple-expression-in-memo` — Avoid memo for simple primitives
- `rerender-split-combined-hooks` — Split hooks with independent dependencies
- `rerender-move-effect-to-event` — Put interaction logic in event handlers
- `rerender-transitions` — Use `startTransition` for non-urgent updates
- `rerender-use-deferred-value` — Defer expensive renders to keep input responsive
- `rerender-use-ref-transient-values` — Use refs for transient frequent values
- `rerender-no-inline-components` — Don't define components inside components

### 5. Rendering Performance (MEDIUM)

- `rendering-animate-svg-wrapper` — Animate div wrapper, not SVG element
- `rendering-content-visibility` — Use `content-visibility` for long lists
- `rendering-hoist-jsx` — Extract static JSX outside components
- `rendering-svg-precision` — Reduce SVG coordinate precision
- `rendering-hydration-no-flicker` — Use inline script for client-only data
- `rendering-hydration-suppress-warning` — Suppress expected mismatches
- `rendering-conditional-render` — Use ternary, not `&&` for conditionals
- `rendering-usetransition-loading` — Prefer `useTransition` for loading state
- `rendering-resource-hints` — Use React DOM resource hints for preloading
- `rendering-script-defer-async` — Use `defer` or `async` on script tags

### 6. TypeScript Performance (LOW-MEDIUM)

- `js-batch-dom-css` — Group CSS changes via classes or `cssText`
- `js-index-maps` — Build `Map` for repeated lookups
- `js-cache-property-access` — Cache object properties in loops
- `js-cache-function-results` — Cache function results in module-level `Map`
- `js-cache-storage` — Cache `localStorage`/`sessionStorage` reads
- `js-combine-iterations` — Combine multiple `filter`/`map` into one loop
- `js-length-check-first` — Check array length before expensive comparison
- `js-early-exit` — Return early from functions
- `js-hoist-regexp` — Hoist `RegExp` creation outside loops
- `js-min-max-loop` — Use loop for min/max instead of sort
- `js-set-map-lookups` — Use `Set`/`Map` for O(1) lookups
- `js-request-idle-callback` — Defer non-critical work with `requestIdleCallback`
- `js-flatmap-filter` — Use `flatMap` instead of `map` + `filter`
- `js-tosorted-immutable` — Use `toSorted()` for immutable sorted copies

### 7. Advanced Patterns (LOW)

- `advanced-effect-event-deps` — Use `useEffectEvent` to avoid stale closure deps
- `advanced-event-handler-refs` — Store event handlers in refs for stable identity
- `advanced-init-once` — Initialise once-only values outside render
- `advanced-use-latest` — Keep the latest value accessible in async callbacks

## How to Use

Read individual rule files in `rules/` for detailed explanations and before/after code examples.

Each rule file contains:

- `title` — Short name
- `impact` — CRITICAL / HIGH / MEDIUM / LOW
- `tags` — Searchable keywords
- **Incorrect** — Code pattern to avoid
- **Correct** — Preferred pattern
- **Note** — When exceptions apply

## Attribution

Original rules authored by Vercel Engineering.
Source: <https://github.com/vercel-labs/agent-skills>
Licence: MIT
Adapted for the AGDS Starter Kit (Pages Router, stable React) by removing RSC-specific rules.
