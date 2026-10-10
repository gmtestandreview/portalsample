# Outstanding Actions — Reviewed Backlog

Originally generated from chat history on 2026-09-25, covering 2026-07-01 to
2026-09-25. Reviewed against the repository and GitHub on **2026-10-10
(Australia/Sydney)**, at baseline commit `c38a89ca` on
`feat/formik-to-react-hooks-migration`.

## Purpose and status rules

This plan turns historical observations into verifiable next actions. The
2026-10-10 review updates the backlog only; it does not implement the remaining
fixes, rotate credentials, move the repository, or rerun application suites.

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

## Recommended execution order

1. Triage possible temporary-credential exposure (A1), and retain the dated PAT
   rotation commitment (A2).
2. Establish current reproducers and dependencies for the date defect (A3) and
   skill regressions (A4–A6).
3. Measure the remaining Markdown findings (A7), verify memory-service health
   (A8), and recover the unnamed infrastructure items (A9).
4. Revisit relocation (D1) only if the repository owner chooses to resume it.

These are separate work items. Before each implementation, record its owner,
branch/commit, reproduction or baseline, and focused validation command. Close
an item only with dated evidence; otherwise record the blocker and next action.

## Open actions

### A1 — Verify temporary-token cleanup

- [ ] **Priority: high triage. Status: needs verification. Owner: unassigned.**
      History reported that temporary token files created by `.cmd` scripts
      survived interruption (`#53`, 2026-09-10; originally assessed as medium
      severity).
- **Next action:** locate the responsible script and reproduce normal exit,
  error exit, and Ctrl+C with a dummy credential. Repository `.cmd` candidates
  exist under `scripts/`, but the responsible file has not been established.
  Scan files for secrets before reading them, as required by `AGENTS.md`.
- **Done when:** the responsible path is identified and supported exit paths
  leave no credential file. If forced termination cannot guarantee cleanup,
  document that limitation and choose a credential-handling approach that avoids
  leaving a reusable secret on disk. Do not close this item from inspection
  alone.

### A2 — Rotate the `claude.yml` fine-grained PAT by 2026-12-01

- [ ] **Priority: dated commitment. Status: needs verification. Owner: @gregm.**
      The deadline and owner come from historical observation `#59`, 2026-09-10;
      rotation has not been independently confirmed. The commitment is not
      overdue as of this review.
- **Next action:** confirm whether rotation already occurred. If still pending,
  retain **2026-12-01** as the deadline and arrange a reminder through the
  owner's chosen calendar or task system. No reminder was created during this
  review.
- **Done when:** the replacement is installed at its source of truth, the old
  PAT is revoked, and the consuming workflow succeeds. Record the rotation date
  and workflow-run reference without recording either token value.

### A3 — Establish the RFQ date/timezone defect's current status

- [ ] **Priority: customer-facing correctness. Status: deferred pending contract
      evidence; current reproduction unverified. Owner: unassigned.** The
      original review recorded a deferred `datePickerWrapper` timezone defect on
      2026-08-23.
- **Dependency:** the
  [npm remediation umbrella plan](2026-08-23-npm-deprecation-remediation.md)
  identifies Child Plan B as externally deferred until authoritative backend
  evidence establishes the meaning and accepted wire shapes of
  `preferredInstrumentOrArtefactAvailabilityDate`. Confirm that gate's current
  status before production edits; the historical defect alone does not authorize
  guessing the date contract.
- **Next action:** locate the latest contract decision and reproduce the
  reported date shift. An existing unit-test file is
  `tests/unit/components/inputs/datePickerWrapper.test.tsx`; its presence does
  not prove the timezone defect is covered or fixed.
- **Done when:** the contract gate is satisfied and regression evidence shows
  the intended date survives form/API round trips across UTC, Australia/Sydney
  including daylight-saving transitions, and a negative UTC offset. Record the
  exact environments and results. If contract evidence is still unavailable,
  retain the deferred status and name the missing evidence.

### A4 — Recover and rerun skill activation evaluation

- [ ] **Priority: release verification. Status: needs verification. Owner:
      unassigned.** Iteration 2 reportedly had near-miss false positives,
      including “optimize activation conditions for browser extension,” and a
      holdout timeout (`#137`, 2026-09-21). No iteration-3 result was present in
      the original review.
- **Next action:** establish which skill, revision, evaluator, and release the
  observations concern. Locate later evaluation artifacts before rerunning the
  same positive, negative, near-miss, and holdout cases. Evaluation material
  exists under `skills/writing-skills/evals/`; that does not establish the
  original evaluated revision or a current failure.
