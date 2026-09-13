---
name: agent-development
description: Use when creating, revising, or validating Claude Code plugin agent/subagent Markdown files, including adding an autonomous reviewer, generator, or analyzer under a plugin's agents/ directory; defining agent frontmatter or trigger examples; choosing model, color, or tools; or writing the agent system prompt. Excludes CLAUDE.md/AGENTS.md refactoring and general tool or MCP schema design.
compatibility: Designed for ChatGPT Codex to create and validate Claude Code plugin agent Markdown files; the bundled validator requires Bash plus awk, grep, sed, and head.
metadata:
  version: "0.1.0"
---

# Claude Code Agent Creation

Create or revise Claude Code plugin agents as autonomous subprocesses for complex, multi-step work. Use commands instead when the task is primarily a user-initiated action rather than autonomous delegated work.

Keep this skill scoped to Claude Code agent files. Do not use it to refactor `CLAUDE.md`/`AGENTS.md` instructions or design general agent-tool/MCP schemas; route those tasks to their companion skills when available.

## Inputs and Context

Use the user's requirements and available project context. Identify:

- agent purpose and responsibilities;
- explicit, implicit, proactive, or reactive trigger conditions;
- expected outputs and important edge cases;
- project-specific instructions, conventions, or scope limits;
- required Claude Code tool access.

When available, read the relevant project `CLAUDE.md` before generating the agent. Treat it as project context, not as a file to refactor unless the user separately asks for that work.

If the target agent file already exists, inspect it before editing. Preserve unique behavior and project-specific constraints unless the user explicitly requests their removal or replacement. Do not silently overwrite an existing agent. For a substantial rewrite, preserve the original through a backup or version-control diff before replacement.

Do not invent project rules, tools, permissions, integrations, or test results. If a material requirement is unavailable, make the assumption or validation gap explicit.

## Agent File Contract

Create the agent at `agents/<agent-name>.md` using YAML frontmatter followed by the system prompt. The supplied Claude Code guidance says `.md` files under a plugin `agents/` directory are auto-discovered. When agents are placed in subdirectories, account for automatic namespacing such as `plugin:subdir:agent-name`.

```markdown
---
name: code-reviewer
description: |
  Use this agent when the user asks for code review or when a completed code change should be reviewed proactively. Examples:

  <example>
  Context: The user just completed an implementation.
  user: "I've finished the authentication change."
  assistant: "I'll use the code-reviewer agent to review the completed change."
  <commentary>
  A logical code change is complete and the agent is configured for proactive review.
  </commentary>
  </example>

  <example>
  Context: The user explicitly requests review.
  user: "Can you review these changes?"
  assistant: "I'll use the code-reviewer agent to review the changes."
  <commentary>
  The request directly matches the agent's review responsibility.
  </commentary>
  </example>
model: inherit
color: blue
tools: ["Read", "Grep", "Glob"]
---

You are an expert code reviewer...
```

### `name`

- Required; 3-50 characters.
- Use lowercase letters, numbers, and hyphens only.
- Start and end with an alphanumeric character.
- Avoid generic identifiers such as `helper`, `assistant`, `agent`, or `tool`.

### `description`

- Required and central to triggering.
- Start with concrete triggering conditions such as `Use this agent when...`.
- Include 2-4 concrete `<example>` blocks by default.
- Vary phrasing and cover proactive and reactive use when both are intended.
- Each example should include context, user wording, assistant triggering behavior, and `<commentary>` explaining why the agent applies.
- Include a meaningful near-miss or non-trigger boundary when adjacent requests could be confused with the agent.
- For multiline examples, use a YAML block scalar (`description: |`) and indent its content.

Read `references/triggering-examples.md` when trigger behavior is ambiguous, proactive/implicit triggering matters, or an agent triggers too often or too rarely.

### `model`

Required. Use `inherit` by default unless the user or project context requires one of the supplied alternatives: `sonnet`, `opus`, or `haiku`.

### `color`

Required. Use one of `blue`, `cyan`, `green`, `yellow`, `magenta`, or `red`.

