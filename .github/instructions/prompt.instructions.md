---
description: 'This file describes best practices for writing GitHub Copilot Chat prompt files (.prompt.md) in this repository. Follow these guidelines to create effective, safe, and maintainable prompts that align with repository policy and provide clear value to users.'
applyTo: '**/*.prompt.md'
---

# Copilot prompt file rules

Use these rules when creating or editing `.prompt.md` files.

## Purpose

Prompt files are opt-in task workflows for GitHub Copilot Chat.

Use prompt files for repeatable tasks that a user intentionally invokes, such as audits, reviews, generation workflows, migration checks, or structured analysis.

Do not use prompt files as always-on repository policy. Put canonical policy in `AGENTS.md`, concise repo-wide Copilot guidance in `.github/copilot-instructions.md`, and path-specific rules in `.github/instructions/*.instructions.md`.

## Frontmatter

Use valid YAML frontmatter.

Recommended baseline:

```yaml
---
agent: 'agent'
description: 'Short action-focused description of the prompt.'
argument-hint: 'What the user should provide when running the prompt.'
---
```

Rules:

- Keep `description` short, accurate, and action-focused.
- Use `argument-hint` when the prompt expects user input.
- Use `agent` only when the prompt genuinely needs a specific mode.
- Use `model` only when the task has a justified model requirement.
- Use `tools` only when the prompt genuinely needs explicit tools.
- Do not invent unsupported metadata fields, tool names, agents, or models.
- Preserve existing `$input` or `${input:...}` style unless the task asks to change it.

## Inputs and scope

Every prompt should make its required inputs clear.

Include:

- what the user must provide
- what the prompt will do
- what the prompt will not do
- what to do when required input is missing

Scope rules:

- Keep prompts task-specific and opt-in.
- Do not run broad repo-wide workflows unless the user explicitly asks.
- Do not edit files, run commands, or create artifacts unless the prompt’s task requires it.
- If the task is review-only, report findings without modifying files.
- If scope is unclear, state assumptions or ask for the missing required input.

## Tools and permissions

Use least-privilege tool access.

- Include only tools needed for the prompt’s job.
- Avoid broad tool lists copied from other prompts.
- Warn before destructive or broad actions such as mass edits, deletes, dependency changes, workflow changes, or terminal commands.
- Do not require unavailable tools.
- If a required tool is unavailable, report the limitation and provide the safest fallback.

## Body structure

Keep the body short and operational.

Recommended sections:

- `# Title`
- `Goal`
- `Required inputs`
- `Scope`
- `Workflow`
- `Output format`
- `Validation`
- `Safety notes` when relevant

Use fewer sections when the task is simple.

Avoid:

- long tutorials
- copied product documentation
- generic best-practice lists
- large reference tables
- stale version-specific claims
- duplicated repo policy
- placeholder text or template residue

If the prompt needs many files, scripts, templates, or references, consider a skill instead.

## Output format

Define the expected output clearly.

Specify when relevant:

- response sections
- file paths to create or update
- whether code, Markdown, JSON, or another format is expected
- acceptance criteria
- validation evidence
- residual risks or unresolved gaps

Do not claim work was completed, validation passed, tests ran, or files changed unless that actually happened.

## Validation

Before finishing a prompt-file change, confirm:

- frontmatter is valid
- input expectations are clear
- the prompt is opt-in and task-specific
- tool access is least-privilege
- output format is explicit
- validation or evidence rules are included where needed
- the prompt does not duplicate or weaken repo policy
- no unsupported metadata, fake tools, placeholder text, or stale examples remain
- confirm the prompt is still the right artifact type and not better represented as an instruction, agent, skill, or normal documentation
- if the prompt is too long, complex, or broad, consider whether it should be a skill instead of a prompt.
- if the prompt is for a repeatable task, consider whether it should be an instruction instead of a prompt.
- if the prompt is for a specific file, path, or type of change, consider whether it should be an instruction instead of a prompt.
