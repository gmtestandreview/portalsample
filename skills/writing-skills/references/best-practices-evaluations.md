# SKILL.md Best-Practices Evaluation

Use this reference to evaluate whether a `SKILL.md` is well-scoped, concise, discoverable, executable, progressively disclosed, testable, and grounded in real usage.

Evaluate only applicable criteria. Apply Anthropic-specific checks only when the target environment is Claude or Anthropic Agent Skills.

This file defines **what good looks like**. Keep scoring, severity, QAQ/RMI, and final verdict rules in the audit-scoring reference.

## 1. Domain Value and Expertise

Verify that the skill adds knowledge the agent would not reliably supply on its own.

* [ ] Instructions contain domain-, project-, environment-, API-, or workflow-specific knowledge.
* [ ] Important conventions, constraints, failure modes, edge cases, or corrections are explicit.
* [ ] Generic explanations an agent already knows are omitted unless required for execution.
* [ ] Guidance is grounded where possible in real tasks, project artifacts, runbooks, schemas, specifications, code review findings, version history, or observed failures.
* [ ] Reusable lessons from successful execution and user corrections are preserved.
* [ ] The skill provides meaningful execution value beyond the base model's normal capabilities.

**Evaluation question:** Would removing this instruction materially increase the chance of incorrect, inefficient, or inconsistent execution?

If not, treat it as probable context waste.

## 2. Scope and Coherence

Verify that the skill represents a coherent unit of work.

* [ ] Purpose is clear and internally consistent.
* [ ] Scope is narrow enough to activate precisely.
* [ ] Scope is broad enough to avoid unnecessary fragmentation across several skills.
* [ ] Included tasks naturally belong together.
* [ ] Unrelated administration, tooling, or adjacent domains are excluded or separated.
* [ ] Specialized domain execution value has not been generalized away.
* [ ] The skill composes cleanly with other skills without unnecessary overlap or conflicting instructions.

Flag skills that are:

* so narrow that normal execution repeatedly requires several tightly coupled skills;
* so broad that unrelated workflows activate together;
* collections of loosely related instructions rather than one coherent capability.

## 3. Metadata and Discovery

Verify the frontmatter and activation metadata against the applicable skill specification.

### Name

* [ ] `name` exists.
* [ ] Name clearly identifies the activity or capability.
* [ ] Name is not vague or overly generic.
* [ ] Naming is consistent with the surrounding skill library.
* [ ] Gerund-style naming is preferred where appropriate, but equivalent clear naming is acceptable.

### Description

* [ ] `description` exists.
* [ ] Description states **what the skill does**.
* [ ] Description states **when the skill should be used**.
* [ ] Important trigger terms and user contexts are represented.
* [ ] Description accurately reflects actual scope.
* [ ] Description is specific enough to distinguish the skill from neighboring skills.
* [ ] Description is not so broad that unrelated prompts are likely to activate it.
* [ ] Description is not so narrow that legitimate use cases are missed.

### Anthropic-specific metadata

When evaluating Anthropic Agent Skills:

* [ ] `name` is no more than 64 characters.
* [ ] `description` is no more than 1024 characters.
* [ ] Description is written in third person.

## 4. Context Efficiency

Every instruction consumes attention once `SKILL.md` is loaded.

Verify that:

* [ ] Content focuses on information the agent needs for correct execution.
* [ ] Generic background explanations are removed.
* [ ] Repeated guidance is consolidated.
* [ ] Instructions are concise without removing necessary execution detail.
* [ ] Examples justify their context cost.
* [ ] Rarely needed material is not permanently loaded in the main file.
* [ ] Edge cases are included when they materially affect execution rather than merely for completeness.
* [ ] The skill avoids exhaustive documentation when agent judgment is sufficient.

Prefer concise, stepwise guidance over encyclopedic explanation.

### Size guidance

* [ ] `SKILL.md` remains under 500 lines where practical.
* [ ] For portable Agent Skills, target no more than approximately 5,000 tokens for the main file.
* [ ] Larger bodies use progressive disclosure rather than continuing to expand `SKILL.md`.

