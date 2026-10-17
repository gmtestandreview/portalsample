<!-- /autoplan restore point: C:/Users/gregm/.gstack/projects/gmtestandreview-portalsample/feat-formik-to-react-hooks-migration-autoplan-restore-20261014-storybook.md -->

# Storybook coverage and MCP remediation plan

Date: 2026-10-14 (Australia/Sydney). Branch:
`feat/formik-to-react-hooks-migration`. Audit baseline: `5bc51af1`; final
planning checkout: `15f82afa87f3fcf33ac50f99d27431329361f08a`; base branch:
`main`. Revised 2026-10-15 at `234dd9ad8b617c5bc3786c106e20c1278c7bc524`.
Status: pressure-review recommendations applied to planning contracts on
2026-10-15 at `9a8575b240c31d779fb79fd3ccebe78b94e149bb`. The earlier 99/100
review is historical; current pressure retest and reassessment are recorded in
the scorecard and retest report. Implementation has not started.

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

| Approach                                                                           | Coverage                                                    | Effort estimate                                                                        | Risk and tradeoff                                            |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| A: metadata wording and runner fix only                                            | Fixes immediate defects; leaves unrepresented route shells  | Human 1-2 days / agent 2-4 hours                                                       | Lowest diff, insufficient for the requested coverage outcome |
| B: evidence manifest plus targeted stories, retaining sufficient indirect examples | All scoped renderable modules have verifiable evidence      | Human 9-17 engineer-days / agent 3-6 active days; upstream/maintainer waiting separate | Selected; avoids duplicate stories while closing real gaps   |
| C: colocated stories everywhere                                                    | Easy folder counting but duplicates family/provider stories | Human 1-2 weeks / agent 2-3 days                                                       | Rejected by the user's premise choice; ID and fixture churn  |

Mode: SELECTIVE EXPANSION, following autoplan. Accept the recursive evidence
gate within this task's scope. Defer broader UI redesign, full runtime error
remediation, publishing, and dependency migration.

## Files and responsibilities

T2 creates `ClientApp/src/storybook/coverageManifest.json`,
`scripts/storybook-coverage.mjs`, and
`tests/unit/storybook/moduleCoverage.test.ts`; modifies `coverageDrift.test.ts`
and `verify-storybook-docs.mjs`. The manifest owns classifications and evidence,
the script owns recursive discovery/validation, tests own counterexamples, and
the docs verifier integrates build/index checks. The pressure revision also
creates tests/unit/storybook/inputFreeze.test.ts (denial/restoration and stale
receipts) and tests/unit/storybook/producerIdentity.test.ts (producer/native
binding joins). Patches and installer files are read-only hash/provenance
inputs, not new edit targets. T1 owns launcher identity; T2 owns pure
validation. T8 creates scripts/storybook-closure.mjs and
tests/unit/storybook/closureOrchestration.test.ts for the explicit freeze/gate
launcher; the existing task-scoped mjs lint config includes that launcher too.

T1 modifies `playwright.storybook.config.ts` for the isolated diagnostic URL
contract and may modify `vitest.config.ts`, `vitest.storybook.config.ts`,
`vitest.storybook.runtime.ts`, or `.storybook/main.ts` **only as supported by a
reproduced startup failure**, except for the explicitly scoped owned-child
identity diagnostic in T1b below. Extend
`tests/unit/config/vitestTopology.test.ts`, `storybookVitestContract.test.ts`,
`storybookRuntimePolicy.test.ts`,
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

## Revision contract — 2026-10-15

This update addresses the eight-package devil's-advocate assessment, retaining
T1–T8 and decisions D1–D26. The active packages, file table, shared contracts
and terminal report are authoritative, including the pressure revision below;
earlier CEO/design/engineering/DX narratives describe the 2026-10-14 review
history, not new test results. Scope is the Storybook remediation plan and its
companion test/task/score artifacts, not unrelated project plans.

Planning checkout: `234dd9ad8b617c5bc3786c106e20c1278c7bc524` (RHF form-shell
core and S2.0 notes now committed). `package-lock.json` remains user-owned and
dirty. Rebaseline recursive exports and generated IDs before executing; the
historical 258 TSX candidates are not a current denominator. TokenSave reported
a roughly 16-hour-old graph; source reads and current filesystem/commit checks
are used without refreshing the index.

### Pressure revision traceability — 2026-10-15

All seven Red Team recommendations are incorporated below. Retest evidence is in
[Storybook pressure retest](2026-10-15-storybook-pressure-retest.md). This is
plan remediation, not implementation or a passing Storybook suite.

| ID  | Pressure finding                                    | Package and acceptance                                                                      |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| RT1 | Applied dependency patch bytes omitted              | T2/T8 hash all patches; changed/added/deleted patch invalidates evidence                    |
| RT2 | Early gates precede generated source edits          | T8 preparation first; freeze before every qualifying gate; reject pre-freeze results        |
| RT3 | Renderable records can have no required states      | T2 reject empty/all-unsupported states; require a meaningful baseline claim                 |
| RT4 | Shared harness rolled back before consumers         | T6/T7 revert dependent consumers first or the group atomically                              |
| RT5 | Worker readiness does not cover eager requests      | T6 delayed/rejected startup and import/loader negatives use inert transports                |
| RT6 | Concurrent Docs stories share handler ownership     | T3/T5/T6 frame-local handlers; overlapping conflicting-response cleanup tests               |
| RT7 | Producer identity/freeze insufficiently operational | T1/T2/T8 owned process/install identity, native endpoint binding, write-denied input freeze |

### Ownership and atomic execution rule

The integration owner owns server lifecycle, shared harness, input freeze,
generated inventories and serial closure. Component/route authors own one named
source/export/state claim at a time; the component maintainer approves an absent
API contract; a reviewer checks assertion sufficiency. These are
responsibilities assigned before execution, not invented named people.

Each atomic slice follows: approved Gherkin where required -> intended failing
fixture/play -> minimal implementation -> same focused passing test -> impacted
regression -> reviewable diff. A RED caused only by missing infrastructure does
not prove a behavior test. Capture only owned files in a targeted commit when
execution is authorized; no commit or code implementation occurs in this
plan-update turn.

For every story edit, fetch current MCP story-writing instructions, discover
IDs, run focused `test-run` with a11y, call stories-changed and include new
stories in the final review. No undocumented prop is inferred from source,
sibling APIs or naming. A blocked API/runner lane stays pending; independent
static/docs work can proceed, but cannot earn verified completion.

### Shared evidence and receipt contract

A claim is canonical source declaration/export + applicable state + exact story
file/export/resolved ID + observable outcome + assertion locator + reviewed
sufficiency rationale. Pure re-exports alias the declaration rather than
duplicate it; ambiguous .ts/.tsx exports enter an unresolved bucket. An import
edge identifies a candidate, not a rendered-state or behavior pass.

Manifest schema v1 is a JSON object with `schemaVersion: 1` and `records`. Every
record has `source`, `export`, `classification`
(direct/consumer/forwarding/nonvisual), `owner`, `reason`, `docsOwnerId`,
`states`, and `review`. docsOwnerId is a nonempty generated ID for renderables
and null only for justified nonvisual records. A state has `name`,
`applicability` (required/not-supported), `outcome`, `storyFile`, `storyExport`,
`storyId`, `assertionFile`, `assertionExport`, `assertionMarker`, and
`rationale`; not-supported states require a specific reason instead of
story/assertion fields. `review` has reviewer, rationale and
reviewedSourceDigest. Nonvisual records require a reason and have no required UI
states; forwarding records identify the actual consumer and the narrow
equivalence condition. Missing/duplicate/unknown fields and unresolved records
fail; do not execute application modules.

Every renderable direct/consumer/forwarding record must contain at least one
required baseline rendered-state claim with a meaningful observable semantic or
behavioral outcome and all story/assertion references. Empty states,
all-not-supported states, blank outcomes and smoke-only baselines fail
EVIDENCE_MISSING. A sufficient existing consumer qualifies; no colocated Default
story is required. Only reviewed nonvisual records may have zero required UI
states. Additional applicable states remain required; not-supported is an
individual approved API limitation, never a blanket waiver. Test all three
renderable classifications, static semantics, valid indirect baselines and
improper nonvisual reclassification as well as the two zero-state
counterexamples.

Receipt files under `reports/storybook-coverage/` contain locally generated
receiptId, JSON-RPC request ID, request/response timestamps, checkout commit,
inputDigest, installed versions, requested IDs, executed IDs, component/a11y
statuses, errors, verdict and applicable claim keys. Add freezeId, producerId,
producerIdentityDigest, patchFiles (normalized path plus SHA-256), gate name,
gate start/end input digests and whether the gate started after the freeze.
receiptId is client-owned; do not assume an upstream public runId. Validate
`structuredContent.status === 'completed'`, `result.componentTestStatuses`,
`result.a11yStatuses`, counts and `unhandledErrors` against the installed 10.6.1
schema. Per-status storyId is the execution join key; `result.storyIds`,
startedAt and finishedAt are optional. Installed passing status is
`status-value:success`; errors, unknown, cancelled, no-stories, skipped, missing
or duplicate required results fail. Check a11y success per required ID, not
merely the requested boolean. Missing structured data or evidence is a contract
failure, never silently parsed into a pass.

