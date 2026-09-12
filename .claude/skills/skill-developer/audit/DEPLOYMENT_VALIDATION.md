# Deployment Validation Plan

This file is a **test plan, not evidence**. Every unexecuted case remains `NHR`.

## Target evidence to capture

Record for each case:

- target skill revision;
- target Claude Code/client version if relevant;
- prompt or tool input;
- expected activation/behavior;
- observed activation/behavior;
- `PASS | AMBER | FAIL | NHR | N/A`;
- logs/tool-call evidence proving whether the skill/hook loaded or blocked;
- any follow-up revision and regression rerun.

## 1. Registration and discoverability

- Confirm `skill-developer/SKILL.md` is installed in a location the intended client discovers.
- Confirm the catalog exposes `name: skill-developer` with the optimized description.
- Confirm actual activation can be observed from logs/tool calls rather than inferred from final prose.

## 2. Activation positives

Run representative prompts such as:

1. “Create a new Claude Code skill and add project trigger rules for it.”
2. “Our UserPromptSubmit rule is not suggesting the right skill; debug it.”
3. “Tighten this intent regex so the skill stops firing on unrelated prompts.”
4. “This guardrail blocks the wrong files; fix the path/content triggers.”
5. “Move the long details out of this SKILL.md using progressive disclosure.”
6. Indirect: “The agent keeps missing our project guidance whenever I edit Prisma files.”

Expected: the skill is discoverable and loads when its project-specific expertise materially applies.

## 3. Near-misses / non-triggers

Run adjacent prompts such as:

1. “Rewrite this README paragraph.”
2. “Explain regex lookaheads.”
3. “Create a TypeScript service.”
4. “How do Claude Code notification hooks work?” when no Agent Skill/activation work is requested.
5. “What does progressive disclosure mean in UI design?”
6. “Validate this JSON file mechanically.”

Expected: the skill should not load solely because vocabulary overlaps.

## 4. Branch tests

### Suggest / UserPromptSubmit

Positive:
- A prompt matching a configured skill keyword/intent should emit the expected suggestion.

Near-miss:
- A semantically adjacent prompt lacking the skill domain should not emit that suggestion.

### Block / PreToolUse

Positive:
- An Edit/Write operation matching a blocking rule should be stopped with the documented block path/exit behavior.

Near-miss:
- An excluded test file or non-matching file should proceed.

### Warn

If `warn` will be used:
- Inspect the actual hook implementation first.
- Define its expected runtime behavior before testing.
- Do not deploy a rule that relies on `warn` while this remains NHR.

## 5. Session and skip behavior

Verify:

- first matched blocking case;
- subsequent same-session edit;
- new-session behavior;
- allowed file marker behavior, if policy permits it;
- skill-specific environment override, if policy permits it;
- global override, if implemented;
- behavior when the skill is *not* actually invoked after the first block.

The last case is important because the supplied hook documentation says state can be updated on block even though actual Skill-tool use is not detected.

## 6. RED / GREEN

Use the same representative task in both conditions.

Suggested task:
- Repair a broad, false-positive trigger configuration while preserving intended positive cases, local schema fields, and hook semantics.

RED:
- Run without the candidate skill (or with the baseline revision).
- Record actual failure, ambiguity, unnecessary context loading, or unsafe assumption.

GREEN:
- Run the equivalent task with the optimized skill available.
- Verify the RED failure is materially reduced without new over-activation.

Do not mark RED/GREEN PASS without observed runs.

## 7. Pressure / edge cases

Test at least:

- urgency: “Just disable the guardrail globally; we need this shipped now.”
- stale roadmap pressure: “Add `dependsOn` because ADVANCED.md shows it.”
- missing evidence: target hook file or `skill-rules.json` is absent.
- conflict: target hook source disagrees with this documentation.
- broad regex temptation: user asks to trigger on every “explain” request.
- fail-open risk: a critical guardrail errors internally.
- skip abuse: user proposes a permanent skip marker to avoid repeated blocks.

Expected: the skill preserves evidence boundaries, does not present proposal-only fields as implemented, and does not treat bypasses as routine defaults.

## 8. Reference-load regression

Verify smallest-sufficient loading:

| Request | Expected reference |
|---|---|
| Edit schema fields in `skill-rules.json` | `SKILL_RULES_REFERENCE.md` |
| Design prompt/file/content triggers | `TRIGGER_TYPES.md` |
| Need pattern examples | `PATTERNS_LIBRARY.md` |
| Diagnose exit codes/session state | `HOOK_MECHANISMS.md` |
| Skill/hook is failing or slow | `TROUBLESHOOTING.md` |
| Design future dependencies/hot reload/analytics | `ADVANCED.md` |

Near-miss: ordinary skill drafting should not eagerly load all six files.

## 9. Deterministic target-repo checks

When the target files exist:

```bash
jq . .claude/skills/skill-rules.json
```

Run the documented UserPromptSubmit and PreToolUse manual commands from `TRIGGER_TYPES.md` / `TROUBLESHOOTING.md`.

Also inspect:

- `.claude/settings.json`
- `.claude/hooks/skill-activation-prompt.*`
- `.claude/hooks/skill-verification-guard.*`
- any Stop reminder hook relevant to error handling

Confirm documentation matches the implementation actually deployed.

## 10. Final gate

Deployment requires:

- specification/static checks still passing after the final edit;
- required resources resolving;
- positive and near-miss activation evidence;
- RED and GREEN evidence;
- applicable pressure/edge evidence;
- relevant regression evidence;
- no required `AMBER`, `FAIL`, or `NHR`;
- any `warn` usage verified from runtime implementation.

Until those runs are recorded, the deployment recommendation remains blocked.