Treat size as an information-architecture signal, not a substitute for evaluating actual content quality.

## 5. Degree of Control

Match instruction specificity to task fragility.

### High freedom

Appropriate when:

* multiple approaches are valid;
* decisions depend strongly on context;
* heuristics are more useful than rigid procedure.

Verify that the skill provides clear goals and decision criteria without unnecessarily constraining implementation.

### Medium freedom

Appropriate when:

* a preferred approach exists;
* controlled variation is acceptable;
* parameters or environment affect execution.

Verify that the preferred pattern is obvious while legitimate adaptation remains possible.

### Low freedom

Appropriate when:

* operations are fragile or error-prone;
* consistency is critical;
* sequence matters;
* destructive or high-risk actions are involved.

Verify that commands, ordering, constraints, and validation gates are explicit.

**Evaluation question:** Is the degree of prescription proportional to execution risk?

## 6. Defaults and Alternatives

When multiple approaches or tools exist:

* [ ] A justified default is provided when one approach is normally preferred.
* [ ] Alternatives are retained only when they serve a meaningful different condition.
* [ ] Alternatives include a clear trigger or reason for choosing them.
* [ ] The skill does not present unnecessary menus of equivalent options.
* [ ] Tool choice does not force the agent to rediscover the preferred path every run.

Prefer:

`Use A by default. Use B when condition X applies.`

over:

`Use A, B, C, D, or E.`

## 7. Procedures Over One-Off Answers

Verify that the skill teaches a reusable method.

* [ ] Instructions generalize across the intended task class.
* [ ] Procedures describe how to determine the correct action from available context.
* [ ] Examples illustrate the method rather than replacing it.
* [ ] Fixed values, queries, outputs, or commands are included only when genuinely invariant.
* [ ] Output constraints and safety requirements remain explicit where necessary.

Flag instructions that encode the answer to one specific task instead of teaching the reusable procedure.

## 8. Progressive Disclosure

Keep information in `SKILL.md` when it is needed on most activations. Move conditional or extensive material into supporting resources.

Verify that:

* [ ] Core workflow and critical constraints remain in `SKILL.md`.
* [ ] Detailed reference material is externalized when it is not required every run.
* [ ] Every supporting reference has a clear load condition.
* [ ] Load conditions describe **when** the agent should read the file, not merely that the file exists.
* [ ] References are named descriptively.
* [ ] Domain-specific references are separated where doing so avoids loading irrelevant information.
* [ ] Long examples or templates are externalized when appropriate.
* [ ] Critical gotchas are not hidden in references when the agent may not recognize the condition requiring them.

Prefer:

`Read references/api-errors.md if the API returns a non-200 response.`

over:

`See references/ for more information.`

### Reference topology

For Anthropic Agent Skills:

* [ ] Supporting references are normally one level deep from `SKILL.md`.
* [ ] Important files are linked directly from `SKILL.md`.
* [ ] Deep reference chains are avoided.
* [ ] Reference files longer than roughly 100 lines include a useful table of contents.

## 9. Gotchas and Non-Obvious Rules

Verify whether the skill captures assumptions an agent is otherwise likely to get wrong.

Good gotchas include:

* environment-specific behavior;

* misleading API or health behavior;

* inconsistent identifiers between systems;

* hidden data conventions;

* known failure modes;

* counterintuitive project rules.

* [ ] Gotchas are concrete rather than generic warnings.

* [ ] Each gotcha changes execution behavior.

* [ ] Frequently relevant or hard-to-detect gotchas remain prominent in `SKILL.md`.

* [ ] Corrections learned from real execution are incorporated where they prevent recurrence.

Avoid generic statements such as "handle errors appropriately."

## 10. Workflows and Decision Points

For multi-step work:

* [ ] Steps are explicit and logically ordered.
* [ ] Dependencies occur before dependent actions.
* [ ] Decision branches are stated where workflow differs by task type.
* [ ] Required inputs and outputs are clear.
* [ ] Complex workflows use checklists when this reduces skipped steps.
* [ ] Conditional workflows tell the agent which branch to follow.
* [ ] Very large conditional workflows are separated and loaded only when needed.

