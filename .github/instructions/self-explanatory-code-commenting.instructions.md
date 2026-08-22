---
description: 'Repository rules for creating, editing, or validating comments in JavaScript and TypeScript source and test files. Use these rules with the add-educational-comments skill to keep comments durable, non-redundant, syntax-safe, and aligned with repository conventions.'
applyTo: 'components/**/*.{ts,tsx,js,jsx},pages/**/*.{ts,tsx,js,jsx},src/**/*.{ts,tsx,js,jsx},e2e/**/*.spec.ts,scripts/**/*.{js,mjs,cjs,ts,mts,cts}'
---

# Self-Explanatory Code Commenting Rules

Use these rules when creating, editing, or validating comments in this repository's JavaScript and TypeScript source or test files.

These instructions complement the `add-educational-comments` skill. The skill controls educational-commenting workflow, safety, backups, note numbering, validation, and reporting. This file provides repository-specific comment-quality rules.

## Primary Principle

Prefer self-explanatory code over explanatory comments.

Use clear names, small functions, direct control flow, and simple structure before adding comments. When the user has not explicitly requested educational inline comments, do not add comments just to explain code that can be made clearer by naming or structure.

When the user explicitly asks for educational comments, add comments only where they create durable learning value. Keep them concise, accurate, and tied to non-obvious code, constraints, or reasoning.

## Comment Modes

### Production maintainability comments

Use production comments for future maintainers. They should explain:

- why the code exists
- business rules or policy rationale
- accessibility or AGDS integration constraints
- browser, framework, runtime, or API gotchas
- security-sensitive reasoning
- performance-sensitive tradeoffs
- non-obvious algorithms or regex intent
- test setup that is not obvious from the test name
- public API behavior or contract
- temporary workarounds with a removal condition

Production comments should not use educational note numbering unless the user explicitly requested it and the output is an annotated learning copy.

### Educational comments

Use educational comments only when the user requests learning-oriented inline comments, annotations, or code explanation in the file.

Educational comments should:

- explain why a line or block matters
- connect syntax or patterns to the learner's configured level
- avoid restating obvious code
- avoid comment spam
- preserve runnable behavior
- follow the skill's note-numbering setting
- prefer an annotated copy over in-place production edits unless the user requested in-place changes

If repository style conflicts with a requested educational format, preserve repository safety and explain the tradeoff in the final report.

## Avoid

Do not add or retain:

- obvious comments
- comments that merely restate the code
- comments that duplicate nearby names or types
- outdated comments
- commented-out dead code
- decorative divider comments
- changelog comments such as who changed what and when
- broad TODOs without a clear reason or next action
- educational note numbers in production code unless explicitly requested
- comments that reveal secrets, tokens, credentials, or private implementation details

## TODO-Style Annotations

Use `TODO`, `FIXME`, `HACK`, `SECURITY`, `PERF`, and `DEPRECATED` sparingly.

When adding one, include enough context for a future maintainer to act:

```ts
// TODO: Remove this fallback after the Storybook 10 migration is complete.
```

Avoid vague annotations:

```ts
// TODO: Fix later.
```

A valid annotation should usually include at least one of:

- the condition for removal
- the reason the workaround exists
- the risk being tracked
- the owner, ticket, or source of truth when available
- the next concrete action

Do not convert educational comments into TODO-style annotations unless the user asked for maintainability work.

## JavaScript and TypeScript Gotchas

Before adding comments to JS, TS, JSX, or TSX:

- avoid inserting comments inside import/export declarations
- avoid breaking decorators, chained calls, object literals, generic type syntax, JSX attributes, or JSX expressions
- avoid comments inside template literals or regular expressions
- avoid changing public API documentation semantics
- avoid comments that confuse lint rules or formatters
- preserve existing JSDoc/TSDoc structure and tags
- do not add comments to generated, bundled, minified, vendored, or sourcemap-related files

Use `//` for short comments. Use `/** ... */` only for public API documentation or when matching existing JSDoc/TSDoc style. Avoid block comments when a line comment is safer.

## When to Refactor vs Comment

If code is unclear and the user did not request comment-only work, prefer a small clarity refactor over adding explanatory comments.

If the active task is governed by `add-educational-comments`, keep edits comment-only unless the user explicitly authorizes code changes. You may suggest a refactor in the final report, but do not perform it as part of educational commenting.

## Validation

Before finishing:

- confirm comments still match the code
- confirm comments explain useful context, constraints, or learning value
- remove comments that only describe obvious code
- preserve public API and non-obvious test comments unless their purpose is clearly obsolete
- avoid TODOs without clear context or next action
- verify referenced tickets, issues, and external docs when safe and available
- confirm no executable statements, string literals, data values, imports, exports, or types were changed unless separately authorized
- follow the skill's static-first validation hierarchy

For JS/TS files, prefer the smallest safe available checks:

1. inspect the diff first
2. run formatter/linter checks only if project-standard and non-mutating
3. run typecheck only if available and non-mutating
4. run focused tests only when local, relevant, and safe
5. ask before running broad, slow, networked, credentialed, state-mutating, or deployment-related commands

## Review Checklist

Before completing the task:

- [ ] The file still matches the user's requested mode: production maintainability comments or educational comments.
- [ ] Comments explain why, constraints, gotchas, policy, accessibility, security, algorithms, regexes, public APIs, or non-obvious tests.
- [ ] Obvious, stale, decorative, or duplicate comments were not added.
- [ ] Existing valuable public API, security, accessibility, test, or workaround comments were preserved unless clearly obsolete.
- [ ] TODO-style annotations include a reason and next action or removal condition.
- [ ] JS/TS/JSX/TSX syntax-sensitive locations were not broken.
- [ ] Generated, bundled, minified, vendored, or sourcemap-related files were not directly edited.
- [ ] Educational note numbering was used only when requested by the skill configuration.
- [ ] Validation and caveats are reported according to the active skill's final report template.