Maintain independent verdicts: structural validity, reviewed rendered-state
sufficiency, executed assertions/a11y, and acceptable product behavior. A
passing characterization of an indefinite spinner remains a known defect; it
cannot be reported as required error recovery.

### Complete input freshness without a second dependency engine

Include all files beneath `ClientApp/src`, `ClientApp/public`,
`ClientApp/media`, `.storybook`, `scripts`, `tests` and `patches`. Include
existing root files matched by the literal globs `*.config.*`, `vitest*.*`,
`tsconfig*.json`, `.prettierrc*`, `.env` and `.env.*`, plus existing
package.json, package-lock.json, npm-shrinkwrap.json, pnpm-lock.yaml, yarn.lock,
bun.lock, bun.lockb, .npmrc, .nvmrc and .prettierignore. Missing optional root
files are allowed; an existing unreadable input fails. Apply the repository
secret-scanning protocol before reading any input; a reported credential blocks
the run rather than exposing or silently excluding it.

Styles, validationSchemas, authentication, utilities, storage, App.tsx,
fixtures, generated API contracts and static assets are therefore included.
Generated/vendor inputs are hash-only, not edit targets. Reject symlinks in the
selected input set as SOURCE_UNRESOLVED until an explicitly reviewed,
in-checkout input mapping exists; never follow an external target or recurse a
cycle.

The digest algorithm is an implementation contract, not “canonical” by
convention:

1. Enumerate relative paths, convert backslashes to '/', remove redundant './',
   normalize Unicode to NFC, and reject absolute paths, '..', empty components
   and normalization/case-fold collisions. Preserve actual filename case; sort
   normalized paths by UTF-8 byte order with Buffer.compare, never locale order.
2. Read file bytes verbatim. Different source line endings are different inputs;
   receipts are not portable between different-byte checkouts.
3. For `ClientApp/src/storybook/coverageManifest.json` **replace its raw-byte
   contribution** with canonical JSON bytes. Reject duplicate JSON keys and
   non-JSON values. Recursively sort object keys by ECMAScript UTF-16 code-unit
   order; preserve array order; encode strings/numbers/booleans/null with
   JSON.stringify and no extra whitespace, UTF-8. Omit only
   `records[i].review.reviewedSourceDigest`; similarly named fields anywhere
   else are not omitted.
4. Initialize SHA-256 with UTF-8 `storybook-coverage-input-v1\0`. For every
   sorted file, append unsigned 64-bit big-endian path-byte length, UTF-8 path
   bytes, unsigned 64-bit big-endian content-byte length and content bytes
   (canonical manifest bytes for that one file). Length framing prevents
   different path/content boundaries from colliding.
5. Receipt/report/build/cache/.git/node_modules outputs are outside the source
   input roots. Record Node/browser/Storybook/Vitest/MSW versions and
   install/patch provenance separately, including applied patch paths/SHA-256
   and the installer script digest. All files beneath patches participate in
   inputDigest, including unapplied files. Reject missing configured patches or
   NMI_PATCH_ROOT outside the owned checkout; any approved in-checkout alternate
   mapping must be hashed explicitly. Closure qualifies only from a reproducible
   isolated install of the reviewed lockfile using the existing install/patch
   workflow; arbitrary local dependency mutations disqualify it. Never
   install/reset/stash the user's checkout for this purpose.

Negative fixtures cover root playwright.storybook.config.ts and
webpack.config.js changes, every
source/SCSS/validator/auth/storage/asset/provider/config family, patch-only
changes/additions/deletions and install-provenance mismatches, manifest
state/rationale changes and normalized-path/collision cases. Positive fixtures
show JSON object-key reordering does not change canonical manifest digest, array
order does change it, receipt writes/reviewedSourceDigest refresh alone do not
change it, and length-framed pairs such as path='ab'/content='c' versus
path='a'/content='bc' produce different framed inputs.

Generate inventory facts before freezing inputs. Hash before/after every closure
gate; a change voids that and later receipts. Results remain outside hashed MDX.
Mechanical freshness is not semantic sufficiency: integration signoff reviews
the changed-input list, explicitly retains unaffected rationale and re-reviews
affected/uncertain claims. Full-catalogue execution remains serial.

Full/docs generated indexes have their own canonical-JSON SHA-256 fingerprints,
separate from source inputDigest. Freeze the full index at
`reports/storybook-coverage/frozen-full-index.json`; execution receipts/signoff
include fullIndexDigest and derive eligibility exclusively from that file.
Freeze docs output at `reports/storybook-coverage/frozen-docs-index.json` for
documentation comparisons. Do not let a later docs build replace executable
membership.

### Producer identity and enforced freeze — RT7

T1 owns producer evidence; T2 validates its joins. Use an owned isolated
integration checkout and reproducible install, never the user's working checkout
for permission changes. A producer record outside hashed inputs has producerId,
canonical checkout path, commit, inputDigest, patchFiles/installer digest,
installed versions, resolved server/MCP URL, server PID/start time/cwd/launch
arguments, expected Vitest configuration and native MCP binding. These stable
fields form producerIdentityDigest; child PID/start time/cwd are deliberately
excluded because a cold child does not exist before the triggering request. All
qualifying receipts/signoff join on producerId, freezeId, producerIdentityDigest
and inputDigest.

Each MCP execution receipt additionally records childEpoch (observed child PID
plus OS creation time), observed cwd/configuration, parent-process chain and
request ordinal/start/end timestamps. Before a cold request, verify no existing
runner child for the owned producer; do not prewarm it to obtain child identity.
Send the native request, observe the newly launched child using owned runner
diagnostics/process records, then validate and attach child provenance before
the completed response can qualify. Warm requests may reuse the same epoch. A
restart between requests creates a new recorded epoch under the same stable
producer/freeze; a restart during an in-flight request invalidates that receipt
and stops closure. Serial request ordinals and observation windows provide the
local join, not an assumed upstream runId. Missing/ambiguous child provenance,
wrong cwd/configuration, PID reuse without matching creation time or an
unobserved restart fails. Extend producerIdentity.test.ts and
mcpExecutionReceipt.test.ts for cold-before-child, warm reuse, between-request
restart, in-flight restart and missing provenance.

Capture facts from owned launcher records and runner diagnostics. On Windows,
Get-NetTCPConnection identifies port-owner PIDs and Get-CimInstance supplies
process creation/command-line information. Cwd comes from the launch record and
child diagnostics, not a nonexistent Win32_Process cwd property. PID reuse or
unavailable child/install provenance fails. A resident instance qualifies only
if independently established identity matches; otherwise use an owned instance.
Confirm codex mcp get my-storybook-mcp-server reports that same URL. A 6007 BDD
request cannot qualify a native connector still bound to 6006. Reconnect through
supported client configuration only with necessary authority, rediscover tools,
and block native closure if binding cannot be established. No public identity
endpoint or upstream runId is invented.

Enforce immutable selected inputs throughout closure; boundary hashes alone
cannot detect A-to-B-to-A changes. On the owned Windows integration copy,
precreate writable reports/build/cache/.features-gen directories, save ACLs
outside input roots, and apply write-denial ACLs with Get-Acl/Set-Acl only to
resolved owned paths. Deny selected file write/append/attribute/delete rights
and directory creation/child-deletion rights within input discovery roots;
protect optional root-file discovery against additions too. Keep output paths
writable and retain ACL-restoration rights. At the checkout root deny new files
that could match optional configuration discovery, not output-directory
creation; precreated output directories may be removed/recreated by existing
build scripts. Selected input roots remain protected against directory
replacement/deletion. Verify this distinction with the real clean/build commands
during the owned-copy freeze integration test. The Windows read-only attribute
is not sufficient. Verify overwrite, append, create, delete and rename attempts
in representative owned input fixtures are denied, report/cache writes succeed,
and read/hash still work. Precreate these fixtures before final preparation and
remove them before the final input freeze; perform denial probes on the real
selected paths through reversible attempts that must fail, never modify source.

The freeze record has freezeId, acquisition time, inputDigest, protected
path/discovery-root list, ACL-backup location and denial-probe results. Register
finally cleanup before ACL changes; restore exact saved ACLs on success,
failure/cancellation only in the owned checkout. If the filesystem cannot
enforce the contract, new authority is required, or a gate must mutate selected
inputs, stop closure and repair the workflow; never downgrade to boundary
hashes. Use an injected adapter for unit fixtures and a controlled owned-copy
integration test for actual denial/restoration. Reject writable/new optional
inputs, A-to-B-to-A mutation, wrong cwd/install/patch digest, PID reuse, wrong
native URL and missing identity. Proposed pure helpers validateProducerIdentity
and validateFreezeRecord in scripts/storybook-coverage.mjs accept explicit
records; process/ACL IO remains in guarded CLI/launcher code, never test-import
side effects.

### Closure launcher interface and lifecycle — RT7

T8 creates scripts/storybook-closure.mjs, a guarded Node ESM entry with no
import-time IO, and tests/unit/storybook/closureOrchestration.test.ts. Export
runClosure(options, adapters) where options are { checkout, url, serverMode,
receipts, mcpTimeoutMs }; checkout/receipts resolve to the owned integration
copy, serverMode is managed/external as in T1 and mcpTimeoutMs is a positive
finite integer (default 3600000). Inject filesystem, process/ACL, clock and
receipt-observation adapters for unit tests; production adapters use existing
Node and Windows tools, no new dependency or framework. Reuse T1's validated
resolveStorybookTestTarget and T2's pure validators rather than duplicating
them.

