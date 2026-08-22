---
description: 'Guide creation and editing of custom Copilot agent files with safe, minimal, and maintainable defaults. These rules cover file location, frontmatter structure, tool access, agent design principles, and validation steps to ensure that custom agents are effective, aligned with repository policy, and do not introduce unsupported capabilities or unnecessary complexity. Follow these instructions when working with `.agent.md` files in the repository to maintain consistent quality and alignment with project goals.'
applyTo: '**/*.agent.md'
---

# Custom agent file rules

Apply these rules when creating or editing custom agent files.

## Default stance

- Only create or expand a custom agent when the task actually needs reusable, specialized agent behavior.
- Prefer simple agents with one clear role over complex multi-agent workflows.
- Optimize for maintainability, not novelty.

## File location and scope

- Repository-level custom agents belong in `.github/agents/`.
- Keep each agent focused on a specific job such as planning, implementation, testing, or review.
- Do not create overlapping agents with unclear boundaries.

## Frontmatter rules

- Use valid YAML frontmatter.
- Include a short, accurate `description`.
- Add only the frontmatter fields the agent actually needs.
- Do not invent unsupported properties or assume all properties work in all environments.
- Use environment-specific features only when the task clearly requires them.

## Tool rules

- Follow the principle of least privilege.
- Give the agent only the tools it needs.
- Avoid `execute`, `web`, MCP tools, or agent-to-agent invocation unless they are clearly necessary.
- Do not grant broad tool access just because it is convenient.

## Agent design rules

- Give the agent one clear responsibility.
- State what the agent should do, what it should avoid, and what output it should produce.
- Prefer concise, direct instructions over long tutorials or framework essays.
- Do not embed large orchestration systems, bulky templates, or handbook-style content unless the task explicitly requires that complexity.
- Prefer a single agent unless handoffs or sub-agents are clearly justified.

## Safety and repo alignment

- Do not invent routes, APIs, environment variables, dependencies, tools, or unsupported capabilities.
- Keep agent behavior aligned with `AGENTS.md`, `.github/copilot-instructions.md`, and relevant `.github/instructions/*.instructions.md` files.
- Do not weaken repository policy, quality gates, or review expectations from within an agent definition.

## Validation

Before finishing:

- Check that the file name follows the `.agent.md` convention.
- Check that the frontmatter is valid and minimal.
- Check that the agent’s role, tools, and outputs are clear.
- Check that the agent does not claim unsupported capabilities or unnecessary complexity.
- When feasible, test the agent with one representative task to confirm its role, tool limits, and output behavior are coherent.
