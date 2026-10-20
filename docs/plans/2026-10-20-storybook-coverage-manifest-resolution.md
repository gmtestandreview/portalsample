# Storybook coverage manifest resolution plan

## Status

Phase 0 and Phase 1 are verified. Phase 2 is in progress with 46 accepted claims
across 22 reviewed batches. The CommandPalette accessibility experiment and its
reviewed manifest claim pass the component-local path, while the overall
source-coverage queue and exact closure receipt remain open. Overall status:
`PARTIALLY VERIFIED`.

The final closure criteria are not yet satisfied: source mode currently reports
621 remaining `EVIDENCE_MISSING` diagnostics and exits 1. No other source-mode
diagnostic classes are currently reported.

### Current status update — 2026-10-20

The following status supersedes stale interim counts elsewhere in this plan:

- Phase 2 accepted 35 additional claims across 16 reviewed batches during the
  latest continuation, increasing the accepted total from 10 to 45 and reducing
  source-mode `EVIDENCE_MISSING` diagnostics from 657 to 622.
- The reviewed CommandPalette direct claim was then added with the current
  source digest, generated docs/story IDs, and the `Example.play` assertion;
  source mode now reports 621 remaining diagnostics and no missing claim for the
  renderable `CommandPalette` export. `CommandPaletteProps` remains separately
  unclaimed.
- The focused validator suite for the current continuation passed 5 files and
  29 tests; the exact CommandPalette, Menu, and Modal MCP stories passed with
  accessibility enabled.
- Manifest JSON parsing, targeted story linting, coverage-script linting, and
  `git diff --check` passed. The Storybook build also completed with exit 0.
- The prior Actions/RequestList role regression was corrected. Before this
  continuation, the full unit suite passed with 249 files and 2,814 tests; a
  fresh full-suite run after the latest Phase 2 changes has not yet been
  performed.
- The CommandPalette batch was initially rejected and rolled back after three
  targeted accessibility corrections failed. No CommandPalette claims were
  added during that rejection.
- The approved component-local experiment then added the documented
  `disableVirtualFocus` prop and a Storybook play assertion. The open-state
  browser trace now reports no `scrollable-region-focusable` violation; the
  search input has no `aria-activedescendant`, the menu is keyboard-accessible,
  Tab moves focus to the first menu item, and Escape restores focus to the
  trigger. No shared Menu, Modal, or CSS contract was changed.
- The manifest contains one reviewed CommandPalette claim, and the focused MCP
  run exercises the open state through the play assertion rather than only the
  previously closed default render. Storybook build, focused MCP tests for
  CommandPalette/Menu/Modal, focused closure-validator tests (5 files, 29
  tests), and targeted lint pass. The repository type-check still exits 2 only
  for the unrelated existing `ComboBox.stories.tsx:31` error.
- The closure digest boundary was corrected to accept byte-view input for the
  canonical manifest; the regression test observed the intended RED failure and
  now passes. The managed closure launcher still cannot produce a receipt: its
  freeze ACL causes `EPERM` while enumerating `ClientApp/src`, and the raw MCP
  endpoint returns no required `structuredContent` execution result. No passing
  receipt was synthesized.
- Independent review remains `NOT VERIFIED`: the first reviewer attempt hit a
  usage limit and the retry timed out without findings.

## Objective and success criteria

Resolve the 668 initial `EVIDENCE_MISSING` diagnostics produced by:

```text
node scripts/storybook-coverage.mjs --mode source
```

The initial cause was confirmed:
`ClientApp/src/storybook/coverageManifest.json` contained an empty `records`
array. The resolution must first prove that the discovery denominator is
correct, then create reviewed claims for every accepted discovered export while
distinguishing renderable UI exports from reviewed nonvisual exports. It must
not turn the manifest into a list of unverified or guessed Storybook IDs.

The work passes only when all of the following are true:

1. Source mode exits 0 and reports no `EVIDENCE_MISSING`, `SOURCE_UNRESOLVED`,
   `CLAIM_DUPLICATE`, or `MANIFEST_SCHEMA_INVALID` errors.
2. The discovered-export denominator is captured in a deterministic worklist,
   reviewed by category, and explicitly accepted before manifest population.
   Every export in the accepted denominator has exactly one canonical manifest
   claim. Any discovery correction produces a new worklist and review; no export
   is silently omitted.