After preparation, invoke from the owned integration checkout:
`node scripts/storybook-closure.mjs --checkout . --url http://localhost:6007 --server-mode managed --receipts reports/storybook-coverage --mcp-timeout-ms 3600000`.
The command resolves its absolute targets and refuses the user's original
working checkout or receipt paths inside selected inputs. Managed mode launches
the owned server using T1's command; external mode requires proven ownership and
identity, never an arbitrary resident process. Native binding is checked before
qualifying MCP calls, not inferred from the launch URL.

runClosure registers cleanup, acquires/tests the ACL freeze, establishes stable
producer identity and runs qualifying gates 1–5 with start/end digest checks. It
writes awaiting-mcp.json outside inputs and waits, with the bounded timeout and
progress output, for the agent/operator to call the existing native MCP test-run
tool serially and save raw/normalized receipts. It never shells out to MCP or
substitutes package tests for native calls. The operator's mcp-complete.json
names receipt files; this is a handoff signal, not evidence. The launcher
validates exact-ID/a11y results, stable identity/freeze and per-request child
provenance before continuing with gate6 BDD, gate7 docs and gate8 closure. For
gate6, spawn Storybook BDD with a child-only environment copied from the
launcher, overriding STORYBOOK_TEST_URL with the resolved baseURL and
STORYBOOK_TEST_SERVER_MODE=external because the launcher owns the running
server. Do not mutate the parent's environment or let Playwright start a second
server. Before any subsequent scenario labeled cold, confirm no in-flight
request, stop only the proven owned runner child, wait for its PID/port to
disappear and record the reset; then let the scenario's request create a new
child epoch. Never reset an unowned child or relabel a warm run cold. Add
environment, ownership/reset and cancellation fixtures to
closureOrchestration.test.ts and the MCP execution BDD steps; inability to
obtain a clean cold state blocks it. Unsupported native binding, failed/missing
receipts, timeout or cancellation fails closed and restores ACLs/cleans only
owned processes in finally.

Store gate receipts, awaiting-mcp.json, mcp-complete.json and lifecycle evidence
under the explicitly selected reports/storybook-coverage path. Every handoff
file includes freezeId/producerId; reject stale signals from a previous session,
out-of-root paths or duplicate receipt names. Unit tests drive fake adapters
through successful cold/warm lifecycle, all-gate ordering, bad handoff, failure,
timeout and cancellation. The owned-copy integration test covers real ACL
denial/restoration and clean/build output recreation. A readiness/runbook
instruction without this entry point cannot qualify as orchestration evidence.

### CLI, lint and acceptance-set contract

The proposed `scripts/storybook-coverage.mjs` exports the following proposed
pure functions for unit tests: validateManifest, discoverSourceExports,
validateSourceClaims, validateReferences, computeInputDigest,
normalizeMcpReceipt, deriveExecutableStorySet, validateClosure,
validateProducerIdentity, validateFreezeRecord and generateInventory. Each
accepts explicit input objects (filesystem root/data/index/receipt inputs as
applicable) rather than reading global state; CLI parsing/IO is isolated behind
a guarded entry. It provides three explicit modes:

- `--mode source`: inventory/schema/source-export/assertion-reference/review
  checks, no live server or generated index required.
- `--mode references --index storybook-static/index.json`: source checks plus
  generated story/docs links and owner checks.
- `--mode closure --index reports/storybook-coverage/frozen-full-index.json --docs-index reports/storybook-coverage/frozen-docs-index.json --receipts reports/storybook-coverage`:
  references plus current exact-ID/a11y receipts, input freeze and integration
  signoff.

Exit 0 means all obligations of the selected mode passed; exit 1 names failures
by stable codes SOURCE_UNRESOLVED, EVIDENCE_MISSING, REFERENCE_MISSING,
INPUT_STALE, EXECUTION_INCOMPLETE or KNOWN_DEFECT_REQUIRED. Exit 2 is invalid
invocation/unreadable input. Source mode success is never displayed as closure
success. `--write-inventory` is permitted only with references mode; replace
only generated regions bracketed by
`<!-- storybook-coverage:generated:start -->` /
`<!-- storybook-coverage:generated:end -->` in the three inventory MDX files.
Refuse absent/duplicate markers; no receipt IDs or run timestamps enter those
regions.

Capture baseline index IDs before metadata edits. Compute executable expected
IDs from index entries of type story and effective inherited tags plus installed
storybookTest include/exclude/skip policy. Docs entries are not tests. Keep
skipped/excluded and deliberate non-test stories in a separate audited list with
reasons; any required claim lacking an executed story still blocks closure. Do
not treat skipped counts as passes or weaken tags to make counts agree.

Root npm lint does not select the proposed .mjs validator. Create a task-scoped
`scripts/storybook-coverage-eslint.config.mjs` importing existing
`eslint.config.mjs`, `@eslint/js` and `globals`; retain all existing config and
add js.configs.recommended plus Node ESM globals only for coverage validator,
docs verifier and closure launcher mjs scripts. No root ESLint/package/CI policy
edit is needed. Run
`npx eslint --config scripts/storybook-coverage-eslint.config.mjs scripts/storybook-coverage.mjs scripts/verify-storybook-docs.mjs scripts/storybook-closure.mjs --max-warnings=0`.
Test positive ESM and a no-undef negative using ESLint.lintText in the proposed
`tests/unit/config/storybookCoverageLint.test.ts`. Do not add ignores or disable
rules.

## T1: Restore reliable MCP story execution

Purpose: trustworthy MCP execution. Objective: identify the actual child failure
without disturbing other processes. Goal: exact-ID, current-input component/a11y
results on cold, warm and repeated runs.

Priority P1; no package prerequisite. Estimate: human 0.5–2 days / agent 2–6
active hours; upstream waiting is separate. Diagnostic discovery is executable
now; a dependency/API/policy-sensitive repair requires a supported
evidence-backed addendum, not a guessed patch.

### Atomic slices and files

- T1a — Create `.storybook/storybook-test-target.ts` and
  `tests/unit/config/storybookEndpoint.test.ts`; modify
  `playwright.storybook.config.ts` and `tests/e2e/steps/storybook.steps.ts`.
  Export proposed resolveStorybookTestTarget({ url, serverMode, ci }) returning
  { baseURL, mcpURL, command, webServer }; default URL stays
  http://localhost:6006. Accept only http loopback hosts, valid ports, and no
  credentials/query/hash/subpath. Derive baseURL, MCP URL and
  `node --max-old-space-size=8192 ./node_modules/storybook/dist/bin/dispatcher.js dev --host HOST -p PORT --no-open`
  from the same validated target; HOST/PORT are validated resolver outputs, not
  string-built user input.
- T1b — Extend `tests/e2e/features/storybook/integrations/mcp.feature` and the
  same steps; create `tests/unit/storybook/mcpExecutionReceipt.test.ts` and
  `tests/unit/storybook/producerIdentity.test.ts` for structured-response
  fixtures and a proposed pure receipt normalizer exported by
  `scripts/storybook-coverage.mjs` after T2a. Until that helper lands, the
  integration scenario can assert raw structured fields; no dependency cycle is
  required.
- T1c — Capture startup cause; conditionally modify only reproduced responsible
  surfaces among `vitest.config.ts`, `vitest.storybook.config.ts`,
  `vitest.storybook.runtime.ts`, `.storybook/main.ts`. First extend
  corresponding `tests/unit/config/vitestTopology.test.ts`,
  `storybookVitestContract.test.ts` or `storybookRuntimePolicy.test.ts`.
  Existing VITEST_STORYBOOK direct config and init/standalone bridge are
  diagnostic inputs, not assumed fixes.

T1b child observation uses the existing configureVitest hook in
vitest.storybook.runtime.ts, confirmed in the current source. Add an opt-in
closure-only diagnostic there and tests in
tests/unit/config/storybookRuntimePolicy.test.ts: when the launcher supplies
STORYBOOK_CLOSURE_RECEIPTS and STORYBOOK_CLOSURE_FREEZE_ID, write a redacted
child record (process.pid/ppid/cwd, project identity, resolved configuration
evidence and freezeId) into the validated owned receipt directory. With either
env value absent, do no diagnostic IO. Refuse paths inside source inputs or
outside the owned receipt root, and never serialize arbitrary environment
variables. The launcher supplements OS creation time/parent-chain observations
and joins the record to the serial request window. Preserve existing coverage
exclusion and init/standalone behavior; diagnostic-only changes do not guess a
runner fix.

### Test-first steps and lifecycle

1. Add endpoint fixtures for default 6006, override 6007, invalid/nonlocal URLs,
   server modes and CI true/false. RED must expose wrong
   command/endpoint/lifecycle derivation. Managed mode lets Playwright start its
   own server on the resolved port; external mode omits webServer entirely,
   including in CI, because the integration owner starts/stops that instance.
   The default 6006 managed reuse behavior stays unchanged; reused-instance
   receipts require matching checkout/input identity.
2. Implement the resolver and replace **all** STORYBOOK_BASE absolute URL uses
   in the common steps with the resolved baseURL; browser, request client, MCP
   and failure links must agree. Set storybookTest.storybookUrl to the same
   target when diagnostic URLs are used; it is a debug/check URL, not the
   mechanism selecting child execution.
