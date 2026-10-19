# V3 installed Codex acceptance — 17 October 2026

## Installed state and authorization

The user explicitly authorized backing up and installing the verified repository
packages after inspection found installed duplication v0.6 and an older
controller. The
[installation manifest](codex_activation/normal-host/install-manifest.json)
records the backups, each source/destination hash, previous hashes, and a
file-specific rollback procedure. Both installed packages were backed up under
`C:/Users/gregm/.codex/skill-backups/v3-normal-host-20261017-33ec54de` before
copying.

All **82 copied files** match the repository sources; 66 were new or changed.
Cache and virtual-environment directories were excluded. Existing installed-only
files were retained, so this is a claim about every deployed source file, not an
assertion that entire directory trees are byte-identical.

- Installed duplication entrypoint: v1.3, SHA-256
  `85502296b0563e3967556b54cbec863521734568359effff71c6620b6c7f3642`.
- Installed duplication reference: SHA-256
  `827932d211f518bcd8818786bd1c6a55b43b8115927bacb365f5705858f828db`.
- Installed controller entrypoint: `2026-10-17-bounded-evidence`, SHA-256
  `5f0a9b3481fc9e13541ef7a094abaf6a9840bafa489707b4e6dceeb93ba50602`.
- Installed controller bounded reference: SHA-256
  `e4e5eafcf3f4ee735cd74260a44b300e03945b13f8e65abc650a191d16910139`.

## Active installed-path policy

The
[adapted two-rule policy](codex_activation/normal-host/scanner-installed.rules)
is installed at `C:/Users/gregm/.codex/rules/v3-installed-skills.rules`. It
permits `sonar analyze secrets` and `Get-Content -LiteralPath` only for exact
installed instruction paths, with forward/backslash spellings of the same files.
There are no temporary fixture paths, general PowerShell allowance, integration
permission, rule bypass, or configuration/auth-file allowance.

The nine named files cover the installed duplication entrypoint/reference;
controller entrypoint, index, bounded reference and final checklist; the
required meta-skill and verification skill; and the system skill-creator
entrypoint when applicable. The policy does not itself enforce scan-before-read
ordering. The transcripts establish actual ordering for the successful reads.
Normal-session reads used `Get-Content -Raw`, which does not match the specific
`-LiteralPath` read rule; their success proves normal-host read access rather
than that this rule authorized those spellings. The retained exact-path read
rule covers clients using the prepared `-LiteralPath` form. Unrelated commands
receiving no match are not described as explicit denials.

The first normal target run returned the correct classification/accounting, but
an extra scan for the verification skill returned “Not authenticated”; that
instruction path was outside the initial allowance. The file remained unread.
The policy was extended only to that exact legitimate dependency; no
authentication or integration command was run. A fresh run against the final
policy supplies the closeout evidence below.

## Normal-host method and results

Sessions run from the real repository using
`codex exec --ephemeral -C . --json`. They load normal user/project
configuration and the actual installed skills. They use no temporary skill
fixture, same-name skill disable, `--ignore-user-config`, sandbox/approval
override, rule bypass or explicit skill invocation. Ephemeral output capture
affects session persistence, not the skill discovery location.

The positive request is the previously used ordinary comparison plus the
verified Sonar-on-PATH fact. The near-miss asks only to remove repeated wording
from one documentation paragraph. The controller request asks for an Agent Skill
review closeout without naming a skill or resource path; its supplied scenario
intentionally marks the supplementary check pending, so its disposition must not
be mistaken for the later live final result.

