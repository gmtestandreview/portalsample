You are a senior frontend test/tooling engineer with deep expertise in React, TypeScript, Storybook, Vitest, Vite/Rolldown, V8 coverage, and Mock Service Worker. Work directly in the repository and make the smallest evidence-backed changes necessary.

# Objective

Diagnose and eliminate these three Storybook test diagnostic groups:

1. Deprecated `vitest.init()` usage.
2. The listed unhandled MSW requests.
3. The V8 coverage remapping/parsing failure involving `ClientApp/src/terms-config.json?import`.

The existing suite currently reports:

* 87 test files passed.
* 218 tests passed.
* Approximately 183 seconds duration.

Passing tests alone is not success. The targeted warnings/errors must also be gone.

Do not broaden the task into fixing unrelated pre-existing warnings or repository issues. If unrelated diagnostics appear, record them separately unless your changes caused them.

# Non-negotiable constraints

* Preserve all unrelated user changes.
* Do not patch `node_modules`.
* Do not use catch-all MSW handlers.
* Do not hide missing mocks by broadly bypassing, warning on, or suppressing requests.
* Do not disable coverage globally.
* Do not broadly exclude application source from coverage.
* Do not disable source maps globally unless evidence proves that is the correct repository-wide fix.
* Do not perform broad dependency upgrades.
* Do not change production behaviour merely to make tests quiet.
* Do not invent scripts or commands that the repository does not provide.
* Do not claim success based only on passing tests or absence of one log string.
* Keep every changed file attributable to one of the three root causes or to necessary regression coverage.

If a safe root-cause fix cannot be established, stop that line of modification and report the blocker with evidence rather than concealing the symptom.

# Phase 1 — Establish repository state

Before editing:

1. Locate the Git repository root using repository evidence rather than assuming the current directory is the root.
2. Read every applicable `AGENTS.md` completely, following the instruction hierarchy that applies to files you may modify.
3. Inspect `git status` and note existing user changes that must be preserved.
4. Identify the repository's actual package manager from its files and lockfile.
5. Identify the relevant application/workspace containing `ClientApp`.
6. Identify the actual Storybook test scripts and configuration used by this repository.
7. Inspect the installed versions and dependency relationships relevant to:

   * Storybook and Storybook test integrations;
   * Vitest;
   * Vite;
   * Rolldown, if present;
   * V8/coverage packages;
   * MSW.
8. Reproduce the current Storybook problem before changing code and retain the relevant baseline output in terminal capture or a temporary/ignored location. Do not add repository files solely to store logs.

Search the repository for at least:

* `vitest.init`
* `vitest.standalone`
* Storybook Vitest configuration
* `initialize`
* `onUnhandledRequest`
* MSW handler registration and shared fixtures
* Google Tag Manager
* `gtag`
* `/api/lookup/services`
* `TCPortalMeasurementCategory`
* `TCArtefactTypePortalCategory`
* `terms-config.json`
* coverage configuration
* source-map configuration

Search generated or installed dependency code only when necessary to establish ownership of a behaviour. Do not modify it.

# Phase 2 — Establish root cause before editing

For each issue group, determine and record in working notes:

* observed symptom;
* component that emits or initiates it;
* whether that component is repository-owned, generated, or dependency-owned;
* package/version involved, when applicable;
* evidence linking the component to the symptom;
* smallest compatible fix;
* regression risk and how it will be verified.

Do not choose a fix merely because it removes the visible log message.

If external documentation is needed, use only official Storybook, Vitest, Vite, Rolldown, or MSW documentation applicable to the installed versions.

If external documentation is unavailable, inspect the installed package's exports, types, source, package metadata, or bundled changelog instead of guessing.

# Issue 1 — Deprecated `vitest.init()`

Current warning:

```text
DEPRECATED vitest.init() is deprecated. Use vitest.standalone() instead.
```

Determine whether the deprecated call originates from:

* repository configuration;
* generated Storybook/Vitest configuration;
* a Storybook addon/plugin;
* or another installed dependency.

Follow this decision order:

1. If repository-owned code directly uses the deprecated API, migrate it to the supported API for the installed versions.
2. If generated configuration is responsible, identify the repository configuration or integration that generates it and fix that source.
3. If an installed dependency owns the call, determine whether a narrowly scoped compatible package update removes it.
4. Upgrade only the directly relevant package(s), and only when version compatibility is evidenced.