3. Every renderable claim has at least one meaningful required baseline state,
   an actual Storybook docs owner, an exact story ID from the generated
   Storybook index, and an assertion that demonstrates user-visible or
   behavioral outcome. Smoke-only assertions are not accepted.
4. Every nonvisual claim has an explicit owner and reason, `docsOwnerId: null`,
   and no renderable states. A nonvisual classification is an individual review
   decision, not a blanket exemption for a directory or export kind.
5. Story and docs references resolve against the generated Storybook index, and
   the referenced stories are included in the successful MCP receipts.
6. The final source, docs, index, receipt, and closure checks all use one frozen
   input set. A source, story, docs, or configuration change after the freeze
   invalidates the receipts and requires a new run.

The expected durable outputs are:

- `ClientApp/src/storybook/coverageManifest.json` containing the reviewed
  claims;
- `reports/storybook-coverage/source-worklist.json` containing the discovered
  denominator, classification, batch, owner, and review status;
- `reports/storybook-coverage/source-summary.json` containing final counts and
  diagnostic totals;
- frozen Storybook full/docs indexes and structured MCP receipts under
  `reports/storybook-coverage/`, retained as CI artifacts and never hand-edited.

## Evidence already established

- `ClientApp/src/storybook/coverageManifest.json` was initially syntactically
  valid but empty; it now contains 46 reviewed claims across 22 Phase 2 batches.
- `scripts/storybook-coverage.mjs --mode source` initially emitted 668
  diagnostics, beginning with
  `EVIDENCE_MISSING: source inventory must contain at least one reviewed claim`
  and continuing with unclaimed discovered exports.
- The Storybook MCP full suite was rerun after the Storybook server and MCP
  investigation process were restarted. It returned passing stories with
  accessibility enabled. This proves the current transport and suite can run; it
  does not create source-review records or prove that every discovered export
  has adequate evidence.
- The existing manifest fixture at
  `tests/fixtures/storybook/module-coverage/coverageManifest.json` demonstrates
  the schema shape, but its placeholder digest and example IDs are not
  production evidence.
- The existing implementation plan
  `docs/plans/2026-10-14-storybook-coverage-and-mcp-remediation.md` defines the
  source, docs, receipt, freshness, and closure contracts that this plan
  completes.

## Execution record and current evidence

### Phase 0 — completed

- Added the deterministic worklist generator at
  `scripts/storybook-coverage-worklist.mjs`.
- Added `tests/unit/storybook/worklist.test.ts` and generated the worklist and
  summary artifacts under `reports/storybook-coverage/`.
- The accepted discovery baseline was 667 discovered exports and 668 initial
  diagnostics. Category counts were direct 479, consumer 0, forwarding 0,
  nonvisual 188, unresolved 0, with 271 policy exclusions.
- The worklist and focused tests passed. The production manifest was not
  populated by this phase alone.

### Phase 1 — completed

- Added hard source, story, assertion-marker, source-digest, index-reference,
  and receipt-closure validation.
- Added the focused validator and closure tests, including
  `tests/unit/storybook/storyEvidence.test.ts` and
  `tests/unit/storybook/manifestReceiptClosure.test.ts`.
- The focused Storybook validator suite passed: 4 files and 44 tests.
- The reference validator passed against the generated Storybook index with
  `ok: true` and zero errors.

### Phase 2 — in progress

The following reviewed batches are accepted in
`ClientApp/src/storybook/coverageManifest.json`:

| Family              | Accepted claims | Story evidence                                                       |
| ------------------- | --------------: | -------------------------------------------------------------------- |
| Accordion           |               2 | `components-accordion--single-section`                               |
| Alert               |               4 | Info, Success, Warning, and Error Dismissible stories                |
| NotificationMessage |               1 | `components-alert-notificationmessage--success`                      |
| Actions             |               2 | `components-actions--text-button`, `components-actions--icon-button` |
| AriaButton          |               1 | `evaluation-react-aria-button--primary`                              |

The accepted continuation batches are:

| Batch families                                          | Accepted claims | Story evidence                                                        |
| ------------------------------------------------------- | --------------: | --------------------------------------------------------------------- |
| Breadcrumbs, React Aria Button, Calendar, RangeCalendar |              10 | Exact MCP stories for the example/default/invalid states              |
| Accordion and Alert type exports                        |               5 | Reviewed nonvisual classifications with no renderable states          |
| Checkbox and CheckboxGroup                              |               3 | Example, indeterminate, and labelled/description stories              |
| ColorArea, ColorField, ColorPicker, ColorSlider         |               7 | Exact MCP example and documented state stories                        |
| ColorSwatch, ColorSwatchPicker, ColorWheel, ColorThumb  |               6 | Exact MCP example stories; ColorThumb reviewed as forwarding evidence |
| ComboBox                                                |               4 | `evaluation-react-aria-combobox--example`                             |

The current source-mode run reports 621 `EVIDENCE_MISSING` diagnostics, zero
`SOURCE_UNRESOLVED`, `CLAIM_DUPLICATE`, or `MANIFEST_SCHEMA_INVALID`
diagnostics, and no remaining Actions diagnostics. The Actions batch also
required a targeted accessibility correction for dropdown menu/item semantics;
both focused MCP stories passed with accessibility enabled and zero violations.

The CommandPalette batch was initially blocked. Its exact MCP story reported a
`scrollable-region-focusable` violation on the suggestions menu. Three targeted
correction attempts—adding `tabIndex`, using documented `autoFocus`, and
matching the documented `min-height: 0` menu layout—did not resolve the
violation. Those story, shared Menu, and CSS changes were rolled back, and the
source count returned to 622.

The browser-level diagnostic trace for the open story state recorded the
following evidence:

- `axe.run` with only the `scrollable-region-focusable` rule reported a
  serious violation on the rendered `.react-aria-Menu` element, with the
  failure summary stating that the element should have focusable content or
  be focusable.
- The menu had `role="menu"`, `overflow-y: auto`, `scrollHeight: 264`, and
  `clientHeight: 245`, but no `tabindex` and zero focusable descendants.
- The search input remained `document.activeElement`, exposed
  `aria-controls` for the menu, and moved the active item through
  `aria-activedescendant` after `ArrowDown`; the menu item itself remained
  unfocusable. This is the current rendered virtual-focus model, not a proven
  defect in the shared Menu or Modal implementation.
- The Storybook documentation and React Aria reference describe
  `disableVirtualFocus` as the documented way to require focus to move between
  the input and list. The approved component-local experiment used this prop;
  the resulting open-state axe scan passed and the focus assertions passed.

Batch-level verification performed so far includes:

- `npm run build-storybook` — exit 0;
- full Storybook suite — 149 files and 344 tests passed;
- changed-file ESLint for CommandPalette source and story — exit 0;
- `npm run type-check` — blocked by the unrelated existing
  `ComboBox.stories.tsx:31` missing-`children` error;
- `git diff --check` — exit 0;
- focused MCP run for CommandPalette, Menu, and Modal with accessibility — all
  three stories passed;
- references validation — zero errors.

The current continuation has not rerun the full unit suite, full lint, or
Storybook BDD. References mode still exits 1 because the remaining source
claims are unresolved. Type-check still exits 2 only on the unrelated
`ComboBox.stories.tsx:31` error. The managed closure launcher did not produce an
exact receipt: the first attempt exposed a byte-input defect in the closure
digest path, and the corrected retry was blocked by the launcher's freeze ACL
with `EPERM` before MCP handoff. The ACL deny rule and launcher probe files were
then removed, and direct Node read checks for all four protected roots passed.

### Documentation regression correction

The prior `MigrationReadiness.docs.mdx` failure was traced to the migration
inventory test reading `ClientApp/src/components/ComponentInventory.docs.mdx`
and requiring one exact table-spacing layout. The test now checks exact table
cells independent of alignment padding. The targeted inventory test passes 1
file and 7 tests; no documentation content was rewritten.

The repository-wide `npm run test:all` run remains non-passing with 4 failing
files and 22 failing tests out of 3,157. The observed failures are in existing
Actions/RequestList/header-footer tests that expect native link/button roles
while the current Actions implementation exposes menu-item roles. This is a
separate regression follow-up and is not evidence that the inventory correction
failed.

## Next steps

