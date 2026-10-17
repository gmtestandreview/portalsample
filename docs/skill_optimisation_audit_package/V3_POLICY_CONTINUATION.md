# V3 scanner-policy continuation — 17 October 2026

Latest closeout: the user subsequently authorized package backup/install and
adaptation to actual installed paths. The
[normal-host deployment report](V3_NORMAL_HOST_ACCEPTANCE.md) records an active
exact-path user policy, source-matching installed files, native
normal-configuration acceptance and unchanged protected hooks. The
fixture-only/no-permanent-policy statements below describe the preceding phase
and are not the current installed state. The fixture policy remains historical
evidence; use
[scanner-installed.rules](codex_activation/normal-host/scanner-installed.rules)
for the deployed path set.

## Prior fixture result and scope

The required scanner and instruction reads succeeded after loading a narrowly
scoped execution-policy file from the active Codex user rules directory. Two
fresh native Codex sessions then discovered, loaded and applied the exact
duplication skill v1.3 and returned its required classification/accounting
artifact. F04/F05 passed one independent decision-level pressure test.
Specialist benchmark aggregation is **N/A** for this noncomparative
continuation; local evidence arithmetic remains applicable and passes its
focused tests.

This is candidate acceptance evidence for the isolated Codex environment
described below. No installed skill, hook, repository policy, user
configuration, or permanent execution policy was changed. The prepared
correction is retained for review. `sonar integrate claude` was never executed;
`pretool-secrets.ps1` and `prompt-secrets.ps1` were not changed.

## Scanner rejection and smallest correction

The original `CreateProcess` rejection occurred before Sonar executed. Changing
read-only to workspace-write had not resolved it. A project-local rule matched
in `codex execpolicy check` but was not effective in the isolated CLI run; the
same narrow scanner rule loaded from `~/.codex/rules/` allowed the scan. A
subsequent run proved that scanning alone was insufficient: the instruction-file
read was independently rejected. Two exact-path prefix rules therefore cover the
demonstrated acceptance needs:

1. `sonar analyze secrets` followed by one of the exact fixture/meta-skill
   instruction paths.
2. `Get-Content -LiteralPath` followed by one of those same paths.

See the
[prepared two-rule correction](codex_activation/policy-correction/scanner-acceptance.rules)
and
[policy match checks](codex_activation/policy-correction/policy-checks.json).
Paths include the two frozen duplication files, their relative forms, and the
required `using-a-team/SKILL.md`. No general Sonar or PowerShell permission was
retained. An experimental exact PowerShell-wrapper rule and scanner-availability
probe were unnecessary and removed before the second successful run. An
unrelated file scan, unrelated read, integration command, other analysis
command, and a compound wrapper did not match the prepared rules. These are
match-check results, not claims that an unrelated command was executed or that
every host policy would forbid it.

