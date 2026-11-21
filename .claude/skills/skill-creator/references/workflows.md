# Workflow Patterns — Agent Skill Authoring

**Load:** Only when drafting or restructuring a `SKILL.md` that has ordered or
conditional work. These are illustrative _design patterns_, not installed
commands or evidence of test success. Adapt paths to files that actually exist
in the target skill.

## Sequential workflow with measurable exit conditions

Example: a request to revise an incident-review Agent Skill while preserving its
activation boundary.

1. **Locate and preserve:** Read `SKILL.md` plus referenced
   `references/incident-evidence.md`; snapshot their bytes and record the
   original `name` and `description`. If the referenced file is missing, report
   the missing dependency; do not invent its contents.
2. **Define scope:** Write the direct positive ("revise an incident-review Agent
   Skill") and near-miss negative ("write an incident report"). Freeze the
   expected activation boundary before edits.
3. **Refactor a candidate only:** Move verbose sample incident timelines to a
   conditional reference; retain the requirement to distinguish _observed_ vs
   _inferred_ customer impact in the entrypoint.
4. **Check structure:** Parse frontmatter, validate link destinations, and
   inspect generated files; a passing parser does not prove activation.
5. **Test behavior if tooling exists:** Run the frozen positive/near-miss cases
   in the target host and compare candidate-vs-baseline outputs using the same
   expectations. If unavailable, write NHR for those gates.
6. **Decide:** Deliver the candidate and diff. Report outcomes by gate, with a
   `HOLD` recommendation when required behavior remains unobserved; preserve the
   original for rollback.

**Acceptance:** The original `name` and boundary are preserved, only
known-relative links exist, the inferred-impact safeguard remains, and evidence
status is recorded separately from structural validity.

## Conditional workflow with failure branches

| Condition                                                  | Next action                                                      | Observable output                              |
| ---------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| User asks for a new skill and supplies domain requirements | Draft an entrypoint and only necessary resources                 | Candidate directory with valid frontmatter     |
| User asks to edit an existing skill and source is present  | Snapshot, inspect callers, edit in a candidate                   | Diff with preserved identity and reference map |
| User asks to edit an existing skill but source is absent   | Do not fabricate it; request the actual source or report blocked | NHR/missing-input finding; no invented file    |
| Request is about a non-skill CI trigger                    | Do **not** activate Agent Skill authoring                        | Negative activation result                     |
| Candidate passed static validation but host cannot be run  | Stop before declaring production-ready                           | Static PASS, runtime NHR, release HOLD         |

## Adversarial verification contract

**Positive:** Given an actual source and a safe edit request, the workflow
reaches a testable candidate and evidence report. **Near miss:** A general PDF
task does not load a skill-creation workflow merely because the example happens
to mention a PDF. **Failure:** Missing source, stale reference, or denied
execution yields an explicit blocker, never fictional output. **Regression:**
The original activation description and safety constraints remain intact. This
reference's test plan is instructional; actual observed host outcomes must come
from separate runs.
