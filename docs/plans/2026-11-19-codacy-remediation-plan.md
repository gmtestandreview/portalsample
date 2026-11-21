# Codacy remediation plan — PR #116

Status: **READY FOR APPROVAL** with an owner-approved score waiver (raw 92,
target 96). Approval of this plan is not permission to implement.

Source of truth for findings: Codacy PR issues API for
`gmtestandreview/portalsample` PR 116 (123 findings at head `d33ba2ea`). The
earlier pasted report in `codacy-lint-issues.md` (133 findings) is an older
snapshot and is superseded.

Evidence labels: VERIFIED (observed in this session), REPORTED (stated by Codacy
or a user, not re-checked at HEAD), HYPOTHESIS (inferred).

## 1. Executive summary

Codacy reports 123 new issues against a gate of 0. All 123 are individually
identified (file, rule, line, tool). They fall into subprocess hardening, one
runtime bug, Ruff style and typing, Pylint false positives, Markdown, PowerShell
and file-length findings. The plan fixes real defects first, fixes style and
typing in parallel, and proposes documented exceptions (no suppressions) for
by-design or false-positive findings.

## 2. Baseline

| Item                           | Value                                                              | Evidence                   |
| ------------------------------ | ------------------------------------------------------------------ | -------------------------- |
| Branch                         | `fix/strict-eslint-violations`                                     | VERIFIED                   |
| HEAD and PR head               | `d33ba2ea283dc07dbdd83c5ba96f4c94b1b3f0a9`                         | VERIFIED                   |
| Base and merge-base            | `main`, `d60f214c70fdd9493784c11bcffe204825c7fac4`                 | VERIFIED                   |
| Commits ahead of base          | 86                                                                 | VERIFIED                   |
| Toolchain                      | Python 3.14.7, Node v24.21.0, Pyright 1.1.414                      | VERIFIED                   |
| Ruff config                    | `ruff.toml`, `target-version='py314'`, `line-length=100`           | VERIFIED                   |
| Codacy live result             | 123 added, 872 solved, gate 0                                      | VERIFIED                   |
| Pasted report                  | 133 added, 871 solved                                              | REPORTED, snapshot unknown |
| Findings by introducing commit | `bae48386` 83, `fafe15be` 26, `d33ba2ea` 4, `b8375f2c` 3, others 7 | VERIFIED                   |

Consequence: 119 findings come from older commits. Line numbers may be stale and
some findings may already be fixed at HEAD. Re-pull the issues API before and
after every phase; only the fresh list counts.

CI scope (VERIFIED from `.github/workflows/pr.yml`): Ruff and Pyright do not run
in CI and were never meant to. The Python CI steps are the webapp-testing
unittest job and the `tests/hooks` checks. Ruff and Pyright are local checks.
Codacy is the Python lint gate.

## 3. Target state

- Codacy new issues: 0 against the gate.
- No lint rule, threshold, coverage or security control weakened.
- No `# nosec` or blanket exclusions. Exceptions are documented and approved.
- Existing tests pass. Subprocess calls are explicit about `check`, executable
  path and timeouts.

## 4. Strategy and dependency graph

```text
P0 BASE-001  re-pull Codacy issues for HEAD
 └─ P1 TEST-001  characterisation tests (hook git helpers, timeouts)
     ├─ PY-006, PY-007, SEC-001, SEC-003, SEC-004, PS-001   (serial)
     └─ P2 parallel: PY-001, PY-002, PY-003, PY-005, PY-008..PY-011, DOC-001
         └─ PY-004 (E501 wrap, last: touches lines other tasks edit)
P3 CX-001a..d  ClientApp splits (independent of Python phases)
P4 INT-001  integrated verification
```

## 5. Phase plan

| Phase | Objective             | Entry gate    | Tasks                                          | Exit gate     | Owner          |
| ----- | --------------------- | ------------- | ---------------------------------------------- | ------------- | -------------- |
| 0     | Fresh finding list    | Plan approved | BASE-001                                       | List recorded | Repo owner     |
| 1     | Defects and security  | Gate A        | TEST-001, PY-006, PY-007, SEC-001..006, PS-001 | Gates B, C    | Security owner |
| 2     | Style, typing, docs   | Phase 0       | PY-001..PY-005, PY-008..PY-011, DOC-001        | Gates B, C    | Python owner   |
| 3     | ClientApp file length | Phase 0       | CX-001a..d                                     | Gates B, C    | Frontend owner |
| 4     | Integration           | Phases 1 to 3 | INT-001                                        | Gate D        | Tech lead      |

