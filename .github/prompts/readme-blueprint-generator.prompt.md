---
description: 'Create or update README.md using the repository workflow. Follow evidence-first planning, lessons review, controller-gated execution when required, README best practice, disciplined validation, and truthful tracking.'
agent: 'agent'
---

Canonical command reference: see [.github/docs/COMMAND_CANON.md](../docs/COMMAND_CANON.md) for repo-standard validation, build, lint, and test commands.

# README Workflow Prompt

Use this prompt when the task is to create or update `README.md` for a repository and the work must follow the repository workflow rather than being handled as one large free-form request.

## Objective

Complete the README task using the repository workflow with evidence-first planning, controller-gated execution when needed, regression-aware validation, disciplined tracking, and lessons-learned reuse.

## Task

Task objective:
`Create or update README.md for this repository using evidence from repository documentation, code, configuration, and workflow materials.`

Optional context:

- scope: `Prioritize a user-first, contributor-useful README grounded in actual repository behavior and supported documentation.`

## README-specific goal

Produce a README that helps a new reader quickly understand:

1. what the project is
2. why it exists
3. how to install or run it
4. how to use it
5. how to contribute correctly

Prioritize clarity, accuracy, quick-start usefulness, and scannability.

## Core workflow rule

Use `scripts/copilot-workflow-controller.mjs` to inspect workflow state and gates when the task is large enough to require controller-gated execution.

The controller is status-only:

- it reports artifact and gate status
- it checks for structural blockers
- it reads validation outcomes
- it does not create research, planning, rubric, validation, changes, release, or lessons artifacts
- it does not bypass validation
- it does not approve release

Create or update required artifacts separately, then use the controller to verify gate status.

## 1. Frame the task

Before substantial work:

- state the task objective in one sentence
- classify the task as one of:
  - a controller-gated workflow task
  - a small local fix
  - a dependency/configuration remediation
  - a documentation-only update
- for README work, prefer `documentation-only update` unless the task is broad enough to require controller gating
- if controller-gated, choose a normalized slug in the format:
  `YYYYMMDD-readme-update`
  or
  `YYYYMMDD-readme-<short-description>`
- list affected surfaces before editing, such as:
  - `README.md`
  - docs referenced from README
  - setup commands
  - package scripts
  - config files
  - contributor instructions
  - workflow files
  - `.github/copilot/*`
  - `.github/copilot-instructions.md`

## 2. Review lessons before work starts

Before planning implementation, review:

- `.copilot-tracking/lessons/Lessons_Learned.md`
- top repeatable rules
- lessons promotion register
- follow-up TODO register
- any dated lessons that appear similar to the current task

Use lessons learned as workflow input, not only as retrospective output.

## 3. Baseline reality first

Before editing:

- inspect the current `README.md` if it exists
- inspect the current repository structure and relevant source-of-truth files
- if README already contains setup, usage, test, or build commands, run those exact commands before editing the docs
- distinguish current repo state from historical or stale documentation
- if a previous slug appears complete, verify it still matches the current workspace before relying on it
- do not plan from assumptions when current evidence can be collected directly

## 4. Controller intake

Use this section when the task is large enough to require workflow gating.

Before substantial gated work:

- state the task objective
- choose the slug
- resolve expected artifact paths using repository naming conventions
- run:

```powershell
node scripts/copilot-workflow-controller.mjs --task-slug "<slug>" --phase "status"
```

Then:

- follow the first missing or blocked phase reported by the controller
- do not skip ahead because a later phase seems obvious
- do not implement while validation keeps the implementation gate closed
- treat the controller as status-only

## 5. Research

Read the local source of truth first:

- relevant code
- relevant tests
- current `README.md`
- relevant instructions, prompts, and agents
- lessons learned
- relevant config and workflow files
- `.github/copilot/*`
- `.github/copilot-instructions.md`

For README generation, extract only supported facts such as:

- project name
- project purpose
- primary audience or use case
- technology stack
- package manager and scripts
- setup requirements
- run commands
- test commands
- architecture summary
- project structure
- contributing expectations
- license details if explicitly present

