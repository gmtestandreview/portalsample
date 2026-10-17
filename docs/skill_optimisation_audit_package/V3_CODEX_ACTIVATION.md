# Codex primary-host activation check — 17 October 2026

The user chose Codex as primary for this task; Claude Code remains a separate
acceptance target. No further host-selection decision is pending.

## Method

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

## Observed gates

| Gate                      | Result       | Evidence                                                                                                  |
| ------------------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| Skill discovery/selection | PASS scoped  | Both runs attempted to scan the temporary `skill-duplication-audit/SKILL.md` without the prompt naming it |
| Instruction loading       | BLOCKED      | CLI execution policy rejected the required `sonar analyze secrets <SKILL.md>` command                     |
| Instruction application   | NOT VERIFIED | Both agents explicitly said they read no skill files                                                      |
| Expected skill artifact   | NOT VERIFIED | Generic recommendations omitted the skill's required classification/count contract                        |
| Codex runtime acceptance  | HOLD         | Discovery alone is insufficient                                                                           |
| Claude Code runtime       | NOT TESTED   | Primary-host choice was Codex                                                                             |

The remaining step is to permit the required secrets scanner under the intended
Codex host execution policy and rerun the same request in a fresh session. Do
not skip the scanner, silently relax policy, or count the generic answer as
successful application. No installed skill or execution policy was changed.

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
