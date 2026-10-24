# ESLint Security Warning Atom Trace

Date: 2026-10-23

## Scope and result

This trace covers the current `npm run lint` security output after the ESLint
flat-config repair. The reproducible inventory contains 190 warnings:

- 99 `security/detect-object-injection`
- 61 `security/detect-non-literal-fs-filename`
- 22 `security/detect-non-literal-regexp`
- 7 `security/detect-unsafe-regex`
- 1 `security/detect-possible-timing-attacks`

The warning count is not a defect count. Static analysis reports a possible
hazard at a syntax shape; it does not establish attacker control, an unsafe
trust boundary, a bad runtime result, or a regression.

No correctness defect was confirmed by this pass, so no application behavior was
changed. The existing worktree edits were preserved. The status values in the
atom traces mean:

- **Contained**: the input is fixed, typed, or test-only, and the warning does
  not currently justify a behavior change.
- **Verify**: the warning is plausible, but the trust boundary, input contract,
  or worst-case runtime behavior needs a repository-level test or review.
- **Confirmed defect**: a failing behavior or exploitable boundary has been
  demonstrated. None were found in this pass.

Each warning location below belongs to exactly one atom. Locations are grouped
when they share one responsibility and one independently testable contract.

## Object-injection atoms

### OI-01 — Vite environment-key projection

Warnings: `vite.config.mts:54:7`, `vite.config.mts:54:42`,
`vite.config.mts:70:10`.

Trace: `VITE_ENV_KEYS` and `DEVELOPMENT_DEFAULTS` -> indexed lookup while
constructing the template environment -> `Object.fromEntries` returns the fixed
application environment map, and `escapeHtmlAttributeCharacter` maps only
characters matched by the fixed escape pattern.

Expected outcome: every supported Vite key is emitted; unknown keys fall back to
the empty string or the development default. No user-controlled property name
reaches this map.

Tests: `tests/unit/config/viteConfig.test.ts` environment and template
replacement cases; add a focused case asserting all `VITE_ENV_KEYS` are
projected and that a missing development default becomes `''`.

Classification: **Contained**.

### OI-02 — Vite HTML-attribute escape table

Warning: `vite.config.mts:236:22`.

Trace: the regex capture from the HTML attribute escaper -> lookup in the
literal `HTML_ATTRIBUTE_ESCAPE_REPLACEMENTS` table -> escaped template output.

Expected outcome: `&`, quotes, and angle brackets are escaped; any character
outside the table is returned unchanged. The key domain is fixed by the regex.

Tests: `tests/unit/config/viteConfig.test.ts`; add table-driven cases for all
five special characters and one ordinary character.

Classification: **Contained**.

### OI-03 — Build-verifier HTML escape table

Warning: `scripts/verify-vite-build.mjs:61:45`.

Trace: a character captured from generated HTML -> lookup in the literal
`htmlAttributeEscapes` object -> verifier-only escaped text.

Expected outcome: build verification rejects malformed output or compares the
same escaped value the application expects. This code does not serve runtime
HTML.

Tests: add a unit test around the verifier helper for the five escape
characters; retain the existing Vite build verification as the integration test.

Classification: **Contained**.

### OI-04 — Storybook coverage JSON parser character indexing

Warnings: `scripts/storybook-coverage.mjs:95:21`, `103:23`, `130:23`, `140:11`,
`146:13`, `150:13`, `159:13`, `163:13`, `172:11`, `179:13`, `183:13`.

Trace: a parser-owned string and its cursor -> `text[index]` or a fixed parser
state table -> parse progress or a validation error. The parser is used for
coverage manifests, receipts, and other generated JSON.

Expected outcome: the parser accepts valid JSON, rejects control characters,
duplicate keys, missing punctuation, and unterminated values, without using
input as an executable property path.

Tests: existing `assertUniqueJsonKeys` and closure-validation tests; add
malformed-input cases for long strings, nested arrays, duplicate keys, and
`__proto__`/`constructor` JSON keys. The latter should assert parse behavior,
not mutate a global prototype.

Classification: **Contained**, with parser robustness worth preserving.

### OI-05 — Storybook coverage canonicalized record fields

Warnings: `scripts/storybook-coverage.mjs:233:44`, `807:25`, `851:9`, `851:28`,
`2045:9`.

