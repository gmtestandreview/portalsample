# Rubric for `add-educational-comments` SKILL.md

Total: 100 points.

| Criterion | Points | Full Credit Requires | Common Failure Modes | Evidence to Inspect |
|---|---:|---|---|---|
| Frontmatter compliance | 10 | Valid YAML frontmatter with spec-compliant `name` and a non-empty description under 1024 characters. | Invalid YAML, missing description, description too vague or too long. | Parse result, description length, frontmatter fields. |
| Activation precision | 10 | Description starts with “Use this skill when...” and names source code, educational inline comments, learner levels, and runnable behavior. | Broad activation, grammar issues, unclear target task. | Frontmatter description. |
| Scope boundaries | 12 | Explicit supported, conditional, and unsupported file categories; covers JSON, binaries, lockfiles, generated, minified, vendored, and secret-bearing files. | Directly comments JSON, secrets, lockfiles, binary/generated files. | Supported/Unsupported section. |
| Quality-first comment policy | 12 | Replaces hard line-count quotas with value-based comment density and anti-spam guidance. | Padding comments, explaining every line, chasing arbitrary ratio. | Comment Density Policy. |
| Language detection | 8 | Requires detection by extension, shebang, syntax, project config, and user hint before editing. | Guesses comment syntax for unknown files. | Language Detection section. |
| Comment syntax selection | 8 | Gives safe defaults and says to match existing style. | Uses wrong comment delimiters or unsafe placements. | Comment Syntax Defaults, Gotchas. |
| Backup and edit controls | 10 | Requires annotated copy or backup/snapshot before destructive in-place edit. | Overwrites original without fallback. | Backup/Diff section. |
| Validation and regression | 15 | Gives concrete validation by file type and regression checks comparing original and annotated behavior. | “Validate” remains vague; no original-vs-output checks. | Validation table, Regression Checks. |
| Parameter operation | 8 | Operationally defines `Comment Detail`, `Repetitiveness`, `Educational Level`, and note numbering. | Numeric settings are subjective or inconsistent. | Operational Parameters and Note Numbering. |
| Fetch List handling | 4 | Defines when to fetch, source priority, inaccessible references, and no source bloat. | Fetches irrelevant sources or fabricates inaccessible content. | Fetch List Handling section. |
| Reporting and checklist | 3 | Includes progress checklist and final report template. | No trackable workflow or final status. | Agent Progress Checklist and Final Report Template. |

Pass threshold: 90/100.
Production threshold: 95/100.