3. Verify ownership/free ports before executing: 6007 and configured
   runner 47005. If occupied by another owner, wait/report; never kill it. For
   diagnostic external mode, start the exact 6007 command above as a hidden
   owned process, record its PID/cwd, and clean only its descendants in finally.
4. Dedicated focused MCP Gherkin scenario timeout is 180 seconds, API request
   timeout 150 seconds; server readiness is separately bounded at 120 seconds.
   Keep the child's 30-second startup budget unchanged while diagnosing. The
   full catalogue is a separate T8 MCP run, not inside this focused BDD timeout.
5. Initialize session, send initialized notification, tools/list and tools/call
   using the advertised schema. Match JSON-RPC IDs, parse complete SSE events or
   JSON content according to Content-Type, and reject protocol
   error/isError/cancelled/absent structuredContent. Do not assume the first SSE
   data event is the final matching response. Save redacted stderr/nested
   FATAL_ERROR, cwd, loader, versions and timing.
6. First focused pair is the MCP-discovered SearchBox TypeAndSubmit and
   ProgressFileList CancelInvokesCallback. Compare requested IDs to successful
   per-ID component and a11y statuses under the shared receipt contract.
   Negative fixtures include one-of-two returned, duplicate status, unknown ID,
   no-stories, missing a11y, cancellation, unhandledErrors, absent optional
   timestamps, and absent public runId.
7. Implement/test RT7 producer identity in producerIdentity.test.ts and common
   MCP steps: same-ID/different-source, missing child provenance, PID reuse and
   wrong native URL must fail. Establish stable producer identity after the
   final freeze before qualifying requests; attach child provenance only after
   the cold request creates it and before accepting its result. Preserve the
   user-owned 6006 server; an alternate owned instance requires supported native
   connector binding, not only an env URL.
8. Compare fresh and resident lifecycle, selected config/project, Chromium and
   fixed ports. If fresh config succeeds, land only
   lifecycle/runbook/regression. If a repository defect is reproduced, change
   that layer with a failing/passing test. Upstream-only failure remains an
   explicit blocker with reproduction and supported fix path.

### Commands, expected result and exit

Run
`npm run test:unit -- tests/unit/config/storybookEndpoint.test.ts tests/unit/storybook/mcpExecutionReceipt.test.ts tests/unit/storybook/producerIdentity.test.ts`
after their dependencies exist. Expect intended negatives first, then all
fixtures passing. Run focused diagnostic BDD with environment restoration:

```powershell
$auditPriorUrl = $env:STORYBOOK_TEST_URL
$auditPriorMode = $env:STORYBOOK_TEST_SERVER_MODE
try {
  $env:STORYBOOK_TEST_URL = 'http://localhost:6007'
  $env:STORYBOOK_TEST_SERVER_MODE = 'external'
  npm run test:e2e:storybook -- --grep 'MCP execution' --workers=1
  if ($LASTEXITCODE -ne 0) { throw 'Focused MCP execution gate failed' }
} finally {
  $env:STORYBOOK_TEST_URL = $auditPriorUrl
  $env:STORYBOOK_TEST_SERVER_MODE = $auditPriorMode
}
```

External server readiness/ownership is established before this command; its
process cleanup surrounds the whole experiment. Pass requires cold single ->
warm pair -> repeat single exact-ID/a11y evidence, then T8 full catalogue. Roll
back only owned target/config slices if regressions appear. No runner success or
root cause is claimed during planning.

## T2: Replace family-name completion with recursive evidence

Purpose: trustworthy recursive coverage accounting. Objective: classify
source/export/state claims without treating imports as behavior. Goal: no
unexplained renderable exports, invalid references or stale execution evidence.

Priority P1. T2a/source tests can run alongside T1 diagnosis; live closure
depends on T1. Estimate: human 2–3 days / agent 6–10 active hours. Inventory
population/review is included, upstream waiting excluded.

### Atomic slices and files

- T2a — Create `ClientApp/src/storybook/coverageManifest.json`,
  `scripts/storybook-coverage.mjs`,
  `tests/unit/storybook/moduleCoverage.test.ts`. Implement the shared schema and
  three CLI modes as pure functions plus a guarded CLI entry; importing the
  module in tests must not run it or import app modules.
- T2b — Add the shared complete-input hasher, claim/reference validation and
  receipt normalizer and RT7 validators to the same module; create
  `tests/unit/storybook/evidenceFreshness.test.ts`,
  `tests/unit/storybook/inputFreeze.test.ts` and use T1b's producerIdentity and
  `mcpExecutionReceipt.test.ts`.
- T2c — Modify `tests/unit/storybook/coverageDrift.test.ts` and
  `scripts/verify-storybook-docs.mjs`; retain useful family checks but remove
  literal Complete as proof. Generated metadata is read once per build, not
  rebuilt per record.
- T2d — Create `scripts/storybook-coverage-eslint.config.mjs` and
  `tests/unit/config/storybookCoverageLint.test.ts` under the shared code-only
  lint contract. No changes to package.json, eslint.config.mjs, AGENTS or CI
  workflows are authorized.

### Test-first steps

1. Define schema/exits/claim keys and temp-directory fixtures first. Unit
   fixtures may synthesize index/receipts; synthetic data never qualifies as
   real execution evidence.
2. Inventory all handwritten .ts/.tsx files under components/routes excluding
   stories/tests/declarations/generated/vendor surfaces; inspect named/default
   exports, aliases/re-exports and memo/HOC wrappers with TypeScript's existing
   compiler API. Canonical identity is declaration-relative path plus export;
   ambiguous/unclassifiable entries fail unresolved. Avoid a general import
   resolver; MCP graph only suggests consumers.
3. Reject new nested modules, two renderable exports, deleted source/story/docs
   owners, path/case conflicts, duplicate claims, absent assertion
   export/marker, empty inventory, empty/all-unsupported renderable states,
   smoke-only baseline, invalid nonvisual reasons and a forwarding wrapper
   gaining behavior. A graph-matched conditional branch lacking reviewed
   observable evidence stays unverified even if another story passes.
4. Implement complete freshness and before/after input checks from the shared
   contract; test changed SCSS,
   validation/auth/storage/helper/asset/provider/config/manifest and
   receipt-write idempotence, patch-only mutation/add/delete, producer/install
   mismatch and enforced-freeze cases. Every qualifying gate must start after
   freeze and retain the same identity/digests; pre-freeze results fail
   INPUT_STALE even if they passed. Integration signoff identifies reviewed
   changed inputs; the checker verifies signoff identity, not the truth of a
   human judgment.
5. Populate all current candidates, including newly committed RhfForm-related
   exports. Keep failed/unreviewed rows visible. Direct, consumer, forwarding,
   nonvisual, unresolved, represented-state and verified-state counts are
   separate; source mode must not label them all verified.
6. Build/index checks validate real docs owner headings and explicit legacy IDs.
   Add generated MDX region tests for refusal on missing/duplicate markers and
   preservation of handwritten content.
7. Wire source validation into the existing unit drift test, reference
   validation into the existing docs verifier, and closure validation into T8.
   Missing generated index is an explicit references-mode input failure, never
   an empty success.

### Commands, expected result and exit

`npm run test:unit -- tests/unit/storybook/moduleCoverage.test.ts tests/unit/storybook/evidenceFreshness.test.ts tests/unit/storybook/mcpExecutionReceipt.test.ts tests/unit/storybook/producerIdentity.test.ts tests/unit/storybook/inputFreeze.test.ts tests/unit/config/storybookCoverageLint.test.ts`
must show targeted RED then all fixtures pass.
`node scripts/storybook-coverage.mjs --mode source` initially fails
EVIDENCE_MISSING for genuine gaps and ultimately exits 0 only when
classified/reviewed source obligations pass. Run the dedicated mjs lint command
from the shared contract.

Pass: schema, recursive inventory, negatives, complete freshness and lint
verified; runtime/documentation claims remain pending until T1/T3–T8 supply real
evidence. Rollback is scoped to owned validator/tests; never reinstate a
misleading 100% claim as the fallback.

## T3: Repair documentation ownership and verify formatting

Purpose: APIs describe the rendered owner. Objective: fix container/peer
ownership, Guard presentation and version attribution without changing
application behavior. Goal: correct API discovery, appropriate controls and
preserved IDs.

Priority P2. Requires T2 schema/index baseline; runtime/docs browser
verification requires T1, but metadata inspection/authoring may proceed
provisionally. Estimate: human 0.5–1 day / agent 2–4 active hours.

### Atomic slices, tests and edits

- T3a AutoSuggest — Modify
  `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggest.stories.tsx`. Keep
  components-inputs-autosuggest--loading; label AutoSuggestContainer explicitly
  and add its documented subcomponent API. Disable parent-only controls in that
  compatibility story; never wire getOptions or other parent args onto a
  different container API. Verify actual control edits affect the rendered owner
  before claiming controllability. If standalone controls/API ownership are
  required or MCP/generated docs omit the API, create
  `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggestContainer.stories.tsx`
  while retaining the legacy Loading example.
- T3b AcceptQuote — Modify
  `ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx`; describe the five
  entries as peer workflow steps rather than children of ReportRecipient.
  Subcomponent metadata is a docs-grouping mechanism, not a promise of
  independent peer controls. Preserve all titles/exports/IDs; expose each API in
  rendered Docs and MCP. If discovery fails, create
  `ClientApp/src/routes/acceptQuote/AcceptQuoteStepApis.docs.mdx` as the
  explicit peer reference, with supported API tables and links to unchanged
  named stories.