Trace: keys from a canonicalization list, `requiredProducerFields`, a fixed
receipt-identity list, or a fixed digest-key tuple -> record read/write ->
canonical output or validation errors.

Expected outcome: only repository-defined fields participate in canonical
serialization and closure validation. The values are compared, not executed.

Tests: `tests/unit/storybook/closureValidation.test.ts` and
`tests/unit/storybook/manifestReceiptClosure.test.ts`; add a fixture containing
unknown fields and the reserved names `__proto__` and `constructor`.

Classification: **Contained** unless a future change makes any field list
external input.

### OI-06 — Storybook inventory region replacement

Warning: `scripts/storybook-coverage.mjs:2333:38`.

Trace: keys from the literal `files` map -> generated inventory path and
`inventory.regions[region]` -> replacement of one approved generated region.

Expected outcome: exactly the three known inventory documents are updated with
their matching generated region. `region` is not sourced from a request.

Tests: `tests/unit/storybook/inventoryWriter.test.ts`; assert all three known
regions are replaced and an unexpected region is not written.

Classification: **Contained**.

### OI-07 — Certificate lookup dynamic option fields

Warnings:
`ClientApp/src/components/Inputs/CertificateNumberLookup/index.tsx:84:19`,
`:89:19`, `:105:19`, `:187:32`.

Trace: component props and the filtered suggestion index -> lookup response
field, active suggestion, or indexed DOM ref -> filtering, selection, and
scrolling behavior.

Expected outcome: only configured lookup field names and numeric indexes are
used. Invalid or missing suggestions fall back to free text selection.

Tests: the component's existing lookup tests; add cases for a missing configured
field, an out-of-range active index, and keyboard Enter/Escape behavior.

Classification: **Verify** for prop-contract enforcement; no defect is confirmed
because field names are component configuration and reads are not writes.

### OI-08 — Organisation lookup and suggestion projection

Warning:
`ClientApp/src/components/Inputs/OrganisationNameLookup/index.tsx:162:22`; and
`ClientApp/src/components/Inputs/OrganisationNameLookup/suggestionUtils.ts:26:32`,
`:45:15`, `:59:20`.

Trace: configured option/parent field names and bounded suggestion indexes ->
string matching, selected option projection, or DOM ref scrolling -> rendered
suggestions and selected form value.

Expected outcome: only string-valued configured fields are matched; a missing
parent field returns no match; duplicates are removed and results are bounded by
`maxResults`.

Tests: existing `tests/unit/components/inputs/OrganisationNameLookup.test.ts`;
add malformed option objects, an invalid `matchType`, and an index equal to the
result length.

Classification: **Verify** for the public prop contract; no confirmed defect.

### OI-09 — PII analytics map construction

Warnings: `ClientApp/src/analytics/GoogleAnalytics.tsx:45:5`, `:46:5`, and
`ClientApp/src/routes/common/helperFunctions.ts:392:5`.

Trace: `[data-pii]` DOM attributes -> dynamic analytics object keys -> local
debug output or redacted GA event data.

Expected outcome: values are redacted before production analytics is sent;
localhost diagnostics may retain original values by explicit design.

Tests: `tests/unit/routes/common/helperFunctions.test.ts`; add a DOM fixture
with multiple PII fields, a missing attribute, and the reserved names
`__proto__` and `constructor`. Verify no raw PII reaches the non-local send.

Classification: **Verify**. The value path is intentionally redacted, but the
repository must confirm that PII attribute names are application-controlled and
that localhost console output is acceptable.

### OI-10 — Indexed UI refs and selected controls

Warnings: `ClientApp/src/components/AriaComponents/Slider/Slider.tsx:48:21`;
`ClientApp/src/components/Inputs/CertificateNumberLookup/index.tsx:136:29`,
`:137:7`, `:304:23`;
`ClientApp/src/components/Inputs/OrganisationNameLookup/index.tsx:116:29`,
`:117:7`, `:260:23`;
`tests/unit/routes/requestForQuote/requestForQuoteSummary.test.tsx:231:21`.

Trace: React-rendered array/index -> array item, ref, or test button -> focus,
scroll, selection, or navigation.

Expected outcome: indexes are bounded by the rendered collection; an absent item
is a no-op or test failure rather than an exception in application code.

Tests: slider, lookup, and request-for-quote component tests; add an empty list,
last-item, and stale-index case for each reusable component.