1. Retain the passing CommandPalette-only `disableVirtualFocus` experiment and
   its reviewed manifest claim; the claim-side evidence handoff is complete, but
   exact closure evidence remains blocked:

   a. Reproduce the open state in the managed Storybook browser and capture a
      deterministic DOM/focus trace containing the axe rule result, the
      scroll container's computed overflow and dimensions, the active element,
      the input's `aria-controls`/`aria-activedescendant`, the active menu item,
      and the menu's focusable descendants. Preserve the trace as redacted
      structured evidence under `reports/storybook-coverage/`; do not record
      credentials, tokens, or unrelated page content.

   b. Preserve the passing local change and its play assertion as the
      CommandPalette evidence. Do not repeat the rejected `tabIndex={0}`,
      `autoFocus`, or shared flex/min-height variants, and do not change
      `Menu.tsx`, `Modal.tsx`, or their shared CSS.

   c. Record that no shared-contract decision was required for this local
      experiment. Consult the identified owner only if a later proposal would
      change the shared Menu/Modal accessibility contract; absence of that
      consultation is not approval for such a change.

   d. Accept a candidate only if the open-state axe rule passes, the input or
      menu has the intended keyboard focus ownership, arrow navigation reaches
      the active option, Escape/dismissal restores focus to the trigger, and
      the existing Menu and Modal stories remain free of new accessibility
      violations. A closed-story pass is insufficient.

   e. Rerun source/reference validation against the final frozen source and
      obtain the required exact MCP receipt for the passing story once the native
      MCP response includes structured execution statuses and the managed freeze
      can complete. Do not claim closure from the current human-readable-only
      MCP result or from the failed launcher attempt.

2. Continue Phase 2 with the next documented component-family batch, including
   non-blocked queue entries where appropriate. For each batch, obtain the
   Storybook MCP documentation contract, add only meaningful state assertions,
   update the manifest with the current source digest, and run source mode,
   focused validator tests, and focused MCP stories.
3. Repeat until all accepted discovered exports are claimed or explicitly
   blocked with owner and evidence. The current remaining count is 621
   `EVIDENCE_MISSING` diagnostics.
4. After source mode reaches zero, execute Phase 3 against the final frozen
   manifest: rebuild Storybook, validate references, write only generated
   inventory regions, run MDX lint, and review the documentation diff.
5. Execute Phase 4 using the managed closure launcher on port 6007, preserve
   exact MCP receipts, run the applicable Storybook BDD gates, and require
   source mode, references mode, receipts, docs, producer, and input digests to
   agree before reporting completion.

## Verification plan and expected evidence

Verification is performed in four independent layers:

| Layer             | Command or method                                                                                                           | Pass evidence                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Manifest/schema   | Unit tests and `node scripts/storybook-coverage.mjs --mode source`                                                          | Valid schema; zero missing, duplicate, unresolved, or unsupported claims                                                  |
| References        | `npm run build-storybook`, then `node scripts/storybook-coverage.mjs --mode references --index storybook-static/index.json` | Every docs owner and required story ID resolves to the generated index                                                    |
| Executed behavior | Storybook MCP `test-run` with `a11y: true`, followed by Storybook BDD                                                       | Exact referenced story IDs return `status-value:success`; no missing, skipped, cancelled, duplicate, or unhandled results |
| Closure/freshness | Final freeze, docs verification, and closure mode                                                                           | Source, docs index, full index, producer, input digest, and receipts agree with the frozen run                            |

Do not report a proposed command as evidence. Capture the actual exit code and
relevant output for each layer. If a command cannot run, mark that layer
`NOT VERIFIED` and do not claim overall completion.

## Requirements traceability

| Requirement                                                 | Plan coverage                                                                                              |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Remove the empty-manifest condition                         | Phase 2 populates the production manifest from the reviewed worklist                                       |
| Resolve the observed diagnostics without weakening the gate | Phase 0 establishes the denominator; Phases 1–3 retain strict discovery and require zero missing claims    |
| Preserve canonical source/export identity                   | Phase 2 uses the existing declaration-aware discovery and duplicate checks                                 |
| Prove rendered behavior                                     | Phase 3 requires meaningful story play assertions and successful MCP receipts                              |
| Keep nonvisual classifications accountable                  | Phase 2 requires per-record owner/reason and rejects blanket waivers                                       |
| Prevent fabricated or stale evidence                        | Phase 1 adds story-reference and source-digest checks before production population; Phase 4 freezes inputs |
| Keep docs and closure consistent                            | Phase 4 rebuilds Storybook, regenerates only generated inventory regions, verifies docs, then runs closure |
| Preserve unrelated worktree changes                         | All edits are limited to the files listed in each phase; no reset, stash, or broad formatting pass         |

