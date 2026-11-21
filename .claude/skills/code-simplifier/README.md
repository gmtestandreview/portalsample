# Claude Code — Code Simplifier

One skill provides behavior-preserving code cleanup and optional measured
cognitive-complexity refactoring. No second complexity-reduction skill is
required.

## Install

Copy the complete `code-simplifier/` directory to your project at
`.claude/skills/code-simplifier/` or to your Claude Code user skills directory.
Ensure that `SKILL.md` is directly inside that skill directory, with
`references/` and `evals/` as siblings. If the older
`refactor-method-complexity-reduce` skill is installed, remove or disable that
separate installation if you want only one available skill.

## Requests

- `/code-simplifier Simplify the function I just edited without altering behavior.`
- `/code-simplifier Reduce getStatus in src/status.ts to cognitive complexity 15 or below.`
- `/code-simplifier Review handleSubmit for unnecessary complexity without editing.`

An explicit numeric threshold requires actual measured evidence from the
project's analyzer. No analyzer is bundled or installed by this skill.

**Acceptance:** For implemented changes, all existing related tests must be run
and explicitly report **zero total failures**, including no pre-existing
failures. Successful compilation and actual method complexity are additionally
required where applicable. If required evidence is missing, report BLOCKED or
NOT VERIFIED rather than PASS.

## Evidence status

This package has been checked statically for structure and internal references.
It has **not** been exercised in an actual Claude Code session, and it has not
run real application tests or numeric complexity measurements. See the `evals/`
files for test definitions, not observed passing test results.