Classification: **Contained** for the slider and test index; **Verify** for the
lookup refs because the component contract should explicitly cover stale refs.

### OI-11 — HTTP error content selection

Warning: `ClientApp/src/components/ErrorBoundary/ErrorDisplay.tsx:84:19`.

Trace: HTTP status number -> fixed `errorContentByStatus` map -> user-facing
error content, with a server-error fallback.

Expected outcome: known statuses render their approved copy; every unknown
status renders the safe generic content.

Tests: error display tests should cover every supported status, `0`, `999`, and
non-enumerable runtime input coerced at the route boundary.

Classification: **Contained**; the key is numeric and the fallback is explicit.

### OI-12 — Form error summary maps

Warnings: `ClientApp/src/components/forms/ErrorSummary/index.tsx:106:44`,
`:176:7`.

Trace: server/Formik error keys -> display lookup and normalized summary object
assignment -> linked error list and focus targets.

Expected outcome: field errors are displayed under their normalized field path;
unknown server keys do not execute code or alter unrelated state.

Tests: error-summary tests; add `__proto__`, `constructor`, nested array paths,
and duplicate normalized keys. Assert the summary remains a normal display map
and no prototype property is changed.

Classification: **Verify**. The writes are string-valued and currently appear
display-only, but server-shaped keys cross a trust boundary that should be
tested explicitly.

### OI-13 — React Hook Form error flattening

Warning: `ClientApp/src/components/forms/ErrorSummary/rhfErrors.ts:33:9`.

Trace: RHF field names -> dotted error path -> result map assignment -> error
summary rendering.

Expected outcome: only `message` strings are copied; RHF `ref` objects are not
traversed or rendered.

Tests: existing `tests/unit/components/forms/rhfErrors.test.ts`; add reserved
field names and nested arrays.

Classification: **Verify** for reserved-name hardening; current behavior is
display-only and no defect is confirmed.

### OI-14 — Wizard step status and route indexes

Warnings:
`ClientApp/src/components/forms/WizardForm/useWizardStepController.ts:194:9`,
`:195:14`, `:338:22`;
`ClientApp/src/components/forms/WizardForm/WizardRoutedStep.tsx:121:23`,
`:165:20`.

Trace: current step and incomplete-step indexes -> status array, route element,
and rendered step list -> completion state and navigation.

Expected outcome: only indexes produced by the wizard's own step collection are
used; a missing step does not produce a navigation target.

Tests: wizard controller and routed-step tests; add zero-step, completed-step,
stale-index, and first-incomplete-before-current cases.

Classification: **Verify** for stale route state; not a confirmed security or
correctness defect from this static warning.

### OI-15 — Form/data utility dynamic fields

Warnings: `ClientApp/src/env.ts:63:24`, `:67:7`;
`ClientApp/src/routes/common/helperFunctions.ts:419:6`, `:426:8`, `:428:17`,
`:438:6`, `:438:51`; `ClientApp/src/routes/services-we-offer/index.tsx:198:21`;
`ClientApp/src/routes/ta/supportingDocuments.tsx:38:11`, `:91:5`;
`ClientApp/src/utils/areFormValuesEqual.ts:45:62`, `:66:28`, `:66:39`;
`ClientApp/src/utils/index.ts:198:74`, `:292:7`;
`ClientApp/src/validationSchemas/common.ts:150:3`.

Trace: typed display-field names, form keys, service IDs, error names, or loop
indexes -> property read/write -> sorting, equality, selected-service state,
error display, file conversion, or digit-name formatting.

Expected outcome: configured keys select the intended field; equality remains
order-independent for plain objects; numeric indexes stay within arrays; a
missing digit mapping falls back to its numeric text.

Tests: existing helper, form equality, route, and validation tests; add missing
field, empty list, negative/oversized file-size, sparse array, and reserved-key
fixtures. Do not change data structures until those contracts are explicit.

Classification: **Verify**. These are mostly typed reads, but the form/error
maps need boundary tests before any extraction.

### OI-16 — Slate and branch-table dynamic fields

Warnings: `ClientApp/src/components/SlateEditor/SlateEditor.tsx:64:18`;
`ClientApp/src/components/modals/BranchSelectorModal/index.tsx:375:37`,
`:376:37`.

Trace: Slate mark key or `SortableBranchKey` -> model/property read -> editor
format state or branch sorting.