Gates: A ready to implement, B local remediation verified, C integration
verified, D approved for next work package. None has run.

## 6. Finding register (123 of 123, status COMPLETE)

Each line number is one finding. Composite key: file, rule, line. Issue IDs are
available from the Codacy API. All entries are REPORTED; state at HEAD is
unconfirmed (see section 2). Skill paths shorten `.claude/skills/` to `S/` and
`skill-creator` to `SC/`.

| Task      |   Count | Findings (file, rule, lines)                                                                                                                                                                                                                                |
| --------- | ------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOC-001   |       4 | `.agents/skills/dry-refactoring/SKILL.md` MD031 @49,51; `.agents/skills/migrate-oxfmt/SKILL.md` MD034 @307, MD041 @9                                                                                                                                        |
| PS-001    |       2 | `.claude/hooks/git-guard.ps1` AvoidAssignmentToAutomaticVariable @14, AvoidUsingEmptyCatchBlock @65                                                                                                                                                         |
| SEC-001   |       6 | `.claude/hooks/secret-scanner.py` B603 @336,342; B607 @336,342; W1510 @336,342                                                                                                                                                                              |
| SEC-003   |       4 | `S/webapp-testing/scripts/with_server.py` B603 @187,218,338; W1510 @338                                                                                                                                                                                     |
| SEC-004   |       1 | `.github/skills/eyeball/tools/eyeball.py` dangerous-subprocess-use-tainted-env-args @155                                                                                                                                                                    |
| SEC-002   |       5 | `S/typescript-expert/scripts/tests/test_ts_diagnostic.py` subprocess-audit @155,161; `S/webapp-testing/scripts/tests/test_with_server.py` subprocess-audit and python_exec @158; `S/SC/scripts/Regression tests/test_run_pipeline.py` subprocess-audit @274 |
| SEC-005   |       2 | `S/SC/scripts/run_pipeline.py` non-literal-import @186; `S/SC/scripts/Regression tests/test_improve_description.py` non-literal-import @72                                                                                                                  |
| SEC-006   |       4 | B105 in `S/SC/scripts/run_early_exit_eval.py` @280, `run_pipeline.py` @438, `run_readiness_pressure_eval.py` @920, `S/typescript-expert/scripts/ts_diagnostic.py` @31                                                                                       |
| PY-006    |       1 | `S/cto-advisor/scripts/team_scaling_calculator.py` F821 @312                                                                                                                                                                                                |
| PY-007    |       1 | `S/SC/scripts/Regression tests/test_run_pipeline.py` Pylint E0239 @56                                                                                                                                                                                       |
| PY-008    |       5 | `.github/skills/draw-io-diagram-generator/scripts/add-shape.py` Pylint E1101 @130,139,159,162,170                                                                                                                                                           |
| PY-009    |       5 | `S/SC/scripts/run_pipeline.py` Pylint C0123 @867,957,1239,1410,1422                                                                                                                                                                                         |
| PY-010    |       1 | `S/SC/scripts/run_eval.py` Pylint W0718 @1176                                                                                                                                                                                                               |
| PY-011    |       3 | `.github/skills/acquire-codebase-knowledge/scripts/scan.py` E741 @853, F841 @483, Pylint W0612 @483                                                                                                                                                         |
| PY-001    |       8 | UP040 in `S/SC/eval-viewer/generate_review.py` @68; `S/SC/scripts/aggregate_benchmark.py` @27,28,29,30,31,74,75                                                                                                                                             |
| PY-002    |       2 | B007 in `.claude/hooks/secret-scanner.py` @227; `S/SC/scripts/run_red_green_eval.py` @492                                                                                                                                                                   |
| PY-003    |       4 | SIM115 `S/file-organizer/scripts/validate_manifest_v6.py` @67,69; SIM117 `S/SC/scripts/Regression tests/test_eval_control.py` @250; SIM102 `.github/skills/quality-playbook/quality_gate.py` @1198                                                          |
| PY-005    |       2 | B009 `S/SC/scripts/Regression tests/test_run_early_exit_eval.py` @77,81                                                                                                                                                                                     |
| PY-004    |      59 | E501, see below                                                                                                                                                                                                                                             |
| CX-001    |       4 | Lizard `file-nloc-medium` @1 in `ClientApp/src/components/modals/BranchSelectorModal/index.tsx`, `ClientApp/src/components/modals/Modals.stories.tsx`, `ClientApp/src/routes/dashboard/dashboard-ta.tsx`, `ClientApp/src/routes/dashboard/index.tsx`        |
| **Total** | **123** |                                                                                                                                                                                                                                                             |

