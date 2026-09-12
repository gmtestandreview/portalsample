# Structured Autonomy Compatibility Mode

Load this reference only when the user or project explicitly requires the supplied structured-autonomy planning workflow, a single-PR/dedicated-branch plan, commit-shaped implementation steps, or its research-before-planning behavior.

Do not apply these requirements to ordinary `writing-plans` requests.

## Preserved workflow

1. Research and gather context before generating the plan.
   - Inspect related code, existing patterns, affected services, documentation, architecture decisions, and dependencies.
   - Research external APIs/libraries from suitable documentation when that is part of the task and the environment supports it.
   - The source workflow preferred stopping research around 80% confidence that the feature can be decomposed into testable phases.
2. Determine commits.
   - SIMPLE features: one commit containing the complete coherent change.
   - COMPLEX features: multiple commits, each a testable step toward the final outcome.
3. Generate the plan for a single pull request on a dedicated branch.
4. The source used `plans/<feature-name>/plan.md` and this shape:
   - feature name;
   - branch;
   - one-sentence description;
   - goal;
   - implementation steps with files, what changes, and testing.
5. The source workflow inserted `[NEEDS CLARIFICATION]` while drafting, asked for clarification, paused for feedback, then reran research if feedback changed the required context.
6. Remove all clarification markers before treating a plan as finalized.

## Tool-specific rule from the source

The source required `runSubagent` for research when that tool was available and otherwise performed the research directly. Treat that as an environment-specific compatibility rule: use it only when the target environment exposes the named capability. Do not invent or alias the tool in other environments.

## Related legacy conventions

The older `writing-plans` source also assumed a dedicated worktree created by a brainstorming workflow and used Superpowers-specific execution handoffs. Preserve those conventions only when that workflow is explicitly installed or required; otherwise use the portable default in `SKILL.md`.