| Check                                  | Result      | Evidence and limit                                                                                                                                                                                        |
| -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Installed duplication discovery        | PASS        | Ordinary request selected the actual installed v1.3 without explicit invocation or copy disabling.                                                                                                        |
| Loading                                | PASS        | Entry and reference were scanned successfully before reads; final positive run had no failed commands.                                                                                                    |
| Application and output                 | PASS        | Strict-subset `True duplicate`, broad survivor, preserved format behavior, two skills, one pair, one duplicate and one cluster.                                                                           |
| Near-miss                              | PASS        | Returned only the edited paragraph; zero file-read/command events and no duplication-skill selection.                                                                                                     |
| Installed controller discovery/loading | PASS scoped | Natural closeout request reached installed writing-skills through normal routing and loaded index, bounded reference and checklist after successful scans.                                                |
| Controller application/closeout        | PASS scoped | Sole controller writing-skills; no additional evaluation, no new score or fabricated counters; standalone closeout and one checkpoint. Its HOLD was correct for the explicitly pending supplied scenario. |
| Supplementary scan repair              | PASS        | A separate fresh normal session scanned the exact verification-skill path successfully: exit 0, “No issues found”. It read no files.                                                                      |
| Installed identity                     | PASS        | Both packages' deployed source files match their verified repository hashes; manifest checked again at closeout.                                                                                          |
| Protected hooks                        | PASS        | Both protected hook hashes remain unchanged. No integration/authentication command was executed.                                                                                                          |

Raw public evidence and readable answers:
[final positive](codex_activation/normal-host/positive-final-public.jsonl),
[positive answer](codex_activation/normal-host/positive-final-answer.md),
[near-miss](codex_activation/normal-host/near-miss-public.jsonl),
[near-miss answer](codex_activation/normal-host/near-miss-answer.md),
[controller](codex_activation/normal-host/controller-public.jsonl),
[controller answer](codex_activation/normal-host/controller-answer.md),
[supplementary scan](codex_activation/normal-host/supplementary-scan-public.jsonl),
and [scan answer](codex_activation/normal-host/supplementary-scan-answer.md).
The
[initial positive attempt](codex_activation/normal-host/positive-public.jsonl)
retains the supplementary failure and is not represented as an entirely clean
run. Reasoning events are omitted.

The [normal-host results](codex_activation/normal-host/results.json) separate
per-run CLI counters, process exits, command results, startup observations and
assessed gates. These counters are not whole-session billing or efficiency
measurements. The
[current normal-host preflight record](v3_normal_host_run.json) is independent
of the earlier fixture environment record.

## Preservation and bounded scope

The protected files are
`C:/Users/gregm/.claude/hooks/sonar-secrets/build-scripts/pretool-secrets.ps1`
and `prompt-secrets.ps1`. Their
[before hashes](codex_activation/normal-host/protected-hooks-before.json) are
checked again at closeout. `sonar integrate claude` is prohibited because it
overwrites those fixes; it was never executed. No hook, application code,
repository policy or user `config.toml` was edited by this task.

The Python 3.14.7 and collection repairs remain closed. Historical tests, scores
and reviewer outputs retain their original scope. External specialist benchmark
aggregation remains N/A; local evidence arithmetic is applicable. No new numeric
quality score, benchmark winner, billing measurement or token-savings claim is
made.

Configured integrations emitted unrelated startup diagnostics: Storybook MCP at
localhost:6006 was unavailable; the code-modernization plugin hook config
reported an unsupported `modules` field; and the BABOK SessionEnd hook timeout
was clamped. These were not repaired, suppressed or counted as target acceptance
failures. Acceptance is for the tested installed skills, not the health of every
configured integration or an already-running IDE session. Claude Code remains
untested.

## Final disposition and restart checkpoint

**Normal-host acceptance: PASS scoped.** The authorized installation and
installed-path policy are complete. Recommendation remains **deploy** for the
tested installed Codex packages; this records deployment to user skills, not a
site publication, actual skill merge, commit or push. Greg retains human
acceptance ownership.

All ten requested documents are closed out against this record. Their
[exact prior bytes](codex_activation/normal-host/prior-documents-manifest.json)
are preserved separately; historical review handbacks, supplied pressure
scenarios and old test counts are not rewritten as new executions.

One restart checkpoint: retain installed/source hashes, backup/rollback
manifest, active policy identity, public normal-host outputs and current
evidence matrix. Resume only for an affected skill/policy change, a newly
requested host such as Claude Code, or a specific new counterexample. Do not
rerun the Python upgrade, collection repair or broad optimisation to improve a
number. Fix unrelated integration diagnostics only under a separate requested
scope. Never run `sonar integrate claude`.