## Phase 0: Prove the discovery denominator before creating claims

### Files to add or generate

- `scripts/storybook-coverage-worklist.mjs` (new deterministic worklist
  generator, reusing the coverage script's declaration-aware discovery)
- `tests/unit/storybook/worklist.test.ts` (new)
- `reports/storybook-coverage/source-worklist.json` (generated artifact)
- `reports/storybook-coverage/source-summary.json` (generated artifact)

### Steps

1. Generate the worklist from the same discovery implementation used by source
   mode. The generator must not maintain a second export-resolution algorithm.
   Sort entries by canonical `source#export` and include the discovery kind,
   unresolved reason when present, proposed classification, owner, batch, and
   status.

2. Produce category counts before editing the manifest: direct, consumer,
   forwarding, nonvisual, unresolved, and excluded-by-policy. Include the exact
   observed diagnostic count and the number of discovered exports that produced
   it. The reported 668 is a baseline observation, not an assumed permanent
   denominator.

3. Review a representative sample of every category, including re-exports, route
   modules, hooks/utilities, constants/types, and ambiguous declarations. The
   reviewer must decide whether each category is an obligation under the
   coverage policy. If the discovery logic is too broad, change it with a
   regression test and regenerate the worklist; do not compensate with mass
   nonvisual claims.

4. Require an identified reviewer to approve the worklist summary and proposed
   classification policy before Phase 1 begins. A missing reviewer approval is
   `BLOCKED`, not an implicit approval.

### Verification

```powershell
node scripts/storybook-coverage-worklist.mjs --out reports/storybook-coverage/source-worklist.json --summary reports/storybook-coverage/source-summary.json
npm run test:unit -- tests/unit/storybook/worklist.test.ts
```

Expected result: the worklist is deterministic across two consecutive runs,
contains the complete accepted discovery set, and records the baseline counts
without modifying the production manifest.

## Phase 1: Establish hard evidence checks

### Files to modify or add

- `scripts/storybook-coverage.mjs`
- `scripts/storybook-closure.mjs`
- `tests/unit/storybook/moduleCoverage.test.ts`
- `tests/unit/storybook/evidenceFreshness.test.ts`
- `tests/unit/storybook/storyEvidence.test.ts` (new)
- `tests/unit/storybook/manifestReceiptClosure.test.ts` (new)
- `tests/unit/storybook/closureOrchestration.test.ts`
- `tests/fixtures/storybook/module-coverage/coverageManifest.json`

### Steps

1. Add test coverage before changing the production manifest for the two
   integrity gaps that would otherwise allow plausible-looking records:

   - The `source` path exists, is inside the allowed handwritten source roots,
     and the named export is still present in the declaration-aware source
     graph.
   - `storyFile` and `assertionFile` resolve to the same allowed story source;
     `storyExport` resolves to a named CSF story export; `assertionExport` uses
     the defined v1 convention `<storyExport>.play` and resolves to that story's
     `play` property; the required `storyId` resolves to a story entry in the
     generated Storybook index; and `assertionMarker` is an exact string literal
     inside the resolved play-function AST span.

   Use the TypeScript parser/compiler path already used by the coverage script;
   do not replace export resolution with a regex that can mistake comments or
   object properties for exports.

2. Add a per-source reviewed digest check. The digest must be the SHA-256 of the
   exact UTF-8 bytes of the canonical source file named by `source`, with no
   newline or encoding normalization, represented as `sha256:<lowercase-hex>`.
   Keep the existing input-digest rule that omits `reviewedSourceDigest` from
   the manifest-wide digest so the review metadata does not self-invalidate the
   input set.

3. Extend the focused tests with negative fixtures for missing story files,
   missing story exports, missing assertion exports, missing assertion markers,
   stale source bytes, and a story ID that is absent from the generated index.
   Keep the existing positive fixture, but replace its placeholder digest with
   the digest calculated from its fixture source.

4. Run the focused tests while the new tests are expected to fail. Record the
   failures as the RED baseline. Implement only the validator changes needed to
   make those tests pass, then rerun the same command. Do not populate the
   production manifest until these guards pass.

5. Add `tests/unit/storybook/manifestReceiptClosure.test.ts`. It must load the
   production manifest, the accepted worklist, the generated Storybook index,
   and a normalized receipt fixture and prove that every required manifest story
   ID is present and successful in the receipt set. This closes the gap between
   “the MCP suite passed” and “the manifest's referenced evidence passed”.

### Verification

```powershell
npm run test:unit -- tests/unit/storybook/moduleCoverage.test.ts tests/unit/storybook/evidenceFreshness.test.ts tests/unit/storybook/storyEvidence.test.ts
node --check scripts/storybook-coverage.mjs
```

Expected result after the implementation in this phase: exit code 0 for both
commands, with negative fixtures rejected for the intended diagnostic code.

## Phase 2: Classify and populate the complete accepted export set

### Files to modify

- `ClientApp/src/storybook/coverageManifest.json`
- Any existing story files under `ClientApp/src/components/` or
  `ClientApp/src/routes/` that are selected by the reviewed queue
- New story files only where Phase 2 identifies a missing supported renderable
  state and the Storybook contract has been confirmed through MCP

### Steps

1. Use `reports/storybook-coverage/source-worklist.json` as the working queue.
   Sort review batches by canonical `source#export`, not by diagnostic order.
   Re-run the worklist generator after every source or re-export change; the
   queue is not a static assumption.

2. For each discovered export, assign exactly one classification using source
   behavior and the reviewed Storybook contract:

   - `direct`: the export itself is rendered by the story and its public
     behavior is asserted.
   - `consumer`: a route, shell, or composition export is represented by a story
     that exercises the consumer behavior, not merely an imported child.
   - `forwarding`: the export is a pure forwarding wrapper or re-export with no
     owned behavior; the rationale names the reviewed target and explains why
     the target evidence applies.
   - `nonvisual`: the export has no UI-rendering obligation. Record the specific
     reason, set `docsOwnerId` to `null`, and leave `states` empty.

   Do not classify an export as nonvisual merely because it is difficult to
   render, lacks a current story, or sits in a utility-looking file. Do not
   classify an ambiguous re-export as forwarding until declaration resolution
   proves that it is pure.

3. Work in small, reviewable batches grouped by source directory and feature
   family. Each batch must include all fields required by the schema:

   - canonical source path and export;
   - classification, owner, and specific rationale;
   - actual `docsOwnerId` from Storybook documentation;
   - state applicability and outcome;
   - exact story file/export and story ID;
   - exact assertion file/export/marker;
   - reviewer identity, review rationale, and current source digest.

   After each batch, run source mode. A batch is not accepted if it reduces the
   diagnostic count by adding a record whose story or assertion cannot be
   resolved.

4. Before creating or changing stories, call the Storybook MCP documentation
   tools to obtain the current component list, component documentation, and
   story-authoring instructions. Use only documented props and documented or
   indexed story IDs. If documentation is unavailable for a component, record
   the batch as blocked rather than inferring its API.

5. For each renderable record, select existing adequate stories first. Add a
   story or play assertion only when no existing story demonstrates the required
   state. Assertions must prove a semantic or behavioral result such as a
   visible accessible name, changed selection, validation result, navigation,
   dialog state, or user-visible error. Do not use “renders without throwing”, a
   generic `rendered` marker, or a timing-only wait as the baseline claim.

6. Treat not-supported states narrowly. A not-supported state must identify the
   specific unsupported public API or product constraint, include an approved
   rationale, and have null story/assertion references. It cannot be used to
   mark an entire component, route, or export family unsupported.

7. Resolve the known shared-component evidence gaps from the parent plan only
   when they occur in the queue: `AriaButton`, `Link`, `SegmentedControl`,
   `SegmentedControlItem`, `Sheet`, `AlertMessage`, `PageHeader`, and
   `StatusPill`. Do not invent props or interaction behavior for these
   components; obtain the contract through Storybook MCP and existing source
   conventions first.

8. Keep unresolved exports in the worklist with the diagnostic, likely cause,
   owner, and blocking decision. Do not hide them by changing discovery
   exclusions, lowering the required-state rule, or adding a blanket nonvisual
   record.

### Verification after every batch

```powershell
node scripts/storybook-coverage.mjs --mode source
npm run test:unit -- tests/unit/storybook/moduleCoverage.test.ts tests/unit/storybook/evidenceFreshness.test.ts tests/unit/storybook/storyEvidence.test.ts
```

Expected result: the source diagnostic count decreases only through reviewed
records, and no new schema, duplicate, unresolved, or stale-digest diagnostic
appears. If the same batch defect survives three targeted correction attempts,
stop that approach, preserve the failing evidence, and escalate the specific
source/story contract decision rather than repeating the edit.

## Phase 3: Validate generated docs and executable references

### Files to modify

- Generated Storybook documentation regions owned by the existing inventory
  writer, using the current parseable JSX comment marker convention in the
  repository
- `tests/unit/storybook/coverageDrift.test.ts` if it does not already assert the
  production manifest and source-mode exit status
- `tests/unit/storybook/storybookDocsConfig.test.ts` only if a missing docs
  owner or invalid docs configuration is discovered

### Steps

1. Build the static Storybook index from the final story source:

```powershell
npm run build-storybook
```

1. Validate references against the generated index:

```powershell
node scripts/storybook-coverage.mjs --mode references --index storybook-static/index.json
```

1. Write only the generated inventory regions after the reference check passes:

```powershell
node scripts/storybook-coverage.mjs --mode references --index storybook-static/index.json --write-inventory
```

1. Run the repository docs and focused Storybook checks:

```powershell
npm run lint:mdx
npm run test:unit -- tests/unit/storybook/coverageDrift.test.ts tests/unit/storybook/storybookDocsConfig.test.ts
```

1. Review the diff to confirm that generated inventory regions changed only as a
   consequence of the manifest and Storybook index, and that no unrelated
   documentation or application source was reformatted.

Expected result: references mode exits 0; every renderable `docsOwnerId` maps to
an index entry with `type: docs`; every required `storyId` maps to an index
entry with `type: story`; docs lint and focused tests exit 0.

## Phase 4: Execute evidence and close the frozen set

1. Rebuild Storybook after the last source/story/docs change:

```powershell
npm run build-storybook
```

Capture the final full index and docs-index fingerprints. Do not edit source,
stories, configuration, or the manifest after this point.

1. Derive the executable story set from the final index. Do not hand-copy the
   668 diagnostics into an MCP request and do not run guessed IDs. Exclude only
   stories explicitly disabled by the existing skip rules; any required story
   that is skipped or missing fails closure.

2. Run the MCP suite serially in the existing cold, warm, full, and repeat
   sequence with accessibility enabled. Preserve the structured receipts with
   the exact story IDs, `status-value:success` component/a11y results, input
   digest, producer identity, child provenance, and creation timestamp.

3. Run the Storybook BDD suite against the same built Storybook. If application
   route behavior was changed while creating evidence, also run the app BDD
   suite; otherwise record that app BDD was not in scope for the manifest-only
   change.

4. Run the pre-freeze diagnostics and test contract:

```powershell
npm run type-check
npm run lint
npm run lint:mdx
npx eslint --config scripts/storybook-coverage-eslint.config.mjs scripts/storybook-coverage.mjs scripts/storybook-coverage-worklist.mjs scripts/verify-storybook-docs.mjs scripts/storybook-closure.mjs --max-warnings=0
npm run test:unit -- tests/unit/storybook tests/unit/config/vitestTopology.test.ts tests/unit/config/storybookRuntimePolicy.test.ts tests/unit/config/storybookCoverageLint.test.ts
node scripts/storybook-coverage.mjs --mode source
node scripts/storybook-coverage.mjs --mode references --index storybook-static/index.json
npm run storybook:verify:docs
npm run test:e2e:storybook
```

1. Run the managed closure launcher, which records gate start/end identities,
   producer information, freeze data, and receipts. The managed launcher owns
   port 6007 for the qualifying run; do not run a separate `npm run storybook`
   process concurrently:

```powershell
node scripts/storybook-closure.mjs --checkout . --url http://localhost:6007 --server-mode managed --receipts reports/storybook-coverage --mcp-timeout-ms 3600000
```

The closure launcher's gate list must include a references-mode invocation after
the final Storybook build and before docs/closure validation:

```text
node scripts/storybook-coverage.mjs --mode references --index storybook-static/index.json
```

If the current launcher does not include that gate, add it to
`scripts/storybook-closure.mjs` and cover the ordering in
`tests/unit/storybook/closureOrchestration.test.ts`; a pre-freeze references
check alone is insufficient because the launcher rebuilds Storybook.

The launcher must complete its native MCP cold/warm/full/repeat sequence and its
configured gates. Do not substitute a simulated receipt or a manually edited
status file. If the managed launcher cannot bind 6007, stop and resolve the
launcher/port contract; do not silently substitute the development port 6006.
Run `npm run test:e2e:app` only when route/application behavior was changed
while creating evidence; otherwise record it as out of scope rather than
claiming it passed.

Expected final evidence:

- source mode exit code 0 with zero `EVIDENCE_MISSING` diagnostics;
- references mode exit code 0;
- all referenced MCP results have exact IDs and `status-value:success`;
- Storybook BDD exit code 0;
- closure-launcher exit code 0 with matching input, producer, index, docs, and
  receipt identities;
- `reports/storybook-coverage/source-summary.json` shows zero unresolved entries
  in the accepted denominator and reconciles discovered, claimed, renderable,
  and nonvisual counts.

## Rollback and safety

- Commit or otherwise checkpoint each accepted manifest/story batch before
  beginning the next batch. Preserve the user's pre-existing dirty worktree; do
  not run `git reset --hard`, `git checkout --`, broad cleanup, or a stash.
- If a batch is rejected, revert only that batch's manifest entries, story
  changes, and generated inventory region. Re-run source mode to prove the
  previous accepted denominator is restored.
- Never resolve the diagnostics by weakening `discoverSourceExports`, adding a
  source exclusion, accepting duplicate canonical claims, treating all states as
  not-supported, or marking the MCP suite successful without exact receipts.
- If a source export has no supported public contract or a required Storybook
  component cannot be documented through MCP, leave it explicitly blocked with
  the failing evidence and owner. The overall status is then `BLOCKED`, not
  `VERIFIED`.

## Fresh critical review

The principal residual risk is false completeness: a populated manifest can make
the source validator pass while the recorded assertions are too weak or the
referenced stories are not the stories that were executed. The plan addresses
this by adding story-source resolution, per-source digest checks, index
resolution, and exact MCP receipt matching before closure.

Additional risks to inspect during implementation:

- re-export canonicalization can move an export to a different declaration
  source; the manifest must follow the declaration identity, not the importing
  file;
- a pure forwarding wrapper can later gain behavior, invalidating its rationale
  and requiring a new direct or consumer claim;
- generated Storybook IDs can change after story title or export changes, so all
  IDs must be taken from the final index;
- the current MCP suite passing is not independent proof of source coverage; it
  must be joined to the manifest's exact referenced IDs;
- the CommandPalette accessibility failure was independently reproduced in the
  open browser state and is now cleared by the documented component-local
  `disableVirtualFocus` experiment; no shared Menu/Modal contract was changed;
- the passing story play assertion covers the open state, virtual-focus removal,
  tab-based menu focus, and the focused MCP run covers CommandPalette, Menu, and
  Modal with accessibility enabled;
- the CommandPalette source record is present and current, but its exact
   closure receipt is still pending because the managed launcher and native MCP
   response failed the receipt contract;
- the independent reviewer has not supplied an external finding because the
  retry timed out;
- repository type-check remains blocked by the unrelated existing
  `ComboBox.stories.tsx:31` missing-`children` error;
- the worktree already contains unrelated changes, so diff review is required
  after every batch and before closure.

## Overall status for this plan

`PARTIALLY VERIFIED`. Phases 0 and 1 have supporting evidence, and the 22 listed
Phase 2 batches have passed their applicable batch-level checks. The
CommandPalette-only `disableVirtualFocus` experiment passes its focused story,
open-state axe trace, focus assertions, and shared Menu/Modal regression
stories, and its reviewed manifest claim resolves against the rebuilt index. No
passing exact closure receipt was created. The plan remains open because 621
source diagnostics remain, final frozen-set closure has not run, native MCP
structured execution data is unavailable, repository type-check is blocked by
the unrelated ComboBox story error, and independent external review is not
verified.