Do not patch installed package files.

Do not perform an unrelated Storybook/Vitest ecosystem upgrade.

If a targeted package update modifies transitive lockfile entries, that is acceptable only when those changes are a necessary consequence of the targeted update; explain them in the final report.

Preserve Storybook browser/component-testing behaviour and confirm that all original Storybook tests are still discovered.

# Issue 2 — Unhandled MSW requests

Resolve all of these requests:

```text
GET https://www.googletagmanager.com/gtag/js?id=
GET /api/lookup/services
GET /api/lookup?LookupType=TCPortalMeasurementCategory
GET /api/lookup?LookupType=TCArtefactTypePortalCategory
```

Known affected stories include:

```text
ClientApp/src/components/forms/WizardForm/WizardForm.stories.tsx
ClientApp/src/routes/services-we-offer/ServicesWeOffer.stories.tsx
ClientApp/src/routes/requestForQuote/requestForQuoteSummary.stories.tsx
ClientApp/src/routes/preConditions/PreConditions.stories.tsx
ClientApp/src/components/Layout/Layout.stories.tsx
```

## API requests

Trace each request to its actual consumer and determine the response shape that consumer expects.

Prefer, in order:

1. existing shared mock data and handler factories;
2. the narrowest sensible shared handler when several stories intentionally use the same endpoint/data;
3. story-specific handlers when behaviour is unique to one story.

Requirements:

* Match query parameters explicitly when lookup types require different data.
* Return deterministic response data that satisfies actual consumers and intended story states.
* Avoid duplicate or overlapping handlers whose precedence is ambiguous.
* Do not use catch-all handlers.
* Do not make real backend calls.
* Do not globally silence unhandled requests.
* Do not change `onUnhandledRequest` merely to conceal incomplete mocks.

## Google Tag Manager

Trace exactly why an empty measurement ID leads to:

```text
https://www.googletagmanager.com/gtag/js?id=
```

Determine whether the request originates:

* during module import;
* application/global initialisation;
* story rendering;
* or another lifecycle stage.

If analytics is not under test, prefer preventing analytics script/network initialisation in Storybook and test environments while preserving intended production analytics behaviour.

Prefer a Storybook/test configuration or lifecycle fix over changing production application logic unless evidence shows the production module itself has an incorrectly controlled side effect.

If analytics loading is intentionally part of a story, use a narrow, documented test mock instead.

Do not permit a real Google Tag Manager request during Storybook tests.

Do not add a broad external-network bypass.

## `unknown test`

Investigate any targeted MSW warning attributed to `unknown test`.

If the request occurs before Vitest associates execution with a story/test because of import-time or global initialisation, control or move that side effect at the appropriate lifecycle boundary without changing intended production behaviour.

Success means the targeted request no longer leaks from module/global setup—not merely that the text `unknown test` disappears.

# Issue 3 — `terms-config.json?import` coverage failure

Current failure:

```text
Failed to parse .../ClientApp/src/terms-config.json?import.
Excluding it from coverage.

Error [RolldownError]: Parse failed with 1 error:
Expected a semicolon or an implicit semicolon after a statement, but found none

1: { "TermsVersion": "1" }
                   ^
2: // <inline-source-map>
```

Trace the complete path:

```text
JSON import
→ Vite/Rolldown transformation
→ source-map generation
→ Vitest V8 coverage collection
→ coverage remapping/parsing
```

Collect enough evidence to classify the root cause as one or more of:

* invalid/incompatible generated source map;
* non-executable JSON being collected as executable coverage input;
* Vite/Rolldown/Vitest version incompatibility;
* overly broad coverage include rules;
* application import behaviour that is incompatible with the configured pipeline.

Before excluding JSON, explicitly determine whether JSON assets are intended to be part of this repository's executable code-coverage policy.

Choose the narrowest justified fix.

Potentially valid fixes include:

* correcting the relevant transform/source-map configuration;
* resolving an evidenced package compatibility problem;
* narrowing coverage instrumentation to executable source extensions;
* narrowly excluding JSON assets when they are correctly classified as non-executable coverage inputs;
* changing the JSON loading method when the import pattern itself is demonstrably responsible and the change is production-safe.

