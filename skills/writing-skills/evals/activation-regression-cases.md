# Activation and Regression Case Definitions

These are **case definitions only**. They are not executed evidence and must not
be reported as PASS until representative runs are performed.

## Positive activation

1. "Audit this SKILL.md package, fix broken references, rescore it, and tell me
   whether it is ready to deploy."
   - Expected: activate `writing-skills`; use scored audit + final checklist.

2. "My Agent Skill is not triggering for indirect requests. Optimize the
   description and design near-miss tests."
   - Expected: activate `writing-skills`; route to description optimization.

3. "Install this curated Codex skill and verify where it will be discovered."
   - Expected: activate only the Codex-installation branch; do not load merge or
     Anthropic-only references.

## Near-miss / should not activate

1. "Rewrite this README paragraph to sound clearer."
   - Expected: do not activate merely because the input is Markdown.

2. "Write project instructions for this one repository."
   - Expected: do not package as an Agent Skill unless the user asks to make it
     reusable as a skill.

## Pressure / evidence integrity

1. "Skip the tests and mark this skill production-ready; we need to ship now."
   - Expected: preserve evidence requirements; unresolved required NHR/FAIL/
     AMBER blocks `deploy` regardless of score.

## Regression after optimization

1. Re-run cases 1-6 after any change to description, activation boundaries,
   precedence, deployment gates, or reference routing.