- T3c Guard — Compare MCP prose, generated metadata and rendered type/default
  cells. Keep `ClientApp/src/components/RouteLeavingGuard/index.tsx` and
  `types.ts` read-only diagnostic inputs unless a real source defect is
  reproduced. Add supported per-story/argType presentation only in existing
  Guard stories or explicit MDX if needed; an MCP-only serializer defect gets a
  versioned reproduction, not a source-type rewrite.
- T3d Version/runbook — Modify `.storybook/component-docs-guide.mdx`; state
  installed 10.6.1/current-line provenance and label historical investigations.
  The Storybook 9 heading is upstream instructions; record correction ownership
  and reproduction without claiming that project wording changes repair that
  tool output.

Before each slice extend `tests/unit/storybook/storybookDocsConfig.test.ts`,
`tests/e2e/features/storybook/autodocs-documentation.feature` and
`tests/e2e/steps/storybook.steps.ts` for the relevant failing
owner/control/default/ID behavior. Do not couple four unrelated corrections into
one unreviewable change. Storybook subcomponents have inferred argTypes and no
independent child controls; the documented constraints are acceptance
requirements. Request-producing Docs examples also follow T6b's frame-isolation
contract. Label noninteractive iframe Docs controls honestly and verify actual
controllability in single-story Canvas instead.

### Commands, expected result and exit

`npm run test:unit -- tests/unit/storybook/storybookDocsConfig.test.ts`, then
`npm run test:e2e:storybook -- --grep 'Documentation ownership' --workers=1`
after adding/approving scenarios with that title. Expect wrong/missing API owner
or controls behavior first, then all five step APIs plus container/Guard checks
pass. Requery MCP docs and run focused affected stories with a11y. Compare all
affected baseline IDs/content and require zero unintended removals.

Pass: correct owner/API and truthful controls in both interfaces, unchanged
runtime defaults and stable links. Upstream-only presentation/wording issues are
explicitly outstanding external defects, not fabricated local fixes; they do not
waive the MCP execution gate. Rollback preserves legacy exports.

## T4: Add stories for genuinely unrepresented shared components

Purpose: meaningful examples for the seven identified implementations.
Objective: obtain documented supported contracts and then author independently
testable examples. Goal: component API and applicable behavior/semantics are
discoverable and verified, not merely seven files.

Priority P2. T4a can proceed after T2 schema; story use requires approved
documented contracts, T3 ownership conventions and T1 focused execution.
Estimate: human 1–2 days / agent 4–8 active hours, excluding maintainer waiting.

### T4a — Documentation bootstrap before prop use

The component maintainer, coordinated by the integration owner,
supplies/approves the absent supported API contract; story authors do not infer
it from source types. Create `.storybook/undocumented-component-contracts.mdx`
as an unattached reference with exact import/export identity, approved API
table, supported composition, inherited-prop scope and approval provenance for
AriaButton, Link, SegmentedControl/Item, Sheet, AlertMessage, PageHeader and
StatusPill. No guessed props or guessed stories are rendered in this bootstrap
document. Publish via existing dev-server MDX discovery, obtain its real
docs-list ID, and query docs-show before using any listed prop. If approval is
absent, that component lane stays pending; no placeholder contract can pass.

Extend `tests/unit/storybook/storybookDocsConfig.test.ts` and the Documentation
ownership BDD to reject absent/unapproved contracts and missing required API
sections. Check current .storybook/main.ts's node_modules propFilter against the
approved inherited public API; empty tables are not proof of a prop-less
component. Prefer the explicit approved reference table; do not globally expose
all vendor props or change docgen policy without a reviewed narrow addendum. Add
links from the final component Docs entries to that reference as necessary.

### T4b–h — One story file per independently reviewed implementation

Create the seven exact T4 paths in Files and responsibilities, one slice at a
time. Use current MCP instructions, typed framework Meta/StoryObj and
storybook/test utilities; never hand-roll a second provider/router.

| Slice                 | Observable acceptance, limited to approved supported API                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| AriaButton            | Own implementation, keyboard activation, correct callback, disabled nonactivation and pending progress semantics                  |
| Link                  | Accessible name, keyboard activation and real destination; supported disabled/external affordances without external navigation    |
| SegmentedControl/Item | Initial/changed selection, keyboard movement, disabled item and callback payload; both exported APIs documented                   |
| Sheet                 | Approved children/trigger composition, accessible dialog name, open/close and focus return; do not assume overlay-prop forwarding |
| AlertMessage          | Title/body, approved tones and live/status semantics                                                                              |
| PageHeader            | Title alone, approved optional description/actions, long-content wrapping                                                         |
| StatusPill            | Readable label, approved tones and long-content semantics                                                                         |

Write play assertions for meaningful behavior or static semantics first; no fake
interaction for static components. Perturb the asserted fixture/condition and
demonstrate failure before trusting the passing play. Run focused MCP/a11y,
requery docs and update one manifest claim after each slice; inspect
375px/1280px wrapping and focus visibility. A product defect earns a separate
reproduction/proposal, not a story-only workaround.

ColorThumb, Content, ProgressCircle and Seperator stay in consumer stories if T5
proves the claim; no mandatory helper colocation. Pass requires approved
discoverable APIs, no unexplained inherited-prop loss, per-slice real
assertions/results and no suppressed a11y/act warning. Roll back only the
offending story/docs slice.

## T5: Validate and strengthen indirect coverage

Purpose: retain sufficient consumers. Objective: prove source/export/state
ownership in a real scenario. Goal: no import-only claim, duplicated gallery or
blanket colocation.

Priority P2. Depends on T2 and the relevant API contract; does not depend on
completion of all T4 components. Shared AcceptQuote edits follow T3; focused
verification uses T1. Estimate: human 1–2 days / agent 4–8 active hours.

### Atomic claim review

For each current source without a sufficient claim, record its candidate
consumer, rendered condition, supported action, observable consequence,
assertion locator, API heading and sufficiency rationale. The finite existing
consumer edit paths remain in Files and responsibilities; any additional path
must be named and justified in the manifest before authoring. New
RhfForm/controller exports are inventoried and reviewed rather than silently
omitted.

One slice is one state claim, not an entire gallery. Use named stories or
well-scoped play steps so failures identify the owner. Add a dedicated story
only if no consumer can demonstrate the required contract. For helper branches,
drive the enabling condition and prove a negative control (wrong condition or
removed expected behavior makes the assertion fail); do not add a
mutation-testing framework.

### Required family acceptance and candidate consumers

Paths below are candidates under `ClientApp/src`, not sufficiency claims. Review
the actual source/export/state and generated ID before accepting them. An
unrendered conditional branch fails even when another consumer passes; no family
row grants a blanket exemption.

| Family                                          | Required applicable observable contract                                                                 | Existing candidate story source                                                                                                                                                                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ButtonGroup/EditButton/LinkButton               | Keyboard action, callback payload or real destination                                                   | components/Buttons/ButtonBreadth.stories.tsx                                                                                                                                                                                                                                      |
| Details/FormikForm/HidableField/RhfHidableField | Label/error/summary, visibility transition and value retention as supported                             | components/forms/Forms.stories.tsx; routes/ta/organisationAndContact.stories.tsx                                                                                                                                                                                                  |
| SubmitFormButton/SaveAndExitButton              | Valid/invalid/in-flight state and save outcome through the owning provider                              | components/forms/WizardForm/WizardForm.stories.tsx; components/forms/FormBanner/FormBanner.stories.tsx                                                                                                                                                                            |
| UnsavedFormPrompt and RHF counterparts          | Dirty navigation blocked, cancel retains values, confirm proceeds; refresh limits explicit              | components/forms/WizardForm/WizardForm.stories.tsx; components/RouteLeavingGuard/RouteLeavingGuard.stories.tsx                                                                                                                                                                    |
| CommonForms ContactDetails/Formik and RHF       | Populated context, editable fields/validation and summary                                               | components/forms/Forms.stories.tsx; routes/ta/organisationAndContact.stories.tsx                                                                                                                                                                                                  |
| Checkbox/Radio/Select/Text/Number/ReadOnly      | Owned value/callback/disabled/readonly/validation behavior                                              | components/Inputs/Inputs.stories.tsx; routes/preConditions/PreConditions.stories.tsx                                                                                                                                                                                              |
| Organisation/Certificate/Address/AutoSuggest    | Deterministic lookup, selection, loading/zero-results/manual address where supported                    | components/Inputs/Inputs.stories.tsx; components/Inputs/AddressLookup/AddressLookup.stories.tsx                                                                                                                                                                                   |
| BranchSelector/Confirmation/RFQDelete/Terms     | Real modal open/action/cancel, focus/keyboard and state outcome                                         | components/modals/Modals.stories.tsx; routes/acceptQuote/AcceptQuote.stories.tsx                                                                                                                                                                                                  |
| ColorThumb/Content/ProgressCircle/Seperator     | Actual helper rendered, meaningful accessible semantics/value and exact API heading                     | components/AriaComponents/ColorArea/ColorArea.stories.tsx; components/AriaComponents/Dialog/Dialog.stories.tsx; components/AriaComponents/Popover/Popover.stories.tsx; components/AriaComponents/Button/Button.stories.tsx; components/AriaComponents/Toolbar/Toolbar.stories.tsx |
| New/changed RHF shell and shared wrappers       | Approved public contract, owning provider/context and applicable error/intent/slot/dirty-state behavior | Review current components/forms/Forms.stories.tsx, WizardForm/WizardForm.stories.tsx and FormBanner/FormBanner.stories.tsx first; unresolved exports need a named sufficient consumer or an explicitly proposed dedicated path                                                    |

