# Outstanding Actions — Reviewed Backlog

Originally generated from chat history on 2026-09-25, covering 2026-07-01 to
2026-09-25. Reviewed against the repository and GitHub on **2026-10-10
(Australia/Sydney)**, at baseline commit `c38a89ca` on
`feat/formik-to-react-hooks-migration`.

## Purpose and status rules

This plan turns historical observations into verifiable next actions. The
2026-10-10 review was followed by authorized execution in
`.worktrees/outstanding-actions-plan`. Current results and verification evidence
are recorded in the
[execution report](2026-10-10-outstanding-actions-execution.md). The next-action
and acceptance details below retain the reviewed scope; completed items have
their execution result recorded alongside them.

**Status refreshed 2026-10-10 (Australia/Sydney), latest continuation:** A8 is
verified through actual VS Code memory-context delivery. A9 is closed after
recovering the original record and correcting the inferred bug count. A7
remediation remains complete. The remaining dependencies are A2's owner PAT
rotation, A3's unavailable backend authority, A4's provider quota, and D1's
explicit owner deferral.

- **Verified:** supported by a current repository or GitHub check.
- **Needs verification:** reported in history; current failure or completion has
  not been established. An unchecked item is not proof of a present defect.
- **Deferred:** a known dependency or scope decision must be resolved before
  implementation.
- **Closed / superseded:** the original action no longer applies within the
  checked scope. Evidence appears below.

References such as `#53` and `#137` are identifiers from the original
chat-history review, not verified GitHub issue numbers. Historical violation
counts and test results are not current baselines. Owners remain **unassigned**
unless explicitly recorded; proposed ownership must be accepted before
implementation.

## Current priority queue

