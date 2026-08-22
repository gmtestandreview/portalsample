---
agent: 'agent'
description: 'Localize selected Markdown documents into a target locale while preserving
  structure, code, links, and repository policy.'
argument-hint: 'Target locale, source files or folders, output location, exclusions, and
	overwrite behavior for Markdown localization.'
---

# Localize Markdown Documents

Use this prompt only when the user explicitly requests Markdown localization.

Do not use this prompt for routine documentation edits, README updates,
instruction-file edits, prompt edits, or repository policy changes unless the
user explicitly asks to localize those files.

The localization request is: **$input**

## Goal

Localize selected Markdown documents into the requested locale while preserving
the original document structure, technical accuracy, links, code examples, and
repository conventions.

## Required inputs

Before localizing, identify:

- target locale, for example `fr-ca`, `ja-jp`, `ko-kr`, `pt-br`, or `zh-cn`
- source files or folders to localize
- output location
- files or folders to exclude
- whether existing localized files should be overwritten, updated, or left
  unchanged

If the target locale or source scope is missing, ask for the missing information
before creating files.

## Locale rules

- Use lowercase language-region format, for example `fr-ca`.
- Use ISO 639-1 language codes and ISO 3166 region codes where applicable.
- Preserve the requested locale exactly in output paths unless the user asks for
  normalization.

## Default output location

Unless the user specifies another location, write localized files under:

```text
localization/<locale>/
```

Preserve the relative source structure where practical.

Example:

```text
docs/setup.md
```

becomes:

```text
localization/fr-ca/docs/setup.md
```

## Scope control

- Localize only the files in the requested scope.
- Do not search for and localize every Markdown file unless the user explicitly
  asks for full-repo localization.
- Do not localize generated files, tracking artifacts, build output, dependency
  folders, or repository policy files unless explicitly requested.
- Do not change source documents unless the user explicitly asks.

Common exclusions unless explicitly requested:

```text
node_modules/
.next/
dist/
out/
coverage/
storybook-static/
playwright-report/
test-results/
.copilot-tracking/
.github/instructions/
.github/prompts/
.github/skills/
AGENTS.md
CODE_REVIEW.md
```

## Preserve technical content

Translate prose, headings, labels, and explanatory text.

Do not translate unless explicitly requested:

- fenced code blocks
- inline code
- commands
- package names
- file paths
- URLs
- import paths
- component names
- variable names
- placeholders such as `{{locale}}`, `${value}`, `%VALUE%`, or `<PLACEHOLDER>`
- frontmatter keys
- Markdown anchor IDs
- HTML attributes
- configuration snippets
- API names
- product names where translation would reduce clarity

If a code comment or code-adjacent note is user-facing prose, translate it only
when doing so will not break the example.

## Markdown structure rules

Preserve the original structure:

- frontmatter
- heading hierarchy
- paragraph order
- list nesting
- tables
- blockquotes
- admonitions
- code fences and language tags
- HTML blocks
- comments when relevant
- footnotes
- reference-style links
- image syntax

Do not remove sections or paragraphs.

Do not rely on line count alone to prove completeness. Translation may change
wrapping and line counts.

## Link handling

For each localized file:

- keep external links unchanged
- keep image links pointing to the original asset unless a localized asset
  exists or the user asks otherwise
- rewrite relative links to Markdown documents so they point to the localized
  version when that localized target exists or is being created
- preserve anchor links when possible
- verify relative paths from the localized file location
- if a localized link target does not exist, either keep the original link or
  flag it as a validation gap

Do not invent localized files only to satisfy links unless the user asked to
localize those files.

## Disclaimer

Append a localized disclaimer to each localized document unless the user asks
not to.

The disclaimer should preserve this meaning:

```markdown
---

**DISCLAIMER**: This document was localized by GitHub Copilot and may contain
mistakes. If you find an inappropriate or incorrect translation, please create
an issue.
```

The issue link must resolve correctly from the localized document location. Do
not hardcode `../../issues` if the localized document is nested more deeply.
Calculate or preserve a correct relative link to the repository issues page
where possible.

## Localization quality

- Preserve the meaning and tone of the source.
- Use natural, locale-appropriate technical language.
- Keep terminology consistent across files.
- Prefer clear technical accuracy over literal translation.
- Keep headings concise.
- Preserve accessibility-relevant text, such as alt text, accurately.
- Flag ambiguous source text instead of inventing meaning.

## Completeness check

After localization, compare each localized file against its source.

Check:

- every source heading is represented
- every paragraph or content block is represented
- every list item is represented
- every table row and column is represented
- every code block is preserved
- every image is preserved
- every internal link was handled intentionally
- disclaimer is present when required

If something cannot be verified, report it as a validation gap.

## Output format

Return:

1. Summary
   - target locale
   - source scope
   - output location
   - number of files localized

1. Files created or updated
   - source file
   - localized file
   - notes about link handling or skipped content

1. Exclusions
   - files or folders intentionally skipped
   - reason for skipping

1. Validation
   - structure comparison result
   - link handling result
   - disclaimer status
   - unresolved issues or validation gaps

1. Residual risks
   - ambiguous terminology
   - unverified links
   - files needing human translation review