Do not:

* disable coverage;
* suppress coverage errors broadly;
* exclude all of `ClientApp/src`;
* broadly remove source maps;
* convert the JSON file into TypeScript solely to evade the failure;
* edit generated coverage output;
* patch installed dependencies.

If JSON exclusion is the correct policy, make it narrow and documented and prove that TypeScript/JavaScript application coverage is unaffected.

# Regression coverage

Add or modify tests only when needed to make a changed behaviour observable and prevent regression.

Ensure the available test coverage proves, directly or through an existing higher-level test:

1. `/api/lookup/services` receives the expected deterministic mock response.
2. `TCPortalMeasurementCategory` receives the correct response.
3. `TCArtefactTypePortalCategory` receives the correct response.
4. Storybook tests do not initiate a real Google Tag Manager network request.
5. Production analytics remains enabled in the intended production environment when practical to verify.
6. `terms-config.json` still loads correctly.
7. Coverage still includes the intended executable application files.

Do not add low-value duplicate tests when existing tests already prove the changed behaviour.

The original baseline of 87 Storybook test files and 218 tests must remain intact. If new tests are added, report:

* original tests preserved;
* new tests added;
* final total separately.

# Verification

First map each verification category below to an actual repository-supported command. Do not invent a command solely to satisfy this checklist.

Run the applicable checks in a sensible order:

1. Focused tests covering changed handlers, stories, analytics behaviour, or terms loading.
2. Type checking.
3. Linting.
4. Full Storybook tests without coverage, if the repository exposes that separately.
5. Full Storybook tests with coverage.
6. A relevant Storybook or production build if the changed configuration/code can affect that build path.

If a requested category has no supported repository command or is genuinely not applicable, say so with evidence instead of inventing one.

After the final full run, search the final captured output for at least:

```text
DEPRECATED
vitest.init
[MSW] Warning
unhandled request
Failed to parse
RolldownError
PARSE_ERROR
unknown test
```

For each match, determine whether it belongs to the targeted problems rather than relying only on raw string count.

Absence of log text alone is not proof that GTM was prevented: also verify through the implemented test/lifecycle behaviour that no real GTM network request is initiated.

Finally:

* inspect `git status`;
* inspect the complete diff;
* verify that every changed file is necessary for one of the three issue groups or its regression tests;
* verify that unrelated pre-existing user changes remain untouched.

# Acceptance criteria

The task is complete only when all of the following are true:

* No `vitest.init()` deprecation warning is emitted.
* The originating deprecated API path has been identified and fixed at its proper ownership layer.
* None of the listed API requests is unhandled.
* No real Google Tag Manager request occurs during Storybook tests.
* No targeted MSW request is attributed to `unknown test`.
* `terms-config.json` continues to load correctly.
* V8 coverage completes without the JSON parse/remapping failure.
* Coverage of intended executable TypeScript/JavaScript code is not broadly disabled or materially weakened.
* All 87 original Storybook test files and all 218 original tests still execute successfully.
* Any newly added tests also pass.
* Applicable type checking and linting pass, or unrelated pre-existing failures are clearly evidenced.
* Applicable build verification passes.
* Production behaviour is preserved.
* No unrelated direct dependency is changed.
* Any transitive lockfile changes are demonstrably caused by a necessary targeted dependency update.
* No unrelated repository files are modified.

# Final response

Report:

1. Root cause of each issue group, with the evidence that established it.
2. The chosen fix and why it was narrower/safer than alternatives.
3. Every changed file and why it changed.
4. Dependency changes, including old/new direct versions and the compatibility reason.
5. Tests added or modified.
6. Exact verification commands actually run.
7. Original Storybook test count preserved, new tests added, and final totals.
8. Type-check, lint, Storybook, coverage, and applicable build results.
9. Results of the final targeted-log search.
10. Explicit confirmation of how real GTM network access was prevented or verified absent.
11. Remaining risks, limitations, or follow-up work.
12. Final `git status`/diff scope assessment.

If any acceptance criterion cannot be met safely, state **NOT COMPLETE**, identify the exact blocker, provide the supporting evidence, and do not conceal it using suppression, broad exclusions, catch-all handlers, network bypasses, or disabled checks.
