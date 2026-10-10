# Outstanding Actions — Execution Evidence

Execution started 2026-10-10 (Australia/Sydney) in
`.worktrees/outstanding-actions-plan`, branch `docs/review-outstanding-actions`.
Baseline: `655f90af166b98c62f567874474f310f7608e914`, based on `main`. Codex
owns the local investigations and repairs authorized by the request to execute
the [reviewed backlog](2026-09-25-TODO-outstanding-actions.md).

**Status refresh 2026-10-10 23:45 (Australia/Sydney):** MD-T1 through MD-T5 are
complete, with zero Markdown errors across 153 maintained files. A2 now has an
assigned GitHub task with the December 1 deadline; rotation is still pending.
A3's backend approval and A8's VS Code consumer check remain unresolved. A4's
holdout remains on hold pending the provider reset reported for 2026-10-11 03:20
(Australia/Sydney). A9's original identity correlation and D1's deferral are
unchanged.

## Results

| Action | Result                                                                                          | Remaining work                                                     |
| ------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| A1     | Reproduced and fixed temporary credential-file exposure; 10 launcher tests pass                 | None for the tested launcher behavior                              |
| A2     | Owner confirmed rotation is pending; December 1 deadline retained; GitHub task #74 assigned     | Owner rotates/revokes PAT and verifies workflow                    |
| A3     | Existing date implementation passes 30 tests in each of three timezones                         | Backend approval evidence and explicit DST-transition acceptance   |
| A4     | Training passes 20/20; holdout interrupted by 14 provider-quota errors                          | Rerun untouched holdout after quota reset; release remains on hold |
| A5     | Recovered hidden test; 19 tests and 42 subtests pass within the original timeout                | None for current suite execution; historical hang cause unproven   |
| A6     | Restored mandatory aliases; 16 regression tests and representative activation probes pass       | No broader deployment-readiness claim                              |
| A7     | MD-T1 through MD-T5 complete; 1,063 findings corrected; 153 maintained documents lint clean     | Retain focused Markdown checks for future edits                    |
| A8     | Worker health, readiness, recent-context retrieval, and context injection respond successfully  | Verify the affected VS Code consumer                               |
| A9     | Recovered two documented candidate infrastructure bugs, their fixes, and passing topology tests | Original observation needed for definitive identity correlation    |
| D1     | Owner explicitly kept relocation deferred                                                       | No relocation work authorized for this execution                   |

## A1 — Credential-file exposure repaired

`scripts/github-mcp-server.cmd` wrote the fallback GitHub CLI credential to
`%TEMP%\github-mcp-token.txt` before reading and deleting it. Interruption
during `gh auth token` left the file behind; the fixed filename also made
concurrent launches share credential storage.

The launcher now captures `gh auth token` stdout through `for /f`, keeping the
credential in the child environment and avoiding the disk write. Existing
environment-variable precedence and the Docker invocation are preserved.

The new `tests/hooks/test_github_mcp_server.py` runs the real Windows launcher
against a fake native GitHub executable and a fake Docker command. It clears
inherited credential variables and uses only dummy credentials and isolated
temporary directories. A `.cmd` GitHub double was rejected during test
development because batch control transfer does not model `gh.exe` correctly.

With the corrected doubles, the original launcher produced **1 failure and 7
passes**: the regression observed the credential file while authentication was
blocked. After the fix and addition of real Ctrl+C coverage, **10 tests pass**.
Coverage includes all credential sources and precedence, authentication failure,
Docker exit propagation, no credential in command arguments/output, forced
termination at authentication and Docker boundaries, and real `CTRL_C_EVENT`
delivery to each boundary in a separate hidden console.

```powershell
../../.venv/Scripts/python.exe -B -m pytest tests/hooks/test_github_mcp_server.py -q -p no:cacheprovider
ruff check --no-cache tests/hooks/test_github_mcp_server.py
```

Observed after final formatting: **10 passed in 6.32s**, exit 0; Ruff passed
with the repository's `ruff.toml`. A metadata-only check also found no existing
`github-mcp-token.txt` at the actual current temporary-directory path. No real
credential was read or used. Secrets scans passed. Independent code, security,
and Python review found no material blocker.

## A2 — Owner commitment and reminder