PY-004 E501 findings (59):

- `.github/skills/quality-playbook/quality_gate.py` (26): 309, 341, 372, 395,
  400, 774, 818, 1054, 1060, 1096, 1106, 1111, 1204, 1219, 1289, 1293, 1348,
  1357, 1444, 1523, 1533, 1537, 1616, 1627, 2680, 3142.
- `S/typescript-expert/scripts/ts_diagnostic.py`: 623, 639, 679.
- `.github/skills/acquire-codebase-knowledge/scripts/scan.py`: 845, 874;
  `validate_codebase_docs.py`: 166, 287.
- `.github/skills/code-tour/scripts/generate_from_docs.py`: 124, 228;
  `validate_tour.py`: 198, 331.
- `.github/skills/excalidraw-diagram-generator/scripts/add-arrow.py`: 215, 235;
  `add-icon-to-diagram.py`: 306, 325; `split-excalidraw-library.py`: 143,
  154, 172.
- `.github/skills/eyeball/tools/eyeball.py`: 657, 661.
- `S/agile-product-owner/scripts/user_story_generator.py`: 142, 355;
  `S/ceo-advisor/scripts/financial_scenario_analyzer.py`: 375, 376;
  `strategy_analyzer.py`: 345; `S/code-reviewer/scripts/pr-analyzer.py`: 638;
  `S/security-compliance/scripts/vuln_prioritizer.py`: 334, 432.
- `S/file-organizer/scripts/validate_manifest_v6.py`: 43;
  `S/SC/eval-viewer/generate_review.py`: 40; `S/SC/scripts/__init__.py`: 8;
  `S/SC/scripts/run_pipeline.py`: 1476;
  `S/vulnerability-scanner/scripts/security_scan.py`: 171.

Tools: Ruff 78, Pylint 16, Bandit 11, Opengrep 8, Lizard 4, markdownlint 4,
PSScriptAnalyzer 2. Complexity and clone entries in the Codacy summary are
metrics, not findings, and carry no task unless a finding links to them.

## 7. Execution backlog

Each finding in section 6 maps to exactly one task. Priority: P0 security or
correctness defect, P1 gate blocker, P2 maintainability, P3 cosmetic.

| Pri | Task     |    Findings | Prerequisites      | Risk   | Acceptance                                                                |
| --- | -------- | ----------: | ------------------ | ------ | ------------------------------------------------------------------------- |
| P1  | BASE-001 |         all | none               | low    | Fresh issues list recorded for HEAD                                       |
| P0  | TEST-001 | supports 15 | BASE-001           | low    | Tests pin current hook and timeout behaviour on unmodified HEAD           |
| P0  | PY-006   |           1 | TEST-001           | low    | Name defined before use; test added                                       |
| P0  | SEC-001  |           6 | TEST-001           | medium | 0 findings; fail-open behaviour unchanged                                 |
| P0  | SEC-003  |           4 | TEST-001           | high   | W1510 fixed; B603 exception approved; unittest green on both OS           |
| P0  | SEC-004  |           1 | TEST-001           | medium | `soffice_path` provenance verified, else exception                        |
| P1  | SEC-002  |           5 | TEST-001           | low    | Fixed in code, else exception                                             |
| P1  | SEC-005  |           2 | TEST-001           | medium | Test fixed by literal import; loader exception approved                   |
| P1  | SEC-006  |           4 | TEST-001           | low    | Exception approved; no real secrets confirmed                             |
| P1  | PS-001   |           2 | none               | low    | 0 findings; hook tests pass                                               |
| P2  | PY-007   |           1 | TEST-001           | low    | Base class redefined with class syntax                                    |
| P2  | PY-008   |           5 | none               | low    | Exception approved (Pyright reports 0 errors)                             |
| P2  | PY-009   |           5 | TEST-001           | medium | Shared bool-excluding int helper at all five sites                        |
| P2  | PY-010   |           1 | none               | low    | Exception approved or exception set narrowed                              |
| P2  | PY-011   |           3 | none               | low    | Cleared                                                                   |
| P2  | PY-001   |           8 | none               | medium | `type X = ...`, quoted forward references dropped; Ruff and Pyright clean |
| P2  | PY-003   |           4 | none               | low    | Cleared                                                                   |
| P2  | CX-001   |           4 | none               | medium | See section 8                                                             |
| P3  | PY-002   |           2 | none               | low    | Cleared                                                                   |
| P3  | PY-005   |           2 | none               | low    | Narrow per-line Pyright private-access exception, then direct access      |
| P3  | PY-004   |          59 | other Python tasks | low    | Wrapped; `line-length` unchanged                                          |
| P3  | DOC-001  |           4 | none               | low    | Cleared                                                                   |
| P1  | INT-001  |         all | Phases 1 to 3      | medium | Codacy re-run shows 0 new issues                                          |