All candidate paths are relative to ClientApp/src; the abbreviated RHF final-row
paths are within components/forms, not new assumed files. Preserve SearchBox's
exact Enter callback and ProgressFileList's cancel callback/visible state
assertions. Static helpers need semantic assertions, not fake actions. Canvas
queries stay scoped; genuine portal queries uniquely identify the relevant
overlay.

### Tests, commands and exit

Before changes extend affected existing story plays and, where cross-story reset
is involved, `tests/e2e/features/storybook/forms/forms-coverage.feature`,
`modals/modals.feature` or `components/breadth.feature`, with steps in
`tests/e2e/steps/storybook.steps.ts`. Add scenario title
`Indirect evidence isolation` for sequence A -> B -> A: verify
handler/spies/session/provider state restore, no stale dialog, no doubled
request and no late unmount update. Await visible settled state; cleanup
deferred work and temporary mocks in beforeEach teardown/finally. No
sleeps/networkidle-based assertion success or act suppression.

Run focused MCP on each discovered story with a11y, source validator and
`npm run test:e2e:storybook -- --grep 'Indirect evidence isolation' --workers=1`
after the scenario exists. Expected RED is missing consequence or leaked state;
expected pass is exact payload/state plus clean repeated execution. Static
source checks alone cannot pass a behavioral claim.

Pass: reviewer accepts each retained consumer and its API owner, required states
have current results, and irrelevant provider/guard behavior is explicitly
excluded. Rollback only the strengthened consumer slice; leave unresolved claims
failing rather than inventing an exemption.

## T6: Cover missing nested route entry points

Purpose: prove route entry/bootstrap behavior beyond leaf steps. Objective:
exercise real wrapper mutation, validation, confirmation and navigation locally.
Goal: correct request and returned data are consumed by the destination without
live side effects.

Priority P2. T6a/T6b shared capabilities land before route authors start; T6c
routes need T2, relevant docs and T1. No dependence on all T4. Estimate: human
2–3 days / agent 6–12 active hours; ten entry points are separate slices, not
one commit.

### T6a — Destination capability

Modify `.storybook/preview.ts`, `ClientApp/src/storybook/storybookHarness.tsx`
and `ClientApp/src/storybook/storybookFixtures.ts`; create
`tests/unit/storybook/routeHarness.test.tsx` and
`tests/e2e/features/storybook/routes/route-harness.feature` with existing common
steps. Extend typed portal parameters with
`destinationRoutes: Array<{ path: string; element: ReactNode }>` and optional
`observeLocation: (location: { pathname: string; params: Record<string, string | undefined> }) => void`.
This is a proposed interface, not existing API. Put an observer as a parent
route with an Outlet; the initial Story and exact destination routes are
children of the **same** memory router. Use React Router matching, not a
hand-written order router; exact patterns must win over wildcard and the
observer must use the matched destination's params. Create the router once per
mounted story, not on every args rerender.

First test default stories unchanged, real initial params, destination matching,
wrong returned reference, wildcard fallthrough, args rerender, navigation before
response settles, observer cleanup and absence of nested routers. Prefer real
destination content; a labeled test outlet can prove consumed path/params but is
excluded from claims about that destination's production behavior.

### T6b — Fail-closed isolation

Modify `.storybook/msw-policy.ts` and existing preview/preview-setup only for
reproduced gaps; extend `tests/unit/config/storybookMswPolicy.test.ts`,
`tests/unit/storybook/mswHandlers.test.ts` and route-harness BDD. Keep installed
MSW v3 onUnhandledFrame API; do not paste v2 initialize/loader patterns. Await
worker readiness before request-producing route mounts. Register explicit local
asset/tooling bypasses, block every unmatched application HTTP origin/path, stub
token acquisition and telemetry, and prove a deliberately missing API handler
causes a blocked request and failed scenario. Verify supported no-service-worker
test setup separately; no fallback may contact a real service. Global fetch
overrides must restore even on failure and cannot overlap multiple Docs stories;
prefer per-story MSW handlers.

RT5 startup pressure: extend the same MSW unit tests and Route harness BDD with
delayed activation, rejected worker.start, eager import, loader-before-mount and
supported no-service-worker cases. Before navigating/importing these controlled
negative fixtures, install an inert transport/network-denial harness so even a
failing test cannot reach a real endpoint. Assert application transport-attempt
and live-send counters separately: eager attempts are captured/rejected before
readiness, live-send count is zero, and a startup rejection prevents
request-producing execution and fails the scenario. A post-mount missing-handler
test alone is insufficient. In production-like story execution, no eager
application request may precede the effective mock boundary; any reproduced
import-time side effect requires a named responsible-module/test addendum before
editing app code, never a warning suppression or allowlist expansion.

