---
name: skill-developer
description: Creates, edits, tests, and troubleshoots Claude Code skills for projects using `.claude/skills/skill-rules.json` with UserPromptSubmit/PreToolUse hooks. Use when working on SKILL.md structure, trigger patterns, guardrail enforcement, activation failures, session skips, hook behavior, or progressive disclosure.
---

# Skill Developer

## Scope

Use this skill for the project-specific Claude Code skill system documented in these files: `SKILL.md` content plus `.claude/skills/skill-rules.json`, UserPromptSubmit suggestions, and PreToolUse guardrails.

For portable Agent Skills, preserve only the portable guidance: valid `SKILL.md` frontmatter, clear activation metadata, concise instructions, and progressive disclosure. Do **not** assume this repository's `skill-rules.json`, hook paths, enforcement fields, skip controls, or performance targets exist in another environment.

Before changing runtime configuration, inspect the target project's actual `.claude/settings.json`, `skill-rules.json`, and hook files when available. Treat this skill's project paths and schemas as documented conventions, not proof of the current runtime.

## Workflow

1. **Inspect the target.** Identify the skill directory, existing `SKILL.md`, rule entry, hook registration, and relevant hook source. Preserve a baseline before high-impact changes.
2. **Define the activation boundary.** State what requests should activate the skill, what adjacent requests should not, and at least one near-miss.
3. **Author or revise `SKILL.md`.** Keep required guidance in the main file; move conditional detail, large examples, schemas, and troubleshooting into directly linked references.
4. **Choose activation and enforcement.**
   - `suggest`: UserPromptSubmit advisory matching through prompt triggers.
   - `block`: PreToolUse enforcement for matched Edit/Write operations; the documented hook blocks with exit code `2`.
   - `warn`: accepted by the supplied schema, but its distinct runtime behavior is not defined by the supplied hook reference. Verify the hook implementation before relying on it.
5. **Design triggers narrowly.** Prefer domain-specific keywords and regex nouns. Use file paths or content patterns only when they materially improve precision. Add exclusions for known near-misses such as tests when appropriate.
6. **Configure `skill-rules.json`.** Keep the skill name consistent with the target skill, use only fields implemented by the target schema, and make block messages actionable.
7. **Validate after the last change.** Check JSON syntax, regex/glob behavior, representative positive prompts, near-misses, relevant file/content cases, skip behavior, session behavior, and hook exit behavior. Do not claim a pass for checks that were not run.
8. **Refine the smallest cause.** If a case fails, change the responsible trigger, branch, or instruction rather than broadening the whole skill.
9. **Troubleshoot from evidence.** Distinguish registration failures, trigger mismatches, exclusions, state/skip behavior, hook execution failures, and performance issues.
10. **Finish only with fresh evidence.** Confirm references resolve, the main skill remains concise, and no runtime claim depends on unverified project state.

## Trigger Design

| Trigger | Use when | Main risk |
|---|---|---|
| Keywords | The domain has specific, unambiguous terms | Generic substrings cause false positives |
| Intent regex | Users express the action without exact keywords | Broad verbs/nouns over-activate |
| File paths | Repository location reliably identifies the domain | Wide globs match unrelated work |
| Content regex | Actual code usage is the strongest signal | Comments/strings can create false matches |

Read [TRIGGER_TYPES.md](.claude\skills\skill-developer\references\TRIGGER_TYPES.md) before changing trigger strategy. Use [PATTERNS_LIBRARY.md](.claude\skills\skill-developer\references\PATTERNS_LIBRARY.md) as examples to customize, not as untested copy-paste policy.

## Hook Semantics and Gotchas

- **UserPromptSubmit**: the documented hook reads the prompt, matches prompt triggers, writes suggestions to stdout, and exits `0`.
- **PreToolUse**: the documented guard checks path/content triggers plus skip/session state. A matched block writes its message to stderr and exits `2`; exit `0` allows the tool.
- **Session state does not prove skill use.** The supplied hook documentation says the skill is marked in session state when the first block occurs, even though the hook cannot detect whether the skill was actually invoked afterward.
- **Fail-open behavior is documented for hook errors.** For a critical guardrail, verify that this policy matches the target project's risk tolerance before relying on the guardrail as a safety boundary.
- **Error-handling/Sentry note:** the source set records a 2025-10-27 project change from blocking PreToolUse enforcement to a Stop reminder for that concern. Treat this as concern-specific historical guidance; verify current hook registration before relying on it. It does not remove PreToolUse guardrails generally.
- Skip markers and environment overrides weaken enforcement. Use them only when the target policy permits the bypass and the reason is understood.

Read [HOOK_MECHANISMS.md](.claude\skills\skill-developer\references\HOOK_MECHANISMS.md) when exact hook flow, exit behavior, session state, or performance mechanics matter.

## Progressive Disclosure

Load only the reference needed for the task:

| Reference | Load when |
|---|---|
| [SKILL_RULES_REFERENCE.md](.claude\skills\skill-developer\references\SKILL_RULES_REFERENCE.md) | Editing or validating the project-local `skill-rules.json` schema or examples |
| [TRIGGER_TYPES.md](.claude\skills\skill-developer\references\TRIGGER_TYPES.md) | Designing keywords, intent regex, file paths, content patterns, or exclusions |
| [PATTERNS_LIBRARY.md](.claude\skills\skill-developer\references\PATTERNS_LIBRARY.md) | You need example regex/glob patterns to adapt and test |
| [HOOK_MECHANISMS.md](.claude\skills\skill-developer\references\HOOK_MECHANISMS.md) | Debugging hook flow, exit codes, session state, or performance |
| [TROUBLESHOOTING.md](.claude\skills\skill-developer\references\TROUBLESHOOTING.md) | A skill does not trigger, blocks incorrectly, the hook fails, or performance regresses |
| [ADVANCED.md](.claude\skills\skill-developer\references\ADVANCED.md) | Discussing future enhancements only; its proposals are not current schema or runtime guarantees |

## Validation Commands

Run these only when the referenced project files exist:

```bash
jq . .claude/skills/skill-rules.json
```

Use the manual hook invocations in [TRIGGER_TYPES.md](.claude\skills\skill-developer\references\TRIGGER_TYPES.md) or [TROUBLESHOOTING.md](.claude\skills\skill-developer\references\TROUBLESHOOTING.md) for representative prompt/file cases.

For blocking rules, verify both a case that must block and a near-miss that must allow. For suggestion rules, verify both a relevant suggestion and an adjacent prompt that should remain inactive.

## Done Criteria

- `SKILL.md` frontmatter and scope match the intended capability.
- Project-local configuration uses only verified schema fields.
- Required references resolve and have explicit load conditions.
- Trigger positives and near-misses were tested after the final trigger change.
- Relevant path/content/session/skip and exit-code behavior was tested when applicable.
- No speculative `ADVANCED.md` field is presented as implemented behavior.
- Unrun or unavailable runtime checks are reported as unverified rather than passed.