Task notes (VERIFIED root causes unless marked):

- **PY-006:** `team_scaling_calculator.py:298` assigns `salary_bands = {...}`
  and lines 311 and 312 read `salary_bands` inside the same literal. Define the
  US bands first, then derive EU and APAC.
- **SEC-001:** `subprocess.run(['git', ...])` at lines 336 and 342 has no
  `check=` and a bare executable name. Add `check=False`, a `timeout`, and a git
  path resolved once with `shutil.which`; keep fail-open.
- **SEC-003:** The final `run` at line 338 has no `check=`. The B603 hits are by
  design (the tool runs caller-supplied commands with `shell=False` and a
  resolved executable). Propose a documented exception.
- **PY-009:** `type(x) is int` deliberately excludes `bool`. A plain
  `isinstance` would admit `True` as an exit code.
- **PY-007:** `_CaseRequired` is a functional-form `TypedDict`; Pylint cannot
  see it as a class (false positive).
- **PY-008:** HYPOTHESIS: Pylint inference gap with `defusedxml` types.
  `pyright --project pyrightconfig.json` on `add-shape.py` reports 0 errors.
- **SEC-006:** `ts_diagnostic.py:31` is `PASS = 'PASS'`. Names and keys named
  "pass" are a report-format contract; do not rename.
- **SEC-004:** The code passes an absolute path with no shell and no custom
  process settings, with a comment guarding option injection.

## 8. ClientApp file-length plan (CX-001)

Lizard `file-nloc-medium` threshold is 580 NLOC in `.codacy/codacy.config.json`.
Do not change it. Overage per file is not measured (HYPOTHESIS).

| Sub-task | Target                                                                  | Change                                                                                                                                                                                                                                            |
| -------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CX-001a  | `BranchSelectorModal/index.tsx` (672 lines; component spans 175 to 670) | Extract load and save logic into a custom hook in the same folder                                                                                                                                                                                 |
| CX-001b  | `dashboard/index.tsx`, `dashboard-ta.tsx`                               | Extract the identical helper block (`showDashboardMessage`, `setNotification`, `setInfoNotification`, `handlePaginationScroll`, page-size constant) into a shared helpers module. Leave `fetchRequestsByTab` per dashboard (client types differ). |
| CX-001c  | `Dashboard` (273 to 882), `DashboardTA` (179 to 781)                    | Extract load, fetch and error handling into hooks; after CX-001b                                                                                                                                                                                  |
| CX-001d  | `Modals.stories.tsx` (732)                                              | Split into three story files plus a shared harness                                                                                                                                                                                                |

Risks: `pr.yml` gates Storybook coverage on "167 story files", so splitting
changes that count; check the gate and any governance manifest before and after.
Hook extraction must not change effect order or render counts. Existing unit and
Storybook tests are the guard.

## 9. Verification

Commands come from `package.json`, `pr.yml` and the user. None has been run.
Ruff and Pyright are local checks and are not in CI.

| Scope                | Command                                                                                                      | Source                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------- |
| TypeScript types     | `npm run type-check`                                                                                         | `pr.yml`                |
| Lint                 | `npm run lint`                                                                                               | `pr.yml`                |
| Unit tests           | `npm run test:unit`                                                                                          | CLAUDE.md               |
| Storybook tests      | `npm run test:storybook`                                                                                     | CLAUDE.md               |
| Format               | `npm run format:check`                                                                                       | `pr.yml`                |
| webapp-testing tests | `python -W error::ResourceWarning -I -m unittest discover -s .claude/skills/webapp-testing/scripts/tests -v` | `pr.yml`                |
| Hook tests           | `python3 tests/hooks/test_pre_tool_use.py`                                                                   | `pr.yml`                |
| Ruff (local)         | `uv run ruff check --config ruff.toml <paths>` (use `--no-fix`; the supplied `--fix` form edits files)       | user, unconfirmed       |
| Pyright (local)      | `pyright --project pyrightconfig.json <paths>`                                                               | user, confirmed locally |
| Static analysis      | Codacy re-run, compare against a fresh API pull                                                              | Codacy                  |

