# User Story Quality

Load when creating, refining, or reviewing agile user stories.

## Core checks

### Syntactic

- Prefer a clear role, goal, and benefit; the standard "As a..., I want..., so that..." form is useful but not mandatory if all three are explicit.
- Keep the story atomic and minimal but sufficient.
- Use consistent terminology, Australian English, and natural human language.
- Keep style and level of detail consistent across the backlog.

### Semantic

- Make the need or problem clear; avoid prematurely specifying implementation or UI design unless it is a real constraint.
- Ensure the goal logically supports the stated benefit.
- Remove vague quantifiers, subjective terms, and ambiguous pronouns.
- Surface assumptions that would otherwise remain tacit.
- Check for duplication or contradiction with related stories.
- Verify alignment to the higher-level goal, outcome, epic, or requirement.

### Pragmatic

- Keep the story small enough for the team's delivery cadence and estimatable with available information.
- Keep it negotiable rather than turning it into a frozen specification.
- Aim for independence where feasible.
- Add clear acceptance criteria or concrete examples.
- Check collective completeness across the feature, not only the individual story.

## Extended checks

Where relevant, confirm:

- feasibility and architecture fit;
- security, privacy, and compliance constraints;
- usability, performance, maintainability, reliability, and other NFRs;
- correctness against stakeholder need;
- traceability to objectives/epics/requirements;
- prioritisation rationale;
- testability and modifiability;
- UX coherence when the story is delivered independently.

Automated language-quality tools may supplement team review; they do not replace stakeholder, product, architecture, security, accessibility, or test judgment.

## Review outcome

If deficient, identify the exact clarification needed and the stakeholder best placed to answer it. Do not silently rewrite missing business intent, policy, architecture, or acceptance rules.

For detailed source rationale, consult `references/source-checklist/quality-user-story-checklist.md`.