Expected outcome: only type-level keys are read; sorting does not mutate the
source data unexpectedly.

Tests: Slate mark toggle tests and branch-selector sorting tests for every
allowed key, missing values, and ascending/descending order.

Classification: **Contained** for key domain; **Verify** for the existing
in-place `sort` behavior, which is a separate correctness concern from this
warning.

### OI-17 — Test policy maps

Warnings: `tests/unit/config/dependencySecurity.test.ts:36:27`, `:188:9`,
`:301:9`; `tests/unit/config/eslintPolicy.test.ts:30:17`; and
`tests/unit/config/vitestTopology.test.ts:95:14`.

Trace: package/rule/config names from test-owned constant lists -> map lookup ->
assertion failure if policy drift occurs.

Expected outcome: tests fail loudly when dependency pins, rule severities, or
config topology change.

Tests: the warning locations are themselves the policy tests; add reserved-key
fixtures only if the policy parser starts accepting external data.

Classification: **Contained**, test-only and fixed-domain.

### OI-18 — Vite config test environment maps

Warnings: `tests/unit/config/viteConfig.test.ts:114:38`, `:115:5`, `:127:37`,
`:128:10`, `:416:39`, `:421:9`, `:448:41`, `:449:14`, `:452:9`.

Trace: fixed `TEST_ENVIRONMENT` keys -> process-environment setup/restore ->
isolated Vite config assertions.

Expected outcome: test process state is restored exactly, including absent keys.

Tests: existing Vite config suite; add a reserved-key entry only if the test
fixture type is widened. No production behavior is involved.

Classification: **Contained**.

### OI-19 — Mocked control registries

Warnings: `tests/unit/routes/ta/applicationAndInstrument.test.tsx:41:11`,
`:45:11`, `:76:5`, `:104:5`.

Trace: rendered control names -> captured mock registry -> assertions and event
callbacks.

Expected outcome: the mock records exactly the controls rendered by the route.

Tests: existing application-and-instrument route tests; add an unknown-control
assertion if the mock is reused for externally named controls.

Classification: **Contained**, test-only.

### OI-20 — Runtime environment test harness

Warnings: `tests/unit/runtime/env.test.ts:42:21`, `:42:39`, `:119:16`,
`:178:14`.

Trace: fixed environment-key list -> `vi.stubEnv`, imported `env` map, and
assertion lookup -> missing-variable diagnostics and empty fallbacks.

Expected outcome: tests isolate and restore runtime environment state.

Tests: existing runtime env tests; add a cleanup assertion for `globalThis`
runtime overrides.

Classification: **Contained**, test-only.

### OI-21 — MSW lookup fixture map

Warnings: `.storybook/msw-handlers.ts:202:11` and
`tests/unit/storybook/mswHandlers.test.ts:171:9`.

Trace: `LookupType` enum/query value -> fixture map -> mocked response or
501/fail-closed behavior.

Expected outcome: only mapped lookup types return data; unknown types fail
closed.

Tests: existing `tests/unit/storybook/mswHandlers.test.ts`; add a reserved-key
query and unknown lookup type.

Classification: **Contained** for the enum-driven application handler;
**Verify** that the test fixture cannot be reached with arbitrary network input
outside MSW.

### OI-22 — Console guard and deferred test values

Warnings: `tests/helpers/unexpectedConsoleGuard.ts:100:19`, `:177:7`, `:192:31`;
`tests/unit/components/inputs/Attachment/RhfAttachmentItem.test.tsx:194:9`.

Trace: formatted console arguments, guarded log level, or deferred outcome name
-> formatter/console method or deferred resolver -> captured output and test
settlement.

Expected outcome: console output is re-emitted unchanged and deferred tests
settle only through the requested resolve/reject operation.

Tests: unexpected-console helper tests and attachment tests; add unknown format
tokens, invalid levels, and double-settlement cases.

Classification: **Contained**; all inputs are test-controlled.

### OI-23 — E2E step and Storybook retry maps

Warnings: `tests/e2e/features/@type-approval/steps.ts:62:22` and
`tests/e2e/support/storybookHelpers.ts:119:21`.

Trace: scenario title or retry attempt -> fixed location/delay map -> URL
assertion or retry scheduling.

Expected outcome: unsupported titles fail explicitly; unsupported attempts do
not silently retry.