Separate facts from assumptions.

Classify the README task shape:

- missing README
- stale README
- documentation drift
- guidance discoverability gap
- contributor guidance gap
- workflow/process gap
- repo behavior changed but README did not
- documentation-only update vs wider repo issue

## 6. Plan

Keep the plan narrow and evidence-based.

Define:

- measurable success criteria
- explicit non-goals
- exact validation commands to run
- whether the work is documentation-only or mixed
- whether any README claims require command verification

Prefer the smallest correct change that removes the real source of friction.

## 7. Adversarial review before implementation

Before implementation, start with the strongest objection, not the easiest one.

Challenge whether the plan could fail because of:

- README claiming commands that no longer work
- stale dev server reuse
- stale Storybook process reuse
- workspace-root resolution issues
- PowerShell vs POSIX command drift
- old docs masking current behavior
- a documentation gap being mistaken for a code gap
- historical artifacts being mistaken for current validation evidence
- unsupported assumptions about setup, environment variables, versions, badges, or license

Record:

- `Best Objection`
- `Counterarguments`
- `Non-Obvious Scenarios`
- `Remaining Vulnerabilities`
- `Concessions and Mitigations`

Do not begin implementation until the validated plan survives this review.

## 8. Environment and command safety

Use repository-correct tooling and shell behavior.

Rules:

- use `pnpm`, not `npm` or `yarn`, when the repository uses pnpm
- make command examples valid for the active shell or provide explicit alternatives
- prefer first-class repo scripts over ad hoc shell sequences
- check whether active processes can invalidate results, including:
  - `pnpm dev`
  - `pnpm storybook`
  - Playwright or reused web-server processes
- do not treat shell drift or stale processes as product failures until verified

## 9. README implementation

Implement only after validation allows it.

README rules:

- write a user-first, evidence-based README
- include only information supported by repository evidence
- do **not** invent:
  - installation commands
  - setup steps
  - environment variables
  - version numbers
  - build steps
  - CI badges
  - license details
  - deployment instructions
- if important information is missing, omit it or add a brief visible TODO only when necessary
- prefer concise summaries in README and link to deeper docs when appropriate
- do not expose sensitive or internal-only information that does not belong in a README

## 10. Recommended README structure

Include sections only when supported and useful:

# Project Name

## Overview

- what the project does
- who it is for
- the problem it solves
- the primary use case

## Key Features

- 3 to 7 concrete bullets

## Tech Stack

- languages, frameworks, platforms, tooling
- include versions only if explicitly documented

## Project Structure

- brief high-level folder overview

## Getting Started

- prerequisites
- installation
- setup
- configuration
- first-run steps

## Usage

- real commands, entry points, or sample workflows supported by evidence

## Architecture

- short high-level summary only if sufficiently documented

## Development

- local workflow
- relevant scripts
- contributor expectations

## Testing

- testing approach and commands if documented and verified

## Contributing

- concise contribution guidance
- link to deeper docs instead of duplicating long internal guidance

## License

- include only if explicitly available

## Additional Documentation

- relative links to deeper repository docs where helpful

## 11. Writing rules

- use clear Markdown with concise headings and short paragraphs
- put the most important information near the top
- prefer actionable instructions over long prose
- avoid repetition
- avoid marketing language
- avoid low-value inventories
- do not force sections that lack evidence
- if architecture, workflow, coding standards, or testing are too detailed for README, summarize briefly and link out

## 12. Validation

Validation must start with reality, not with the broadest command.

Rules:

- re-run the exact commands the README claims work
- then run the broader impacted validation set only if relevant
- for docs changes, validate the commands the docs claim are supported
- use only checks relevant to the task

Choose from relevant repo commands such as:

- `pnpm lint`
- `pnpm test -- --passWithNoTests`
- `pnpm build`
- `pnpm storybook`
- `pnpm test:storybook-startup`
- `pnpm build-storybook`

Additional README rules:

- do not include a setup, usage, test, or build command in README unless it was verified or clearly sourced from current working documentation
- if validation fails, revise the README to reflect current truth instead of aspirational behavior

