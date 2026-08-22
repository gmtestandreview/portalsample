---
agent: 'agent'
description: 'Run an opt-in Core Web Vitals and web performance audit for relevant routes, pages, components, assets, or diffs.'
argument-hint: 'Performance issue, route, component, page, asset, metric, or diff to audit'
---

# Performance Audit

Use this prompt only when the user explicitly requests performance analysis, Core Web Vitals review, runtime-performance investigation, or performance optimization.

Do not use this prompt for ordinary feature work, refactors, documentation edits, styling changes, or repository maintenance unless the user explicitly asks for performance review.

The performance request is: **$input**

## Goal

Review the relevant route, page, component, asset, workflow, or diff for performance risks and improvement opportunities.

Use Core Web Vitals as the main lens:

- LCP: Largest Contentful Paint
- INP: Interaction to Next Paint
- CLS: Cumulative Layout Shift

Prefer measurable evidence where available. Do not claim a performance improvement without evidence, a clear mechanism, or an explicit caveat.

## Repository rules

Follow these rules first:

- Follow `AGENTS.md` as the canonical repository policy.
- Keep changes minimal and focused on the requested performance issue.
- Prefer AGDS-first and existing layout/component patterns.
- Preserve the current routing architecture unless the task explicitly asks for migration.
- Do not introduce App Router, Cache Components, new caching architecture, new dependencies, or build tooling unless explicitly required.
- Do not change linting, formatting, CI, package scripts, or repository policy unless explicitly asked.
- Do not widen the repository lint gate.

## Freshness rule

Performance guidance can depend on current browser, React, Next.js, and framework behavior.

When version-specific behavior matters:

- verify against current official documentation where available
- prefer existing repo patterns over generic framework advice
- state uncertainty when behavior cannot be verified
- do not rely on stale browser or framework support claims

## Audit scope

Review only the requested scope.

- If the scope is missing or too broad, state the minimum scope assumptions before reviewing.
- If the task is audit-only, do not modify files; report findings and recommended fixes only.

Relevant scope may include:

- a page or route
- a React component
- an image, font, script, or CSS asset
- a user interaction
- a hydration issue
- a build or bundle concern
- a specific metric regression
- a pull request diff

Do not perform full-repo performance rewrites unless explicitly requested.

## Audit areas

Check only the areas relevant to the task.

### LCP

Look for:

- slow server response or unnecessary blocking data fetches
- main content rendered only after client-side JavaScript
- render-blocking CSS or scripts
- missing priority/preload for the LCP image or font
- lazy-loaded above-the-fold images
- oversized or unoptimized images
- missing image dimensions
- heavy third-party scripts
- unnecessary redirects
- missing compression or poor asset delivery

### INP

Look for:

- long event handlers
- heavy synchronous work on the main thread
- unnecessary client-side rendering or hydration
- too many Client Components
- avoidable re-renders
- large unvirtualized lists
- layout thrashing
- expensive animations using layout-triggering properties
- missing cleanup for listeners, timers, or subscriptions
- oversized JavaScript bundles

### CLS

Look for:

- images, iframes, or embeds without reserved dimensions
- fonts that shift text during load
- content injected above existing content
- unstable loading states
- hydration mismatches
- layout changes caused by late-loading assets

### React / Next.js

When relevant:

- use Server Components or server-side rendering patterns only when the repo and task support them
- do not move large trees into Client Components unnecessarily
- keep `'use client'` at the smallest necessary boundary
- avoid client-side fetching for main above-the-fold content when a server-side pattern is available and appropriate
- do not use App Router-only guidance for Pages Router work unless the task explicitly involves App Router
- do not enable Next.js 16 caching features unless the task explicitly requires that behavior

### Assets

When relevant:

- prefer optimized image formats and dimensions
- avoid lazy loading LCP or above-the-fold images
- use responsive image sizing where appropriate
- avoid loading unnecessary fonts, weights, or third-party assets
- preserve accessibility requirements such as meaningful alt text

## Severity

Use these severity levels:

- Critical: likely blocks a Core Web Vital target or causes a major user-visible regression
- Important: likely has measurable performance impact and should be fixed soon
- Suggestion: possible improvement, but lower confidence or lower impact

Do not mark an issue Critical based only on a static pattern unless the user impact is clear.

## Review rules

- Prefer measured runtime evidence over static assumptions.
- Distinguish confirmed issues from hypotheses.
- Explain the likely performance mechanism.
- Prefer small fixes that preserve existing behavior.
- Do not add dependencies or architecture just because they are common performance tools.
- Do not optimize code that is outside the requested scope.
- If no material issues are found, say so and list any remaining validation gaps.

## Output format

Return:

1. Summary
   - requested performance scope
   - overall performance risk level
   - highest-priority findings

2. Findings
   For each finding include:
   - severity: Critical / Important / Suggestion
   - status: Confirmed / Likely / Needs measurement
   - affected metric: LCP / INP / CLS / Bundle / Memory / Other
   - file, route, component, or asset affected
   - what is wrong
   - why it matters
   - recommended fix
   - whether the fix requires measurement, code change, asset change, or configuration change

3. Suggested fixes
   - minimal safe fix first
   - optional follow-up improvements separately
   - avoid unrelated refactors

4. Validation
   - evidence reviewed
   - commands or tools run
   - commands or tools recommended
   - what could not be verified

5. Residual risks
   - assumptions
   - missing runtime data
   - browser/framework uncertainty
   - follow-up measurements

## Recommended validation

When relevant, run or recommend:

- `pnpm test`
- `pnpm build`
- `pnpm build-storybook`

For runtime performance evidence, recommend appropriate tools when available:

- Lighthouse
- Chrome DevTools Performance panel
- Web Vitals extension
- field analytics / real-user monitoring
- bundle analysis
- browser network waterfall
- interaction profiling

If validation cannot be run, say so clearly and do not claim performance improvement was verified.