The evidence supports a missing effective allow rule under the tested
`approval_policy=never` configuration. It does not establish the internal
fallback classification or why the temporary project layer was inactive. No
explicit forbidden rule was identified, and no forbidden decision was
overridden. Rules use the most restrictive matching decision; an allow cannot
override an explicit prohibition. The source and activation behavior are
documented in
[official OpenAI Rules documentation](https://learn.chatgpt.com/docs/agent-configuration/rules).

Preliminary natural attempts sometimes probed scanner availability using
differing PowerShell pipelines, which the exact policy did not permit. The
successful [ordinary request](codex_activation/policy-correction/request.txt)
adds only the verified environment fact that Sonar is installed on PATH and
should be invoked directly. It names no skill, skill path, expected
classification, oracle, or count result. This operational clarification is part
of the tested request and limits generalization to arbitrary availability
probes.

The read rule itself does not enforce scan-before-read ordering. Both successful
transcripts show that ordering for every instruction file actually read. No
credential, auth, configuration or session file was read by either subject.

## Natural Codex acceptance

Host: Codex CLI `0.162.0-alpha.17.2`, Windows PowerShell 7, Sonar CLI `1.7.0`;
fresh ephemeral sessions, `--ignore-user-config`, workspace-write sandbox,
approval policy `never`, no rule/sandbox bypass. Only the same-name installed
duplication copy was disabled through an invocation-local override. Codex's
repository skill discovery used `.agents/skills/`, consistent with
[official OpenAI skills documentation](https://learn.chatgpt.com/docs/build-skills).

The fixture entrypoint SHA-256 is
`85502296b0563e3967556b54cbec863521734568359effff71c6620b6c7f3642`; reference
SHA-256 is `827932d211f518bcd8818786bd1c6a55b43b8115927bacb365f5705858f828db`.
Both match current repository files after execution.

| Gate                | Result           | Evidence                                                                                                                                                  |
| ------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discovery/selection | PASS scoped, 2/2 | Both subjects independently selected the repository candidate without explicit invocation.                                                                |
| Loading             | PASS scoped, 2/2 | Successful scan then successful full read of entrypoint and subset-validation reference; meta-skill also scanned/read.                                    |
| Application         | PASS scoped, 2/2 | Both used the strict-subset/format-only rule and named `True duplicate` with the broad skill surviving.                                                   |
| Resulting artifact  | PASS scoped, 2/2 | Required block: two skills, one pair, one true duplicate, one cluster, zero other classes/holds/boundaries; preserved requested format and general scope. |
| Runtime             | PASS scoped, 2/2 | Complete ordinary-request flow under the prepared temporary policy.                                                                                       |

Public raw evidence:
[run 1](codex_activation/policy-correction/natural-1-public.jsonl),
[run 2](codex_activation/policy-correction/natural-2-public.jsonl); readable
[answer 1](codex_activation/policy-correction/natural-1-answer.md),
[answer 2](codex_activation/policy-correction/natural-2-answer.md);
[commands, counters and gate results](codex_activation/policy-correction/results.json).
Reasoning events were omitted. Earlier failed attempts are not promoted to PASS
and the original rejection evidence remains unchanged. The
[separate current runtime preflight record](v3_codex_runtime_run.json) binds
these cases. The implementation record is an evidence index; its original
nine-case behavioral assessment remains separate from the current runtime cases.

The successful CLI usage counters are 140,577 input / 109,568 cached input / 907
output tokens, and 140,537 / 120,960 / 901 respectively. These are reported CLI
counters for two runs, not the entire continuation, billed usage, or efficiency
savings. No baseline efficiency comparison is claimed.

## F04/F05 focused pressure

The [five-assertion contract](v3_pressure_contract.json) was frozen before a
fresh independent subject received the realistic task and permitted candidate
resources. The subject did not receive expected assertions or parent
conclusions. Its [public handback](v3_pressure_raw.md) is retained before
grading.

| Assertion                      | Result | Observed behavior                                                                                                                 |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| P1: evaluation usefulness      | PASS   | Earlier state: one five-unit focused evaluator for a new acceptance-changing counterexample; rejects extra broad reviewers.       |
| P2: cap/reserve                | PASS   | Current state: no optional dispatch at two spent waves and remaining capacity equal to reserve; rejects repeated unchanged cases. |
| P3: ownership/delegation scope | PASS   | One methodology controller, human acceptance owner, no invented specialist or benchmark winner.                                   |
| P4: closeout                   | PASS   | Delivers standalone unscored HOLD with supplied evidence distinguished from verified observations and historical scores.          |
| P5: restart                    | PASS   | One checkpoint tied to the unresolved scan/load gate; no score-chasing restart or prohibited child delegation.                    |

This sample establishes process decisions under the supplied pressure, not
automated enforcement, actual child-dispatch behavior, causal improvement over a
no-skill baseline, or statistical reliability. Its supplied loading-failure
scenario remains separate from the later successful native-host evidence.
F04/F05 enforcement remains a controller responsibility and both matrix statuses
remain `PRESENT BUT NOT ENFORCED`. Assertion content was frozen before dispatch;
subsequent Prettier formatting changed no assertion or supplied scenario.

## Specialist aggregation applicability

F17's local Boolean/count/case-set/winner-claim checks remain required. The
current Python 3.14.7 run of
`pytest -q -p no:cacheprovider tests/test_evidence.py` passes **43 tests**. The
already completed 203-test Python upgrade/collection baseline is preserved and
was not rerun for these evidence-only changes.

An external specialist benchmark aggregator is conditional on conducting a
comparative benchmark or publishing aggregated arm statistics/winner claims.
This continuation has neither: two same-candidate acceptance runs and one
process pressure sample are graded independently, without ranking variants or
asserting improvement. Accordingly the external aggregator is **N/A**, not
unavailable required evidence and not a verified implementation. If a future
campaign compares arms or claims a winner, its own aggregation arithmetic must
be verified then. `skill-creator` remains a conditional specialist capability,
not a second controller.

## Prior fixture verdict and checkpoint

The scanner blocker is resolved for the tested acceptance fixture; primary Codex
duplication-skill acceptance is **PASS scoped**. The evidence does not establish
normal installed-client operation, discovery of the revised writing-skills
controller in a native CLI session, or Claude Code acceptance. The controller
has independent pressure-application evidence, which is a different claim from
natural discovery.

Release recommendation: **deploy**, scoped to the candidate and tested primary
Codex acceptance environment, with the verified scanner/read policy as an
execution prerequisite. This is a recommendation, not an installation claim or
permission to overwrite installed skills. Normal-client installation and Claude
Code acceptance were not required by this continuation and are not promoted to
PASS or introduced as new release blockers. Greg retains release acceptance. No
new numeric score was requested or assigned.

One restart checkpoint: retain the candidate/reference hashes, prepared policy,
two successful public transcripts, pressure contract/handback, refreshed matrix
and preflight record. Resume only the intended normal-host policy
adoption/acceptance gate if deployment is requested; preserve the hooks'
absolute-path fixes and never run the integration command that overwrites them.
Do not repeat the Python upgrade, collection repair, broad optimisation, or
completed focused tests without an affected change or new counterexample.
