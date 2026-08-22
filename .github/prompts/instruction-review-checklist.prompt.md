---
agent: 'agent'
description: 'Reusable checklist for reviewing instruction, prompt, and agent guidance files with repo-alignment, applicability, glob-quality, and command-style discipline.'
---

Canonical command reference: see [.github/docs/COMMAND_CANON.md](../docs/COMMAND_CANON.md) for repo-standard validation, build, lint, and test commands.

# Instruction Review Checklist

Use this checklist when reviewing or integrating `.github/instructions/`, `.github/prompts/`, or
`.github/agents/` files into this repository.

## Scope first

- Verify whether the file is already technically correct and only needs repository-local alignment.
- Ask whether the real gap is:
  - executable code
  - repo-facing guidance
  - both
- If the file is already correctly scoped, prefer a small alignment layer over a rewrite.

## Repository Alignment Notes template

When a shared or generic file needs local framing, keep the alignment section concise:

- what local architecture or workflow context matters
- which local commands are canonical
- which local conventions should be preserved
- what does **not** change about the file's core standards corpus

## Specialized instruction review checklist

Use this when the file targets a specific framework or technology:

- Run a usage/adoption check before preserving or widening broad `applyTo` globs.
- Narrow `applyTo` to technology-specific file patterns when current repo evidence does not justify
  broad auto-application.
- Keep future-only additions deferred unless the repo currently uses the related file patterns.

## `applyTo` quality checks

- Prefer brace expansion or narrow technology-specific globs over comma-space-separated examples.
- Flag ambiguous patterns such as `'**/*.js, **/*.ts'` for correction.
- Confirm the final pattern matches actual repo usage, not just generic catalog defaults.

## Version wording checks

- If inserted repo-alignment notes mention framework or dependency versions, match either:
  - the repo semver range, or
  - the currently installed evidence
- Do not overstate one exact patch version unless the task depends on that patch specifically.

## Command-style and validation checks

- Use the repo package manager style consistently: `pnpm`, not `npm` or `yarn`.
- For testing-focused guidance, check whether command style and test placement cues align with local
  runner configuration.
- For migration or audit-style tasks, verify that audit scope and command scope match.

## Agent and prompt alignment checks

- For agent reviews, check whether local policy and command alignment notes are needed.
- For instruction reviews, preserve standards corpus and add only the local alignment notes that are
  actually missing.
- For optional-instruction files, include or verify:
  - triggers
  - non-triggers
  - escalation path to prompt/agent workflows

## Decision rule

A review is complete only when it explicitly states:

- what applies
- what does not apply
- what was changed
- what remains deferred and why