Traceability: each task in section 7 is verified by (1) the command for its
language above, (2) a Codacy re-run that no longer reports its findings, and (3)
for SEC-001, SEC-003 and PY-006, a new or existing test that fails before the
change and passes after. Coverage thresholds are not lowered.

Review gates per work package (all planned): A ready to implement; B local
change verified (targeted tests pass, no new local violations); C integration
verified (callers and tests pass); D approved for next package (owner sign-off).

## 10. Decisions (all closed; owners approved)

| ID   | Decision                                                                                                                               |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- |
| D-01 | Hooks keep failing open when git is missing or errors. Add `check=False`, a `timeout`, and a resolved git path.                        |
| D-02 | Fix test-file subprocess findings in code first (static command, no shell). If a rule still fires, propose an exception. No `# nosec`. |
| D-03 | The B105 hits are unverified false positives; inspect each. See D-07.                                                                  |
| D-04 | Superseded: no process-settings allowlist needed for `eyeball.py`. Verify `soffice_path` provenance, else exception.                   |
| D-05 | Split ClientApp files along responsibility boundaries, not to trim lines. Existing tests pass unchanged.                               |
| D-06 | Restructure where possible. Propose documented exceptions for the B603 hits and the two `import_module` loaders.                       |
| D-07 | Keep the B105 names and keys (report-format contract). Propose an exception.                                                           |
| D-08 | Keep the broad `except Exception` at the thread boundary unless the exception set is known.                                            |
| D-09 | A narrow per-line Pyright private-access exception is approved for the `getattr(..., '_validated_cases')` tests.                       |

## 11. Risks

| ID   | Risk                                       | Severity | Mitigation                                    | Recovery                  |
| ---- | ------------------------------------------ | -------- | --------------------------------------------- | ------------------------- |
| R-01 | Resolved git path changes hook behaviour   | High     | TEST-001 first                                | Revert the SEC-001 commit |
| R-02 | `type` aliases break at runtime            | Low      | No `isinstance` use of the aliases (VERIFIED) | Revert PY-001             |
| R-03 | Stale findings (119 from older commits)    | Medium   | Re-pull the API before and after each phase   | n/a                       |
| R-04 | Pressure to suppress false positives       | Medium   | Owner-approved exceptions only                | Revert                    |
| R-05 | Story-file split changes the coverage gate | Medium   | Check the gate before and after CX-001d       | Revert CX-001d            |
| R-06 | Hook extraction changes render behaviour   | Medium   | Existing tests unchanged                      | Revert the extraction     |

## 12. Devil's Advocate summary

- The pasted 133 and the live 123 differ and the cause is unknown. Mitigation:
  the live API is authoritative.
- Fixing B105 or loader findings by renaming would change report formats.
  Mitigation: exceptions D-06 and D-07.
- Only 4 findings were introduced by the HEAD commit, so most may be stale.
  Mitigation: R-03.
- Complexity and clone metrics are not findings and carry no task.

## 13. Rubric and readiness

| Criterion                   |     Max | Awarded |
| --------------------------- | ------: | ------: |
| Evidence and baseline       |      15 |      14 |
| Findings completeness       |      20 |      18 |
| Root cause and dependencies |      15 |      15 |
| Sequencing                  |      15 |      14 |
| Verification                |      15 |      13 |
| Security, risk, rollback    |      10 |      10 |
| Adversarial review          |       5 |       4 |
| Clarity                     |       5 |       4 |
| **Total**                   | **100** |  **92** |

The acceptance target was 96. The owners approved a waiver of the 4-point gap.
Conditions: re-pull the Codacy issues API before and after each phase, and count
only the fresh list.

Decision: READY FOR APPROVAL under that waiver. First implementation phase:
Phase 1 (TEST-001, then PY-006, then SEC-001 and SEC-003 W1510, then PS-001).
Required approvals: security owner, Python owner, frontend owner, tech lead (all
stated as given). Approval of the plan is not permission to implement.

## 14. Phase 1 task briefs

Executable briefs for Phase 1, verified against HEAD `d610b8ee` (all five
findings still present). Global constraints for every task: do not touch files
outside the task's list; no `# nosec`, `# noqa` or lint-config changes; Python
3.14, Ruff `line-length=100`, single quotes; run tests with
`python -I -m pytest <file> -p no:cacheprovider` (hooks) or the `unittest`
command in section 9 (webapp-testing); commit with a `fix:`/`test:` message and
stage only the task's files (the working tree has unrelated user changes).

