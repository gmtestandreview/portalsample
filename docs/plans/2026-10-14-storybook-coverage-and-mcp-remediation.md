<!-- /autoplan restore point: C:/Users/gregm/.gstack/projects/gmtestandreview-portalsample/feat-formik-to-react-hooks-migration-autoplan-restore-20261014-storybook.md -->

# Storybook coverage and MCP remediation plan

Date: 2026-10-14 (Australia/Sydney). Branch:
`feat/formik-to-react-hooks-migration`. Audit baseline: `5bc51af1`; final
planning checkout: `15f82afa87f3fcf33ac50f99d27431329361f08a`; base branch:
`main`. Status: sequential reviews complete; independent plan review approved
97/100; awaiting user plan approval. Implementation has not started.

## Goal and confirmed premise

Make Storybook a trustworthy catalogue of renderable components and application
routes, with accurate documentation and executable interaction/accessibility
evidence. The user explicitly chose **keep indirect coverage where it is
sufficient**. A local story file is therefore not a completion requirement.

Adequate indirect coverage requires a named story that actually renders the
component in the relevant state, observable assertions for its behavior, and a
discoverable documentation owner. An import-graph match alone is only a
candidate. A leaf-component story does not cover a parent route's loading,
submission, navigation, or error behavior.

## Source inputs and corrected findings

- User's seven remediation items and the follow-up coverage premise above.
- Live Storybook MCP: docs-list, docs-show, writing instructions, test-run, and
  stories-find-by-component.
- Recursive live reverse graph: 258 TSX candidate files, 235 with import
  matches, 23 without; maximum distance 12, no clipped results. This is **import
  reachability**, not 91% behavioral coverage or proof of rendered states.
- Full evidence snapshot:
  `C:/Users/gregm/.gstack/projects/gmtestandreview-portalsample/storybook-module-evidence-20261014.json`.
  Recompute against the implementation checkout; counts are a dated baseline.
- `tests/unit/storybook/coverageDrift.test.ts:22-57` checks top-level
  directory-name substrings and a literal Complete marker. It cannot establish
  recursive coverage.
- `scripts/verify-storybook-docs.mjs` checks generated docs links and docgen
  errors for manifest components; it does not compare every source module to
  stories.
- `searchBox.stories.tsx:37-50` already drives Enter and asserts
  `onSearchSubmit('Keysight')`.
- `ProgressFileList.stories.tsx:70-86` already asserts the cancelled filename
  and visible Cancelling state. Preserve these tests; the MCP snippets omitted
  the play functions.
- The Storybook 9 heading is in **upstream MCP writing instructions**, also
  present in installed `storybook/dist/bin/core.js` and
  `storybook/dist/cli/skills/content/index.js`. It was incorrectly attributed to
  `.storybook/component-docs-guide.mdx` in the earlier audit.
- `RouteLeavingGuard/types.ts` contains valid TypeScript. MCP combines types and
  default values into a type-like prose block. Verify the rendered Docs table
  and manifest before proposing a runtime/type edit.
- Current MCP test-run still returns `Failed to start test runner process`.
  Installed addon-vitest wraps startup in a 30-second timeout.
  `vitest.config.ts` already contains a direct Storybook-child configuration
  branch intended to avoid slow workspace discovery. Root cause of the
  **current** failure remains unproved.
- `.storybook/main.ts`, `.storybook/preview.ts`, `vitest.storybook.config.ts`,
  `vitest.storybook.runtime.ts`, `storybookHarness.tsx`, preview setup, existing
  story metadata, root scripts and local patch mechanism were inspected.