Tests: existing E2E step and MCP helper tests; add unknown title/attempt cases.

Classification: **Contained**, test-only and fixed-domain.

## Non-literal filesystem-path atoms

### FS-01 — Vite build verifier traversal and generated assets

Warnings: `scripts/verify-vite-build.mjs:19:11`, `:29:25`, `:67:22`, `:90:10`.

Trace: `dist` and its generated child paths -> `stat`, `readdir`, and `readFile`
-> build asset existence and HTML reference checks.

Expected outcome: verification reads only the build output selected by the
script and fails when an expected asset is missing.

Tests: add a temporary-dist fixture with a nested directory, missing asset, and
symlink/path traversal attempt. The verifier should stay inside the selected
dist root if that is its contract.

Classification: **Verify**. The root is local build output, but symlink and
CLI-root behavior need an explicit repository-level contract.

### FS-02 — Storybook coverage closure inputs

Warnings: `scripts/storybook-coverage.mjs:2523:21`, `:2536:26`.

Trace: `--index`, `--docs-index`, `--receipts`, and the resolved receipt folder
-> JSON reads and receipt enumeration -> closure validation.

Expected outcome: closure mode reads the selected artifacts and rejects invalid
or incomplete receipts; it is not a server endpoint.

Tests: existing closure validation tests; add path-boundary, missing-file,
symlink, and receipt-name cases. Confirm whether CLI users are allowed to choose
arbitrary paths or only paths under the checkout.

Classification: **Verify**. The paths are CLI-controlled and currently resolved,
but the allowed trust boundary is not proven by the lint warning.

### FS-03 — Storybook coverage worklist outputs

Warnings: `scripts/storybook-coverage-worklist.mjs:144:3`, `:145:3`.

Trace: `--out`/`--summary` output paths -> directory creation and JSON write ->
coverage worklist artifacts.

Expected outcome: requested reports are written atomically enough for the
workflow and do not overwrite an unintended checkout file.

Tests: add a temp-directory test for nested output, existing output, and an
output path outside the repository. Preserve the CLI contract if arbitrary
output paths are intentional.

Classification: **Verify**, tooling-only path policy.

### FS-04 — Storybook documentation verifier

Warnings: `scripts/verify-storybook-docs.mjs:15:9`, `:55:28`, `:81:24`,
`:103:9`.

Trace: `process.cwd()/storybook-static` and the fixed docs-source roots ->
directory/file reads -> docs index, manifest, and link validation.

Expected outcome: only generated Storybook output and repository docs are read;
missing or broken docs cause a clear failure.

Tests: add a fixture with a nested docs directory, non-doc file, missing
manifest, and symlink. Existing docs verification remains the integration test.

Classification: **Contained** for the fixed roots; **Verify** for symlink
handling.

### FS-05 — Vitest Storybook receipt writer

Warnings: `vitest.storybook.runtime.ts:57:3`, `:71:3`.

Trace: `STORYBOOK_CLOSURE_RECEIPTS` -> validated resolved receipt directory ->
directory creation and exclusive diagnostic-file write.

Expected outcome: the child writes one redacted diagnostic record outside the
selected source inputs and never overwrites an existing receipt.

Tests: `tests/unit/config/storybookRuntimePolicy.test.ts`; add an outside-root,
source-root, symlink, and concurrent-writer case.

Classification: **Verify**. `isInside` excludes selected inputs, but the full
allowed destination boundary is a repository policy question.

### FS-06 — Test asset and redirect fixtures

Warnings: `tests/unit/config/appShellAssets.test.ts:25:23`;
`tests/unit/config/authRedirectBridgePolicy.test.ts:38:3`;
`tests/unit/config/vscodeProblemsConfig.test.ts:10:5`.

Trace: test-owned repository/temp paths -> `stat`, `writeFileSync`, or
`readFileSync` -> fixture setup and assertions.

Expected outcome: tests read known repository assets and write only temporary
fixtures.

Tests: existing tests; add path traversal and cleanup assertions if any path
becomes scenario-provided.

Classification: **Contained**, test-only fixed paths.

### FS-07 — Environment and local patch policy scans

Warnings: `tests/unit/config/env.test.ts:22:25`, `:36:27`;
`tests/unit/config/localPatchApplication.test.ts:79:13`, `:85:13`, `:91:13`,
`:101:9`.

