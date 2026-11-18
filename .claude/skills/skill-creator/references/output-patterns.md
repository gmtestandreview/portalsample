# Output Patterns — Agent Skill Artifacts

**Load:** When the requested result needs an explicit, reusable output contract.
These are templates to adapt, not default formats imposed on an API, JSON
Schema, or user-supplied style. A strict schema takes precedence over a Markdown
example.

## Strict contract: readiness JSON

Use the selected `references/schemas/*.schema.json` when one governs the
artifact. Do not replace its required fields with this example. For a
human-facing readiness decision, preserve these independent concepts rather than
using a single generic "passed" field:

```text
artifact: <skill path and candidate hash>
checks: <command, runtime, exit code, evidence path>
observed: <direct evidence, failures, omissions>
missing: <required tests not executed, with NHR reason>
verdict: <PASS|AMBER|FAIL|NHR> by evidence requirement
recommendation: <deploy|revise|split|merge|deprecate|hold>
```

**Positive oracle:** An incomplete host-evaluation record produces NHR and HOLD
even if a parser returned zero. **Negative oracle:** Never emit
`release_ready=true` when required cases are missing, failed, or changed from
the frozen oracle. Run `scripts/run_pipeline.py release --dry-run` to verify the
planned gates; executing a dry run is not proof of results.

## Flexible contract: change report

```markdown
# Agent Skill revision — <candidate name>

## Scope and preserved invariants

- Source revision, `name`, trigger boundary, no-change assumptions

## Edits

- Exact path — the smallest functional change and its risk

## Verification

- Check — environment — exit code — result — raw evidence location
- Unrun/blocked check — NHR and reason

## Decision

- Actionable recommendation and remaining risk
```

Use this structure **only** if the user has not supplied a different report
format. A short wording edit may need only a diff and concise evidence record.

## Example: commit message

```text
fix(skill-eval): reject missing release-case evidence

Validate required stage outcomes before setting release_ready.
Add regression tests for absent and failed evidence.
```

A commit message is a proposed artifact, not a claim that the commit or test run
happened.

## Adversarial verification contract

**Input:** User request, target artifact and controlling output schema/format,
available evidence. **Result:** A report or machine output that the consumer can
parse and verify. **Failure:** If required fields or evidence are unavailable,
preserve NHR instead of filling fabricated values. **Regression fixture:** A
required JSON grading schema with a `summary.pass_rate` cannot be replaced by
the prose readiness template. **Check:** Validate schema-controlled outputs with
a schema validator and semantic tests before release; compare flexible text
outputs against the user's actual requested deliverable.