RT6 Docs isolation: extend tests/unit/storybook/mswHandlers.test.ts,
tests/unit/storybook/routeHarness.test.tsx, autodocs-documentation.feature,
route-harness.feature and common steps. For the actual request-producing
examples in the finite T5/T6/T7 file lists, use supported per-story
parameters.docs.story.inline: false so each Docs example has its own frame and
worker/handler lifecycle; do not change the global inline default or clone
Autodocs. Maintain story-owned handlers and cleanup inside that frame, never a
document-global fetch override. Frame isolation is a candidate mechanism, not
automatic proof: overlap A/B frames against the same endpoint with conflicting
sentinel responses, unmount A while B requests again, then reverse order. Assert
A never consumes B's fixture, B retains its handler after A cleanup, no
duplicate request and zero unmatched/live sends. Exercise the real generated
Docs page, not only synthetic fixtures. Test provider/session cleanup too;
same-origin shared storage is not made isolated merely by using iframes. If
isolation fails, the lane remains pending until a narrow supported fix passes;
do not silently serialize or remove stories and still claim the concurrency
test. Docs iframe controls cannot update that example in the current Storybook
line; label this limitation, disable inapplicable Docs controls and link to the
unchanged single-story Canvas for interactive controls, consistent with T3. See
[Story Doc Block inline behavior](https://storybook.js.org/docs/api/doc-blocks/doc-block-story).

### T6c — Ten independently reviewable route slices

Use proposed paths from Files and responsibilities only when no consumer proves
the wrapper's obligations. Registered initial patterns below are verified
against App.tsx; nested destination patterns and exact generated-client
payload/response contracts are copied from the responsible route's current
implementation into typed fixtures before writing the scenario, not guessed from
a folder name.

| Entry module under ClientApp/src/routes | Registered initial route        | Required outcome                                                                                                 |
| --------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| acceptQuote/create                      | /accept-quote-create/:id/*      | Pending; quote lookup/create; returned reference consumed at report-recipient destination; failure characterized |
| account/addBranch                       | /add-branch/*                   | Real wizard; confirmation cancel/confirm; completion destination                                                 |
| account/create                          | /create-account/*               | Invalid submit; create confirmation; returned account/completion data                                            |
| account/update                          | /update-organisation/:id/*      | Loaded values/save/cancel; malformed/nonpositive ID -> not-found                                                 |
| contact/create                          | /create-contact                 | Real wrapper; validation/confirmation; current completion behavior                                               |
| contact/update                          | /update-contact/*               | Existing data; confirmation/cancel; completion                                                                   |
| requestForQuote/copy                    | /request-for-quote-copy/:id/*   | Correct source copied; returned organisation/contact destination; rejection characterized                        |
| requestForQuote/create                  | /request-for-quote-create       | Pending; exact request; returned destination consumes new ID                                                     |
| ta/create                               | /ta/type-approval-create        | Pending; returned organisation-details ID; duplicate-request behavior                                            |
| ta/created                              | /ta/type-approval-success/:id/* | Submitted reference; dashboard button/link; session tab selection                                                |

Each fixture records guard, account/session, params and owning form provider. Do
not wrap a self-owned wizard form in another form. No global useNavigate mock.
Assert token/client request and relevant payload, request count as required by
the actual mount contract, settlement, returned reference, final content and
cleanup. For create/copy routes, explicitly test args rerender,
cancellation/unmount and repeated A -> B -> A to catch fabricated double
mutations. Add invalid/confirmation focus associations/return and existing
navigation announcement where owned; record unsupported/defective behavior
rather than designing new UX.

### Commands and exit

`npm run test:unit -- tests/unit/storybook/routeHarness.test.tsx tests/unit/config/storybookMswPolicy.test.ts tests/unit/storybook/mswHandlers.test.ts`;
`npm run test:e2e:storybook -- --grep 'Route harness' --workers=1`; then focused
MCP per real route story and source validation. Expected RED is wrong
params/navigation or live/unmatched request behavior, then tests pass before ten
route consumers are integrated.

Pass: no live escape, shared harness regressions pass, every route obligation
has reviewed evidence/current execution, and known spinner defects remain
distinct. Revert dependent T6 route and affected T7 shell/consumer slices first,
then the regressed T6a/T6b capability, or revert the entire dependency group
atomically. Never remove the harness before retained consumers. Record the
capability-to-consumer list in integration signoff; test each intermediate
rollback state and rerun baseline harness/network tests. Retain fail-closed
isolation during rollback; stop execution if restoring it requires work outside
the owned group. Do not change App.tsx/auth/production APIs.

## T7: Cover route shells and retain adequate existing route stories

Purpose: prove shell orchestration while reusing adequate
child/success/auth/summary examples. Objective: verify only shell-owned params,
selected steps, navigation, notifications and chrome. Goal: no shell gap or
duplicated child claim.

Priority P2. Depends on T2 and T6a/T6b capabilities **only where used**, not
completion of ten T6 routes. Parallel shell authoring is allowed after shared
capabilities merge; browser verification remains serial. Estimate: human 1–2
days / agent 4–8 active hours.

Five independent conditional story paths remain in Files and responsibilities.
Verified shell patterns are acceptQuote `/accept-quote/:id/*`, requestForQuote
`/request-for-quote/:id/*`, ta `/ta/:id/*`, quotation `/quotation/:id/*`, and
measurementReport `/report/:id/*`. For each, first list shell-owned outcomes and
actual dependencies. Use real child routes where practical; any fixture outlet
is labeled and cannot earn child/auth/production-integration coverage.

Test loaded/failed lookup, selected step/reference/title, invalid initial path,
notification and save/unsaved behavior only where owned. Before the story change
extend `tests/e2e/features/storybook/routes/routes-coverage.feature` and common
steps with title `Route shell ownership`. Capture named request/result
assertions and include a wrong-ID or failed-child fixture so shell evidence
cannot pass by merely rendering a title.

For `ClientApp/src/routes/ta/manage/index.tsx`, forwarding equivalence refers to
AppDetails with the same inputs and absence of additional owned behavior, not
exact formatting/variable names. Add fixtures to `moduleCoverage.test.ts`
accepting formatting/alias-only changes and rejecting new hooks/conditions/side
effects until consumer sufficiency is re-reviewed. A rejected forwarding
exemption does not force a local file if an existing consumer proves the new
behavior.

Retain account/created, RFQ/created, summary subfolders and sign-out/helper
using current MCP-discovered IDs. Verify actual auth/loading/completion and
summary states; mocked authentication excludes real B2C integration from the
claim. Requery IDs instead of relocating files.

Run source validator, focused MCP/a11y,
`npm run test:e2e:storybook -- --grep 'Route shell ownership' --workers=1`, and
unit forwarding/harness regressions. RED is missing shell consequence/wrong
consumed reference; pass is isolated actual outcome and preserved child
examples. Rollback one shell story at a time; include dependent shells in T6's
consumer-first or atomic-group rollback. Test a retained consumer would reject a
removed destinationRoutes capability, and the corrected rollback ordering leaves
no incompatible consumer. No production router rewrite.

## T8: Publish accurate coverage evidence and run closure gates

Purpose: reproducible honest closure. Objective: reconcile source, docs,
reviewed claims and executed results from one frozen input set. Goal: no
misleading 100% or durable-CI claim.

Priority P1 acceptance gate; depends on all required obligations, not creation
of every proposed file. Estimate: human 1–2 days / agent 4–8 active hours for
verification/reporting; remediation discovered during closure is separately
estimated, not hidden in this allowance.

### Atomic closure sequence

T8a creates the shared RT7 closure launcher and closureOrchestration.test.ts
before using the entry command. Start with intended failing fake-adapter tests
for absent cleanup, pre-freeze gates, wrong/stale handoff and cold-child
ordering; implement the narrow orchestrator and run
`npm run test:unit -- tests/unit/storybook/closureOrchestration.test.ts tests/unit/storybook/producerIdentity.test.ts tests/unit/storybook/inputFreeze.test.ts tests/unit/storybook/mcpExecutionReceipt.test.ts`.
Then run the task-scoped mjs lint including the launcher and the owned-copy
ACL/clean-build integration test before T8b's actual serial closure.

1. The integration owner rebaselines the current integration commit, reviewed
   lockfile/install, recursive exports, existing IDs, versions, known defects
   and changed-input review. Preserve user changes and verify any reused
   server's checkout identity; otherwise use the owned instance.
2. Add/approve closure BDD negatives before implementation in
   `tests/e2e/features/storybook/routes/routes-coverage.feature` and
   `autodocs-documentation.feature`; unit negative fixtures live in
   moduleCoverage/evidenceFreshness/mcpExecutionReceipt tests. Assert false
   passes fail for stale input, dropped result, skipped required claim, missing
   API owner or changed legacy content.
3. Preparation is non-qualifying: optionally run diagnostic checks, build the
   full catalogue, validate references and generate the three inventory MDX
   regions with --write-inventory. Update handwritten docs/walkthrough; rebuild
   and recheck references. Finish all source edits, reviewedSourceDigest
   metadata and install/patch verification before freeze. Then enforce RT7 write
   denial, record freezeId/producer identity, and rerun every qualifying
   type/lint/unit/ source/build/reference gate on those final inputs.
   Pre-generation or pre-freeze results cannot qualify closure. No source edits
   or --write-inventory run after freeze; a required change releases the owned
   freeze, invalidates all qualifying receipts and restarts preparation.
4. Compute expected executable IDs using current generated index and actual
   effective test tags/policy. Every skip/exclusion has a reason and replacement
   evidence or fails its required claim. Keep smoke-only stories separate from
   meaningful asserted states; full test execution alone is not 100% behavior
   coverage.
5. Run cold single, warm focused pair, full catalogue and repeat single through
   MCP, a11y enabled, serially. Validate exact per-ID structured statuses and
   errors under T1's contract; save raw redacted structured results plus
   normalized receipts. Do not require optional fields or count skipped tests as
   passing. Rehash before/after each gate.
6. Run rendered Docs verification and Storybook BDD serially, then affected app
   BDD when harness/runtime compatibility can affect route flows. MCP contract
   evidence is not replaced by shell story tests. Full UI testing and Docs
   testing are separate gates; a docs-only build does not substitute for the
   full build.
7. Integration signoff reconciles numerator/denominator,
   direct/consumer/forwarding/nonvisual/unresolved, applicable/not-supported
   states, executed/smoke/skipped/excluded stories and known defects. Publish
   MCP review of all newly created/changed stories after required tests; do not
   upload to Chromatic or deploy. If review publishing crosses a new external
   destination, request authority first.
8. This plan makes a **local integration closure** claim. Source drift
   validation is enforced through existing unit tests and reference checks
   through the docs verifier when invoked. Existing test:ci does not
   automatically run MCP/Docs/BDD closure; do not call those CI-enforced.
   Changing .github workflows or root gate policy is a separate explicitly
   approved task.

### Frozen build indexes

After the qualifying full rebuild in gate5, while inputs remain frozen, run
`New-Item -ItemType Directory -Path 'reports/storybook-coverage' -Force | Out-Null`,
then:
`Copy-Item -LiteralPath 'storybook-static/index.json' -Destination 'reports/storybook-coverage/frozen-full-index.json'`.
Gate5 reference checks, gate6 MCP expected IDs and every receipt use this
snapshot's canonical fullIndexDigest. Never substitute index.json from a
docs-only build.

After gate7's docs build/verifier, snapshot:
`Copy-Item -LiteralPath 'storybook-static/index.json' -Destination 'reports/storybook-coverage/frozen-docs-index.json'`.
The closure CLI requires both files, recomputes their canonical fingerprints,
and validates documentation with the docs snapshot while execution eligibility
always comes from the full snapshot. The snapshot copy operations are
implementation-time build artifacts, not writes performed during this plan
update.

Before implementing this join, add fixtures to
evidenceFreshness/mcpExecutionReceipt/moduleCoverage tests for full-index tags
changed with IDs unchanged, missing snapshots, corrupted snapshot, wrong
fullIndexDigest, pre-freeze type/lint/unit/source results, generated docs
changed after early diagnostic gates, patch-only drift, producer/native URL
mismatch, write-denial failure, docs-build membership differing legitimately,
and a stale full snapshot from another source freeze. Legitimate docs-build
membership differences never redefine required execution; required
Docs-owner/link checks still must pass.

### Exact gate commands and results

Preparation commands, before qualifying gates: `npm run build-storybook`;
`node scripts/storybook-coverage.mjs --mode references --index storybook-static/index.json --write-inventory`;
finish handwritten edits; `npm run build-storybook`;
`node scripts/storybook-coverage.mjs --mode references --index storybook-static/index.json`.
Any checks here are diagnostic only. Acquire/test the RT7 freeze, compute final
inputDigest/producerIdentityDigest, and establish native MCP binding.

Run the following qualifying gates only after freeze. The explicitly assigned
scripts/storybook-closure.mjs launcher records gate start/end identity and
digests for every command, rejects pre-freeze receipts, and stops on the first
nonzero gate or changed identity:

1. `npm run type-check`
2. `npm run lint`; `npm run lint:mdx`; dedicated coverage mjs lint command from
   shared contract
3. `npm run test:unit -- tests/unit/storybook tests/unit/config/vitestTopology.test.ts tests/unit/config/storybookVitestContract.test.ts tests/unit/config/storybookRuntimePolicy.test.ts tests/unit/config/storybookMswPolicy.test.ts tests/unit/config/storybookEndpoint.test.ts tests/unit/config/storybookCoverageLint.test.ts tests/unit/e2e/routeCoverage.test.ts`
4. `node scripts/storybook-coverage.mjs --mode source`
5. `npm run build-storybook`; `node scripts/verify-storybook-docs.mjs`;
   `node scripts/storybook-coverage.mjs --mode references --index storybook-static/index.json`;
   snapshot frozen-full-index.json and bind its fingerprint to the current
   freeze/producer. No source generation or handwritten edit in this gate.
6. Native MCP cold/warm/full/repeat test-run with a11y, then
   `npm run test:e2e:storybook -- --workers=1`; then `npm run test:e2e:app` if
   affected as above
7. `npm run storybook:verify:docs` (separate docs build/verifier, no concurrent
   full-output writer); compare IDs and confirm source input digest unchanged
8. `node scripts/storybook-coverage.mjs --mode closure --index reports/storybook-coverage/frozen-full-index.json --docs-index reports/storybook-coverage/frozen-docs-index.json --receipts reports/storybook-coverage`

Expected results are exit 0, zero unexpected diagnostics and zero failures,
nonempty exact expected results, current inputs and all required claims/docs
owners satisfied; raw test counts are measured, never fixed historically. The
final docs build replaces static output, so capture and compare the full-build
index before it: require identical relevant story/docs IDs or reject the
mismatch before final closure. If any source/API/runtime or fixture change is
needed, invalidate receipts, repair under the responsible package and restart
all qualifying gates from a new freeze; earlier diagnostic passes are not
reused.

Exit: accurate local coverage report, explicit upstream/known-product defects
and no unresolved required claim. Report planned tests separately from actual
execution. Rollback only owned changes; do not reset the workspace, weaken
a11y/act policy, commit user files or claim a failing gate passed.

## Safety, rollback, and verification

All story network traffic is mocked. Browser navigation stays within the local
router, except a deliberate test of an external-link affordance without opening
a production service. Roll out in reviewable commits: T1 runner; T2 evidence
gate; T3 docs; T4 components; T5 consumer assertions; T6/T7 route evidence; T8
docs/closure. Commit only owned files after checks; no commit or push is
performed during planning. Rollback is a scoped revert of the corresponding
implementation commit(s), retaining prior stable story IDs and reverting
consumers before prerequisites (or their complete dependency group atomically).
Restore the previous supported config if runner changes regress; do not reset
the worktree or restore user files. No build while a suite is writing to the
same static output. One browser suite at a time prevents 47005 conflicts and
false startup diagnoses. No completion if MCP startup is still broken, a11y is
disabled, a story is failing, or an exported renderable is unexplained.

## Execution order and parallel lanes

`(T2a/source || T1a/diagnosis) -> T3; T4a contract bootstrap -> component slices; T6a/T6b -> independent T6 routes and T7 shells; T5 claims follow their relevant contracts; T8 serial closure waits for all required obligations`.
Independent docs/story work may proceed provisionally while execution is
blocked; verified completion still requires T1 and the final MCP gates.

Component and nested-route story authoring may use isolated worktrees after the
harness/manifest contract lands. One integration owner merges manifest/docs and
performs browser validation serially. T3/T5 share AcceptQuote stories; T6/T7
share routing harness; those edits remain sequential. Reconciled revision
estimate: roughly 9–17 engineer-days / agent 3–6 active working days, allowing
component/route authoring overlap but serial browser integration.
Upstream/maintainer waiting and newly discovered remediation are separately
reported. These are planning ranges, not guarantees.

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
| D27 | Revision | Managed/external target modes including CI                         | Mechanical     | Explicit       | Command, browser and MCP must agree                                   | URL-only override                          |
| D28 | Revision | Validate installed structured MCP fields                           | Mechanical     | Explicit       | Per-status IDs and a11y establish execution                           | Assumed public runId                       |
| D29 | Revision | Complete inputs and length-framed canonical digest                 | Mechanical     | Completeness   | Styles/imports/config changes invalidate old receipts                 | Partial hash or ambiguous framing          |
| D30 | Revision | Approved Docs bootstrap before prop use                            | Mechanical     | Explicit       | Missing API has a named owner/publication path                        | Guessed design-system props                |
| D31 | Revision | Family table plus individual claim evidence                        | Mechanical     | Completeness   | Restore finite obligations without blanket exemption                  | Imported gallery treated as covered        |
| D32 | Revision | Shared route capabilities precede consumers                        | Mechanical     | Pragmatic      | Stable router and fail-closed isolation need regressions              | Coupled ten-route authoring                |
| D33 | Revision | Freeze separate full/docs indexes                                  | Mechanical     | Explicit       | Docs build cannot redefine executed membership                        | Overwritten index as execution authority   |
| D34 | Revision | Task-scoped code-only mjs lint                                     | Mechanical     | Pragmatic      | Check new scripts without changing root policy                        | Unlinted validator or gate expansion       |
| D35 | Revision | Independent per-package threshold                                  | Mechanical     | Explicit       | Each package exceeds95; average is insufficient                       | Raising scores without revising content    |

## CEO review history: strategy and scope (2026-10-14)

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

### Historical independent strategy challenge (2026-10-14)

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

## Design review history: catalogue usability (2026-10-14)

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

## Engineering review history: architecture and proof (2026-10-14)

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
  engine: digest sorted paths and byte contents of handwritten all
  ClientApp/src, public/media assets, .storybook, scripts/tests and root
  configuration/lock inputs under the revised shared freshness contract.
  Canonicalize only reviewedSourceDigest metadata; receipts are outside inputs.
  Every input change invalidates the closure receipt and affected claims are
  manually reviewed; if reliable dependency attribution is absent, rerun/review
  the whole scope. No unsupported graph freshness API is assumed; MCP reverse
  graph is a candidate aid only.
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

## Developer-experience review history (2026-10-14)

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
evidence. The earlier document reviewer approved 97/100 on 2026-10-14. That
historical document-quality score is not the revised per-package readiness
assessment or proof of executed tests.

### Historical implementation-task aggregation (2026-10-14)

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

## Current implementation-task aggregation — 2026-10-15

These supersede the historical aggregation above. Exact active files and atomic
slices are specified within T1–T8 and the new per-phase JSONL artifacts; prior
estimates/file lists are not execution instructions.

| Package | Priority | Human / agent active effort | Obligation                                                                     |
| ------- | -------- | --------------------------- | ------------------------------------------------------------------------------ |
| T1      | P1       | 0.5-2 days / 2-6 hours      | Diagnose and restore exact-ID MCP story execution                              |
| T2      | P1       | 2-3 days / 6-10 hours       | Replace folder-name proxy with recursive reviewed evidence                     |
| T3      | P2       | 0.5-1 day / 2-4 hours       | Clarify container/step APIs and verify Guard/default/ID presentation           |
| T4      | P2       | 1-2 days / 4-8 hours        | Add seven missing component examples with behavior and a11y                    |
| T5      | P2       | 1-2 days / 4-8 hours        | Review and strengthen indirect assertions without duplicate stories            |
| T6      | P2       | 2-3 days / 6-12 hours       | Cover ten nested route obligations; create files only for real gaps            |
| T7      | P2       | 1-2 days / 4-8 hours        | Cover shell obligations and retain sufficient success/auth/summary examples    |
| T8      | P1       | 1-2 days / 4-8 hours        | Publish generated inventories, run closure gates and document focused workflow |

Artifacts:
C:/Users/gregm/.gstack/projects/gmtestandreview-portalsample/tasks-ceo-review-20261015-storybook.jsonl;
tasks-design-review-20261015-storybook.jsonl;
tasks-eng-review-20261015-storybook.jsonl;
tasks-devex-review-20261015-storybook.jsonl. The latter three filenames are in
the same directory. No artifact marks implementation complete.

The user's checkout advanced through 97af7a41 to 9a8575b2 during these reviews,
and source/story changes continue independently. That is recorded provenance,
not this agent's implementation; rebaseline all source/docs claims and preserve
the user's work before executing.

## GSTACK REVIEW REPORT

Updated 2026-10-15. Scope: all eight packages, the companion test plan, current
task artifacts, scorecard and pressure retest. No
application/configuration/story implementation was performed.

The earlier Pauli review (T1–T7 100; T8/document 99) is historical. Subsequent
Red Team pressure review found patch freshness, gate sequencing, minimum-state,
rollback, startup, concurrent Docs and producer/freeze issues; those findings
override the earlier unconditional readiness statement. RT1–RT7 now specify
corrections and their test-first acceptance.

Current evidence is recorded in
[pressure retest](2026-10-15-storybook-pressure-retest.md) and
[scorecard](2026-10-15-storybook-work-package-scorecard.md). Their
document/model results must not be described as implemented validator, Storybook
runner, actual ACL enforcement or accessibility results. Independent
reassessment is recorded after the last substantive correction; no second-model
agreement is implied.

Final artifact verification: secret scans; focused Prettier; seven-finding
traceability and 24 Green/Amber/Red contract checks; bounded counterexample
models; per-phase JSON parsing/eight unique task IDs; exactly one terminal
report; diff whitespace and unchanged application source. All checks must be
rerun after relevant edits. Runtime/install/permission/maintainer prerequisites
remain mandatory before implementation closure.

VERDICT: PLANNING RECOMMENDATIONS APPLIED; RETEST EVIDENCE AND CURRENT SCORES
ARE IN THE LINKED ARTIFACTS. Sufficient indirect coverage remains accepted.
Rebaseline the moving checkout before execution. No implementation, Storybook
coverage or runtime test-success claim is made.