Trace: repository fixture roots and package paths -> recursive reads -> source
policy or patch-idempotence assertions.

Expected outcome: tests inspect only the checked-out source and temporary patch
fixtures.

Tests: existing env and local-patch suites; add a symlinked fixture and assert
the intended follow/no-follow behavior.

Classification: **Contained** for current fixed roots; **Verify** if fixture
roots become configurable.

### FS-08 — Sonar backlog fixture lifecycle

Warnings: `tests/unit/config/sonarBacklog.test.ts:109:37`, `:173:5`, `:195:14`,
`:214:5`, `:218:5`, `:238:14`, `:247:5`, `:276:14`, `:331:20`, `:429:20`.

Trace: temporary fixture/output directories and subprocess output -> file
creation, reads, existence checks, and cleanup -> backlog validation results.

Expected outcome: malformed fixtures fail without leaving output artifacts;
valid fixtures retry and write the expected report.

Tests: the warning locations are covered by the sonar backlog suite; add a
cleanup assertion after subprocess failure and a symlink fixture.

Classification: **Contained**, test-only. Cleanup behavior is a test-quality
check, not an application vulnerability.

### FS-09 — Storybook runtime policy fixtures

Warnings: `tests/unit/config/storybookRuntimePolicy.test.ts:16:3`, `:96:5`,
`:106:14`, `:130:5`, `:141:14`, `:144:9`.

Trace: temp receipt root -> directory creation, enumeration, and child record
read -> assertions about no-write and redacted-write modes.

Expected outcome: the no-receipt mode stays empty; the configured mode produces
one valid record and removes the temp tree.

Tests: existing runtime policy cases; add symlink and concurrent-child cases.

Classification: **Contained** for test-only temp roots; **Verify** for runtime
destination policy as described in FS-05.

### FS-10 — Vitest and Storybook source-contract readers

Warnings: `tests/unit/config/storybookVitestContract.test.ts:23:16`, `:45:10`,
`:57:3`; `tests/unit/storybook/reactAriaEvaluationContract.test.ts:12:10`,
`:22:5`, `:34:18`, `:65:22`, `:76:14`;
`tests/unit/storybook/storybookDocsConfig.test.ts:251:14`, `:252:29`;
`tests/unit/storybookMigrationInventory.test.ts:8:3`.

Trace: package-resolved paths or fixed repository component roots -> source
reads and recursive enumeration -> contract assertions about package shape,
stories, imports, and migration inventory.

Expected outcome: tests fail when package internals or story inventory drift;
they do not process user requests.

Tests: the named contract suites; add package-root and symlink boundary tests
only if the test roots become configurable.

Classification: **Contained**, test-only.

### FS-11 — E2E route and coverage fixture readers

Warnings: `tests/unit/e2e/routeCoverage.test.ts:38:11`, `:41:31`, `:50:11`;
`tests/unit/storybook/coverageDrift.test.ts:14:3`.

Trace: inventory entries -> repository-relative feature/story paths -> file
existence, source reads, and scenario assertions.

Expected outcome: inventory cannot silently reference a file outside the
repository or a missing scenario.

Tests: existing route-coverage and coverage-drift suites; add `../` and
absolute-path entries and assert rejection before any read.

Classification: **Verify**. The code constructs paths from inventory data; the
repository should make the containment assertion explicit.

### FS-12 — Storybook inventory writer and MSW source scanner

Warnings: `tests/unit/storybook/inventoryWriter.test.ts:23:9`, `:24:9`, `:25:9`,
`:34:11`, `:59:9`, `:68:9`, `:74:9`; and
`tests/unit/storybook/mswHandlers.test.ts:27:14`.

Trace: temp inventory documents or globbed source files -> directory/file
creation and source reads -> generated-region and lookup-fixture assertions.

Expected outcome: only temp fixture paths and repository source files are
written/read.

Tests: existing inventory-writer and MSW tests; add a glob result containing a
symlink and an excluded generated API client.

Classification: **Contained** for current test-owned paths.

## Non-literal regular-expression atoms

### RE-01 — Yup dynamic consecutive-character validator

Warnings:
`ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts:733:32`.

Trace: validated numeric threshold -> escaped numeric quantifier in a regex ->
reject repeated alphabetic characters.