Do not require checklist overhead for simple tasks where it adds no execution value.

## 11. Templates and Examples

Use concrete structures when output shape matters.

### Templates

* [ ] Strict output requirements use a sufficiently precise template.
* [ ] Flexible outputs identify the template as a default rather than an absolute requirement.
* [ ] Template strictness matches actual requirements.
* [ ] Large or conditional templates are stored externally where appropriate.

### Examples

* [ ] Examples are concrete rather than abstract.
* [ ] Examples demonstrate expected style, structure, or transformation.
* [ ] Examples are included only where they materially improve reliability.
* [ ] Multiple examples are justified by materially different cases.
* [ ] Examples do not accidentally narrow a general workflow to one instance.

## 12. Validation and Feedback Loops

Quality-critical workflows should validate their own results.

Verify that applicable workflows follow:

`perform → validate → fix → revalidate`

* [ ] A validator, test, reference checklist, or equivalent verification mechanism exists.
* [ ] Validation happens at the appropriate point in the workflow.
* [ ] Failure results in correction rather than unsupported completion.
* [ ] The workflow repeats validation after correction.
* [ ] Finalization occurs only after required validation succeeds.
* [ ] Validation errors provide enough information to support correction where the skill controls the validator.

A reference document may serve as a validator when machine validation is not appropriate.

## 13. Plan-Validate-Execute

For batch, destructive, complex, or high-stakes operations:

* [ ] The skill creates a reversible intermediate plan or structured representation where appropriate.
* [ ] The plan is validated against a source of truth before execution.
* [ ] Invalid plans are corrected before side effects occur.
* [ ] Execution occurs only after required validation.
* [ ] Results are verified after execution when practical.

Preferred pattern:

`analyze → plan → validate → execute → verify`

Machine-verifiable intermediate outputs are preferred where deterministic validation is practical.

## 14. Scripts and Deterministic Operations

Use bundled scripts when agents would otherwise repeatedly recreate deterministic logic.

Verify that:

* [ ] Repeated deterministic operations use reusable scripts where this improves reliability.
* [ ] Scripts have a defined purpose and expected inputs/outputs.
* [ ] Instructions clearly distinguish **execute this script** from **read this script as reference**.
* [ ] Execution is preferred over loading script contents when the script is simply a deterministic utility.
* [ ] Scripts include useful failure handling.
* [ ] Errors are handled rather than simply delegated back to the agent.
* [ ] Configuration values and thresholds are justified rather than unexplained magic numbers.
* [ ] Required dependencies are documented.
* [ ] Dependency availability is verified for the intended environment.
* [ ] Paths and commands are valid for the intended runtime.
* [ ] Forward slashes are used for portable skill paths.

## 15. Content Durability and Terminology

Verify that:

* [ ] Terminology is consistent throughout the skill and its references.
* [ ] The same concept is not unnecessarily described with multiple competing terms.
* [ ] Current instructions are separated from obsolete or legacy patterns.
* [ ] Time-sensitive instructions are avoided when a durable rule can be stated instead.
* [ ] Historical behavior is retained only when it remains useful and is clearly identified as legacy.
* [ ] File and resource names communicate their purpose.

## 16. Evaluation and Real-Usage Testing

A skill should be tested against representative work, not judged only by reading the instructions.

Verify where evaluation evidence exists that:

* [ ] Representative scenarios cover actual intended use.
* [ ] Expected behavior is stated clearly enough to determine success.
* [ ] A baseline without the skill is established when evaluating whether the skill adds value.
* [ ] The skill contains only enough instruction to correct observed gaps.
* [ ] Evaluations are rerun after changes.
* [ ] Real workflows are used in addition to synthetic tests.
* [ ] Successful runs as well as failures are reviewed.
* [ ] Execution traces are inspected where available.
* [ ] False activations, missed activations, unnecessary exploration, ignored instructions, and wasted steps are considered.
* [ ] Previously observed failures become regression cases when appropriate.

A useful lifecycle is:

`identify gap → evaluate baseline → add minimal guidance → execute → observe → revise → re-evaluate`

## 17. Navigation and Reference Usage

When observing real agent execution, check whether:

