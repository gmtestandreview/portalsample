---
name: add-educational-comments
description: >
  Use this skill when the user asks to add educational inline comments to source code
  or comment-capable configuration files for learning. Adapt explanations to beginner,
  intermediate, or advanced learner levels while preserving encoding, line endings,
  indentation, syntax, and runnable behavior. If no target file is provided, ask the
  user to provide one or choose from close matches.
compatibility: >
  Requires file read/write capability. Validation commands require the relevant local
  toolchain; network access is used only for permitted Fetch List references.
---

## Related Artifacts

- Agent: `.github/agents/educational-code-commenting-agent/educational-code-commenting.agent.md`
- Prompt: `.github/prompts/educational-code-commenting.prompt.md`
- Instructions:
  - `.github/instructions/educational-code-commenting-agent.instructions.md`
  - `.github/instructions/self-explanatory-code-commenting.instructions.md`

## Project Commenting Instructions

Before editing files, check for applicable repository comment-policy files such as
`*.instructions.md`, `.github/instructions/*.md`, or project style guides.

If project instructions exist, apply them as repository-specific constraints unless
they conflict with safety, explicit user instructions, or this skill's core
comment-only preservation rules.

For production files, project commenting style overrides generic examples.
For educational annotated copies, preserve the user's configured educational format
while reporting any style tradeoffs.

# Add Educational Comments

Add educational comments to source code and comment-capable configuration files so they become effective learning resources. Keep edits comment-only unless using an approved sidecar notes file.

## Core Objective

1. Add concise educational comments aligned with the user's configuration.
2. Preserve encoding, line endings, indentation, syntax, semantics, and runnable behavior.
3. Prefer high-value comments over line-count targets. Do not pad comments.
4. Avoid direct inline edits to unsafe, generated, binary, secret-bearing, or comment-hostile files.
5. Validate and report the result with evidence.

## Activation Boundaries

Use this skill for requests such as:

- "Add beginner-friendly comments to this Python file."
- "Annotate this source code so I can learn it."
- "Add educational inline comments to this script."
- "Explain this configuration by adding comments where valid."

Do not use this skill for requests that only ask to review comments, write documentation, explain code in chat, add TODO comments, format code, code review, refactor code, or generate new code. Offer a more appropriate response instead.

## Configuration Defaults

- File Name: required
- Comment Detail = 2
- Repetitiveness = 2
- Educational Nature = Computer Science
- User Knowledge = 2
- Educational Level = 1
- Line Number Referencing = yes
- Nest Comments = yes
- Fetch List:
  - <https://peps.python.org/pep-0263/>

Interpret obvious typos only when the intended setting is clear, such as `Line Numer = no` as `Line Number Referencing = no`. Ask for clarification when a typo changes meaning.

## Operational Parameter Rules

### Comment Detail

- `1`: short comments; explain the immediate purpose or one key concept.
- `2`: moderate comments; explain purpose plus the most useful reason, pitfall, or pattern.
- `3`: deeper comments; include tradeoffs, lifecycle, runtime, architecture, or framework context when useful.

Higher detail means deeper comments, not more comments.

### Repetitiveness

- `1`: explain a concept once unless a later use is meaningfully different.
- `2`: reinforce important concepts at first use and at one or two important variations.
- `3`: reinforce recurring concepts more often, but vary the wording and avoid copy-paste comments.

Repetition must improve learning.

### Educational Level

- `1`: beginner in this language/framework; define core syntax, lifecycle, naming, and beginner pitfalls.
- `2`: intermediate; focus on idioms, maintainability, debugging clues, conventions, and practical tradeoffs.
- `3`: advanced; focus on internals, performance, architecture, concurrency, security boundaries, extensibility, and edge cases.

If `User Knowledge` and `Educational Level` differ, prioritize `Educational Level` for language/framework explanations and `User Knowledge` for general CS explanations.

## File Safety Rules

Before editing, classify each target as supported, conditional, or unsupported.

Direct inline commenting is usually allowed for source files and comment-capable configuration files with known comment syntax.

Do not directly insert comments into JSON, lockfiles, binary files, compiled artifacts, images, archives, minified/bundled files, vendored dependencies, generated files without explicit authorization, secret-bearing files, or exact-format files where comments change semantics.

For unsupported targets, offer sidecar notes such as `<filename>.notes.md`, chat explanations, a redacted/source-format alternative, or a request for safe comment syntax.

Read `references/supported-unsupported-files.md` when classification is uncertain or when a target is JSON, a lockfile, generated, minified, vendored, binary, or secret-bearing.

## Language Detection and Comment Syntax

Detect language and comment syntax before editing using:

1. File extension.
2. Shebang.
3. Existing syntax and comment style.
4. Project configuration.
5. User-provided language hint.

If language or comment syntax remains uncertain, do not guess. Ask for clarification or provide sidecar notes.

Common defaults:

- Python, Ruby, Shell, YAML, Dockerfile, Makefile: `#`
- JS/TS/Java/Kotlin/Go/Rust/Swift/C/C++/C#: `//` for short comments
- SQL: `--`
- HTML/XML: `<!-- -->`
- CSS: `/* */`
- Markdown: prose notes outside fenced code blocks unless direct code-block annotation is requested

Match the file's existing comment style when consistent.