- **Done when:** a dated result identifies the tested revision, completes the
  holdout without timeout, and meets the evaluator's existing acceptance
  criteria. Treat this as a release blocker only if the failing result is still
  applicable to the candidate being released.

### A5 — Locate and reproduce the review-generator test hang

- [ ] **Priority: test reliability. Status: needs verification. Owner:
      unassigned.** `test_generate_review.py` reportedly ran beyond 180 seconds
      without output (`#111`, 2026-09-20).
- **Next action:** recover the original test path, command, revision, and
  runtime. Filename discovery in this checkout did not locate that test; do not
  assume it belongs to this repository or invent a runner. Check later artifacts
  before a bounded rerun with captured progress and subprocess state.
- **Done when:** the original suite completes under its existing timeout, or
  evidence establishes that the referenced test was superseded. Raising the
  timeout alone is not completion evidence.

### A6 — Verify writing-skills metadata regressions

- [ ] **Priority: test reliability. Status: needs verification. Owner:
      unassigned.** Two failures around `called_writing_skills_alias` were
      reported in `test_writing_skills_metadata.py` (`#91`, 2026-09-20).
- **Next action:** use the skill's documented test runner for
  `skills/writing-skills/scripts/tests/test_writing_skills_metadata.py` and
  compare the result with the original failing cases. The file exists; it was
  not run during this document review.
- **Done when:** the relevant cases pass on the recorded revision, or a linked
  change explains why they were replaced. Preserve the failure details if they
  still reproduce.

### A7 — Replace historical Markdown counts with a current baseline

- [ ] **Priority: maintenance. Status: needs verification. Owner: unassigned.**
      The original review reported roughly 987 violations and an uncertain 104
      MD060 table-format findings. Those counts predate the current
      configuration.
- **Next action:** run a read-only Markdown check over the maintained scope
  using the current rules and record command, scope, rule counts, and baseline
  commit. Determine whether MD060 remains after the reported “Batch A”
  remediation. Neither `markdownlint` nor `markdownlint-cli2` was available
  locally during this review; establish the supported runner before batching
  fixes.
- **Done when:** remaining enabled-rule findings have an accurate baseline and
  scoped remediation tasks, or the checked scope passes. Do not revive MD013
  cleanup or disable rules to make the check pass. Prettier owns formatting.

### A8 — Verify claude-mem worker health

- [ ] **Priority: developer tooling. Status: needs verification. Owner:
      unassigned.** `worker-service.cjs` reportedly failed its health check and
      blocked VS Code memory completions (`#93`, 2026-09-20).
- **Next action:** locate the installed service's supported health check and
  test a memory-completion request in the affected VS Code environment. The
  original review's statement that it was “clearly working now” is not retained
  as proof.
- **Done when:** the health check and affected completion flow succeed with
  dated evidence, or the owner confirms the integration has been retired.

### A9 — Identify the two unnamed deferred infrastructure bugs

- [ ] **Priority: evidence recovery. Status: needs verification. Owner:
      unassigned.** Two infrastructure bugs were reportedly deferred alongside
      the date defect on 2026-08-23; their identities were absent from the
      original log.
- **Next action:** correlate the original observations with
  [PR #1](https://github.com/gmtestandreview/portalsample/pull/1) and the
  [npm remediation umbrella plan](2026-08-23-npm-deprecation-remediation.md). PR
  #1 is merged, but merge status alone does not identify or close these bugs.
- **Done when:** each bug has a concrete description and either linked
  completion evidence or its own actionable backlog entry. If the records cannot
  be recovered, explicitly retain “identity unknown” rather than infer a defect.

## Deferred scope decision

### D1 — Decide whether repository relocation is still wanted

- [ ] **Status: awaiting owner scope decision. Owner: @gregm for the decision;
      implementation owner unassigned.** The current checkout remains under
      `source-map-capture`; relocation of this checkout has not occurred.
- **Next action if resumed:** refresh the preflight in the
  [relocation plan](../../plans/2026-09-20-relocate-repo-to-portal-example.md).
  Re-inventory absolute paths in `.claude/settings.local.json`, symlinks,
  environment state, and tooling indexes. Historical counts of “10+ paths” are
  unverified. The old `.worktrees/vscode-problems-remediation` repair
  instructions are conditional: the current `git worktree list` contains only
  the main checkout. Establish whether `.venv` and claude-mem state need
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
parsing was checked separately from the historical config incident. No current
failure was established for A1–A9, and no runtime test result is implied by this
review.

For subsequent updates, record the action ID, date, owner, commit or external
revision, exact verification command, observed result, and evidence reference.
Keep credentials out of evidence. Move an item to closed only when its
completion criteria are supported; keep deferred items and unknowns explicit.
