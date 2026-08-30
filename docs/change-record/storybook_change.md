# Prompt

The prompt I ran

You are a senior React, TypeScript, Storybook, Vitest, Vite/Rolldown, and Mock Service Worker engineer working directly in this repository.

Your task is to diagnose and fix all warnings and coverage errors produced by the Storybook test command.

## Current result

The Storybook suite completes successfully:

* Test files: 87 passed
* Tests: 218 passed
* Duration: approximately 183 seconds

However, the run is not clean. It produces:

1. A deprecated `vitest.init()` warning.
2. Several unhandled MSW request warnings.
3. A V8 coverage remapping/parsing error involving `ClientApp/src/terms-config.json?import`.

Do not treat passing tests as completion. The command must finish without these warnings or errors.

## Required working method

Before editing:

1. Locate the repository root.
2. Read any applicable `AGENTS.md` files completely.
3. Inspect `git status` and preserve all unrelated user changes.
4. Inspect the relevant installed package versions in `package.json`, the lockfile, and the dependency tree.
5. Identify the actual Storybook test command and configuration files.
6. Reproduce the problems and save the relevant baseline output.
7. Search the repository for:

   * `vitest.init`
   * `vitest.standalone`
   * Storybook Vitest configuration
   * `initialize` and `onUnhandledRequest`
   * MSW handlers
   * Google Tag Manager or `gtag`
   * `/api/lookup/services`
   * `TCPortalMeasurementCategory`
   * `TCArtefactTypePortalCategory`
   * `terms-config.json`
   * coverage configuration
   * source-map configuration

Do not assume the correct fix from the log alone. Establish which repository configuration or dependency invokes each behaviour.

Use the APIs supported by the versions installed in this repository. If documentation must be checked, use only the official Storybook, Vitest, Vite, Rolldown, and MSW documentation applicable to those versions.

## Issue 1: deprecated `vitest.init()`

Current warning:

```text
DEPRECATED vitest.init() is deprecated. Use vitest.standalone() instead.
```

Determine whether the deprecated call exists:

* directly in repository configuration;
* in generated Storybook/Vitest configuration;
* in a Storybook addon or plugin;
* or inside an installed dependency.

Apply the smallest compatible root-cause fix.

Requirements:

* Replace a repository-owned deprecated API with the supported `vitest.standalone()` configuration where appropriate.
* If the call originates in a dependency, determine whether a compatible package upgrade resolves it.
* Do not patch `node_modules`.
* Do not perform broad or unrelated dependency upgrades.
* Keep Storybook browser/component testing behaviour intact.
* Confirm that all existing Storybook tests are still discovered and executed.

## Issue 2: unhandled MSW requests

Resolve every listed request:

```text
GET https://www.googletagmanager.com/gtag/js?id=
GET /api/lookup/services
GET /api/lookup?LookupType=TCPortalMeasurementCategory
GET /api/lookup?LookupType=TCArtefactTypePortalCategory
```

Affected stories include:

```text
ClientApp/src/components/forms/WizardForm/WizardForm.stories.tsx
ClientApp/src/routes/services-we-offer/ServicesWeOffer.stories.tsx
ClientApp/src/routes/requestForQuote/requestForQuoteSummary.stories.tsx
ClientApp/src/routes/preConditions/PreConditions.stories.tsx
ClientApp/src/components/Layout/Layout.stories.tsx
```

For the API requests:

* Reuse existing shared mock fixtures and handler factories where suitable.
* Otherwise, add deterministic MSW handlers at the narrowest sensible shared or story-specific scope.
* Match query parameters explicitly when they produce different response data.
* Return response shapes that satisfy the real consumers and story states.
* Avoid duplicate or conflicting handlers.
* Do not use catch-all handlers.
* Do not silence all unhandled requests.
* Do not change `onUnhandledRequest` to `"bypass"` or `"warn"` merely to hide missing mocks.
* Do not make real backend calls from Storybook tests.

For Google Tag Manager:

* Trace why an empty measurement ID produces this request.
* Prefer preventing analytics scripts from loading in Storybook and test environments when analytics is not under test.
* If analytics-loading behaviour is intentionally part of a story, add a narrowly scoped and documented mock.
* Do not allow a real Google Tag Manager request during tests.
* Do not add a broad external-network bypass.
* Preserve production analytics behaviour.

Also investigate why some warnings appear under `unknown test` or at story-module scope. If a request is triggered during import or global initialisation, move or control that side effect appropriately without changing production behaviour.

## Issue 3: coverage failure for `terms-config.json?import`

Current error:

```text
Failed to parse .../ClientApp/src/terms-config.json?import.
Excluding it from coverage.

Error [RolldownError]: Parse failed with 1 error:
Expected a semicolon or an implicit semicolon after a statement, but found none

1: { "TermsVersion": "1" }
                   ^
2: // <inline-source-map>
```

Diagnose the complete path:

```text
JSON import
→ Vite/Rolldown transformation
→ source-map generation
→ Vitest V8 coverage collection
→ coverage remapping/parsing
```

Determine whether the root cause is:

* an invalid or incompatible inline source map;
* JSON being incorrectly included as executable coverage input;
* a Vite/Rolldown/Vitest compatibility issue;
* an overly broad coverage include pattern;
* or an application import pattern that should be changed.

Apply the narrowest correct fix.

Acceptable approaches may include:

* correcting the relevant source-map or transform configuration;
* correcting a package-version compatibility problem;
* narrowing coverage instrumentation to executable source files;
* explicitly excluding non-executable JSON assets from V8 coverage if that reflects the intended coverage policy;
* changing how the JSON configuration is loaded, if justified and production-safe.

Do not:

* disable coverage globally;
* disable source maps globally without proving that is appropriate;
* exclude the entire `ClientApp/src` directory;
* suppress all coverage errors;
* convert the JSON file into TypeScript solely to avoid investigating the cause;
* edit generated coverage output;
* patch `node_modules`.

If excluding JSON is the correct policy, ensure the exclusion is narrow, documented, and does not reduce coverage of TypeScript or JavaScript application code.

## Test and regression requirements

Add or update tests where needed to verify:

1. The services endpoint returns the expected mock response.
2. Each lookup type receives the correct deterministic response.
3. Storybook tests do not make a real Google Tag Manager request.
4. Analytics remains enabled in the intended production environment, if practical to test.
5. The terms configuration still loads correctly.
6. Coverage still includes the intended executable application files.

Preserve the existing behaviour and assertions of all 218 tests.

## Verification

Use the repository’s actual package manager and scripts. Do not invent commands that are not supported by the repository.

Run, in the appropriate order:

1. Focused tests for changed handlers, stories, analytics code, and terms configuration.
2. Type checking.
3. Linting.
4. The complete Storybook test command without coverage, if separate.
5. The complete Storybook test command with coverage.
6. Any relevant production or Storybook build command.

Capture the final output and explicitly search it for:

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

Do not claim success if any targeted warning remains.

## Acceptance criteria

The work is complete only when:

* No `vitest.init()` deprecation warning is emitted.
* No listed MSW request is unhandled.
* No real Google Tag Manager request is made during Storybook tests.
* No `unknown test` MSW warning remains for these requests.
* `terms-config.json` loads correctly.
* V8 coverage completes without the JSON parse/remapping error.
* Coverage is not broadly disabled or materially weakened.
* All original Storybook test files and tests still pass.
* Type checking and linting pass, or any unrelated pre-existing failures are clearly evidenced.
* Production application behaviour is preserved.
* No unrelated files or dependencies are changed.

## Final response

Provide:

1. Root cause for each of the three issue groups.
2. Files changed and why.
3. Any dependency changes, including old and new versions and the compatibility reason.
4. Tests added or updated.
5. Exact verification commands run.
6. Final pass/fail counts.
7. Confirmation that the final logs contain none of the targeted warning/error strings.
8. Any remaining risks or follow-up work.

If a problem cannot be fixed safely, stop and report the precise blocker with evidence. Do not conceal it using warning suppression, catch-all handlers, broad coverage exclusions, or disabled checks.