Expected outcome: threshold is clamped to a safe minimum and the generated regex
only varies by a bounded integer.

Tests: validation tests for thresholds 0, 1, 2, 3, a large threshold, and long
input. Measure execution time for a worst-case string.

Classification: **Verify** for runtime bounds; no injection defect is confirmed
because the only interpolated value is internally clamped numeric state.

### RE-02 — Yup allowed-format validators

Warnings: `stringExtensions.ts:779:32`, `:825:32`.

Trace: two literal regex constants selected by the `extended` option -> regex
construction -> character-policy validation.

Expected outcome: behavior matches the selected constant exactly; no external
pattern is accepted.

Tests: existing Yup validation tests plus both `extended` branches, empty/
nullable values, and representative punctuation.

Classification: **Contained**; replace `new RegExp` with the existing constants
only if a behavior-preserving refactor is approved.

### RE-03 — Type-approval step URL and heading assertions

Warnings: `tests/e2e/features/@type-approval/steps.ts:66:34`, `:69:51`.

Trace: scenario title/location -> URL and heading regex -> Playwright assertion.

Expected outcome: only known scenario data is matched; unsupported steps fail
before navigation assertions.

Tests: existing feature scenarios; add punctuation and regex-metacharacter
titles to prove whether escaping is required.

Classification: **Verify**, test-only. Unescaped title data can make a test
assertion too broad or too strict, but it cannot affect production runtime.

### RE-04 — Common E2E route and dialog assertions

Warnings: `tests/e2e/steps/common.steps.ts:30:5`, `:221:7`.

Trace: fixed step location or scenario dialog title -> regex URL/text assertion
-> E2E pass/fail.

Expected outcome: route locations and dialog titles are matched literally unless
the feature explicitly intends regex semantics.

Tests: add route/title values containing `.`, `+`, `(`, and `/`.

Classification: **Verify**, test-only.

### RE-05 — Copy-RFQ and quotation identifiers

Warnings: `tests/e2e/steps/copy-rfq.steps.ts:20:7`;
`tests/e2e/steps/quote.steps.ts:83:34`, `:145:17`.

Trace: scenario-provided reference/title -> URL or heading regex -> E2E
assertion.

Expected outcome: reference IDs and titles match the intended literal route or
heading. The quote title currently escapes `/` only.

Tests: add IDs/titles with all regex metacharacters; if identifiers are
contractually alphanumeric, assert that contract at the step boundary.

Classification: **Verify**, test-only.

### RE-06 — Storybook report and multipart fixture parsers

Warnings: `tests/e2e/support/storybookMcpReport.ts:17:3`, `:23:26`;
`tests/e2e/support/type-approval-api.ts:28:10`.

Trace: report heading or multipart field name -> escaped regex -> report section
or captured request value.

Expected outcome: heading and multipart names are treated literally; malformed
input returns no match rather than selecting another field.

Tests: add headings/names with regex metacharacters, CR/LF, and duplicate
fields.

Classification: **Contained** for the explicit escaping; **Verify** the
multipart line grammar with malformed request bodies.

### RE-07 — Coverage, env, ESLint, and Storybook policy regexes

Warnings: `tests/unit/config/coverageRemapPolicy.test.ts:117:3`, `:118:3`;
`tests/unit/config/env.test.ts:66:9`;
`tests/unit/config/eslintPolicy.test.ts:208:9`;
`tests/unit/config/storybookRuntimePolicy.test.ts:24:3`;
`tests/unit/config/viteConfig.test.ts:328:9`;
`tests/unit/e2e/playwrightStepQuality.test.ts:48:19`;
`tests/unit/storybook/storybookDocsConfig.test.ts:255:11`.

Trace: test-owned names or escaped fixture values -> source/config pattern ->
policy assertion.

Expected outcome: policy tests detect drift without treating arbitrary source
text as executable data.

Tests: existing policy suites; add metacharacter fixture names where values are
not statically constrained.

Classification: **Contained** where the values are literals or escaped;
**Verify** for `storyExport` and any future externalized policy input.

## Unsafe-regex atoms

### UR-01 — Generated Storybook JSON number literal

Warning: `scripts/storybook-coverage.mjs:191:7`.

Trace: parser cursor -> anchored JSON-number regex over the remaining manifest
text -> numeric token length and parse progress.

Expected outcome: valid JSON numbers parse; malformed input fails promptly.