### Task 1: TEST-001 characterisation tests for secret-scanner git helpers

Files: `tests/hooks/test_secret_scanner.py` (extend only). Pin the CURRENT
behaviour of `_auto_staged_files`, `_all_added_files` in
`.claude/hooks/secret-scanner.py` (lines ~329-345) before Task 3 changes them:
(a) with `subprocess.run` monkeypatched to return stdout of file names, the
helpers return only existing files; (b) `_all_added_files` strips the 3-char
porcelain prefix; (c) when `subprocess.run` raises `FileNotFoundError` the
helper currently propagates it, and the caller `files_to_scan`/main path's
fail-open outcome is whatever it is today: record it as an assertion. Read the
module to find where errors are caught. Tests must pass on unmodified code.
Acceptance: new tests pass at HEAD; no production file changed.

### Task 2: PY-006 undefined `salary_bands` in `_calculate_budget`

Files: `.claude/skills/cto-advisor/scripts/team_scaling_calculator.py`, plus a
new test
`.claude/skills/cto-advisor/scripts/tests/test_team_scaling_calculator.py`
(create `tests/` if absent; follow neighbouring skill test conventions). Bug:
the `salary_bands = {...}` literal reads `salary_bands` inside itself (`'EU'`
and `'APAC'` entries, lines ~311-312), raising `NameError` at runtime (F821).
Fix: define the `'US'` bands in a local first, then build the dict: EU = US x
0.8, APAC = US x 0.6, keeping the same values and rounding as today. Write the
failing test first: `_calculate_budget` with `location='EU'` and `'APAC'`
returns without error and scales the US figures by 0.8 / 0.6. Acceptance: test
fails before, passes after; Ruff F821 gone.

### Task 3: SEC-001 explicit `check`, resolved git path and timeout in secret-scanner

Files: `.claude/hooks/secret-scanner.py` (lines ~336 and ~342 only, plus a small
module-level git-path helper); extend `tests/hooks/test_secret_scanner.py`. Both
`subprocess.run(['git', ...])` calls lack `check=` (W1510) and use a bare
executable name (B607/B603). Decision D-01: the hook keeps failing OPEN. Change:
resolve git once with `shutil.which('git')`; if missing, return `[]`; call
`subprocess.run([git, ...], capture_output=True, text=True, check=False, timeout=<module constant 10>)`;
catch `subprocess.TimeoutExpired` and `OSError` and return `[]`. Task 1's
characterisation tests must still pass except where they pinned error
propagation: update only those assertions and state why in the report. Add tests
for: git missing -> `[]`; timeout -> `[]`; nonzero exit -> parsed stdout
unchanged. Acceptance: all of `tests/hooks/test_secret_scanner.py` passes; no
other behaviour changes.

### Task 4: SEC-003 explicit `check` on the final run in with_server.py

Files: `.claude/skills/webapp-testing/scripts/with_server.py` (line ~338 only);
`.claude/skills/webapp-testing/scripts/tests/test_with_server.py` if a test is
needed. Change `subprocess.run(prepare_argv(args.command), shell=False)` to add
`check=False` (the tool must propagate the child's exit code via
`sys.exit(result.returncode)`, so `check=True` is wrong). Do NOT change B603
sites (@187, @218, @338): by design, exceptions are the owner's call (D-06).
Acceptance: webapp-testing unittest command from section 9 passes; one existing
or new assertion confirms the child's nonzero exit code is propagated. Note:
`test_bare_name_from_current_directory_is_refused` is a known pre-existing
failure on Windows; report whether it still fails, do not fix it here.

### Task 5: PS-001 git-guard.ps1 PSScriptAnalyzer findings

Files: `.claude/hooks/git-guard.ps1` (lines 14 and 65 only). (a) Rename the
`$event` variable (automatic variable in PowerShell) to `$hookInput` at every
use. (b) The empty `catch { }` in the bare-push branch (line ~65) must not be
empty: keep fail-open behaviour but record the reason, for example
`catch { Write-Verbose "git-guard: branch lookup failed: $_" }`. The hook's
block/allow decisions must not change. Verify with `pwsh -NoProfile -File`
synthetic stdin JSON for: a push to main (exit 2), a push to a feature branch
(exit 0), malformed JSON (exit 0); if PSScriptAnalyzer is installed run
`Invoke-ScriptAnalyzer` on the file and report the result, otherwise say it was
not available. Acceptance: both findings gone; behaviour identical on the three
probes.
