---
description: 'This file describes the Markdown rules for the project. Follow these guidelines when creating or editing Markdown files to maintain consistency, readability, and accessibility across the documentation. These rules cover formatting, technical content, accessibility considerations, and special cases for generated or blog content. Adhering to these standards will help ensure that the Markdown files are clear, well-structured, and easy to navigate for all contributors and readers.'
applyTo: '**/*.md'
---

# Markdown rules

Use these rules when creating or editing Markdown files.

## Scope

- Keep Markdown edits minimal and task-focused.
- Do not reformat or rewrite unrelated sections.
- Do not apply blog, localization, accessibility-audit, or policy workflows
  unless the task explicitly asks for them.
- Do not add Markdown linting to ESLint or widen the repository lint gate.
- Prettier owns Markdown formatting.
- For `AGENTS.md`, `.github/copilot-instructions.md`,
  `.github/instructions/*.instructions.md`, `.github/prompts/*.prompt.md`, and
  skill files, follow their more specific rules first.

## Markdown format

- Use GitHub Flavored Markdown conventions.
- Use ATX headings: `#`, `##`, `###`.
- Keep heading levels logical. Do not skip levels.
- Use real headings for section labels. Do not use standalone bold text as a
  pseudo-heading.
- Use fenced code blocks with a language identifier when the language is known.
- If a fence is only illustrative and no better language applies, use `text`
  rather than leaving the fence bare.
- Use normal Markdown links: `[descriptive text](target)`.
- Use Markdown lists for list content, not emoji or plain-text pseudo-lists.
- Use GFM tables only when tabular data is clearer than bullets.
- Use spaced GFM table pipes such as `| Column | Value |`, not compact pipe
  tables.
- Preserve frontmatter when it already exists.
- Leave final formatting to Prettier where possible. Avoid manual whitespace
  churn, but keep blank lines around headings, lists, tables, and fenced code
  blocks so Markdown renders predictably.
- In prose, prefer inline code spans like `` `div` `` over raw HTML tags like
  `<div>` when you only need to name an element rather than render one.

## Accessibility

- Use descriptive link text. Avoid “click here,” “here,” “this,” “read more,”
  or bare URLs in prose.
- Give images meaningful alt text unless they are explicitly decorative.
- Do not use emoji as the only way to convey meaning.
- Do not use bold text as a fake heading.
- Keep paragraphs readable and break up dense content where it improves
  comprehension.
- Suggest alt text or plain-language changes as recommendations when
  visual/contextual judgment is required.

## Technical content

Do not change the meaning of:

- code blocks
- inline code
- commands
- file paths
- package names
- import paths
- variables
- placeholders
- URLs
- Markdown anchors

## Blog or generated-content rules

Do not require blog-specific frontmatter fields globally.

If a file lives in a known blog/content path and that path has its own
frontmatter rules, follow the path-specific instruction for that folder
instead.

## Localization

Do not localize Markdown from this instruction.

Use `.github/prompts/localize-markdown.prompt.md` only when the user
explicitly requests localization.

## Validation

Before finishing a Markdown change:

- confirm the requested content changed and unrelated content was not rewritten
- confirm links still resolve or flag any unverified links
- confirm code fences, tables, and lists still render correctly
- if the task is about Markdown diagnostics, run a targeted markdownlint check
  on the touched file when feasible, or clearly report why it was skipped
  using the repository's focused Markdown lint rules for fenced code blocks and
  table formatting
- if you are changing repo-quality behavior, remember that `pnpm lint` now
  includes the targeted markdownlint check as part of the existing quality
  workflow
- confirm accessibility-sensitive text, links, and image alt text were handled
  intentionally
- if validation could not be run, say so clearly