- Official references:
  [Storybook 10.2.9 multiple-component documentation](https://github.com/storybookjs/storybook/blob/v10.2.9/docs/writing-stories/stories-for-multiple-components.mdx),
  [play functions](https://storybook.js.org/docs/writing-stories/play-function),
  and
  [Vitest integration](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon).
  Installed version is 10.6.1; use installed contracts when documentation
  versions differ.

## Assumptions, boundaries, and unknowns

Planning artifacts only in this turn. No app implementation, dependency upgrade,
server restart, commit, or publishing is performed by this plan review. At
intake the worktree contained user changes in `WizardRoutedStep.tsx`, new
`useWizardStepController.ts`, and `package-lock.json`. During review the wizard
extraction was committed externally as `15f82afa`; only the lockfile remained
dirty at the final planning check. Audit evidence predates that commit and must
be refreshed against the implementation checkout. Capture the baseline again
when executing. Never stash, overwrite, or incorporate those changes
accidentally. Use an isolated implementation worktree from the intended
integration commit; coordinate the wizard-story lane with the ongoing Formik/RHF
migration. Keep both currently supported form providers. Keep auth guards,
production APIs, runtime config contract, security checks, a11y `test: 'error'`,
act warnings, and current gate names intact. No direct node_modules edits.
Dependency problems require a supported configuration fix or an
upstream/version-managed fix with reproducibility proof. A confirmed upstream
blocker stays visible; it does not become a reported pass. No new deployment,
telemetry service, test framework, public endpoint, or live MSAL flow. Open
engineering unknowns are assigned diagnostic tasks: child startup cause; actual
rendered default-value table; sufficiently exercised indirect stories. Do not
assume their outcomes.

## Requirement traceability

| Requirement                            | Work packages | Completion evidence                                                                       |
| -------------------------------------- | ------------- | ----------------------------------------------------------------------------------------- |
| Version wording                        | T1, T3        | Correct owner identified, current-version project guidance; upstream remediation recorded |
| Interaction assertions and MCP startup | T1, T2, T8    | Cold and warm MCP tests succeed; existing callback assertions retained                    |
| AutoSuggest metadata                   | T3            | Correct container API ownership and meaningful loading story                              |
| AcceptQuote documentation ownership    | T3            | All five step APIs discoverable; legacy story IDs resolve                                 |
| RouteLeavingGuard props formatting     | T3            | UI table separates type and quoted default; defaults unchanged                            |
| Missing Aria and support stories       | T4            | Seven unmatched component modules represented; other four retained with evidence          |
| Broader forms, Inputs, Buttons, modals | T2, T5        | Consumer interactions/assertions and docs verified per symbol                             |
| Nested route modules, including shells | T6, T7        | Route shell and bootstrap behavior represented or justified forwarding equivalence        |
| Covered indirect route families        | T2, T7        | Existing success/auth/summary stories retained, not duplicated                            |
| Durable completion claim               | T2, T8        | Recursive drift negatives fail; generated docs and current MCP tests pass                 |

## Framework fit and existing assets

Use behavior-first acceptance tests, atomic tasks, a source-to-story manifest,
and existing Vitest/Playwright-BDD/MSW infrastructure. No new service
architecture, datastore, DDD model, or ADR is required. Auth and mutation
stories use deterministic local fixtures and existing API contracts.

| Subproblem               | Reuse                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Auth/account/modal state | `ClientApp/src/storybook/storybookHarness.tsx` and fixtures                                                  |
| Route params             | Existing `portal.initialEntries` and `portal.routePath` in preview                                           |
| Form contexts            | Existing Formik/RHF wrappers; never nest an extra form around a wizard that owns its form                    |
| HTTP isolation           | Existing MSW worker, beforeEach handlers, same-origin policy                                                 |
| Documentation            | Global Autodocs, CSF metadata/subcomponents, existing MDX and verifier                                       |
| Navigation guard         | Existing GuardHarness pattern and route-leaving stories                                                      |
| Runner compatibility     | Existing Vitest config branch, single worker and runtime plugin                                              |
| BDD integration          | Existing `tests/e2e/features/storybook/integrations/mcp.feature`, documentation and routes coverage features |
| Testing configuration    | Existing tests under `tests/unit/config/` and `tests/unit/storybook/`                                        |

## Alternatives and selected approach

| Approach                                                                           | Coverage                                                    | Effort estimate                                                            | Risk and tradeoff                                            |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| A: metadata wording and runner fix only                                            | Fixes immediate defects; leaves unrepresented route shells  | Human 1-2 days / agent 2-4 hours                                           | Lowest diff, insufficient for the requested coverage outcome |
| B: evidence manifest plus targeted stories, retaining sufficient indirect examples | All scoped renderable modules have verifiable evidence      | Human 7-12 days / agent 2-4 days of active work; upstream waiting separate | Selected; avoids duplicate stories while closing real gaps   |
| C: colocated stories everywhere                                                    | Easy folder counting but duplicates family/provider stories | Human 1-2 weeks / agent 2-3 days                                           | Rejected by the user's premise choice; ID and fixture churn  |

Mode: SELECTIVE EXPANSION, following autoplan. Accept the recursive evidence
gate within this task's scope. Defer broader UI redesign, full runtime error
remediation, publishing, and dependency migration.

## Files and responsibilities

T2 creates `ClientApp/src/storybook/coverageManifest.json`,
`scripts/storybook-coverage.mjs`, and
`tests/unit/storybook/moduleCoverage.test.ts`; modifies `coverageDrift.test.ts`
and `verify-storybook-docs.mjs`. The manifest owns classifications and evidence,
the script owns recursive discovery/validation, tests own counterexamples, and
the docs verifier integrates build/index checks.

T1 modifies `playwright.storybook.config.ts` for the isolated diagnostic URL
contract and may modify `vitest.config.ts`, `vitest.storybook.config.ts`,
`vitest.storybook.runtime.ts`, or `.storybook/main.ts` **only as supported by a
reproduced startup failure**. Extend `tests/unit/config/vitestTopology.test.ts`,
`storybookVitestContract.test.ts`, `storybookRuntimePolicy.test.ts`,
`tests/e2e/features/storybook/integrations/mcp.feature`, and
`tests/e2e/steps/storybook.steps.ts` for the verified defect. `package.json`,
lockfile, root postinstall, or local patch automation are conditional
external-dependency surfaces; they require an explicit evidence-backed plan
addendum rather than a speculative patch.

T3 modifies
`ClientApp/src/components/Inputs/AutoSuggest/AutoSuggest.stories.tsx`,
`ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx`,
`.storybook/component-docs-guide.mdx`,
`tests/unit/storybook/storybookDocsConfig.test.ts`,
`tests/e2e/features/storybook/autodocs-documentation.feature`, and
`tests/e2e/steps/storybook.steps.ts`. `RouteLeavingGuard/index.tsx` and
`types.ts` are diagnostic inputs, not default edit targets.

T4 creates these exact files:

- `ClientApp/src/components/AriaComponents/AriaButton/AriaButton.stories.tsx`
- `ClientApp/src/components/AriaComponents/Link/Link.stories.tsx`
- `ClientApp/src/components/AriaComponents/SegmentControl/SegmentedControl.stories.tsx`
- `ClientApp/src/components/AriaComponents/Sheet/Sheet.stories.tsx`
- `ClientApp/src/components/reactaria_components/AlertMessage.stories.tsx`
- `ClientApp/src/components/reactaria_components/PageHeader.stories.tsx`
- `ClientApp/src/components/reactaria_components/StatusPill.stories.tsx`

T5's finite consumer edit targets are
`ClientApp/src/components/Buttons/ButtonBreadth.stories.tsx`,
`ClientApp/src/components/forms/Forms.stories.tsx`,
`ClientApp/src/components/forms/WizardForm/WizardForm.stories.tsx`,
`ClientApp/src/components/forms/FormBanner/FormBanner.stories.tsx`,
`ClientApp/src/components/Inputs/Inputs.stories.tsx`,
`ClientApp/src/components/Inputs/AddressLookup/AddressLookup.stories.tsx`,
`ClientApp/src/components/modals/Modals.stories.tsx`,
`ClientApp/src/routes/preConditions/PreConditions.stories.tsx`,
`ClientApp/src/routes/ta/applicationAndInstrument.stories.tsx`,
`ClientApp/src/routes/ta/organisationAndContact.stories.tsx`, and
`ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx`. Add a dedicated
story only when the consumer cannot demonstrate the required contract; document
the exact new file and reason in the manifest before creating it.

T6's proposed route bootstrap/wizard files are below. Create each only after
recording that no existing consumer story can exercise the route module's own
obligations; retaining sufficient existing evidence is preferred:

- `ClientApp/src/routes/acceptQuote/create/CreateAcceptQuote.stories.tsx`
- `ClientApp/src/routes/account/addBranch/AddBranch.stories.tsx`
- `ClientApp/src/routes/account/create/CreateAccount.stories.tsx`
- `ClientApp/src/routes/account/update/UpdateAccount.stories.tsx`
- `ClientApp/src/routes/contact/create/CreateContact.stories.tsx`
- `ClientApp/src/routes/contact/update/UpdateContact.stories.tsx`
- `ClientApp/src/routes/requestForQuote/copy/CopyRequestForQuote.stories.tsx`
- `ClientApp/src/routes/requestForQuote/create/CreateRequestForQuote.stories.tsx`
- `ClientApp/src/routes/ta/create/CreateRequestForTypeApproval.stories.tsx`
- `ClientApp/src/routes/ta/created/RequestForPatternApprovalCreated.stories.tsx`

T7 conditionally creates (using the same sufficiency review as T6)
`ClientApp/src/routes/acceptQuote/AcceptQuoteShell.stories.tsx`,
`ClientApp/src/routes/requestForQuote/RequestForQuoteShell.stories.tsx`,
`ClientApp/src/routes/ta/TypeApprovalShell.stories.tsx`,
`ClientApp/src/routes/quotation/QuotationShell.stories.tsx`, and
`ClientApp/src/routes/measurementReport/MeasurementReportShell.stories.tsx`. The
trivial `ta/manage/index.tsx` delegates directly to AppDetails without hooks,
state or params; retain the existing AppDetails story with an explicit
forwarding-equivalence record and a regression check that invalidates it if the
wrapper gains behavior.

T8 updates `ClientApp/src/storybook/CoverageMatrix.docs.mdx`,
`ClientApp/src/components/ComponentInventory.docs.mdx`,
`ClientApp/src/routes/RouteInventory.docs.mdx`,
`ClientApp/src/storybook/MigrationReadiness.docs.mdx`,
`.storybook/introduction.mdx`,
`tests/e2e/features/storybook/routes/routes-coverage.feature`, and the common
Storybook steps. Preserve source names `Seperator`, `RangeCalander`, `ToolTip`,
and `numberfield`; renaming folders is not required.

## T1: Restore reliable MCP story execution

Priority P1. Dependencies: none. Human 0.5-2 days / agent 2-6 hours; upstream
defect may increase elapsed time.

1. Add/approve an acceptance scenario in the existing MCP BDD feature and
   URL-contract unit tests before implementation. Initialize, list tools and
   discover the advertised test-tool schema; request SearchBox and
   ProgressFileList with a11y enabled. Exact requested story-ID set must equal
   the returned executed set: reject missing/duplicate/unexpected IDs, stale run
   identity, zero tests, absent a11y execution or a generic tool error.
2. Establish isolation before running the new execution baseline. Verify free
   port 6007 and the configured runner port 47005, and record owned process IDs;
   do not stop the user's 6006 server or any unrelated runner. Start an owned
   diagnostic server with
   `node --max-old-space-size=8192 ./node_modules/storybook/dist/bin/dispatcher.js dev -p 6007 --no-open`.
   If the runner port is occupied, defer execution until its owner releases it
   rather than changing global ownership.
3. `playwright.storybook.config.ts` hard-codes 6006: add `STORYBOOK_TEST_URL`
   defaulting to that URL, derive baseURL/webServer URL and MCP endpoint
   consistently, and test the default/override contract. Against the owned
   server run `npm run test:e2e:storybook -- --grep "MCP" --workers=1` with
   `$env:STORYBOOK_TEST_URL='http://localhost:6007'`, restoring the previous
   environment value afterward. Expected RED is the observed startup error, not
   a URL/config parse error. Capture nested FATAL_ERROR, stderr, executable,
   cwd, loader, readiness and versions without tokens; distinguish startup
   failures from assertion/a11y failures.
4. Compare fresh and resident behavior. Verify `VITEST_STORYBOOK` selects the
   existing direct config; verify the configLoader path and project name
   expected by addon-vitest. Compare 30-second startup budget with measured init
   readiness. Check Chromium installation and fixed-port conflicts. Restart only
   owned diagnostic children after each experiment.
5. If the fresh instance succeeds with existing configuration, the correction is
   lifecycle/runbook and test coverage; do not edit config. If it fails, fix the
   demonstrated repository-owned integration defect and first add its regression
   to the existing config-contract test. Do not increase timeouts or remove a11y
   as a substitute for diagnosis.
6. If the failing code is upstream-only, record package/version, minimal
   reproduction, and a supported upstream fix path. Preserve a failing
   acceptance gate until the integrated solution is verified; do not edit
   installed bundles.
7. Pass criteria: cold single-story, warm focused pair, full catalogue, then
   repeat single-story MCP run all succeed on the isolated instance; requested
   and returned executed ID sets match for every run, using the current
   generated executable catalogue and explicit documented non-executable
   exclusions for the full set; no disconnected orchestrator, leftover owned
   worker, unhandled rejection, or zero-test false pass. The shell suite remains
   corroborating evidence only.

## T2: Replace family-name completion with recursive evidence

Priority P1. Depends on T1 for live assertions; static negative tests can be
written first. Human 1 day / agent 2-4 hours.

Manifest records use repository-relative source path, exported symbol,
classification (`direct`, `consumer`, `forwarding`, `nonvisual`), story source
plus named export, generated docs owner, and concise behavior assertion
evidence. Forwarding/nonvisual entries require a specific reason and the source
condition that would make the decision stale. Each claim identifies state,
observable outcome, named story/export, assertion location and reviewer. Keep
separate verdicts for required behavior verified, current behavior
characterized, and known defect. Store execution receipts separately with
commit, relevant working-tree/source digest, package versions, story ID, result
and timestamp; source/story/provider/fixture changes invalidate the affected
review and receipt. The integration owner must reassess invalidated claims
before closure. Paths and exports are checked using the TypeScript compiler API;
IDs come from generated index or MCP, never naming guesses.

Implement `scripts/storybook-coverage.mjs` as importable validation functions
with a CLI entry. Traverse only handwritten components/routes to inventory
candidates and exports, normalizing POSIX/Windows paths. Reuse Storybook's
component graph/manifests for dependency relationships; do not build a general
alias/barrel/cycle resolution engine. Inventory TSX candidates recursively, then
classify **exported renderable symbols**; contexts, types, utilities and
containers are accounted for explicitly. Do not equate JSX extension or an
import with rendered coverage. Do not execute application modules during static
analysis.

Write negative fixtures in `moduleCoverage.test.ts` first: new component in an
existing folder; new nested route; two renderable exports in one file; missing
story export; graph match without reviewed behavior evidence; invalid/removed
docs owner; existing Storybook alias/index/barrel/cycle matches; path separator
mismatch; stale exclusion; nonvisual module; deleted source; forwarding wrapper
gains logic; changed source/provider digest invalidates evidence. Run
`npm run test:unit -- tests/unit/storybook/moduleCoverage.test.ts`; expected RED
is the specific missing validator/coverage behavior. Implement the validator,
then expect all counterexamples and positive examples to pass.

Seed the manifest with all 258 historical TSX candidates, then recompute the
full current .ts/.tsx export inventory; do not limit the denominator to that
historical sample or the 23 unmatched subset. The detached evidence snapshot is
seed evidence, not the gate's denominator. Consumer entries require reviewed
observable assertions, including conditional rendering states. Keep
invalid/incomplete entries as failures while later tasks supply evidence.
Replace `coverageDrift.test.ts` literal Complete checks with recursive contract
validation. Keep any useful family documentation checks separately. Integrate
generated index/docs-owner checks into `scripts/verify-storybook-docs.mjs`;
preserve current docgen exception validation and stale-exception checks.
Completion: no unclassified exported renderables, no nonexistent story/docs
references, no unexplained exemptions. Report direct, consumer, forwarding,
excluded and uncovered separately; report routes/BDD and test coverage
separately.

## T3: Repair documentation ownership and verify formatting

Priority P2. Depends on T1 and T2. Human 1 day / agent 2-4 hours.

- AutoSuggest: preserve `components-inputs-autosuggest--loading`. Add explicit
  container-level description and `subcomponents: { AutoSuggestContainer }`
  metadata using the official multi-component pattern. Explain that its
  controlled loading example demonstrates the inner container, not the
  asynchronous getOptions contract. Bind editable args to the rendered component
  where compatible; avoid duplicate hardcoded args. If MCP still exposes only
  the parent API, create `AutoSuggestContainer.stories.tsx` for the container
  and retain the old Loading export as a documented compatibility example.
- AcceptQuote: keep the existing family title/export names/IDs. Add
  `subcomponents` for PaymentDetails, DeliveryAndReturn, QuotationSummary and
  SummaryAndAccept, plus family/individual-story descriptions identifying each
  API owner. Preserve existing fixture handlers and settled-state waits. Add
  component-specific docs only if manifest/MCP cannot expose these APIs through
  supported subcomponents.
- Guard: compare source types, generated manifest data, browser-rendered
  Controls/ArgTypes, and MCP text. BDD must assert type and default-value
  **cells**, rather than attempting to compile MCP prose as TypeScript. Preserve
  the default text and runtime behavior. If only MCP serializes invalid-looking
  pseudo-TypeScript, document it as an upstream presentation defect with a
  minimal sample and source links; do not rewrite the component to accommodate
  the serializer.
- Version: describe project guidance as Storybook 10.6.1/current installed line,
  remove stale 10.5.10 investigation claims where they no longer represent
  current inspection, and label historical findings as historical. The upstream
  writing-tool Storybook 9 heading gets an upstream remediation record, not a
  false edit in project MDX. Dependency upgrade/patch is chosen only after T1's
  version-supported evidence.
- Regression first: extend existing docs BDD for container API, all AcceptQuote
  step owners, valid default cells, unchanged legacy IDs and resolving docs
  links. Run the failing scenarios, implement metadata/docs, then rerun.

## T4: Add stories for genuinely unrepresented shared components

Priority P2. Depends on T1-T3. Human 1-2 days / agent 3-6 hours.

Create the seven exact story files listed above. Use existing evaluation title
hierarchy and global Autodocs. Before using design-system props, query MCP docs.
If MCP lacks the component contract, obtain an approved API documentation
contract and publish/requery it before story authoring; do not infer
undocumented props from source types or a similarly named component.

Acceptance cases:

- AriaButton: its own implementation, keyboard activation, pending accessible
  progress label, disabled nonactivation, supported visual variants. Do not
  treat sibling Button stories as coverage of this separate implementation.
- Link: keyboard navigation, destination, disabled state and external-link
  policy only where supported.
- SegmentedControl and SegmentedControlItem: selected/unselected state, keyboard
  selection, callback payload, disabled item, long labels.
- Sheet: trigger/open/close, dialog name, focus containment and focus return.
  Inspect the current children-only composition before choosing the story
  harness; a passing example must not depend on overlay props that Sheet does
  not forward. If tests expose a product defect, preserve the reproduction and
  record a separate narrowly scoped fix proposal.
- AlertMessage: supported tones, live region semantics, title/body visibility.
- PageHeader: title alone, descriptive/eyebrow content, actions and long-content
  wrapping.
- StatusPill: supported tones and readable text, including long content.

Retain ColorThumb through ColorArea/ColorSlider/ColorWheel, Content through
Dialog/Popover, ProgressCircle through pending Button, and Separator through
Toolbar **only after** T5 verifies actual visible/interactive evidence and
documentation ownership. Add subcomponent documentation to exact consumer story
files when required; no filler standalone examples purely to satisfy directory
counts.

For each file: write meaningful play assertions, run the focused MCP test, then
query docs and update manifest. A failing story is evidence to resolve, not
permission to suppress warnings or a11y.

## T5: Validate and strengthen indirect coverage

Priority P2. Depends on T2-T4. Human 1-2 days / agent 3-6 hours. Shared edits
with T3 are sequential.

Use the evidence snapshot to find the exact consumer story source/export for
every source without a colocated story. Evaluate at symbol/state level. Fix
missing assertions in the finite consumer edit set above; add a local story only
when the existing consumer cannot demonstrate the relevant contract.

| Family                                          | Required observable contract                                                                               |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| ButtonGroup/EditButton/LinkButton               | Relevant action reachable by keyboard; callback/navigation outcome, not just presence                      |
| Details/FormikForm/HidableField/RhfHidableField | Correct label/error/summary rendering; hidden-to-visible and value preservation as supported               |
| SubmitFormButton/SaveAndExitButton              | Valid/invalid/in-flight behavior and save outcome through owning wizard/banner                             |
| UnsavedFormPrompt                               | Dirty navigation blocks, cancel retains input, confirm proceeds; browser refresh limitation stays explicit |
| CommonForms ContactDetails and RHF counterpart  | Context populated, editable fields/validation and summary behavior                                         |
| Checkbox/Radio/Select/Text/Number/ReadOnly      | Value/callback, disabled/readonly/validation behavior that each component owns                             |
| Organisation/Certificate/Address/AutoSuggest    | Deterministic options, selection, no-results/loading and manual-address behavior where supported           |
| BranchSelector/Confirmation/RFQDelete/Terms     | Actual modal opens, relevant action/cancel, focus/keyboard and state updates                               |
| ColorThumb/Content/ProgressCircle/Separator     | Actual rendered helper is reached, accessible semantics/values correct, appropriate docs owner             |

Preserve already verified SearchBox and ProgressFileList callback assertions.
Where a shared args spy is used, assert callback payload after awaited
interaction and confirm state reset across successive runs. No global
act-warning suppression, sleep-based settlement, or unrelated UI refactor.
Provider nesting: whole route shells own their forms; field stories use the
harness's form providers. Use portal-aware `screen.findByRole` for
dialogs/popovers and await user-visible async state.

## T6: Cover missing nested route entry points

Priority P2. Depends on T1-T3 and current wizard integration state. Human 1-2
days / agent 4-8 hours.

Use the ten proposed files above only where sufficiency review requires them,
with real route modules, typed mock account/MSAL context, local MSW and exact
route patterns. Each first failing acceptance test must demonstrate the route
wrapper's own outcome; existing step stories remain reusable fixtures.

| Route entry            | Required stories and assertions                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| acceptQuote/create     | Pending creation; returned reference navigates to report-recipient; quote lookup or create failure is characterized |
| account/addBranch      | Real one-step wizard; branch confirmation cancel/confirm and completion destination                                 |
| account/create         | Real account wizard; invalid submission; create confirmation and success destination                                |
| account/update         | Loaded values; save/cancel flow; malformed/nonpositive ID navigates to not-found                                    |
| contact/create         | Real create wrapper, validation and confirmation; current labels characterized without drive-by renaming            |
| contact/update         | Existing contact data; update confirmation/cancel; completion behavior                                              |
| requestForQuote/copy   | Existing source reference copied; returned destination; pending/rejection characterization                          |
| requestForQuote/create | Pending; create request captured; returned organisation/contact destination                                         |
| ta/create              | Pending; returned organisation-details destination; duplicate-request handling characterized                        |
| ta/created             | Submitted heading/reference; dashboard button and link navigate; session tab selection observed                     |

Redirect/bootstrap story harness: extend `portal` with a typed
destination-observer outlet only if required by real navigation, and modify
`.storybook/preview.ts` plus harness and tests together. Reuse the one global
memory router. It must show the actual target path and route content without
live requests or nested routers. Do not intercept `useNavigate` globally to
fabricate success. For controlled pending cases use a deferred handler with
explicit lifecycle cleanup, not permanent unresolved work. Current create/copy
catch paths may log and leave a spinner. Characterize that honestly; a new
user-visible error design requires its own agreed requirement and runtime
regression test. Do not label a spinner as a successful error state or silently
fix domain behavior under story authoring.

## T7: Cover route shells and retain adequate existing route stories

Priority P2. Depends on T6's harness and T2. Human 1 day / agent 3-5 hours.

Create the proposed shell files only where the recorded sufficiency review
requires them. Render the actual parent route exports with params and full
provider context. Reuse fixtures from child stories where exported safely, or
shared typed fixtures from `storybookFixtures.ts`; do not import a story's side
effects as a runtime fixture. Assert the shell's selected step, loaded
reference/title, navigation, notification/error behavior and surrounding chrome
that child-only examples cannot prove. Mutating operations remain local MSW
requests. For quotation/report shells: loaded and failed lookup paths;
confirmation/file action only if invoked by the scenario. For wizard shells:
route step and unsaved navigation; initial/invalid path and save error where the
implementation owns them. For `ta/manage/index.tsx`, record structural
forwarding to AppDetails; add a test ensuring it remains a pure forwarding
wrapper. If it gains hooks, conditions or local interaction, the forwarding
exception fails and requires reassessment of consumer evidence; create a shell
story only if no existing consumer demonstrates the new obligations.

Retain `account/created`, `requestForQuote/created`, both summary subfolders and
sign-out/helper through existing live IDs. Review auth loading vs completion and
summary loaded vs loading; metadata must identify these as consumer examples. Do
not relocate existing files just for colocation.

## T8: Publish accurate coverage evidence and run closure gates

Priority P1 acceptance gate. Depends on all packages. Human 0.5 day / agent 2-4
hours.

Replace fixed historical 84-module/132-file/Complete claims with current
definitions and generated validation evidence. The docs must distinguish source
modules/symbols, story entries, docs entries, story reachability, reviewed state
evidence and app BDD paths. Update CoverageMatrix route exclusions consistently:
preConditions has a story; sign-out/helper have Auth examples; common is a
utility family with ErrorStates stories. Never claim a folder is excluded solely
because an old matrix says so. Run these gates in order, releasing the browser
worker before the next browser suite:

1. `npm run type-check`
2. `npm run lint` and `npm run lint:mdx`
3. `npm run test:unit -- tests/unit/storybook tests/unit/config/vitestTopology.test.ts tests/unit/config/storybookVitestContract.test.ts tests/unit/config/storybookRuntimePolicy.test.ts tests/unit/e2e/routeCoverage.test.ts`
4. MCP test-run focused after each story change; final full-catalogue call with
   a11y true; cold/warm repeat from T1.
5. `npm run storybook:verify:docs` (build once; verifier extends module/docs
   evidence).
6. `npm run test:e2e:storybook`
7. `npm run test:e2e:app` for the touched route flows if harness or production
   compatibility changes affected their behavior. Shell story tests may
   corroborate MCP; they never replace the MCP acceptance result. Discover new
   IDs through MCP, call stories-changed, and publish a Storybook review
   including every created story. Record current commit/state, version set,
   runner results, denominator/exclusions and exceptions. New totals must be
   measured, never fixed at 324 or 142.

## Safety, rollback, and verification

All story network traffic is mocked. Browser navigation stays within the local
router, except a deliberate test of an external-link affordance without opening
a production service. Roll out in reviewable commits: T1 runner; T2 evidence
gate; T3 docs; T4 components; T5 consumer assertions; T6/T7 route evidence; T8
docs/closure. Commit only owned files after checks; no commit or push is
performed during planning. Rollback is a scoped revert of the corresponding
implementation commit(s), retaining prior stable story IDs. Restore the previous
supported config if runner changes regress; do not reset the worktree or restore
user files. No build while a suite is writing to the same static output. One
browser suite at a time prevents 47005 conflicts and false startup diagnoses. No
completion if MCP startup is still broken, a11y is disabled, a story is failing,
or an exported renderable is unexplained.

## Execution order and parallel lanes

`(T2 static contract || T1 diagnosis) -> T3 -> (T4 || T6) -> T5 -> T7 -> T8`.
Independent docs/story work may proceed provisionally while execution is
blocked; verified completion still requires T1 and the final MCP gates.

Component and nested-route story authoring may use isolated worktrees after the
harness/manifest contract lands. One integration owner merges manifest/docs and
performs browser validation serially. T3/T5 share AcceptQuote stories; T6/T7
share routing harness; those edits remain sequential. Reconciled total: human
7-12 working days / agent 2-4 working days of active work, with upstream waiting
excluded and separately reported. Browser integration is serial; rebaseline
source/provider digests and rerun affected evidence after wizard-migration
merges. These are planning ranges, not guarantees.

## NOT in scope and deferred work

- Colocated stories everywhere: user explicitly retained adequate indirect
  coverage.
- Application UX redesign, new auth behavior, new APIs or broader Formik/RHF
  migration: these are separate product changes.
- Package upgrades or hand-editing upstream generated code without confirmed
  cause: avoid unrelated dependency churn.
- Live deployment, Chromatic upload, issue filing or external publication: not
  required to make the local plan executable.
- Repository-wide 100% code/branch coverage: distinct from this Storybook
  evidence target.
- Existing create-route indefinite-spinner UX after rejected API calls: record
  reproduction and impact; separate runtime decision, not a falsely passing
  error story.

## Decision Audit Trail

| #   | Phase    | Decision                                                           | Classification | Principle      | Rationale                                                             | Rejected                                   |
| --- | -------- | ------------------------------------------------------------------ | -------------- | -------------- | --------------------------------------------------------------------- | ------------------------------------------ |
| D1  | Premise  | Retain adequate indirect evidence                                  | User decision  | User direction | User answered explicitly                                              | Universal colocation                       |
| D2  | Intake   | Correct version-heading attribution                                | Mechanical     | Explicit       | Heading is upstream tool text                                         | Editing unrelated project MDX              |
| D3  | Intake   | Preserve verified callback assertions                              | Mechanical     | DRY            | Assertions already exist                                              | Duplicate tests                            |
| D4  | Intake   | Replace substring completion proxy                                 | Mechanical     | Completeness   | Recursive sources were not checked                                    | Passing family names as 100%               |
| D5  | Intake   | Treat graph matches as candidates                                  | Mechanical     | Explicit       | Imports do not prove rendered states                                  | Graph-only behavioral claims               |
| D6  | Intake   | Diagnose runner before patch choice                                | Mechanical     | Pragmatic      | Error is generic; existing compatibility fix exists                   | Blind timeout increase                     |
| D7  | Strategy | Use targeted-story approach B                                      | Mechanical     | DRY            | Meets user premise and closes gaps                                    | Full colocation or docs-only fix           |
| D8  | CEO      | Require state/outcome/assertion and current receipts               | Mechanical     | Completeness   | Source classification is not behavioral proof                         | New proxy percentage                       |
| D9  | CEO      | Conditional route story files                                      | Mechanical     | DRY            | Honor sufficient indirect coverage                                    | Predetermined duplicate files              |
| D10 | CEO      | Separate known defects and upstream presentation from verification | Mechanical     | Explicit       | Characterization is not acceptable recovery                           | Passing indefinite spinner as correct UX   |
| D11 | CEO      | Invalidate affected evidence on source/provider changes            | Mechanical     | Completeness   | Surviving references can become stale                                 | Permanent review exemption                 |
| D12 | Design   | Subcomponents first; dedicated docs only if discovery fails        | Taste          | DRY            | Preserve IDs and clear ownership                                      | Immediate docs split                       |
| D13 | Design   | State applicability and route-level accessibility evidence         | Mechanical     | Completeness   | Automated a11y alone misses interaction contracts                     | Happy-path-only stories                    |
| D14 | Design   | Baseline/after story and docs ID comparison                        | Mechanical     | Explicit       | Stable IDs need proof                                                 | Verbal preservation claim                  |
| D15 | Design   | Record guard/provider bypass and destination data                  | Mechanical     | Explicit       | Mocking must not claim bypassed behavior                              | Path-only success                          |
| D16 | Eng      | JSON manifest and bounded export classification                    | Mechanical     | Pragmatic      | Avoid executing TS/app modules or a second graph engine               | TypeScript loader/eval                     |
| D17 | Eng      | Isolated runner first; exact result sets                           | Mechanical     | Completeness   | Missing stories/port contention must not pass                         | Nonempty-result proxy                      |
| D18 | Eng      | Fail-closed network with negative fixture                          | Mechanical     | Explicit       | Mocking promises need enforcement                                     | Live fallback                              |
| D19 | Eng      | Whole-scope digest invalidation initially                          | Taste          | Pragmatic      | Small scope favors correctness over selective reruns                  | New transitive invalidation engine         |
| D20 | Eng      | Exact route observer and serialized validation                     | Mechanical     | Completeness   | Path-only mocks and parallel runners mislead                          | Catch-all fabricated success               |
| D21 | DX       | Improve existing guide and commands, no new onboarding framework   | Mechanical     | DRY            | Existing assets are adequate                                          | Parallel tutorial/tooling stack            |
| D22 | DX       | Warm five-minute target; cold timing separately measured           | Mechanical     | Explicit       | Runner currently blocks first evidence                                | Claiming target as achieved                |
| D23 | DX       | Keep diagnosis and evidence local                                  | Mechanical     | Pragmatic      | No new external service required                                      | Telemetry/community expansion              |
| D24 | DX       | Canonical digest excludes receipts/digest fields                   | Mechanical     | Explicit       | Prevent self-invalidating evidence                                    | Self-referential input hash                |
| D25 | DX       | Separate routine checks from integration closure                   | Mechanical     | Pragmatic      | Preserve useful conservative proof without repeated full human audits | Catalogue-wide manual review on every edit |
| D26 | DX       | Add focused request, consumer example and recovery runbook         | Mechanical     | Completeness   | Make next action executable                                           | Abstract journey only                      |

## CEO review: strategy and scope

### Premise challenge and outcome

The user's outcome is a reliable place to inspect real route/component behavior
and API documentation. Counting colocated files would measure authoring layout
rather than that outcome; the confirmed indirect-coverage premise is adopted.
The earlier 100% assertion is withdrawn because its tests only checked family
names, and the recursive graph is explicitly labeled reachability.

Doing nothing leaves creation/copy flows and route shells unreviewable, while
the MCP runner failure prevents the workflow the user asked for. Retaining
adequate consumer examples prevents a duplicate catalogue that would drift
during the Formik/RHF migration. Version wording and pseudo-TypeScript issues
must be fixed at their real owner rather than used as reasons to modify working
application code.

### Existing-code leverage and dream-state delta

The reuse map above covers all subproblems: providers, MSW, typed story
metadata, static docs verifier, BDD tools integration and Vitest compatibility.
No replacement framework or second router is proposed. The new manifest records
reviewed evidence that existing family inventories do not express.

```text
CURRENT                         THIS PLAN                         12-MONTH IDEAL
family-name completion   ->     recursive evidence + runner  ->   source changes automatically
import-only matches            targeted missing examples         invalidate affected behavior
generic startup error          reproducible diagnostic path      evidence and docs
```

The plan reaches honest, inspectable current coverage. The later ideal would add
automatic state-change invalidation; it is deferred because proving arbitrary
runtime behavior from imports is not possible. New source files and stale
references are guarded now; changes within an existing component still require
review of its evidence.

### Temporal interrogation and complexity

Hour 1 (agent roughly 20-60 minutes): capture versions/state, reproduce runner
readiness and settle source ownership. Hours 2-3 (agent roughly 1-2 hours):
implement a small inventory/evidence validator and metadata changes without
rebuilding Storybook's own graph. Hours 4-5 (agent roughly 1-2 hours): add route
bootstrap scenarios and validate provider/router composition. Hour 6+ (agent
several further hours for this scope): serial browser execution, docs checks and
route-state review reveal async cleanup and stale fixture issues.

More than eight files is justified by the finite inventory of unrelated missing
UI examples, not by infrastructure complexity. Cap new infrastructure at one
manifest and one validation module; use Storybook's own graph/manifests rather
than implementing a general dependency analysis framework. The selected
alternative B remains the smallest complete response to the user's scope.

### 1. Architecture

The application tree remains unchanged by story authoring. Story modules depend
on existing providers, fixtures and route modules; the coverage validator
depends on source inventory and generated Storybook metadata. A separate
diagnostic server gives startup investigations a known lifecycle without taking
over the user's server.

### 2. Error and rescue

Runner startup, invalid references, missing docs, fixture failures and unsettled
async work are named in the registry below. Each results in a failing check and
a diagnostic artifact rather than a swallowed error. Upstream-only defects are a
visible blocker with a bounded reproduction and supported repair path.

### 3. Security and trust boundaries

New bootstrap stories execute code that normally creates or copies an
application. Deterministic MSAL and MSW fixtures must own every request, with no
production host or real credential. Existing auth guards and telemetry opt-outs
stay in force; route testing does not authorize changing security boundaries.

### 4. Data flow and interaction edges

The evidence flow has success, absent-source, empty-index and invalid-reference
paths. Route bootstrap cases include delayed response, rejected token/API call
and navigation destination; form cases include invalid submit, cancellation and
retained input. Import matches cannot stand in for those behavioral assertions.

### 5. Code quality

Two defects were attribution failures rather than missing code: the version
heading is upstream text, and callback assertions already exist. Preserving
these working implementations reduces unnecessary edits. The main quality risk
is turning the manifest validator into a general AST dependency engine; its
remit is explicit references and inventory, with Storybook providing the
dependency graph.

### 6. Test coverage

Required tests span negative coverage fixtures, live MCP startup/execution,
component plays, docs BDD and route-shell scenarios. No new test framework is
required. A static gate must fail on newly added source within an existing
family, not just on a new directory name.

### 7. Performance

The main slow paths are child initialization, broad browser execution and the
static documentation build. Existing single-worker setup avoids shared Chromium
overload; run these phases serially. Do not start full browser suites in
parallel and diagnose the resulting fixed-port conflict as an application
failure.

### 8. Observability

The generic MCP error hides the nested child cause. Capture startup phase,
elapsed time, version set and nested FATAL_ERROR without collecting tokens.
Coverage output names source, story export and missing evidence so a contributor
can act without rerunning a broad audit.

### 9. Rollout and rollback

Land runner and evidence foundations before dependent stories; use separate
reviewable commits. Existing story titles and exports remain stable for
BDD/bookmarks. Revert only owned implementation commits if integration fails;
retain the prior configuration and existing user changes.

### 10. Long-term trajectory

Explicit evidence ownership is maintainable through the active form migration
because provider and consumer changes have named responsibilities. Reversibility
is 5/5 for story/docs changes, lower for any package upgrade, which is why an
upgrade is not assumed. The manifest is useful only if stale exclusions and docs
links fail loudly.

### 11. Design and UX

Storybook contributors need component name, API owner and meaningful scenario
first. This is a documentation/interaction plan, not a redesign of the portal.
Preserve the NMI theme and demonstrate empty/loading/error/partial states that
the real code supports, with visual defects reported separately.

### Error & Rescue Registry

| Codepath                      | Failure class or signal                          | Rescue / response                                                | What the contributor sees                     | Planned test                   |
| ----------------------------- | ------------------------------------------------ | ---------------------------------------------------------------- | --------------------------------------------- | ------------------------------ |
| MCP child startup             | timeout Error / nested FATAL_ERROR / child exit  | Fail run, preserve cause, clean owned child                      | Startup phase and actionable next diagnostic  | MCP execution BDD              |
| Inventory discovery           | ENOENT / invalid path                            | Fail with source and root                                        | Missing source rather than zero denominator   | moduleCoverage negatives       |
| Story/doc reference           | absent export or index ID                        | Fail reference validation                                        | Exact source/story/docs owner                 | moduleCoverage + docs verifier |
| Manifest parse                | SyntaxError / wrong record shape                 | Fail validation                                                  | Record location and required contract         | moduleCoverage schema cases    |
| Route fixture                 | rejected token / HTTP failure                    | Assert current route behavior, prevent live fallback             | Characterized pending/error/destination state | route plays                    |
| Async unmount                 | act warning / leaked handler / unsettled promise | Fix settlement or teardown                                       | Failed interaction or warning                 | repeated focused MCP run       |
| Docs default rendering        | wrong/missing cell                               | Fail docs assertion                                              | Type and default mismatch evidence            | docs BDD                       |
| External package presentation | upstream serializer/instructions defect          | Record version and reproduction; use supported upstream solution | Visible unresolved upstream issue             | MCP/docs contract              |

### Failure Modes Registry

| Flow              | Realistic failure                                 | Visible failure/test                                                  | Critical gap handling                               |
| ----------------- | ------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| Coverage          | Imported but never rendered helper is counted     | State-specific play required; import graph remains candidate evidence | Do not call graph-only mapping complete             |
| Coverage          | New component added in a covered folder           | Recursive negative fixture fails                                      | T2 replaces family-name proxy                       |
| Documentation     | Step APIs hidden under ReportRecipient            | Docs ownership BDD                                                    | T3 subcomponents and supported fallback             |
| Runner            | Warm pass masks cold initialization failure       | Cold/warm/repeat execution scenarios                                  | T1 remains P1                                       |
| Route create/copy | API rejection leaves spinner forever              | Characterization records existing limitation                          | Separate runtime UX proposal, no fake error success |
| Route navigation  | Catch-all loses params/destination                | Exact route pattern and destination observer                          | T6 tests global router integration                  |
| Existing work     | Story fixtures diverge from new wizard controller | Rebaseline after migration commit                                     | Coordinate worktree/merge before closure            |

### Scope proposals and completion summary

Five low-cost improvements were considered: explicit numerator definitions,
stale-exclusion diagnostics, stable-ID checks, cold/warm runner evidence, and
named per-step docs ownership. All are within the requested remediation and are
accepted. No new product feature was added.

Mode SELECTIVE_EXPANSION; 11 sections evaluated; 8 error paths mapped; 7 failure
modes recorded; architecture, tests, state, error and rollout diagrams assigned.
The three confirmed foundations are corrected attributions, meaningful recursive
evidence, and deterministic test isolation. The only outstanding strategy
judgment was indirect coverage, already resolved by the user.

### Independent strategy challenge

[subagent-only] Independent reviewer Franklin raised six findings:
claim-to-execution proof, characterization versus acceptable behavior,
conditional story creation, upstream acceptance boundaries, stale evidence, and
serial estimates. All six are incorporated above. CLI outside voice was
attempted twice but Codex 0.132.0 rejected the current model with HTTP 400
requiring a newer client; no upgrade was performed. Dual-voice consensus is
unavailable, not a pass or disagreement. Primary plus independent subagent
review is the recorded fallback for subsequent phases.

CEO review complete; passing to Design. No unresolved strategy challenge to the
user's direction.

## Design review: catalogue usability, not portal redesign

Design scope is the Storybook catalogue, API ownership and meaningful
interaction examples. There is no existing root DESIGN.md and no new design
system is warranted. The gstack designer executable is unavailable in this
installation; the wireframe below specifies information hierarchy without
pretending a mockup was generated or visually approved.

### 1. Information architecture — 6/10 baseline, 9/10 planned

The current family grouping hides the API owner of AutoSuggest Loading and
several AcceptQuote steps. Preserve familiar titles and IDs, add the rendered
component's name beside each scenario description, and expose component API
links from the family Docs entry. A source-to-docs row must lead to the actual
relevant API, not only to a generic family landing page; dedicated docs are the
fallback when subcomponents are not surfaced by MCP.

### 2. Interaction state coverage — 5/10 baseline, 9/10 planned

Loading examples should distinguish an intentionally held fixture from settled
real behavior. Empty, error, disabled, pending and partial states belong only
where the component owns that contract, with an observable assertion rather than
decorative variants. Known spinner-on-rejection behavior must be labeled a
characterized defect, not satisfactory error recovery; closure reports separate
completeness of representation from quality of the represented behavior.

### 3. User journey and emotional arc — 6/10 baseline, 9/10 planned

A contributor begins uncertain whether a component exists, locates its source
row, opens the right Docs entry, then runs a meaningful scenario. Finding
another component's prop table drains trust even when the rendered example looks
correct. The planned journey provides a single explanation of API owner,
scenario intent and evidence status, followed by a direct story link and
truthful failure diagnostics.

```text
Source module / exported symbol
  -> Docs: API owner + component description + supported props
  -> Scenario: actual state + owning component + known limitations
  -> Interaction: user action -> visible result / callback / destination
  -> Evidence: verified | characterized | known defect | not run
```

### 4. AI-slop risk — 8/10 baseline, 9/10 planned

No new hero, decorative card catalogue, generic filler variants or empty success
narratives are needed. Use real portal fixture shapes and concise descriptions
naming the behavior being proved. Reject synthetic “error” examples that render
a made-up alert unrelated to the route, and avoid a proliferation of standalone
helper stories when a real consumer is clearer.

### 5. Design system alignment — 8/10 baseline, 9/10 planned

Keep the existing NMI SCSS/Bootstrap theme and React Aria primitives; do not
introduce new styles to make stories appear polished. Component prop usage must
come from MCP documentation/examples before authoring. If an API is absent from
MCP, obtain an approved documentation contract and publish/requery it before
using undocumented props; that component lane remains pending rather than
guessing from a sibling or source type.

### 6. Responsive and accessibility — 6/10 baseline, 9/10 planned

For new primitives and representative wizard/dialog stories, inspect at 375px
and 1280px without changing the existing viewport presets. Assert keyboard
activation, meaningful accessible names, focus containment and return, visible
selected/disabled states, and status/progress semantics where owned. Run
automated a11y as an error gate and manually inspect wrapping, focus visibility
and narrow-screen action reachability; automation alone is not a full
accessibility conformance claim.

### 7. Unresolved design decisions — 7/10 baseline, 9/10 planned

The primary choice is shared subcomponent documentation versus dedicated
component docs. Recommend subcomponents first to preserve existing navigation,
with a measurable fallback: every API owner must be discoverable in both
rendered Docs and MCP. Long labels and fixture failures expose existing UI
limitations; record them without broadening this plan into a portal redesign.

### Design litmus scorecard

| Litmus                | Planned acceptance                                              | Outcome now              |
| --------------------- | --------------------------------------------------------------- | ------------------------ |
| Three-second identity | Docs and scenario name the actual API owner                     | Target, not yet measured |
| Navigation trunk test | Source -> docs -> named story links resolve                     | Target, T2/T3/T8         |
| State honesty         | Held loading, known defect and verified outcome distinguishable | Required                 |
| Keyboard first        | Activation and dialog focus behavior asserted                   | Required, T4/T5          |
| Responsive intent     | 375px/1280px long-content review                                | Pending implementation   |
| Restraint             | No duplicate stories purely for folder counts                   | User premise retained    |
| System fidelity       | Existing styles/providers and real local fixtures               | Required                 |

Design score averages are planning judgments, not live UI measurements: baseline
6.6/10; target 9/10. No approved visual mockups exist. Design-specific tasks are
folded into T3-T7, with responsive evidence recorded by T8; out-of-scope portal
redesign remains deferred.

### Independent design challenge and incorporated acceptance

[subagent-only] Kepler raised six gaps; all are incorporated, including the
already-corrected conditional T7 wording. Require a per-owner applicability
checklist for default/loading/empty/partial/error/disabled states, with named
evidence or an explicit not-supported reason. Empty means zero results, partial
means missing optional data, and failure/pending must not be conflated.

Route plays must check existing validation error-to-field associations, keyboard
access to feedback, confirmation focus return, and navigation focus/announcement
where the route owns it. Each route evidence record names guard, provider,
params, account and session state; any bypass is visible and excluded from the
coverage claim. Destination content must consume the returned ID/reference, not
merely show an asserted path.

T2 captures the baseline generated story/docs IDs; T3/T8 compare the new
generated index and resolve every previously present affected link to its
intended content. Inventory discoverability BDD follows source symbol ->
API-owner Docs -> named scenario, including AutoSuggest's container ownership
and every AcceptQuote step. Baseline/after ID evidence is an artifact, not a
promise.

| Design outside voice | Findings                                   | Disposition                           |
| -------------------- | ------------------------------------------ | ------------------------------------- |
| Independent subagent | 6                                          | Incorporated                          |
| Codex CLI            | Unavailable, version/model incompatibility | No independent second-model consensus |
| Consensus            | N/A                                        | Not reported as 7/7                   |

Design review complete; passing to Engineering.

## Engineering review: executable architecture and proof

### Scope challenge from actual code

The existing Vitest child branch already addresses slow workspace discovery;
duplicating it would not diagnose the present generic error. The existing docs
verifier and coverageDrift test are useful but measure different things, so
extend the former and replace only the latter's completion proxy. The source
snapshot shows real create/copy effects and a pure ta/manage forwarding wrapper;
those differences justify route-specific acceptance rather than identical
boilerplate stories.

Use a plain JSON evidence manifest, not a TypeScript module that a Node CLI
would need to execute or transpile. Revise T2's manifest path to
`ClientApp/src/storybook/coverageManifest.json`; validate its schema in the
existing importable mjs validator. This avoids a new loader/dependency and keeps
the static check from importing application code. Discover handwritten .ts and
.tsx exports recursively (excluding story/test/generated/vendor surfaces), with
all renderability classifications explicitly reviewed; the 258 TSX count remains
only the initial audit sample.

### 1. Architecture review

The validation module reads a bounded source inventory, declarative evidence and
generated Storybook metadata, then produces actionable failures. It never
executes route modules to discover exports and never equates graph edges with
runtime coverage. Runtime receipts join a named source/state assertion to a real
MCP result from the same versioned inputs.

```text
handwritten .ts/.tsx exports ─┐
reviewed JSON evidence ─────┼─> static validator ─> missing/stale/invalid rows
Storybook index + docs ──────┘            │
                                         v
local fixtures -> real route/component -> named play assertion
                                         │
                         MCP test + a11y ─┴─> current execution receipt
                                         │
                       docs BDD + ID diff ┴─> closure report (separate verdicts)
```

Source/docs discovery, runtime tests and quality verdicts remain separate
boundaries. The only route-harness extension is a typed destination observer
when existing preview routing cannot show target content. Do not change
application routing, auth guard behavior or server APIs to make an example pass.

### 2. Code quality review

The highest-risk accidental framework is a custom import resolver or arbitrary
JSX render detector. Use the installed Storybook graph and index for candidate
links; static validation checks schema, source/export references and evidence
applicability, while a human-reviewed assertion demonstrates actual rendering.
TypeScript parsing may inventory exports and verify a narrowly defined
forwarding shape, but ambiguous constructs fail classification rather than being
guessed.

Manifest records are declarative and bounded: source, export, classification,
owner, applicable states, documentation owner, story file/export, assertion
locator, reviewed input digest and reason where excluded. Runtime execution
output belongs in `reports/storybook-coverage/`, not hard-coded passing counts
in MDX. Source/provider/fixture changes invalidate the corresponding review
digest and receipt; shared harness changes conservatively invalidate every
dependent claim.

### 3. Test review

Write the accepted Gherkin scenarios first when executing and obtain the
repository's required BDD approval before changing observable behavior. Red
fixtures must fail for the intended reason, not because the runner cannot load
or because assertions are absent. Keep unit schema/source checks, real-browser
Docs behavior and MCP execution independently attributable.

```text
codepath / claim                     proof layer
JSON schema + recursive inventory -> moduleCoverage positive/negative unit fixtures
missing nested export / stale row -> moduleCoverage + coverageDrift contract
child init / URL / config branch  -> config contracts + MCP execution BDD
AutoSuggest / step API / defaults -> docs-owner unit contract + rendered Docs BDD
component action / focus / status -> named story play + MCP a11y
route request / destination data  -> local MSW capture + route play + real router
existing IDs / generated docs     -> baseline index diff + docs link resolution
source/provider migration drift   -> digest invalidation + focused rerun
```

Focused unit and browser tests precede the full suite, so a catalogue-wide
startup failure cannot obscure a smaller regression. Each assertion locator must
resolve to the intended play/helper, and helper-based plays must have an
explicit observable outcome, not just a spy declaration. Browser BDD uses one
worker for the MCP execution scenario and no concurrent full catalogue run;
existing fullyParallel settings must not race the shared runner.

### 4. Performance review

The finite source inventory and JSON contract are linear in scoped files and do
not require a second build for each row. Generate Storybook metadata once per
relevant build, reuse it, and run the full catalogue only at integration closure
after focused evidence passes. Measure child readiness before deciding whether
the 30-second budget is causal; faster generic initialization does not prove the
correct project and stories loaded.

No numeric speedup or cold-start success is claimed in this plan. Record
cold/warm/repeat durations, real story result counts and the current version
set. Cleanup owned diagnostic children and MSW handlers after each run; release
fixed ports before another browser phase starts.

### Test plan artifact and completion summary

The implementation test plan is written separately to
`C:/Users/gregm/.gstack/projects/gmtestandreview-portalsample/test-plan-storybook-remediation-20261014.md`.
It includes route obligations, state applicability, request/destination proof,
metadata/default/ID checks, negative inventory cases and cold/warm MCP
acceptance. The existing failure/error registries above apply unchanged, with
critical gaps explicitly blocked: unresolved runner, unreviewed source, missing
docs owner, live request escape and stale receipt.

Four engineering sections evaluated; architecture and test diagrams produced; no
new runtime architecture or framework proposed. Reuse map and NOT-in-scope
sections remain authoritative. Design/eng changes are provisional until
integrated with the user's wizard changes and rerun against the merged inputs.

### Independent engineering challenge and incorporated contracts

[subagent-only] Mill raised seven implementability gaps; all are addressed in
this section and T1. Runner isolation precedes the baseline execution, and all
MCP results must match the requested IDs with fresh execution/a11y evidence. CLI
remains unavailable; dual-model consensus is N/A, not 6/6.

- Canonical identity is declaration-relative path plus exported symbol (default
  exports use the declaration identity), not the barrel pathname. Use
  TypeScript's local export/alias information for deduplication of
  named/default/re-exports and memo/HOC wrappers; unsupported or ambiguous
  export shapes enter an unresolved bucket that blocks closure. Include .ts
  renderable candidates, and add fixtures for each identity case; no static
  inference of runtime sufficiency is claimed.
- Claim identity joins canonical source/export, state, story source/export and
  resolved ID, reviewed assertion locator, input digest and current receipt.
  Structural validity, reviewed rendered-state sufficiency, execution success
  and acceptable product behavior are independent verdicts. A conditional helper
  with valid references and a passing unrelated branch remains unverified until
  its specific observable evidence is supplied.
- Prefer conservative **whole-scope SHA-256 invalidation** over a new dependency
  engine: digest sorted paths and byte contents of handwritten
  components/routes/storybook, .storybook config/docs, relevant test
  configuration, package.json and lockfile, plus version set and a canonicalized
  manifest with stored digest/receipt fields excluded. Every input change
  invalidates the closure receipt and affected claims are manually reviewed; if
  reliable dependency attribution is absent, rerun/review the whole scope. No
  unsupported graph freshness API is assumed; MCP reverse graph is a candidate
  aid only.
- Enforce MSW readiness before request-producing mounts. Fail closed on every
  unmatched application request; allow only explicit local Storybook
  assets/tooling. Add a missing-handler negative proving zero live fallback and
  a failing scenario. Fake token acquisition and disabled/mock telemetry are
  part of the same isolation boundary; reuse/extend existing storybookMswPolicy
  contracts and preview setup rather than adding a second network stack.
- The optional destination observer lives inside the existing global router's
  root composition, records location and params, and registers exact target
  routes ahead of the wildcard. Prefer real destination components; if a fixture
  outlet is needed, label it and exclude the destination's own behavior from the
  claim. Assert returned reference in consumed params/content, and add
  wrong-reference, premature-navigation and catch-all negatives.
- T4/T6 may author in parallel but submit focused MCP work to one serial
  integration owner. No shared runner, build output or manifest writes are
  concurrent; merged source/provider inputs are digested and revalidated. Keep
  user changes separate and rebaseline before closure.

### Engineering consensus and readiness

| Voice                | Result                                                                             | Status                                  |
| -------------------- | ---------------------------------------------------------------------------------- | --------------------------------------- |
| Primary              | Four sections; source-grounded scope, architecture/test diagrams and test artifact | Complete planning review                |
| Independent subagent | Seven concrete gaps                                                                | Incorporated                            |
| Codex CLI            | Version/model HTTP 400                                                             | Unavailable                             |
| Dual-model consensus | N/A                                                                                | No claim of independent-model agreement |

No critical **planning** gap remains unassigned; runtime startup and missing
stories are intentionally implementation obligations, not passing checks.
Engineering review complete; passing to DX.

## Developer-experience review

Mode DX POLISH. Product type: an internal component/route workbench and
validation workflow, not a public SDK. Primary persona is a contributor
maintaining a React component or route during the form migration; secondary
persona is a reviewer trying to verify coverage without knowing the story
hierarchy. Both need truthful evidence and fast focused feedback more than
another catalogue page.

### Empathy narrative

A contributor starts with a small change to an address field and wants to know
which story proves it still works. They search for the folder, find a family
gallery, and see a reassuring Complete label. The gallery imports the field, but
it is not obvious whether the relevant conditional branch is on screen or
whether any interaction checks the value. They open Docs and find props for a
parent component. At this point they have spent attention but have not gained
confidence.

They try the prescribed MCP test and receive a generic startup failure. It could
be their change, a busy runner port, stale server state or an upstream mismatch.
Running a shell test might help diagnosis, but it does not satisfy the required
workflow. Meanwhile another developer is changing the wizard provider, so
yesterday's result may no longer apply.

The improved path begins with the source symbol and gives them a named scenario,
the API owner and the observable assertion. A focused run either returns the
exact requested result or names the startup phase and next diagnostic. If shared
inputs changed, the workflow says evidence is stale rather than silently
trusting it. They can retain a good consumer example and add a local story only
when it proves a missing contract. The reward is not a green percentage; it is
knowing exactly what was exercised.

### Competitive reference and magical moment

[Storybook's install guide](https://storybook.js.org/docs/get-started/install)
groups documentation, tests and accessibility in its recommended configuration
and provides a standard dev-server entry point.
[Ladle's introduction](https://ladle.dev/docs/) offers a comparison point for a
component-story workbench; no measured speed or feature superiority is inferred
here. The selected improvement is the already-installed Storybook workflow with
fewer uncertainty gaps, not a migration or competitor benchmark project.

The magical moment is source -> correct API -> real scenario -> exact passing
assertion, with no demand to invent another story file. Success is a contributor
locating and running the existing evidence for an indirectly covered helper and
understanding its limits. A first-time confusion report should record any
failure to find the API owner, choose a story ID, interpret stale evidence or
distinguish a product defect from infrastructure failure.

### Journey map

| Stage           | Contributor question         | Current friction            | Planned response                    |
| --------------- | ---------------------------- | --------------------------- | ----------------------------------- |
| 1 Discover      | Where is this component?     | Folder/file counting        | Recursive source-symbol inventory   |
| 2 Locate docs   | Whose props are these?       | Parent metadata hides owner | Direct API-owner link               |
| 3 Pick evidence | Is it actually rendered?     | Imports appear sufficient   | State/outcome/assertion mapping     |
| 4 Prepare       | Which providers and params?  | Wizard context assumptions  | Recorded harness contract           |
| 5 Run           | Can I test just this?        | Generic MCP startup failure | Named-ID focused execution          |
| 6 Diagnose      | Is this my change?           | Child cause hidden          | Startup/assertion/a11y separation   |
| 7 Extend        | Do I need a new file?        | Colocation pressure         | Consumer sufficiency decision       |
| 8 Integrate     | Did migration invalidate it? | Stale passing result        | Whole-scope input digest            |
| 9 Review        | What is actually complete?   | One reassuring percentage   | Structural/runtime/quality verdicts |

### 1. Getting started — 5/10 baseline, 8/10 target

The repository already provides npm scripts and a reachable Storybook endpoint,
so a new install tutorial would duplicate working assets. Add a concise
contributor path to the existing documentation guide: source lookup, API-owner
Docs, named story, focused MCP run, interpretation of evidence. A
clean-environment first-run and a warm-checkout focused run must be timed during
implementation rather than reported as achieved now.

### 2. API/CLI design — 6/10 baseline, 9/10 target

Keep current script names and use the advertised MCP tool schema, not an assumed
historical alias. The validator command is
`node scripts/storybook-coverage.mjs`, documented as a proposed CLI whose
nonzero exit means missing/stale/unresolved evidence; offer a source-path filter
only if a concrete contributor need appears. Default checks remain whole-scope
so a focused convenience cannot become an accidental completion gate.

### 3. Errors and debugging — 3/10 baseline, 9/10 target

The startup error is not actionable enough for contributors and must not be
confused with a failed play assertion. Report source/state/story, execution
phase, exact missing result IDs and a next diagnostic without secrets. Example
planned error:
`EVIDENCE_STALE: source=... state=loading; shared inputs changed; re-review claim then rerun its MCP story`;
do not claim the adapter already emits this.

### 4. Documentation and learning — 6/10 baseline, 9/10 target

The best tutorial is one existing consumer whose action and assertion are
visible, not a new abstract framework guide. Add one complete JSON record
example and one dedicated-story fallback example after the final manifest schema
is implemented. Document “import match is a candidate,” and distinguish known
defects, unexecuted tests and required-behavior passes next to the coverage
definitions.

### 5. Upgrade and migration — 6/10 baseline, 9/10 target

The active Formik/RHF migration is the main integration risk; both supported
contexts must stay represented. Rebaseline and rerun after provider/controller
merges, preserving stable IDs and recording any supported package fix
separately. Historical version investigations remain historical rather than
being presented as current compatibility guarantees.

### 6. Environment and tooling — 5/10 baseline, 8/10 target

Use existing MSW, Vitest, Playwright-BDD and Storybook tooling, with an owned
diagnostic server and serialized browser lane. Document port ownership and
cleanup so contributors do not kill another person's dev server. No extra
daemon, environment-manager requirement or general code-analysis service is
added.

### 7. Community and ecosystem — 7/10 baseline, 8/10 target

This is an internal workbench, so public community growth metrics and SDK
support channels are not appropriate. Link official Storybook guidance and the
local fixture/harness examples, and record upstream wording/serializer issues
with installed versions and minimal reproductions. Filing issues or uploading
evidence externally is not authorized by this plan and remains optional
follow-up.

### 8. Measurement and feedback — 3/10 baseline, 9/10 target

Time to first trustworthy evidence is currently blocked by the MCP execution
failure; the full numeric baseline is unmeasured. Target a warm contributor path
from known source to focused passing evidence within five minutes, excluding new
dependency installation and full-catalogue closure; measure a cold path
separately with timings for each stage. Track unresolved claims, stale receipts
and startup failures locally; do not invent telemetry, compare unequal cold/warm
timings or report a target as a result.

### DX scorecard and implementation checklist

Baseline average 5.1/10; planned target 8.6/10. These are plan-review judgments,
not a live DX benchmark. The target is lower for environment/first-run because
upstream startup and local machine prerequisites remain unproved.

- [ ] T1: exact focused MCP result, owned-port diagnostic and next-action
      failure evidence.
- [ ] T2: simple JSON example, deterministic failure categories and explicit
      unresolved/stale states.
- [ ] T3: source-to-owning-API discoverability and unchanged legacy links.
- [ ] T4-T7: preserve sufficient consumers; document context and known
      limitations.
- [ ] T8: one contributor walkthrough, measured cold/warm timings and honest
      coverage definitions.

No new community platform, telemetry service, package manager or onboarding
framework is in scope. Existing scripts, docs guide, fixture infrastructure and
MCP are the reuse baseline.

### Independent DX challenge and incorporated runbook

[subagent-only] Halley raised six gaps: digest self-reference, duplicate-story
escape clauses, missing worked example, focused execution instructions,
incomplete diagnostic recovery and maintenance overload. They are incorporated
here and the T5/T7 wording is corrected. CLI remains unavailable;
six-dimensional dual-model consensus is N/A.

Canonical hashing excludes all stored reviewedDigest/executionDigest fields and
all execution receipts. Freeze source/docs and canonical manifest facts, compute
SHA-256, run tests, then write receipts outside the hashed inputs. Add an
idempotence fixture: recording a new result with unchanged inputs must not
change the input digest. Do not insert execution receipts into hashed MDX.
Changed inputs invalidate closure automatically, but unchanged claims may retain
their reviewed rationale after the owner records that the change does not alter
their behavior; only affected/uncertain claims need a new sufficiency review.

Routine contributor checklist: find claim -> inspect API/story -> run static
validator -> review changed behavior -> run focused MCP -> hand off evidence.
Integration owner checklist: regenerate inventory facts once -> freeze inputs ->
refresh digest -> serial full-catalogue/docs/BDD gates -> publish closure
report. Repeated counts and links in the three inventories are generated from
the one manifest, not manually maintained as separate sources of truth.

T8's worked **retained consumer** is
`ClientApp/src/components/AriaComponents/ProgressCircle/ProgressCircle.tsx`
through `ClientApp/src/components/AriaComponents/Button/Button.stories.tsx`,
named Pending and MCP-discovered ID `evaluation-react-aria-button--pending`.
Requery docs-list and owning Docs ID rather than fabricating an ID; verify
visible progress semantics and assertion location before marking this mapping
sufficient. Show the final JSON record and relevant owner link in the existing
introduction after the schema lands; until those assertions pass this remains
candidate evidence.

A copyable focused request for the already discovered SearchBox story uses the
current test-run schema:

```json
{
  "a11y": true,
  "stories": [
    { "storyId": "components-searchfilter-searchbox--type-and-submit" }
  ]
}
```

Use the connected MCP on 6006 for ordinary focused work. The integration owner's
raw MCP BDD on owned 6007 is specifically for isolated startup diagnosis;
`--grep "MCP"` is not a story-selection substitute. Save result IDs, run
identity, a11y evidence and diagnostics under `reports/storybook-coverage/`;
never treat an incomplete returned set as success.

Add these runbook examples to `.storybook/component-docs-guide.mdx`:

- Startup failure: record phase/child cause in
  `reports/storybook-coverage/mcp-startup.json`; integration owner checks port
  ownership/config/versions under T1, reruns owned-server MCP BDD, then the
  focused request. Upstream-only outcome remains blocked.
- Missing/stale evidence: `node scripts/storybook-coverage.mjs` names
  source/state/owner and fails; repair or re-review the JSON record, rerun that
  command, then its discovered story. Absent MCP API documentation is a pending
  contract, not a reason to guess props.
- Interaction/a11y failure: identify exact story/assertion/violation in
  `reports/storybook-coverage/focused-result.json`; reproduce that one story,
  repair the owning defect within approved scope, then rerun the same MCP
  request. Style changes for visual/a11y defects require the user's direction
  per MCP policy.

### Cross-phase themes and final handoff

Three independently raised themes recur: evidence is not import reachability
(CEO/Eng), sufficient consumers must not be displaced by duplicate files
(CEO/Design/DX), and shared-input changes make old passes stale (CEO/Eng/DX).
These are cross-phase subagent signals, not fabricated agreement from an
unavailable second model. They drive one explicit manifest, conditional story
creation and conservative closure invalidation.

During this review the source checkout advanced from 5bc51af1 to 15f82afa
through the user's wizard-controller commit. No implementation files were
changed by this audit. Recompute baseline inventory, index IDs and relevant MCP
findings before starting T1/T2; existing lockfile modifications remain
user-owned.

Execution handoff: obtain final plan approval; select an isolated integration
checkout; rebaseline; use the required BDD approval/TDD workflow; implement
T1-T8 in their recorded dependency order. No commit, push, deployment, server
takeover or dependency upgrade is authorized by this planning deliverable.
Review logs must not be marked approved before the final gate.

### Deferred backlog

No root TODOS.md exists; deferred items are recorded here rather than creating a
parallel project backlog. Product error recovery for indefinite-spinning
create/copy failures requires a separate agreed UX/runtime fix; selective
dependency-aware reruns are deferred until whole-scope validation is measurably
too costly. Portal redesign, public issue filing, uploads and dependency
migration remain outside this plan. These deferrals do not waive MCP execution,
accurate docs or complete source classification.

### Final approval choices

- Choice 1 (D12): recommend subcomponent metadata first, dedicated docs only if
  rendered Docs/MCP discovery fails. Immediate split is viable but adds
  navigation/ID maintenance.
- Choice 2 (D19): recommend whole-scope closure invalidation with retained
  unaffected review rationale. Selective dependency invalidation could reduce
  reruns but adds implementation complexity before cost is measured.
- User direction is retained: sufficient indirect coverage is accepted. No user
  challenge requests reversing that direction.

### Final document-review clarifications

Exact network/fixture ownership paths:
`tests/unit/config/storybookMswPolicy.test.ts`, `.storybook/preview-setup.ts`,
`.storybook/preview.ts`, `ClientApp/src/storybook/storybookFixtures.ts` and
`ClientApp/src/storybook/storybookHarness.tsx`. These are conditional edits only
for their corresponding reproduced isolation/harness gap; the T8 unit gate also
includes the MSW policy test. The historical 258-TSX scan seeds, but never
limits, the current .ts/.tsx export inventory.

Before ordinary 6006 MCP results qualify as execution receipts, verify that
server's checkout and input/version identity match the recorded implementation
checkout. If identity cannot be established, use the owned
diagnostic/integration instance; a reachable endpoint alone is not same-input
evidence. The final independent reviewer approved 97/100 with zero critical
failures; these three nonblocking clarifications address its deductions without
changing scope.

### Implementation tasks aggregated across phases

Computed with jq from the four per-phase JSONL artifacts, deduplicated by
component/sorted files/title and sorted by priority then phase. Task order below
is priority, not a replacement for the dependency order. All eight tasks are
implementation obligations, not completed changes.

- [ ] T2 (P1, human 1 day / agent 2-4 hours) — Replace folder-name proxy with
      recursive reviewed evidence
  - Phase: ceo-review; finding: Imports/folder substrings cannot prove covered
    renderable behavior.
  - Files: `ClientApp/src/storybook/coverageManifest.json`,
    `scripts/storybook-coverage.mjs`,
    `tests/unit/storybook/moduleCoverage.test.ts`,
    `tests/unit/storybook/coverageDrift.test.ts`,
    `scripts/verify-storybook-docs.mjs`.
- [ ] T1 (P1, human 0.5-2 days / agent 2-6 hours) — Diagnose and restore
      exact-ID MCP story execution
  - Phase: eng-review; finding: Generic runner startup fails despite existing
    compatibility branch.
  - Files: `vitest.config.ts`, `vitest.storybook.config.ts`,
    `vitest.storybook.runtime.ts`, `playwright.storybook.config.ts`,
    `.storybook/main.ts`, `tests/unit/config/vitestTopology.test.ts`,
    `tests/unit/config/storybookVitestContract.test.ts`,
    `tests/unit/config/storybookRuntimePolicy.test.ts`,
    `tests/e2e/features/storybook/integrations/mcp.feature`,
    `tests/e2e/steps/storybook.steps.ts`.
- [ ] T8 (P1, human 0.5 day / agent 2-4 hours) — Publish generated inventories,
      run closure gates and document focused workflow
  - Phase: devex-review; finding: Historical Complete claims and generic
    failures obscure current evidence.
  - Files: `ClientApp/src/storybook/CoverageMatrix.docs.mdx`,
    `ClientApp/src/components/ComponentInventory.docs.mdx`,
    `ClientApp/src/routes/RouteInventory.docs.mdx`,
    `ClientApp/src/storybook/MigrationReadiness.docs.mdx`,
    `.storybook/introduction.mdx`, `.storybook/component-docs-guide.mdx`,
    `tests/e2e/features/storybook/routes/routes-coverage.feature`,
    `tests/e2e/steps/storybook.steps.ts`.
- [ ] T3 (P2, human 1 day / agent 2-4 hours) — Clarify container/step APIs and
      verify Guard/default/ID presentation
  - Phase: design-review; finding: Wrong API owner and upstream/version
    attribution ambiguity.
  - Files:
    `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggest.stories.tsx`,
    `ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx`,
    `.storybook/component-docs-guide.mdx`,
    `tests/unit/storybook/storybookDocsConfig.test.ts`,
    `tests/e2e/features/storybook/autodocs-documentation.feature`,
    `tests/e2e/steps/storybook.steps.ts`.
- [ ] T4 (P2, human 1-2 days / agent 3-6 hours) — Add seven missing component
      examples with behavior and a11y
  - Phase: design-review; finding: Seven shared implementations have no
    reverse-graph story candidates.
  - Files:
    `ClientApp/src/components/AriaComponents/AriaButton/AriaButton.stories.tsx`,
    `ClientApp/src/components/AriaComponents/Link/Link.stories.tsx`,
    `ClientApp/src/components/AriaComponents/SegmentControl/SegmentedControl.stories.tsx`,
    `ClientApp/src/components/AriaComponents/Sheet/Sheet.stories.tsx`,
    `ClientApp/src/components/reactaria_components/AlertMessage.stories.tsx`,
    `ClientApp/src/components/reactaria_components/PageHeader.stories.tsx`,
    `ClientApp/src/components/reactaria_components/StatusPill.stories.tsx`.
- [ ] T5 (P2, human 1-2 days / agent 3-6 hours) — Review and strengthen indirect
      assertions without duplicate stories
  - Phase: eng-review; finding: Graph reachability needs reviewed
    state/action/outcome proof.
  - Files: `ClientApp/src/components/Buttons/ButtonBreadth.stories.tsx`,
    `ClientApp/src/components/forms/Forms.stories.tsx`,
    `ClientApp/src/components/forms/WizardForm/WizardForm.stories.tsx`,
    `ClientApp/src/components/forms/FormBanner/FormBanner.stories.tsx`,
    `ClientApp/src/components/Inputs/Inputs.stories.tsx`,
    `ClientApp/src/components/Inputs/AddressLookup/AddressLookup.stories.tsx`,
    `ClientApp/src/components/modals/Modals.stories.tsx`,
    `ClientApp/src/routes/preConditions/PreConditions.stories.tsx`,
    `ClientApp/src/routes/ta/applicationAndInstrument.stories.tsx`,
    `ClientApp/src/routes/ta/organisationAndContact.stories.tsx`,
    `ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx`.
- [ ] T6 (P2, human 1-2 days / agent 4-8 hours) — Cover ten nested route
      obligations; create files only for real gaps
  - Phase: eng-review; finding: Child steps do not prove wrapper
    mutation/navigation/error state.
  - Files:
    `ClientApp/src/routes/acceptQuote/create/CreateAcceptQuote.stories.tsx`,
    `ClientApp/src/routes/account/addBranch/AddBranch.stories.tsx`,
    `ClientApp/src/routes/account/create/CreateAccount.stories.tsx`,
    `ClientApp/src/routes/account/update/UpdateAccount.stories.tsx`,
    `ClientApp/src/routes/contact/create/CreateContact.stories.tsx`,
    `ClientApp/src/routes/contact/update/UpdateContact.stories.tsx`,
    `ClientApp/src/routes/requestForQuote/copy/CopyRequestForQuote.stories.tsx`,
    `ClientApp/src/routes/requestForQuote/create/CreateRequestForQuote.stories.tsx`,
    `ClientApp/src/routes/ta/create/CreateRequestForTypeApproval.stories.tsx`,
    `ClientApp/src/routes/ta/created/RequestForPatternApprovalCreated.stories.tsx`,
    `ClientApp/src/storybook/storybookHarness.tsx`, `.storybook/preview.ts`.
- [ ] T7 (P2, human 1 day / agent 3-5 hours) — Cover shell obligations and
      retain sufficient success/auth/summary examples
  - Phase: eng-review; finding: Five shells lack candidates; forwarding
    equivalence needs invalidation.
  - Files: `ClientApp/src/routes/acceptQuote/AcceptQuoteShell.stories.tsx`,
    `ClientApp/src/routes/requestForQuote/RequestForQuoteShell.stories.tsx`,
    `ClientApp/src/routes/ta/TypeApprovalShell.stories.tsx`,
    `ClientApp/src/routes/quotation/QuotationShell.stories.tsx`,
    `ClientApp/src/routes/measurementReport/MeasurementReportShell.stories.tsx`,
    `ClientApp/src/storybook/coverageManifest.json`,
    `tests/unit/storybook/moduleCoverage.test.ts`.

Artifacts:
`C:/Users/gregm/.gstack/projects/gmtestandreview-portalsample/tasks-{ceo-review,design-review,eng-review,devex-review}-20261014-storybook.jsonl`.
These were emitted from structured data through jq, not hand-written JSONL.

## GSTACK REVIEW REPORT

| Review                 | Status        | Result                                                                                          |
| ---------------------- | ------------- | ----------------------------------------------------------------------------------------------- |
| Audit intake           | Complete      | Historical 258 TSX candidates, 23 without import matches; not behavioral coverage               |
| CEO                    | Complete      | 11 review sections, 8 error paths, 7 failure modes; sufficient indirect coverage retained       |
| Design                 | Complete      | 7 dimensions; planning judgment 6.6 -> 9.0 target, not measured UI                              |
| Engineering            | Complete      | 4 sections, architecture/test diagrams, external test-plan artifact                             |
| DX                     | Complete      | 8 dimensions; planning judgment 5.1 -> 8.6 target; warm five-minute target unmeasured           |
| Outside voices         | Degraded      | Independent subagent each phase; Codex CLI version/model incompatible, dual-model consensus N/A |
| Final document review  | Approved      | 97/100; zero critical failures, three nonblocking clarifications incorporated                   |
| Implementation/testing | Not performed | MCP runner failure remains unresolved; no 100% completion claim                                 |
| User approval          | Pending       | Two taste choices; user’s indirect-coverage direction stands                                    |

Decision total: 26 (23 auto-decided, two taste recommendations, one confirmed
user premise); zero requests to reverse user direction. Per-phase findings
incorporated: CEO six, Design six, Engineering seven, DX six. No phase claims
independent second-model consensus.

VERDICT: PLAN REVIEW COMPLETE; AWAITING USER APPROVAL. No implementation or
visual change was made. Final artifact checks are secret scanning, Markdown
formatting and clean patch whitespace; those checks are not Storybook
interaction/a11y verification. Execution requires refreshed inputs at 15f82afa
or the later selected integration commit, accepted BDD scenarios, successful MCP
execution and all T8 gates.
