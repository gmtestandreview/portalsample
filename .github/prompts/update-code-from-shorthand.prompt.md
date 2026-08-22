---
agent: 'agent'
model: 'Claude Sonnet 4.5'
tools: [execute, read, agent, edit, search, web, todo]
argument-hint: 'Target file and shorthand edit markers, or a request beginning with UPDATE CODE FROM SHORTHAND'
description: 'Use this prompt to convert user-provided shorthand, pseudocode, or natural-language instructions into valid code or data within explicitly marked regions of a target file. Follow repository policy and the detailed rules in this instruction to ensure safe, accurate, and maintainable updates that preserve user intent and existing behavior.'
---

# Update Code from Shorthand

Use this prompt only when the user explicitly asks to update code from
shorthand, or when the request begins with:

```text
UPDATE CODE FROM SHORTHAND
```

The shorthand update request is: **$input**

## Goal

Convert shorthand, pseudocode, natural-language notes, or sketch-like
instructions inside explicit edit markers into valid code or valid data for the
target file.

Preserve user intent, repository conventions, file style, and existing
behavior. Keep edits limited to the marked region unless the user explicitly
asks for broader changes.

## Required inputs

Before editing, identify:

- target file path
- file type or extension
- opening shorthand marker
- closing shorthand marker
- the shorthand content between the markers
- whether the target is code, JSON, XML, Markdown, config, or another data
  format

Default marker pattern:

```text
<language comment> start-shorthand
...
<language comment> end-shorthand
```

Examples:

```ts
// start-shorthand
()=> create a helper that formats labels safely
// end-shorthand
```

```css
/* start-shorthand */
()=> add responsive spacing for small screens
/* end-shorthand */
```

If the target file, marker pair, or shorthand region is missing or ambiguous,
stop and report the issue before editing.

## Marker rules

- Require exactly one matching start marker and end marker for each edit region
  unless the user explicitly asks to process multiple regions.
- If markers are missing, duplicated, nested, or out of order, do not guess.
  Report the problem.
- Replace only the marked shorthand region.
- Remove the start and end marker lines after replacement.
- Do not leave shorthand syntax such as `()=>` in the final file unless it is
  valid code intentionally required by the target language.
- Do not remove ordinary `NOTE:` comments unless the marked shorthand explicitly
  says that specific comment should be removed.

## Scope rules

- Follow `AGENTS.md` and repository policy first.
- Keep edits minimal and task-focused.
- Do not edit unrelated files unless the shorthand explicitly requires it.
- Do not add new dependencies, new files, new architecture, new commands, or
  new workflows unless explicitly requested.
- Do not invent features beyond what the shorthand reasonably implies.
- Preserve existing imports, exports, naming, formatting, and nearby style where
  possible.
- Prefer clearer code over extra comments.

## Code conversion rules

When converting shorthand to code:

- infer the smallest valid implementation that satisfies the shorthand
- use the target file's language and existing style
- preserve existing behavior outside the edit region
- add imports only when necessary
- remove unused imports created by the edit
- use existing utilities and patterns before creating new ones
- prefer readable names and simple control flow
- include comments only for non-obvious rationale, constraints, or gotchas

## Data-file rules

When the target is JSON, XML, YAML, Markdown, or another data/config format:

- preserve the existing schema and structure
- produce valid syntax for the file type
- keep ordering consistent with nearby entries where practical
- do not convert data changes into executable code
- do not add unsupported fields or invented configuration keys
- validate parseability where possible

## Safety and quality guardrails

Do not:

- silently apply ambiguous shorthand
- delete unrelated code or comments
- patch generated build artifacts instead of source files
- weaken linting, tests, type checks, validation, or security rules
- hardcode secrets, tokens, credentials, or private data
- claim validation passed unless it actually ran and passed

If the shorthand asks for unsafe, destructive, or policy-weakening changes, stop
and explain the issue. Provide a safer alternative when possible.

## Workflow

1. Confirm the request is an explicit shorthand update request.
1. Locate the target file and marker pair.
1. Read the surrounding code or data context.
1. Interpret the shorthand into a minimal implementation plan.
1. Replace the marked region with valid code or data.
1. Remove shorthand markers.
1. Check for syntax, imports, formatting, and obvious integration issues.
1. Run or recommend relevant validation.
1. Report exactly what changed and what was validated.

## Validation

Use the narrowest relevant validation for the changed file.

Recommended repository checks may include:

- `pnpm lint`
- `pnpm test -- --passWithNoTests`
- `pnpm build`
- `pnpm build-storybook` when Storybook-facing behavior is affected
- `pnpm test:e2e` when e2e/browser behavior is affected

For data files, also check parseability where possible.

If validation cannot be run, say so clearly and note the remaining risk.

## Output format

Return:

1. Summary
   - target file
   - shorthand region processed
   - type of change made

1. Changes made
   - what the shorthand was converted into
   - any assumptions made
   - any related imports, exports, or data structure changes

1. Validation
   - commands or checks run
   - results
   - checks not run and why

1. Residual risks
   - ambiguous shorthand
   - unverified behavior
   - follow-up needed
