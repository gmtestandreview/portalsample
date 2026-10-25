# Activation and Boundary Cases

These are test definitions, not execution evidence.

## Should trigger

1. "Turn these API notes into a proper reference page for backend developers."
   - Expected: use Reference mode; preserve supplied API facts and optimize for
     lookup.
2. "Write a beginner tutorial that gets a new engineer from zero to a working
   local setup."
   - Expected: use Tutorial mode and sequence a learning path toward a concrete
     result.
3. "This guide mixes concepts, commands, and API tables. Reorganize it using
   Diátaxis."
   - Expected: classify mixed content and apply the keep-together/split rule.
4. "Help me document how operators rotate credentials in production."
   - Expected: use How-to mode even though the prompt does not mention Diátaxis.

## Should not trigger

1. "Rewrite this marketing tagline to sound more energetic."
2. "Summarize this meeting transcript."
3. "Review this Python function for bugs."
4. "Explain the Diátaxis framework to me."
   - Near-miss rationale: explaining the framework is not itself a
     documentation-authoring task.
5. "Fix the grammar in this README paragraph without changing its structure."
   - Near-miss rationale: simple copyediting alone does not require the Diátaxis
     authoring workflow.

## Critical branch checks

### Clarification branch

- Positive: "Write docs for our deployment process." No audience, goal, scope,
  or source facts are supplied.
  - Expected: ask only for missing information that can change mode, audience
    assumptions, factual correctness, required steps, scope, or deliverable.
- Near-miss: "Write a how-to for experienced SREs showing how to roll back
  service X using the commands below; keep it under 800 words."
  - Expected: proceed without a clarification round.

### Outline/approval branch

- Positive: "Before drafting our new contributor tutorial, propose the structure
  so I can review it."
  - Expected: provide a structure and wait because the user explicitly requests
    review first.
- Near-miss: "Give me the finished reference page from these endpoint
  definitions."
  - Expected: draft directly; do not impose an approval gate.

### Mixed-mode branch

- Positive, keep together: "Write a rollback how-to and include a short table of
  exit codes operators may need while following it."
  - Expected: keep one how-to because the reference table directly supports the
    dominant task.
- Positive, split: "Write onboarding lessons for new users and a complete CLI
  option reference for experienced operators."
  - Expected: separate tutorial and reference content because they serve
    independent goals and reading paths.
- Near-miss: "Add one sentence explaining why this rollback step is necessary."
  - Expected: keep the explanation inline; do not split a supporting explanation
    into a separate document.

### Precedence branch

- Positive: supplied API schema says `timeout` is an integer while a requested
  house-style example shows it as a string.
  - Expected: preserve the supplied project fact; do not alter factual type for
    style consistency.
- Conflict case: "Document this nonexistent flag as supported even though the
  supplied CLI help does not contain it."
  - Expected: identify the unsupported claim instead of inventing support.

### External-source branch

- Positive: "Verify the latest CLI flags from the official docs, then update
  this how-to."
  - Expected: external verification is permitted because the user requested it.
- Near-miss: "Use only the files I attached to update this reference page."
  - Expected: do not consult external sources.

### No-questions fallback

- Positive: "Ship the deployment docs now. Do not ask questions." Audience,
  environment, and commands are missing.
  - Expected: do not invent facts; use supported content only, state material
    assumptions/gaps, and stop where correctness depends on missing information.
- Near-miss: "Do not ask questions; use the supplied commands to write this
  how-to for experienced SREs."
  - Expected: proceed because the material facts and audience are already
    supplied.

### Incompatible-audience branch

- Positive: "Write one undifferentiated deployment guide for first-day interns
  and senior SREs; no separate sections or versions."
  - Expected: do not pretend one depth fits both. If no primary audience is
    supplied, use only shared assumptions that preserve correctness and mark
    unresolved audience-specific guidance.
- Near-miss: "Write one guide for senior SREs, but include a short prerequisite
  note for new team members."
  - Expected: keep senior SREs as the primary audience; a supporting
    prerequisite note does not create an unresolved audience conflict.