## 13. Regression guard

When the issue could recur:

- add the smallest useful guard
- prefer a focused documentation or workflow check over unnecessary code churn
- if repeated confusion comes from discoverability, improve README or contributor guidance instead of inventing product changes

## 14. Tracking

Keep the execution trail auditable.

Rules:

- if controller-gated, update the changes artifact after each completed phase
- record divergences immediately with:
  - expected behavior
  - actual behavior
  - reason
  - risk
  - validation evidence
- record TaskSync usage or non-use
- if something cannot be completed safely, defer it with evidence instead of hiding it

## 15. Documentation updates

When editing README:

- keep it factual, not aspirational
- re-run README-referenced commands after documentation edits
- avoid broad documentation expansion when a focused alignment note is enough
- optimize for decisions and correct usage, not low-value inventories

## 16. Lessons learned

Treat lessons learned as both pre-work input and post-work output.

After task completion:

- add a lesson only if it is reusable beyond the current README task
- distinguish:
  - solved failure
  - residual warnings
  - upstream noise
  - future-only follow-up
- link lessons to concrete evidence files
- record:
  - workflow success rating
  - improvement still required
  - what should now be standardized for future README work

## 17. Closure

Before closing:

- confirm the active mode can update lessons and release-tracking artifacts
- if the task is gated, run the relevant implementation and closure checks
- confirm closure is based on current validation, not historical artifacts
- treat release approval as external when the controller reports it as required
- if a TODO cannot be closed safely, leave it visible with reason, evidence, owner, and next step

Run closure when required:

```powershell
node scripts/copilot-workflow-controller.mjs --task-slug "<slug>" --phase "closure"
```

## Output structure

Return progress using this structure:

1. `Task Objective`
2. `Task Classification`
3. `Affected Surfaces`
4. `Lessons Reviewed`
5. `Task Slug` (if gated)
6. `Resolved Artifact Paths` (if gated)
7. `Current Phase`
8. `Controller Result` (if gated)
9. `Research Findings`
10. `Plan`
11. `Adversarial Review`
12. `Implementation Status`
13. `Validation Status`
14. `Regression Guard`
15. `Tracking Updates`
16. `Documentation Updates`
17. `Lessons Learned Updates`
18. `Blockers`
19. `Next Required Action`
20. `Release and Closure Status`

When the task is complete, include the final `README.md` content after the workflow status output, or clearly state why the README was not yet produced.

## Atomic self-check

Before calling the task complete, answer yes to all applicable questions:

- Did I state the task objective clearly?
- Did I classify the task correctly?
- Did I review the lessons file before work started?
- Did I inspect the current README and repository evidence first?
- Did I run the commands the README claims work before keeping or adding them?
- Did I validate in the active shell instead of assuming POSIX/bash syntax?
- Did I check for stale servers, stale artifacts, or stale slugs?
- Did I separate blockers from warnings?
- Did I avoid inventing unsupported setup or usage details?
- Did I update the changes trail as work progressed?
- Did I record what I deferred and why?
- Did I avoid implementing while the validation gate was closed?
- Did I base closure on current evidence rather than historical completion state?
- Did I update lessons learned when the outcome produced a reusable lesson?

## Guardrails

- Do not invent repository state, approvals, validation results, or artifact contents.
- Do not bypass controller gating.
- Do not mark a phase complete without evidence.
- Do not silently expand scope.
- Do not force code-specific checks onto documentation-only tasks.
- Do not rewrite broad standards or instruction files when a focused README alignment is sufficient.
- Do not hide unresolved blockers, warnings, or deferred work.

## Success criteria

The task is complete only if:

- the task was framed and classified correctly
- lessons learned were reviewed before work started
- baseline reality was established before edits
- controller-gated tasks followed the first missing or blocked phase
- the README reflects actual repository behavior and supported documentation
- every included command was validated or explicitly grounded in current evidence
- the impacted validation set passed or remaining failures were explicitly evidenced
- regressions were guarded where appropriate
- tracking, documentation, lessons, and closure were handled truthfully
- unresolved items were either solved or explicitly deferred with evidence