1. **P0 — A2:** complete rotation, revocation, and workflow verification by
   **2026-12-01**, tracked in
   [GitHub task #74](https://github.com/gmtestandreview/portalsample/issues/74).
2. **Deferred P1 — A3:** await an authoritative backend source and named
   approver, which the owner confirmed are unavailable. Once supplied, reproduce
   the date shift and add explicit DST-transition evidence.
3. **P1 — A4:** after the provider reset, rerun the untouched holdout with the
   identified candidate, evaluator, and parameters; keep the release on hold
   until the existing acceptance gate is satisfied.
4. **Maintenance — A1/A5/A6/A7/A8:** retain the focused launcher, bounded
   review, metadata, representative activation, maintained-document lint, and
   memory-context delivery checks with future changes. A9 identity recovery is
   complete; the separately tracked modal acceptance remains in the umbrella
   plan's C6 work.

Revisit relocation (D1) only if the repository owner chooses to resume it.

These are separate work items. Before each implementation, record its owner,
branch/commit, reproduction or baseline, and focused validation command. Close
an item only with dated evidence; otherwise record the blocker and next action.

## Open actions

### A1 — Verify temporary-token cleanup

- [x] **Priority: high triage. Status: fixed and verified. Owner: Codex.**
- **Execution result (2026-10-10):** Identified `scripts/github-mcp-server.cmd`,
  removed the temporary-token disk write, and verified 10 Windows launcher tests
  including real Ctrl+C and forced termination. See the execution report for
  RED/GREEN evidence. History reported that temporary token files created by
  `.cmd` scripts survived interruption (`#53`, 2026-09-10; originally assessed
  as medium severity).
- **Maintenance follow-up (in place):** retain the focused regression test with
  future launcher changes. No further investigation is required for the tested
  launcher path.
- **Done when:** the responsible path is identified and supported exit paths
  leave no credential file. If forced termination cannot guarantee cleanup,
  document that limitation and choose a credential-handling approach that avoids
  leaving a reusable secret on disk. Do not close this item from inspection
  alone.

### A2 — Rotate the `claude.yml` fine-grained PAT by 2026-12-01

- [ ] **Priority: dated commitment. Status: pending owner rotation. Owner:
      @gregm.**
- **Execution result (2026-10-10):** Owner confirmed rotation is pending and
  retained 2026-12-01. An [importable reminder](2026-12-01-pat-rotation.ics) is
  prepared; it has not been installed in a calendar. Rotation, revocation, and
  workflow verification remain open. The deadline and owner come from historical
  observation `#59`, 2026-09-10; rotation has not been independently confirmed.
  The commitment is not overdue as of this review.
- **Reminder/task completed (2026-10-10):** the owner selected
  `gmtestandreview`;
  [GitHub task #74](https://github.com/gmtestandreview/portalsample/issues/74)
  is open and assigned to that account with the December 1 deadline. The task
  records the commitment; no scheduled GitHub notification or calendar import is
  claimed.
- **Open P0 action:** rotate and revoke the PAT and verify the consuming
  workflow by **2026-12-01**, then record completion in task #74.
- **Done when:** the replacement is installed at its source of truth, the old
  PAT is revoked, and the consuming workflow succeeds. Record the rotation date
  and workflow-run reference without recording either token value.

### A3 — Establish the RFQ date/timezone defect's current status

- [x] **Priority: customer-facing correctness. Status: closed for this sandbox;
      remediation deferred until the implementation returns to the main project
      code line. Owner: @gregm.**
- **Execution result (2026-10-10):** 30 existing date tests pass in each of UTC,
  Australia/Sydney, and America/Los_Angeles. The date-only adapter already
  exists. Authoritative backend approval evidence and explicit DST-transition
  coverage are still missing; no production edits were made. The original review
  recorded a deferred `datePickerWrapper` timezone defect on 2026-08-23.
- **Standards evidence (2026-10-11):** the [Australian Government API Design
  Standard's date guidance](https://api.gov.au/sections/naming-conventions.html)
  requires ISO 8601 dates, documents `YYYY-MM-DD` for date-only values, recommends
  timezone information for date-times, and uses a `Date` suffix for date-only
  fields. This supports `DATE_ONLY` as the proposed classification for this
  field, but it does not prove the existing backend wire shape or replace a
  field-specific approval.
- **Dependency:** the
  [npm remediation umbrella plan](2026-08-23-npm-deprecation-remediation.md)
  identifies Child Plan B as externally deferred until authoritative backend
  evidence establishes the meaning and accepted wire shapes of
  `preferredInstrumentOrArtefactAvailabilityDate`. Confirm that gate's current
  status before production edits; the historical defect alone does not authorize
  guessing the date contract.
- **Deferred P1 action:** use the Australian Government guidance as the proposed
  `DATE_ONLY` basis, then obtain field-specific schema or a signed backend
  decision and representative payloads. Record the contract decision and
  reproduce the reported date shift. The existing
  `tests/unit/components/inputs/datePickerWrapper.test.tsx` does not prove the
  full timezone acceptance gate is satisfied.
- **Owner confirmation (2026-10-10):** no authoritative backend/OpenAPI source
  or named backend approver is available. A3 is explicitly deferred until the
  owner supplies that authority; do not infer the contract from the current
  adapter or passing tests.
- **Closure disposition (2026-10-11):** the owner closed this sandbox task. This
  records no production remediation and no contract approval. Reopen A3 after
  the sandbox implementation is moved back into the main project code line;
  then obtain the field-specific contract and run the DST and form/API
  round-trip acceptance evidence.
- **Done when:** the contract gate is satisfied and regression evidence shows
  the intended date survives form/API round trips across UTC, Australia/Sydney
  including daylight-saving transitions, and a negative UTC offset. Record the
  exact environments and results. If contract evidence is still unavailable,
  retain the deferred status and name the missing evidence.

### A4 — Recover and rerun skill activation evaluation

- [ ] **Priority: release verification. Status: blocked by provider session
      quota. Owner: Codex for evaluation.**
- **Execution result (2026-10-10):** Current-candidate training passes 20/20
  with no errors. Holdout completed 2/16 attempts, with 14 provider quota
  errors; release remains HOLD. Provider reports reset at 2026-10-11 03:20
  Australia/Sydney. Preserve the run and rerun the complete untouched holdout
  after reset. Iteration 2 reportedly had near-miss false positives, including
  “optimize activation conditions for browser extension,” and a holdout timeout
  (`#137`, 2026-09-21). No iteration-3 result was present in the original
  review.
- **Preparation completed (2026-10-10):** identified the evaluated skill,
  candidate description and evaluator revisions, runtime, and available
  evaluation artifacts. The manifest and result files are preserved under the
  execution report's run directory.
- **Open P1 action:** after the provider reset, rerun the complete untouched
  holdout with the recorded candidate and parameters, then the outstanding
  vocabulary near-miss campaign required by the existing release protocol.
  Preserve the completed training run and the quota-interrupted holdout.
- **Done when:** a dated result identifies the tested revision, completes the
  holdout without timeout, and meets the evaluator's existing acceptance
  criteria. Treat this as a release blocker only if the failing result is still
  applicable to the candidate being released.

### A5 — Locate and reproduce the review-generator test hang

- [x] **Priority: test reliability. Status: current suite verified passing.
      Owner: Codex.**
- **Execution result (2026-10-10):** Recovered the hidden
  `.claude/skills/skill-creator/scripts/Regression tests/test_generate_review.py`;
  19 tests and 42 subtests pass in 3.25s under the original 180-second bound.
  The historical hang was not reproduced; no timeout or code change was needed.
  `test_generate_review.py` reportedly ran beyond 180 seconds without output
  (`#111`, 2026-09-20).
- **Maintenance follow-up (in place):** retain the bounded regression command
  for future changes. The original hang cause remains unknown, but the current
  suite is green.
- **Done when:** the original suite completes under its existing timeout, or
  evidence establishes that the referenced test was superseded. Raising the
  timeout alone is not completion evidence.

### A6 — Verify writing-skills metadata regressions

- [x] **Priority: test reliability. Status: aliases restored and verified.
      Owner: Codex.**
- **Execution result (2026-10-10):** Reproduced both alias failures, restored
  the policy-required aliases in the repository skill description, and verified
  16 focused tests plus representative positive/negative activation probes. No
  global installation was changed. Two failures around
  `called_writing_skills_alias` were reported in
  `test_writing_skills_metadata.py` (`#91`, 2026-09-20).
- **Maintenance follow-up (in place):** retain the focused metadata and
  representative activation checks for future description changes. No global
  installation was changed.
- **Done when:** the relevant cases pass on the recorded revision, or a linked
  change explains why they were replaced. Preserve the failure details if they
  still reproduce.

### A7 — Establish the Markdown baseline and complete remediation

- [x] **Priority: maintenance. Status: MD-T1 through MD-T5 complete and
      verified. Owner: Codex.**
- **Execution result (2026-10-10):** Pinned markdownlint-cli2 0.20.0 measured
  1,063 diagnostics across 46 of 152 maintained documents at baseline 655f90af.
  MD060 remains: 544 diagnostics across 111 line locations in 21 files. MD013
  produced zero. The execution report defines tasks MD-T1 through MD-T5 and
  exact exclusions; the baseline is not a clean-lint claim. The original review
  reported roughly 987 violations and an uncertain 104 MD060 table-format
  findings. Those counts predate the current configuration.
- **Resumed execution (2026-10-10):** assigned MD-T1 through MD-T5 across
  independent analysis, historical-plan, and other-document scopes. Corrected
  the 1,063 findings in 46 documents; the full current scope of 153 maintained
  documents now reports zero errors with the same pinned runner and rules. The
  original baseline remains preserved in the execution report.
- **Maintenance follow-up:** rerun the maintained-document scope after future
  edits. No Markdown rules, exclusions, policy files, or lint gates changed.
- **Done when:** remaining enabled-rule findings have an accurate baseline and
  scoped remediation tasks, or the checked scope passes. Do not revive MD013
  cleanup or disable rules to make the check pass. Prettier owns formatting.

### A8 — Verify claude-mem worker health

- [x] **Priority: developer tooling. Status: service and affected VS Code
      memory-context delivery verified. Owner: Codex.**
- **Execution result (2026-10-10):** claude-mem 13.27.1 health/readiness
  endpoints return HTTP 200, and recent-context retrieval/context injection
  return nonempty responses. Current VS Code consumer logs independently show
  the exact execution worktree loading the plugin, connecting its MCP service,
  and receiving 8,151 characters of validated context after a successful hook.
  `worker-service.cjs` reportedly failed its health check and blocked VS Code
  memory completions (`#93`, 2026-09-20).
- **Evidence scope:** VS Code 1.141.0 with `anthropic.claude-code@2.1.296`
  successfully received project memory context at 23:48:34 Australia/Sydney. A
  final model-response event was not observed; the verified flow is memory
  retrieval and context delivery to the affected consumer.
- **Maintenance follow-up:** retain the service and consumer-context checks
  after integration upgrades. Exact sanitized log references are in the
  execution report.
- **Done when:** the health check and affected completion flow succeed with
  dated evidence, or the owner confirms the integration has been retired.

### A9 — Resolve the inferred deferred infrastructure count

- [x] **Priority: evidence recovery. Status: original record recovered;
      incorrect inference superseded. Owner: Codex.**
- **Execution result (2026-10-10):** the original August 23 closeout names the
  two deferred issues as DatePicker timezone assumptions and Storybook modal
  fade-transition timing. DatePicker was included in that count, rather than
  accompanied by two further unnamed bugs. Four infrastructure fixes, including
  workspace nesting and the root worker cap, had already landed.
- **Disposition:** DatePicker remains explicitly deferred under A3. Modal
  transition assertions were repaired in
  [commit 0e368fe9](https://github.com/gmtestandreview/portalsample/commit/0e368fe9cf8892a74fdb4ec1bfb78518510fb40d),
  which is an ancestor of this branch. Historical passing-run evidence is
  recorded in the execution report; the broader C6 repeated-run acceptance is
  still separately tracked in the
  [npm remediation umbrella plan](2026-08-23-npm-deprecation-remediation.md).
- **Next action:** no further unnamed-bug recovery. Follow A3 and the existing
  C6 acceptance work without creating duplicate infrastructure defects.
- **Done when:** each bug has a concrete description and either linked
  completion evidence or its own actionable backlog entry. If the records cannot
  be recovered, explicitly retain “identity unknown” rather than infer a defect.

## Deferred scope decision

### D1 — Decide whether repository relocation is still wanted

- [ ] **Status: explicitly deferred by owner on 2026-10-10. Owner: @gregm for
      future scope decision.**
- **Execution result (2026-10-10):** Execution: the owner selected “Keep
  relocation deferred.” No relocation, path rewrites, or environment migration
  were performed. The current checkout remains under `source-map-capture`;
  relocation of this checkout has not occurred.
- **Next action if resumed:** refresh the preflight in the
  [relocation plan](../../plans/2026-09-20-relocate-repo-to-portal-example.md).
  Re-inventory absolute paths in `.claude/settings.local.json`, symlinks,
  environment state, and tooling indexes. Historical counts of “10+ paths” are
  unverified. The old `.worktrees/vscode-problems-remediation` repair
  instructions are conditional: the review's one-worktree inventory predates
  creation of `.worktrees/outstanding-actions-plan`. Re-inventory all linked
  worktrees before any move. Establish whether `.venv` and claude-mem state need
  recreation or migration in the actual environment.
- **Done when:** the owner records that relocation is no longer wanted, or a
  refreshed relocation plan is implemented and verified at the destination. This
  decision does not block A1–A9.

## Closed or superseded actions

- [x] **PR status check:** GitHub reports
      [PR #4](https://github.com/gmtestandreview/portalsample/pull/4) and
      [PR #5](https://github.com/gmtestandreview/portalsample/pull/5) as
      `MERGED`, both on 2026-09-09. The historical “both OPEN” claim is
      superseded.
- [x] **Dirty `biome_fixes` checkout as a current blocker:** before this edit,
      `git status --porcelain=v1` was empty. The current branch is
      `feat/formik-to-react-hooks-migration`; local branches are that branch and
      `main`, and no locally known branch/ref matched `*biome*`. The historical
      107-file diff is not present in this checkout. This does not establish
      whether that old diff was committed, discarded, or retained elsewhere;
      investigate its fate only if recovering it is still required.
- [x] **TokenSave serving `main` instead of the active branch:** the MCP status
      reports the correct project root and active branch
      `feat/formik-to-react-hooks-migration`, with last sync at
      `2026-10-10 23:00:16 +11:00`. There is no current need to register
      `biome_fixes`. Some config-file queries still flagged stale entries; those
      files were checked directly. Branch alignment does not prove every cached
      file is fresh.
- [x] **Delete or ignore `ClientApp/src/external/` as a stray artifact:**
      `git ls-files ClientApp/src/external` lists 80 tracked vendor files and
      scoped status shows no changes. The root policy protects this directory.
      Remove the speculative deletion action; any actual snapshot repair needs
      its own scope and evidence.
- [x] **Restore the historical `.markdownlint-cli2.jsonc`:** that file is
      absent. The current `.markdownlint.json` parses successfully and contains
      `MD013: false` and `MD024: { siblings_only: true }`. The old incident is
      superseded for this checkout; it is not a reason to recreate obsolete
      config. The original assertion that MD040 is disabled does not describe
      the current config.
- [x] **MD013 line-length batch:** disabled by both current configuration and
      the repository policy. The historical count of 493 findings does not
      represent actionable work. Keep A7 focused on enabled rules.

## Historical provenance and limits

The original review covered 2026-08-25 to 2026-09-25 first, then searched August
and July records. It reported no available activity for August 1–22 and only one
July session, on July 12. These are gaps in the inspected records, not proof
that no work occurred.

The original review treated the following as completed based on memory markers:
auth bypass removal, SEC-010 IDOR, Node 24 migration, React Aria reorganisation,
the dashboard-ta loop, Vitest/Biome LSP issues, worktree branch tracking, NMI
brand styling, and TypeScript cleanup. Those outcomes were not revalidated here
and are not reopened without new evidence.

The former G0B lane-authorization TODO was also classified as completed in the
original review: D1 reportedly executed on 2026-08-25, while a September archive
summary was used to infer D2 completion after a rate-limit interruption.
Preserve that historical classification without treating it as fresh proof that
every gate in the subsequently revised umbrella plan has passed.

## Review evidence and maintenance

The 2026-10-10 review used `git status`, branch/ref and worktree listings,
`git ls-files`, GitHub PR metadata, TokenSave MCP status, and direct checks of
configuration files after secret scans. Current `.markdownlint.json` JSON
parsing was checked separately from the historical config incident. That review
did not establish current runtime failures. Subsequent execution reproduced A1
and A6, repaired them, and recorded focused test results and remaining blockers
in the execution report.

For subsequent updates, record the action ID, date, owner, commit or external
revision, exact verification command, observed result, and evidence reference.
Keep credentials out of evidence. Move an item to closed only when its
completion criteria are supported; keep deferred items and unknowns explicit.