The owner confirmed during execution that rotation has not yet occurred and
asked to retain **2026-12-01**. The workflow references
`secrets.GH_PERSONAL_ACCESS_TOKEN`; its existing comments record the same owner
and deadline. The workflow was inspected with the managing-github-actions skill
and was not changed or triggered.

The [calendar reminder](2026-12-01-pat-rotation.ics) is prepared for
**2026-12-01 at 09:00 Australia/Sydney**, with an alert seven days beforehand.
It is an importable artifact, not an event already installed in a calendar.
Rotation, old-token revocation, and successful use of the replacement remain
pending with @gregm. No token value is stored in this evidence or reminder.

During resumed execution the owner selected `gmtestandreview` for task tracking.
A duplicate search found no existing PAT/deadline issue.
[GitHub task #74](https://github.com/gmtestandreview/portalsample/issues/74) was
created and independently retrieved to verify its open state, assignment to
`gmtestandreview`, December 1 deadline, and rotation/revocation/workflow
checklist. This records the reminder in the chosen task system; no scheduled
GitHub notification or calendar import is implied.

## A3 — Date behavior verified; contract gate unresolved

The implementation already includes `ClientApp/src/utils/dateOnly.ts` and
normalization before RFQ submission. The original date changes began in
`c3b459a1b8fa0d0fac85717b77ecadf7b366965f` on 2026-09-01, so the historical
assumption that implementation was absent is stale.

The date/infrastructure investigation ran this command from the execution
worktree, using the main checkout's existing dependencies:

```powershell
$env:TZ = 'UTC' # repeated with Australia/Sydney and America/Los_Angeles
node --max-old-space-size=8192 ../../node_modules/vitest/vitest.mjs run --configLoader runner --config vitest.unit.config.ts tests/unit/utils/dateOnly.test.ts tests/unit/components/inputs/datePickerWrapper.test.tsx tests/unit/routes/requestForQuote/props.test.ts tests/unit/routes/requestForQuote/validation.test.ts
```

| Timezone            | Observed result                  | Duration |
| ------------------- | -------------------------------- | -------- |
| UTC                 | 4 files, 30 tests passed; exit 0 | 12.02s   |
| Australia/Sydney    | 4 files, 30 tests passed; exit 0 | 8.89s    |
| America/Los_Angeles | 4 files, 30 tests passed; exit 0 | 9.07s    |

These runs no longer reproduce the historical wrapper failures. Existing cases
do not explicitly exercise Sydney DST transitions. The
[umbrella contract gate](2026-08-23-npm-deprecation-remediation.md) still
requires authoritative backend semantics and a named approver. No
`date-contract.md` was found. The main checkout's ignored
`reports/stabilisation/delivery-ledger.md` still records B0/B1 as blocked, and
its `owners.md` says the approval lane has not been entered; these files are
outside this worktree and were not copied or changed.

Next: reconcile the shipped adapter with the approval records, obtain the field
type/format, nullability, accepted payloads, offset/time-of-day semantics, and
runtime-deserialization evidence; then verify explicit DST transitions. No
backend contract was guessed and no UI source was changed.

Resumed execution on 2026-10-10 rechecked both worktrees and all local Git refs:
`reports/stabilisation/date-contract.md` is still absent. The main checkout's
owner and delivery records still leave the API Contract Approver unassigned and
B0/B1 externally deferred. The approval gate remains unresolved.

## A4 — Activation campaign

The evaluated package is `.claude/skills/skill-creator`. Its current decoded
description SHA-256 is
`1d5e78e5e028bf0ed62a130e82f98d1e10b88b5b728fcd580d2dcc85c5f05d2a`. The existing
evaluator is `scripts/run_eval.py`, SHA-256
`2dfc48e55ddcdf3e9565d12df9bd4f89213f109fc544a419e465e44ceb8727ab`.

The package's `evals/evidence-applicability.md` explains that the older closeout
PASS belongs to a different description. Current-description artifacts with many
errors retain provider `429` usage-limit messages; these are unavailable
observations, not proof of activation false positives.

Fresh serial probes using the existing `run_single_query` function, Claude Code
2.1.286, and a 30-second attempt timeout completed without errors: the browser
extension near-miss did not trigger (22.71s), a training positive triggered
(6.06s), and a previously missed holdout positive triggered (9.71s). These
representative probes alone do not satisfy the full release gate.

The complete current-candidate run preserved the existing training corpus and
untouched holdout, run counts, threshold, and zero-error requirement. From
`.claude/skills/skill-creator`, with `$taskPython` resolved to the main
checkout's Python executable:

```powershell
& $taskPython -B -m scripts.run_eval --eval-set evals/activation-eval.json --skill-path . --num-workers 1 --timeout 30 --runs-per-query 1 --trigger-threshold 0.5 --verbose
& $taskPython -B -m scripts.run_eval --eval-set evals/activation-holdout.json --skill-path . --num-workers 1 --timeout 30 --runs-per-query 2 --trigger-threshold 0.5 --verbose
```

| Campaign | Cases passed | Attempts completed | Execution errors | Duration |
| -------- | -----------: | -----------------: | ---------------: | -------: |
| Training |        20/20 |              20/20 |                0 |  201.50s |
| Holdout  |          1/8 |               2/16 |               14 |   42.85s |

All 14 holdout errors were provider `429` session-limit responses, with a
reported reset at **2026-10-11 03:20 Australia/Sydney**. The two completed
holdout attempts both triggered correctly; no timeouts occurred. Exit 0 means
the evaluator generated reports, not that the holdout met its acceptance gate.
The stage deadlines were 660 seconds and 540 seconds respectively.

The
[campaign manifest](../../../.claude/skills/skill-creator/evals/runs/2026-10-10-outstanding-actions-121932Z/manifest.json)
and adjacent `train-results.json` / `holdout-results.json` preserve commands,
source/corpus hashes, result hashes, environment, counts, and the blocker.
Source hashes were unchanged after execution. The dedicated vocabulary near-miss
campaign was not rerun after the quota was exhausted.

**Release decision: HOLD.** After the quota resets, rerun the complete untouched
holdout with the same candidate and parameters, followed by the outstanding
vocabulary near-miss campaign if required by the package's existing release
protocol. Keep this incomplete attempt. Changing the model, threshold, or corpus
to evade the quota would not satisfy the same gate.

## A5 — Review-generator suite recovered and passing

The test is present at
`.claude/skills/skill-creator/scripts/Regression tests/test_generate_review.py`;
the initial filename search missed the hidden `.claude` directory. It imports
the existing `eval-viewer/generate_review.py` implementation.

The skill-regression investigation resolved Python from the main checkout and
ran the suite from the package directory under an outer 180-second process
deadline:

```powershell
$taskPython = (Resolve-Path ../../.venv/Scripts/python.exe).Path
Push-Location .claude/skills/skill-creator
& $taskPython -B -m pytest "scripts/Regression tests/test_generate_review.py" -vv -p no:cacheprovider --tb=short -o faulthandler_timeout=45
Pop-Location
```

Observed: **19 tests and 42 subtests passed in 3.25s**, exit 0, 3.79s including
the outer wrapper. Environment: Python 3.14.7, pytest 9.1.1. No timeout increase
or source change was needed. The historical hang's cause remains unestablished.

## A6 — Writing-skills aliases restored

Both existing metadata cases around `called_writing_skills_alias` failed before
the change. Repository policy still requires explicit “writing skills” and
“called writing skills” requests to activate this skill; no replacement evidence
superseded that intent. The repair adds one sentence to the description in
`skills/writing-skills/SKILL.md`, preserving the rest of the package and its
version. Global installed skills were not changed.

```powershell
../../.venv/Scripts/python.exe -B -m pytest skills/writing-skills/scripts/tests/test_writing_skills_metadata.py skills/writing-skills/scripts/tests/test_prompt.py -q -p no:cacheprovider --tb=short
```

Root verification observed **16 passed in 0.20s**, exit 0. The skill
investigator also ran `python -B -m skills_ref.cli validate ..` from the skill's
`scripts` directory: `Valid skill: ..`. Fresh isolated activation probes using
the existing creator evaluator triggered for the explicit alias (3.95s) and did
not trigger for a README rewrite (4.69s), with no errors and a 30-second bound.
These probes establish representative discovery, not every client's integrated
deployment readiness.

## A7 — Current Markdown baseline and remediation tasks

Baseline scope is **152 tracked Markdown files**: root 7, `docs` 135, `analysis`
7, `memory` 2, and `hooks` 1. Each candidate and the configuration passed
secrets scanning before linting.

```powershell
$scope = @(git ls-files '*.md' '*.markdown' |
  Where-Object { $_ -notmatch '/' -or $_ -match '^(docs|analysis|memory|hooks)/' })
npx --yes --package=markdownlint-cli2@0.20.0 markdownlint-cli2 @scope --config .markdownlint.json
```

Runner: markdownlint-cli2 0.20.0, markdownlint 0.40.0. At baseline `655f90af`,
the investigation observed **1,063 diagnostics in 46 files**, exit 1. MD013 is
disabled and produced zero findings. MD060 remains: **544 diagnostics at 111
distinct file/line locations across 21 files**. Diagnostics can count multiple
columns on one line, so they are not interchangeable with affected-line counts.

| Rule  | Diagnostics |
| ----- | ----------: |
| MD001 |          18 |
| MD004 |         120 |
| MD012 |           1 |
| MD022 |          30 |
| MD024 |           1 |
| MD025 |          39 |
| MD026 |          10 |
| MD029 |           4 |
| MD031 |          97 |
| MD032 |         131 |
| MD033 |           3 |
| MD036 |          24 |
| MD040 |          27 |
| MD041 |           6 |
| MD051 |           2 |
| MD056 |           3 |
| MD058 |           3 |
| MD060 |         544 |

Excluded tracked groups: `.claude` 761 files, `.github` 615, `.agents` 116,
`skills` 107, `.agent-sync` 14, `reports` 5, and `.superpowers` 1. Tracked-only
enumeration also excludes untracked caches, worktrees, builds, and vendor
artifacts. This is a maintained-document baseline, not a full-repository
Markdown check. Existing root policy documents are included in the measured
scope; this does not authorize changing policy.

| Follow-up                 | Scope and acceptance                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MD-T1: tables             | MD056/MD058/MD060: 550 diagnostics in 22 files. Split MD060 into `analysis/**` (298), historical plans (150), skill reviews (78), and other docs (18). Verify table semantics, then rerun each touched scope. |
| MD-T2: headings           | MD001/MD022/MD024/MD025/MD026/MD036/MD041: 128 diagnostics in 15 files. Correct hierarchy and real headings without changing policy or disabling rules.                                                       |
| MD-T3: lists              | MD004/MD029/MD032: 255 diagnostics in 21 files. Preserve numbering/meaning; apply Prettier and rerun the touched scope.                                                                                       |
| MD-T4: fences             | MD031/MD040: 124 diagnostics in 16 files. Supply accurate fence languages and required spacing; do not disable MD040.                                                                                         |
| MD-T5: remaining findings | MD033: 3 in one file; MD051: 2 in `docs/sec/SEC-010-backend-team-request.md`; MD012: 1. Verify the intended HTML and anchor targets before editing.                                                           |

Additional table-specific issues are MD056 in
`docs/change-record/OPEN-ITEMS-BACKLOG.md` and MD058 in
`docs/superpowers/plans/2026-05-30-sonar-lint-cleanup.md`. Remediation batches
were included in the resumed remediation below. The table above preserves the
original measured baseline.

### MD-T1 through MD-T5 — Completed in resumed execution

Codex assigned the batches to three agents with disjoint file ownership:
analysis (347 original findings), historical plans (506), and other documents
(210). The complete batch corrected 1,063 findings in 46 documents. All five
follow-ups are complete:

- [x] MD-T1: tables — aligned tables, repaired escaped regex alternation pipes
      in the backlog, and preserved intended column contents.
- [x] MD-T2: headings — corrected hierarchy, real subsection headings, duplicate
      headings, and trailing heading punctuation.
- [x] MD-T3: lists — corrected marker formatting and numbering while retaining
      the historical ruling identifiers.
- [x] MD-T4: fences — supplied languages and spacing and repaired nested
      Markdown examples with longer outer fences.
- [x] MD-T5: remaining findings — corrected prose HTML examples, blank lines,
      and the two security-request anchor links.

Using the same scope enumeration and pinned runner shown above, the current 153
maintained tracked documents report **0 errors**, exit 0. The additional file
relative to the 152-file baseline is this execution report. Repository default
Prettier governs the formatting; no lint rules, ignores, policy files, or
quality gates were changed. The original failing baseline remains above.

Final integrated verification after the status updates: pinned Markdown lint
passed on all **153** maintained documents; default Prettier passed on all
**48** changed Markdown files (46 remediation files plus the backlog and this
report); secrets scans of `docs` and `analysis` were clean; and
`git diff --check` passed. Application code was unchanged in this resumed batch,
so application tests and builds were not repeated.

## A8 — Memory service responds; VS Code check remains

The installed worker is claude-mem 13.27.1. Read-only localhost requests at port
37777 returned:

| Endpoint                                                        | Observed result                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------- |
| `/api/health`                                                   | HTTP 200, `status: ok`, `initialized: true`, `mcpReady: true` |
| `/api/readiness`                                                | HTTP 200, `status: ready`, `mcpReady: true`                   |
| `/api/context/recent?project=portal.measurement.gov.au&limit=1` | HTTP 200, JSON response, 3,893 bytes                          |
| `/api/context/inject?project=portal.measurement.gov.au`         | HTTP 200, nonempty text response, 8,255 bytes                 |

Only structural metadata was printed; memory content and settings were not
included in chat or evidence. These results do not reproduce the historical
worker-health failure and establish service-side context retrieval. The current
tools do not control the affected VS Code consumer, so end-to-end completion
verification remains pending. No service restart or global configuration change
was performed.

Resumed execution on 2026-10-10 repeated all four requests: HTTP 200 for each,
`status: ok` / `mcpReady: true` for health, `status: ready` for readiness, and
the same 3,893-byte recent-context and 8,255-byte injection responses. The
affected VS Code completion flow remains unverified.

## A9 — Documented infrastructure candidates recovered

The
[dependency remediation predecessor plan](2026-08-23-dependency-vulnerability-remediation.md)
explicitly names Bug A and Bug B near lines 1084–1085:

1. Nested Storybook projects did not flatten through the root Vitest workspace,
   causing duplicate Node test execution and `document is not defined`.
2. Root `maxWorkers: 1` forced forks/browser pools to share a slot during
   coverage, causing `Vitest failed to find the current suite`.

[Commit `0d16927880127580c0e1f863effd94fb9d34d0ba`](https://github.com/gmtestandreview/portalsample/commit/0d16927880127580c0e1f863effd94fb9d34d0ba)
documents both fixes and their historical verification, and is an ancestor of
the execution baseline. The umbrella plan classifies both as completed
predecessor work. Fresh characterization from the date/infrastructure
investigation:

```powershell
node --max-old-space-size=8192 ../../node_modules/vitest/vitest.mjs run --configLoader runner --config vitest.unit.config.ts tests/unit/config/vitestTopology.test.ts
```

Observed: **22 tests passed**, exit 0, 1.18s. These tests protect the flat
Storybook leaf and absence of the root worker cap. The original unnamed chat
observation was not recovered, so these are the documented candidate pair, not a
definitive identity match to that observation. Do not reopen the already fixed
candidates merely because the old TODO omitted their names.

Resumed execution on 2026-10-10 retrieved PR #1 and its discussion again. The PR
body explicitly references the workspace-nesting fix at `0d16927`; the sole
discussion comment reports a Sonar quality gate. Neither supplies the original
unnamed observation, so definitive identity correlation remains open.

## D1 — Relocation remains deferred

The owner explicitly selected “Keep relocation deferred” during execution. No
repository move, path rewrite, environment recreation, or memory migration was
performed. The relocation plan remains available for a future scope decision.

## Validation boundaries

Code changes are limited to the GitHub MCP launcher, its regression tests, and
the writing-skills alias description. Existing date and topology suites were run
to establish backlog status; their production code was not changed. No
application build, full CI suite, production deployment, secret rotation,
calendar import, or VS Code consumer verification is implied by these results.
Resumed execution additionally remediated the maintained-document Markdown
findings and created the authorized PAT tracking task. The historical failing
baseline is retained alongside the clean current result. Edited documents
receive focused format, secrets, link, and diff checks before handoff.