Use color as a visual identifier rather than a behavior rule. Keep colors distinguishable within the same plugin where practical. Existing guidance associates blue/cyan with analysis or review, green with success-oriented work, yellow with validation/caution, red with critical/security work, and magenta with creative/generation work.

### `tools`

Optional. Restrict tools to the minimum needed. If omitted, the supplied Claude Code agent guidance treats the agent as having access to all tools, so omission is a deliberate broad-access choice rather than least privilege.

Common supplied patterns include:

- read-only analysis: `["Read", "Grep", "Glob"]`
- code generation: `["Read", "Write", "Grep"]`
- testing: `["Read", "Bash", "Grep"]`

These names configure the target Claude Code agent; they do not assert that the current ChatGPT Codex runtime exposes the same tools. Do not add a tool merely because it appears in an example.

## System Prompt

Write the Markdown body in second person and make it specific enough for autonomous execution.

Include the parts that materially apply:

1. expert role and domain;
2. core responsibilities;
3. ordered process or decision method;
4. quality standards;
5. output format;
6. edge cases, missing-information handling, and fallback behavior.

Read `references/system-prompt-design.md` when selecting or adapting analysis, generation, validation, or orchestration prompt patterns.

For AI-assisted creation using the supplied Claude Code generation approach, read `references/agent-creation-system-prompt.md`. Use `examples/agent-creation-prompt.md` when an end-to-end generation/conversion template is useful.

## Workflow

1. Confirm the request is for a Claude Code autonomous agent rather than a command or adjacent companion-skill task.
2. Gather the user requirements, relevant `CLAUDE.md` context when available, target-file state, trigger conditions, output expectations, and tool needs.
3. If editing an existing agent, preserve unique supported behavior before changing it.
4. Choose a specific lowercase identifier.
5. Write the trigger description and 2-4 representative examples.
6. Select `model`, `color`, and the minimum necessary `tools`.
7. Write the system prompt with responsibilities, process, quality standards, output expectations, and relevant edge cases.
8. Save or return `agents/<agent-name>.md` as requested.
9. When Bash and the bundled script are available, run:
   ```bash
   bash scripts/validate-agent.sh "agents/<agent-name>.md"
   ```
10. If deterministic validation fails, fix the reported issue and rerun it.
11. When the target environment can expose agent invocation, test realistic positive, applicable proactive/implicit, and near-miss scenarios. Verify the agent is actually invoked rather than inferring activation from the final answer.
12. Test the system prompt on a typical task, its output contract, and relevant edge cases when execution is available.
13. When integrating the agent into a plugin, document it in the plugin README only when that documentation is part of the requested work.

## Validation and Completion

`scripts/validate-agent.sh` performs deterministic static checks on the generated agent file. It does not prove that Claude will trigger the agent correctly or that the system prompt behaves well.

If Bash or the target Claude Code execution environment is unavailable, do not claim the corresponding check passed. Report static validation, trigger behavior, or end-to-end behavior as unverified/`NHR` as applicable.

No trigger-testing script is bundled. Trigger testing is scenario-based using positive cases and near-misses; do not invent an executable trigger-test dependency.

For code-review agents, the supplied generation guidance assumes review of recently written code rather than the entire codebase unless the user explicitly asks for broader review.

The task is complete when the requested agent artifact is produced without silently discarding existing unique behavior, available deterministic validation has been handled, and unavailable execution-dependent checks are explicitly identified.

## Supporting Resources

Load only the resource needed for the current task:

- `references/agent-creation-system-prompt.md` — AI-assisted generation or alignment with the supplied Claude Code generation prompt.
- `references/system-prompt-design.md` — deeper system-prompt patterns or prompt-quality troubleshooting.
- `references/triggering-examples.md` — trigger examples, proactive/implicit cases, near-misses, or trigger debugging.
- `examples/agent-creation-prompt.md` — full JSON-to-agent generation template and iteration workflow.
- `examples/complete-agent-examples.md` — concrete full-agent examples for comparison or adaptation.
- `scripts/validate-agent.sh` — deterministic validation after creating or materially editing an agent file.

Do not load the full example library when the core workflow is sufficient.