Tests: benchmark long invalid numbers, long exponent strings, and a long run of
digits followed by invalid punctuation. Keep the parser's rejection behavior.

Classification: **Verify**. The expression appears bounded by disjoint token
classes, but worst-case timing needs measurement before changing it.

### UR-02 — Supplementary-plane character filtering

Warnings: `ClientApp/src/components/Inputs/RhfTextAreaInput/index.tsx:9:40`;
`ClientApp/src/components/Inputs/TextAreaInput/index.tsx:39:7`.

Trace: user-entered textarea value -> one character-class replacement -> API-
compatible form value.

Expected outcome: supplementary-plane characters are removed without altering
BMP text or whitespace.

Tests: existing textarea tests plus long ASCII, repeated emoji, mixed Unicode,
and maximum-length input.

Classification: **Contained**; the pattern has one linear character class and no
nested backtracking structure.

### UR-03 — Slate empty-block cleanup

Warning: `ClientApp/src/components/SlateEditor/SlateEditor.tsx:123:16`.

Trace: serialized editor HTML -> empty paragraph regex -> character count used
for validation/display.

Expected outcome: empty scaffolding is ignored; non-empty content remains.

Tests: Slate editor tests for empty blocks, many empty blocks, long whitespace,
and near-miss markup. Measure long malformed HTML before changing the regex.

Classification: **Verify** for worst-case runtime; no correctness defect is
confirmed.

### UR-04 — Shared URL validation expression

Warning: `ClientApp/src/validationSchemas/common.ts:99:3`.

Trace: user-supplied URL string -> anchored URL regex -> Yup validation result.

Expected outcome: accepted/rejected URL behavior remains unchanged while the
regex completes within an agreed bound.

Tests: URL boundary suite plus long invalid host/path strings and repeated
near-matches. Prefer a bounded parser/URL API only after a compatibility test
proves equivalent behavior.

Classification: **Verify**; this is production input and deserves timing
measurement, but the lint warning alone does not prove ReDoS.

### UR-05 — Email local-part expression

Warning:
`ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts:491:5`.

Trace: user-supplied email local part -> dot-separated local-part regex -> email
validation result.

Expected outcome: valid local parts pass and malformed separators fail with a
bounded runtime.

Tests: email validation tests plus long repeated local parts, repeated dots, and
trailing-dot near misses.

Classification: **Verify**. The source comment claims linear structure; a
benchmark should confirm that claim before refactoring.

### UR-06 — Environment-policy test expression

Warning: `tests/unit/config/env.test.ts:76:39`.

Trace: fixed source-contract regex -> environment module text -> test assertion.

Expected outcome: the test detects the required export and environment token.

Tests: existing env policy suite; add a source fixture with a long nonmatching
line only if the source is ever externally supplied.

Classification: **Contained**, test-only.

## Timing atom

### TA-01 — Console formatter token comparison

Warning: `tests/helpers/unexpectedConsoleGuard.ts:97:5`.

Trace: console format token -> equality check for `%%` -> formatter output.

Expected outcome: literal percent escapes are converted and no secret-dependent
branch is present.

Tests: formatter cases for every supported token, `%%`, missing arguments, and
extra arguments.

Classification: **Contained**. This is a test formatter comparing public syntax,
not a secret or authentication value; constant-time comparison would not
preserve a meaningful security property here.

## Correctness-gate and extraction plan

No atom reached **Confirmed defect** status. The safe next sequence is:

1. Add the boundary tests listed for **Verify** atoms, starting with CLI path
   containment, server-shaped error keys, PII attribute names, and production
   regex timing.
2. Run the focused tests and record observed trust boundaries, runtime bounds,
   and behavior snapshots.
3. Fix only a failing or demonstrably unsafe atom, one atom at a time, with a
   regression test before the change.
4. Extract helpers only after their source atom has a passing contract test;
   preserve the existing output, error messages, ordering, and fallback
   behavior.
5. Keep test-only and verifier-only warnings separate from production-runtime
   security work. Suppression is appropriate only when the atom's boundary is
   documented and tested; it must not hide an unresolved production finding.

## Current verification

- `npm run lint`: passed with 0 errors and the warnings listed above.
- ESLint policy test: 29 tests passed.
- `npm run type-check`: passed.
- Secret scan: all 62 affected files scanned with no reported secrets.