* [ ] The agent finds important supporting files.
* [ ] References are read in an intuitive order.
* [ ] Important links are sufficiently visible.
* [ ] Frequently accessed reference content belongs in `SKILL.md` instead.
* [ ] Never-accessed resources still justify their existence.
* [ ] File access patterns support rather than obstruct progressive disclosure.

Unexpected navigation behavior is evidence that information architecture may need improvement.

## 18. Anthropic / Claude-Specific Checks

Apply this section only when the target is Claude or Anthropic Agent Skills.

### Model coverage

* [ ] The skill is tested with each Claude model it is intended to support.
* [ ] Guidance remains sufficient for less capable target models.
* [ ] Guidance does not unnecessarily over-explain for more capable target models.
* [ ] If broad Claude compatibility is required, Haiku, Sonnet, and Opus behavior has been considered.

### Runtime and filesystem

* [ ] Runtime assumptions match the intended Anthropic environment.
* [ ] File access assumptions reflect Claude's on-demand skill loading.
* [ ] Supporting data does not needlessly occupy `SKILL.md` when it can remain external until needed.
* [ ] File names and directory organization support discovery.
* [ ] Script execution is preferred for deterministic utilities where appropriate.
* [ ] The skill tests whether Claude can locate and use required resources.

### Dependencies

* [ ] Required packages are explicitly identified.
* [ ] Package installation assumptions match the target environment.
* [ ] The skill does not assume network or runtime installation where the target environment does not provide it.

### MCP

When MCP tools are referenced:

* [ ] Fully qualified tool names use `ServerName:tool_name`.
* [ ] Server and tool names match the intended MCP configuration.
* [ ] Tool names are not left ambiguous when multiple MCP servers may expose similar capabilities.

### Visual inputs

When layout or visual structure materially affects execution:

* [ ] The workflow uses visual analysis where appropriate.
* [ ] Any required conversion/rendering utility is actually available or supplied.

## 19. Final Best-Practices Checklist

Before declaring a skill aligned with these sources, verify all applicable items:

### Value and scope

* [ ] Adds knowledge or procedure the agent materially needs.
* [ ] Represents a coherent unit of work.
* [ ] Avoids generic filler.
* [ ] Preserves important domain-specific knowledge and gotchas.

### Discovery

* [ ] Name is clear and consistent.
* [ ] Description states what the skill does and when to use it.
* [ ] Trigger terms match actual scope.
* [ ] Provider-specific metadata limits are satisfied where applicable.

### Context and structure

* [ ] Main file is concise.
* [ ] Degree of instruction matches task fragility.
* [ ] Defaults are provided instead of unnecessary menus.
* [ ] Procedures generalize beyond one task.
* [ ] Progressive disclosure is used appropriately.
* [ ] Every supporting resource has a meaningful load condition.
* [ ] References are easy to discover and not unnecessarily nested.

### Execution quality

* [ ] Workflows have clear steps and decision points.
* [ ] Gotchas are concrete and actionable.
* [ ] Templates/examples are used where they improve reliability.
* [ ] Validation loops exist for quality-critical operations.
* [ ] High-risk or batch changes use plan-validate-execute where appropriate.
* [ ] Deterministic repeated logic is bundled when useful.

### Scripts and tooling

* [ ] Script execution versus reference-reading intent is explicit.
* [ ] Scripts handle foreseeable failures.
* [ ] Configuration values are justified.
* [ ] Dependencies and runtime assumptions are explicit.
* [ ] Paths and tool references are valid for the target environment.

### Evaluation

* [ ] Representative evaluations exist where available.
* [ ] Real usage has been tested.
* [ ] Execution behavior, not only final output, has been reviewed.
* [ ] Observed failures and inefficiencies drive revisions.
* [ ] Regressions are retested after changes.

## Evaluation Principle

Do not reward a skill for being comprehensive.

Reward it for providing the **minimum sufficient domain-specific guidance that reliably produces correct execution**.

A strong skill is:

**specific enough to prevent predictable mistakes, concise enough to preserve agent attention, structured enough to reveal the right information when needed, and validated against real execution.**
