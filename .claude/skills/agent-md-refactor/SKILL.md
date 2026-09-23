---
name: agent-md-refactor
description:
  Use when refactoring oversized, mixed-purpose, duplicated, contradictory, or
  hard-to-navigate AGENTS.md, CLAUDE.md, COPILOT.md, or similar agent
  instruction files into a smaller root plus focused supporting files while
  preserving scope, precedence, safety rules, and instruction discoverability.
license: MIT
---

# Agent MD Refactor

Refactor agent instruction files with progressive disclosure without changing
their intended behavior by accident.

## Use this workflow

Use it for monolithic, duplicated, contradictory, or hard-to-navigate agent
instructions. Do not use it merely to rewrite prose when no structural refactor
is needed.

### 1. Inventory before editing

Read the target file and every instruction file, reference, or local policy that
can affect the same scope.

Record:

- the target client or agent environment, if known;
- root and nested instruction files;
- precedence or directory-scoping rules supported by the available evidence;
- existing links and load/discovery mechanisms;
- project-specific commands, overrides, safety rules, and domain conventions;
- unique guidance that must not be lost.

Do not assume that a linked file is automatically loaded or enforced. If the
target client's discovery or scoping behavior is unknown and materially affects
the refactor, mark it `Needs Human Review` and avoid replacing the original file
until verified.

If a known instruction source that can affect the target scope is unavailable,
do not claim preservation or replace the active instructions. Stage the
candidate, identify the missing source, and mark the affected preservation check
`Needs Human Review`.

### 2. Preserve a rollback point

Before implementation, preserve the original files or require an equivalent
reversible checkpoint.

Planning and audit-only requests are read-only. Implement changes only when the
user has asked for the refactor or otherwise authorized editing.

For high-impact changes to safety, permissions, deployment, data handling, or
repository-wide behavior, keep an explicit rollback path and validate before
replacing the active instructions.

### 3. Resolve contradictions

Distinguish true conflicts from instructions that apply under different
conditions.

Use this precedence when the supplied material does not define a stronger local
rule:

1. safety, security, privacy, permissions, and compliance;
2. explicit client, repository, or project requirements;
3. instructions required for correct task execution;
4. narrower domain-specific guidance over generic guidance;
5. maintainability and style.

If a material contradiction cannot be resolved from the available evidence, do
not silently choose a winner. Preserve the affected rules, describe the
conflict, and mark it `Needs Human Review`. Continue with unaffected parts when
safe.

### 4. Decide what stays in the root

Keep root content that agents need broadly or need in order to discover the
correct supporting guidance:

- a concise project or repository description when it changes execution;
- critical precedence, safety, permission, or environment overrides;
- non-standard package manager or commands that are broadly useful;
- universal workflow constraints;
- direct links or routing cues to conditional instructions when the target
  client actually uses them.

Move conditional material out of the root when its load condition is clear,
including language-specific conventions, testing detail, framework patterns,
documentation rules, and specialized architecture guidance.

Treat root length as a heuristic, not a validity rule. Aim for a compact
root—often around 50 lines when practical—but preserve necessary universal
guidance even when that requires more.

### 5. Group conditional guidance

Group moved instructions by coherent topic and load condition. Reuse the
repository's existing convention when possible instead of inventing a new
directory.

Prefer a small number of focused files over either a single monolith or
excessive fragmentation. `3-8` files can be a useful starting heuristic, not a
requirement.

For each supporting file:

- keep one clear topic or scope;
- state when it applies if the load condition is not obvious;
- preserve domain-specific terminology and exceptions;
- avoid duplicating rules already owned elsewhere;
- use relative links that can be verified.

Do not flatten nested instruction files or convert scoped instructions into
ordinary documentation unless the target environment treats the new structure
equivalently.

### 6. Prune carefully

Remove or rewrite content only when its execution value is demonstrably absent,
duplicated, obsolete, or too vague to guide behavior.

Good removal candidates include:

- exact duplicates with the same scope and precedence;
- vague statements such as "write clean code" when no concrete constraint
  follows;
- outdated instructions whose replacement is established by supplied evidence;
- generic explanation that does not change agent behavior.

Never delete a safety, security, privacy, permission, compliance, or
project-specific rule merely because it appears obvious or because a base model
may already know the general principle.

When deletion would change behavior or evidence is incomplete, flag the item
instead of removing it.

### 7. Build the candidate structure

Create the minimal root plus supporting files only after the preservation and
contradiction review.

Maintain:

- original scope and precedence unless an intentional change is authorized;
- all unique operational guidance;
- working relative links;
- meaningful headings and stable terminology;
- discoverability of every relocated instruction.

If client behavior is unverified, produce the candidate in a reversible or
staged location rather than replacing the active files.

### 8. Validate against the baseline

Compare the candidate with the preserved baseline.

Verify statically:

- every original instruction is preserved, intentionally adapted, or explicitly
  listed for removal;
- no unresolved contradiction was silently resolved;
- moved rules remain discoverable in their intended scope;
- all links and referenced files exist;
- root content is concise without dropping required universal guidance;
- supporting files are coherent and not needlessly duplicated;
- safety, permission, and compliance controls are unchanged or intentionally
  strengthened.

Where possible, run representative tasks in the target client to confirm the new
structure is actually discovered and followed. If that execution evidence is
unavailable, report it as `Needs Human Review` rather than claiming behavioral
equivalence.

## Output contract

Return enough information to audit the transformation:

- contradictions and unresolved review items;
- proposed or implemented file structure;
- preservation/move/remove decisions for material instructions;
- files created or changed;
- static validation results;
- behavioral validation status;
- rollback location or method when implementation occurred.

Do not claim links, client loading behavior, or regressions were verified unless
they were actually checked.

## Gotchas

- A Markdown link does not prove an agent will load the linked file.
- Nested instruction files may have directory-specific scope or precedence.
- "Under 50 lines" and "3-8 files" are optimization heuristics, not hard
  requirements.
- Removing generic-looking safety or permission rules can silently weaken
  project behavior.
- Contradiction resolution may require local project knowledge; unresolved
  material conflicts stay explicit.