Read `references/comment-syntax-gotchas.md` before editing syntax-sensitive files, including Python with shebangs/encoding cookies/docstrings, YAML, Makefiles, shell scripts, JS/TS/JSX/TSX, SQL, Markdown, Dockerfiles, HTML/XML, TOML, INI, or generated/formatted files.

## Note Numbering Rules

When `Line Number Referencing = yes`:

- Number notes independently per file.
- Start at `Note 1` unless the file already contains educational notes.
- Preserve existing note numbers where practical.
- Continue from the highest existing note number in that file.
- Do not renumber existing notes merely for neatness.
- If duplicate or malformed note numbers exist, preserve what is safe, add new notes with the next unambiguous number, and report the conflict.
- Cross-reference notes only when useful and only within the same file.

When `Line Number Referencing = no`, do not prefix comments with `Note <number>`.

## Comment Density Policy

Use comment density as a quality decision, not a hard line-count target.

- Comment important syntax, control flow, domain concepts, API usage, side effects, invariants, error handling, and design choices.
- Do not comment every line.
- Do not explain obvious syntax for the configured learner level.
- For large files over 1,000 lines, comment representative sections and important gotchas.
- Never add more than 400 educational comment lines without explicit user authorization.
- For previously processed files, refine existing notes instead of expanding volume by default.

Read `references/examples.md` when examples would help calibrate placement, tone, note numbering, or supported/unsupported handling.

## Backup, Diff, and Edit Controls

Before modifying any target file:

1. Determine whether the user requested in-place edits or an annotated copy.
2. Prefer an annotated copy when the user has not explicitly requested in-place modification.
3. For in-place edits, create a backup or snapshot first when possible.
4. If backup creation is unavailable, state this before editing and proceed only when low risk or explicitly authorized.
5. Keep a concise change log: target file, detected language, output mode, comment syntax, comments added/revised, validation performed, skipped files and reasons.

After editing, provide a diff summary or changed-region summary. Do not paste the full diff unless asked.

## Validation Command Safety

Use a strict static-first hierarchy.

1. **No-command checks first:** inspect diff, confirm additions are comments or sidecar prose, confirm no strings/data/executable statements changed, and confirm encoding/EOL/indentation preservation.
2. **Parse-only or syntax-only checks next:** run the smallest non-mutating parser or syntax command for the target file when available.
3. **Compile/typecheck next:** run local compile or typecheck commands only when they are non-deploying, non-mutating, and do not require credentials.
4. **Focused tests last:** run only relevant, local, project-standard tests when they are safe and useful.
5. **Broad test suites require authorization:** do not run broad, slow, networked, credentialed, state-mutating, database-mutating, deployment, install, or production-contacting commands unless explicitly authorized.

Read `references/validation-matrix.md` before selecting validation commands or when the file type has special validation concerns.

## Regression Checks

After adding comments, compare original and annotated versions to prove comments changed explanation only, not behavior.

At minimum, confirm:

- Annotated file still parses or compiles when a safe check is available.
- Line endings, apparent encoding, and indentation style match the original.
- Shebangs, encoding declarations, imports, module declarations, namespaces, pragmas, and license headers remain valid.
- No string literals, data values, secrets, generated markers, or executable statements changed.
- The diff contains no unrelated formatting churn.

Read `references/regression-checks.md` before final validation or whenever validation fails.

## Fetch List Handling

Fetch or inspect listed references only when relevant to the target language, framework, API, encoding, validation, or user-requested source. Prefer official documentation and project-local docs. Do not fetch references merely because they are listed, and do not copy long passages into code comments.

If a reference is unavailable, irrelevant, outdated, or conflicts with project-local behavior, report that in the final summary. Project-local behavior wins over external references.

Read `references/fetch-list-handling.md` when Fetch List is non-empty, when external references are needed, or when a reference is inaccessible or conflicts with local code.

## Workflow

Progress:

- [ ] Confirm target file or files.
- [ ] Resolve ambiguous file matches.
- [ ] Load configuration and defaults.
- [ ] Classify each file and skip unsupported direct edits.
- [ ] Detect language, syntax, encoding, EOL, indentation, and special headers.
- [ ] Load only the references triggered by the current file type or risk.
- [ ] Choose annotated copy, sidecar notes, or authorized in-place edit.
- [ ] Create backup/snapshot before destructive in-place edits when possible.
- [ ] Select high-value comment locations.
- [ ] Add or refine comments according to learner level and density policy.
- [ ] Run static-first validation and regression checks.
- [ ] Review diff for accidental semantic or formatting changes.
- [ ] Report using `assets/final-report-template.md`.

Stop and report instead of editing when language/comment syntax is unknown, direct inline comments are unsupported, required authorization is missing, validation is unavailable for a high-risk edit, or the file contains secrets/binary/generated/exact-format content.

## Reporting

Use `assets/final-report-template.md` for the final response. Keep it concise. Include changed files, skipped files, output mode, backup/snapshot path, configuration, references consulted, validation, regression results, caveats, and a short educational-value summary.

## Progressive Disclosure Policy

Keep this `SKILL.md` under 500 lines and focused on rules needed on every run. Move examples, long validation details, regression details, extended gotchas, and source-handling details into `references/` or `assets/`.

Do not load all references by default. Load only the reference files explicitly triggered by the current file type, validation need, or Fetch List.
