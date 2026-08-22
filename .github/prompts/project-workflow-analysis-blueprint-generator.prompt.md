---
description: 'Repository-aware workflow-analysis blueprint generator for the AGDS starter-kit workspace. Detects actual repo workflow surfaces such as Next.js Pages Router routes, AGDS layout composition, Storybook rendering, local package aliasing, API routes, and validation workflows, then generates a truthful root-level workflow blueprint while marking unsupported stacks as not applicable.'

agent: 'agent'
---

Canonical command reference: see [.github/docs/COMMAND_CANON.md](../docs/COMMAND_CANON.md) for repo-standard validation, build, lint, and test commands.

# Project Workflow Analysis Blueprint Generator

Use this prompt to generate or refresh a workflow-analysis blueprint that is truthful for the
current repository.

In this repo, the expected output is a root-level `WORKFLOW_ANALYSIS_BLUEPRINT.md` that documents
representative real workflows contributors should follow or inspect before extending the project.

## Required operating rules

1. Review current repository evidence before writing anything:
   - `README.md`
   - `PROJECT_FOLDERS_STRUCTURE_BLUEPRINT.md`
   - `.copilot-tracking/lessons/Lessons_Learned.md`
   - `package.json`
   - `pnpm-workspace.yaml`
   - `pages/`
   - `components/`
   - `.storybook/main.ts`
   - any representative route, API, story, or validation files directly involved in the workflows
2. Use `Lessons_Learned.md` as an input, not only as a retrospective output.
3. Detect what workflow surfaces actually exist before documenting patterns.
4. Mark unsupported or non-detected patterns as `Not applicable in the current repo` instead of
   forcing generic stack guidance into the blueprint.
5. Prefer representative workflows over exhaustive inventory.
6. Keep the output practical, contributor-facing, and workflow-oriented.

## Applicability filter

Before drafting the blueprint, classify the repo workflow surfaces you actually found:

- root Next.js application routes
- page-level composition and shared layout
- API routes
- Storybook component stories
- Storybook page-wrapper stories
- local workspace package aliasing or cross-workspace story rendering
- validation and release workflow commands
- service-layer, repository-layer, database, message-bus, or microservice flows

For each category:

- include it when supported by inspected repo evidence
- exclude it when unsupported
- if excluded, state briefly why it is not part of the current representative blueprint

Do not document .NET, Spring, microservices, CQRS, repository layers, SQL/NoSQL persistence, or
background-job flows unless the current repository actually contains those surfaces and the evidence
was inspected.

## Workflow selection rules

Choose 3-5 representative workflows that best explain how this repository works in practice.

For the AGDS starter-kit workspace, expected candidates usually include:

1. route rendering and page composition
2. API route handling
3. Storybook story rendering and local package alias behavior
4. validation workflow for `pnpm`-based quality gates

If another workflow is more representative than one of these, explain why it replaced it.

## Blueprint output requirements

Generate or refresh `WORKFLOW_ANALYSIS_BLUEPRINT.md` with:

1. `Purpose`
   - explain why the blueprint exists
   - define its representative, non-exhaustive scope
2. `Workflow Selection Criteria`
   - explain why the chosen workflows were selected
3. `Repository Workflow Map`
   - summarize the chosen workflows in one quick-scan section
4. one section per representative workflow, each covering:
   - workflow name and purpose
   - triggering action
   - entry point files
   - key supporting files
   - step-by-step execution flow
   - extension guidance for contributors
   - limitations or not-present layers
5. `Cross-Cutting Conventions`
   - include AGDS `Core`, `AppLayout`, `DocumentTitle`, Storybook config, `pnpm`, and other
     verified repo-wide rules when applicable
6. `Not Currently Present`
   - call out important workflow layers that contributors might expect from a larger app but that
     are not part of the current starter repo
7. `Maintenance Guidance`
   - explain when the blueprint should be updated

## Workflow documentation requirements

For each documented workflow:

- use actual repo file paths
- describe the real entry boundary
- describe the real composition or execution path
- identify where contributors should extend the flow
- distinguish framework plumbing from repo-specific conventions
- call out absent layers when that absence matters to understanding the repo

## Validation and truthfulness rules

The generated blueprint must stay consistent with current repo behavior.

Before considering the blueprint complete:

- confirm the documented commands exist in `package.json`
- confirm the documented route and Storybook flows exist in the current workspace
- avoid claiming full repo-wide architecture coverage when only representative workflows were
  inspected
- keep the document useful for contributors who need to decide where to start a change

## Output style

- Use Markdown.
- Keep headings short and structural.
- Prefer tables and plain-language workflow steps over generic architectural jargon.
- Optimize for contributor decisions, not abstract theory.
- Write as a durable repo blueprint, not as a one-off analysis memo.
