# Codex primary-host activation check — 17 October 2026

Latest closeout:
[normal installed-host acceptance](V3_NORMAL_HOST_ACCEPTANCE.md) is **PASS
scoped**, following explicit backup/install authorization. The active policy now
uses installed paths, not fixture paths. An ordinary positive request,
near-miss, controller closeout and repaired supplementary scan are recorded in
the [normal-host results](codex_activation/normal-host/results.json).
Installed-byte identities and protected hooks are verified. The fixture results
and original blocked attempts below retain their historical scopes.

Preceding fixture result: **PASS scoped** for discovery, loading, application,
artifact and runtime in two fresh Codex sessions under a narrowly scoped
temporary scanner/read policy. See the
[policy correction and current acceptance](V3_POLICY_CONTINUATION.md) and
[public run results](codex_activation/policy-correction/results.json). The
blocked attempts below are retained as historical failure evidence, not the
current gate result. No permanent policy or installed skill was changed.

The user chose Codex as primary for this task; Claude Code remains a separate
acceptance target. No further host-selection decision is pending.

## Original blocked method

Codex CLI `0.162.0-alpha.17.2` received an ordinary comparison request with
inline evidence, without a skill name, skill path, oracle, or expected label. An
exact copy of the revised duplication skill v1.3 and its validation reference
was placed in a temporary workspace under `.agents/skills/`. Existing same-name
user copies were disabled for these invocations only; none was overwritten.

This uses Codex's documented repository discovery and implicit invocation:
[official OpenAI skills documentation](https://learn.chatgpt.com/docs/build-skills).
The copy's SHA-256 matches the repository candidate.

Two bounded attempts were made: read-only, then workspace-write limited to the
temporary workspace. Both used ephemeral sessions and ignored user configuration
to avoid bringing unrelated connector setup into the check. Execution-policy
rules were not bypassed.

## Original blocked gates

| Gate                      | Result       | Evidence                                                                                                  |
| ------------------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| Skill discovery/selection | PASS scoped  | Both runs attempted to scan the temporary `skill-duplication-audit/SKILL.md` without the prompt naming it |
| Instruction loading       | BLOCKED      | CLI execution policy rejected the required `sonar analyze secrets <SKILL.md>` command                     |
| Instruction application   | NOT VERIFIED | Both agents explicitly said they read no skill files                                                      |
| Expected skill artifact   | NOT VERIFIED | Generic recommendations omitted the skill's required classification/count contract                        |
| Codex runtime acceptance  | HOLD         | Discovery alone is insufficient                                                                           |
| Claude Code runtime       | NOT TESTED   | Primary-host choice was Codex                                                                             |

The original remaining step was to permit the required scanner and rerun natural
activation. That step has now been executed with exact-path scan/read
permissions. The successful request adds the verified environment fact that
Sonar is installed on PATH, avoiding blocked availability probes. It still names
no skill or expected result. The generic blocked answers remain unverified
application evidence.

## Preserved evidence

- [Ordinary request](codex_activation/request.txt)
- [Read-only answer](codex_activation/answer.md) and
  [public host events](codex_activation/events.jsonl)
- [Workspace-write answer](codex_activation/answer-workspace-write.md) and
  [public host events](codex_activation/events-workspace-write.jsonl)
- [Read-only rejection](codex_activation/host-stderr.txt) and
  [workspace-write rejection](codex_activation/host-stderr-workspace-write.txt)

Reasoning events are omitted; public answers, tool events, errors and reported
usage remain. CLI usage reports are specific to these attempts, not
whole-session usage or billing. Read-only: 85,137 input, 66,816 cached input,
522 output tokens. Workspace-write: 84,753 input, 66,560 cached input, 504
output tokens. No token savings claim is inferred from these records.
