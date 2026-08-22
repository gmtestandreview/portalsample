# Validation Matrix and Static-First Command Safety

Use this reference before selecting validation commands.

## Safety Hierarchy

1. Diff/static inspection: no commands.
2. Parse-only or syntax-only check for the individual file.
3. Compile/typecheck if non-mutating and local.
4. Focused local tests only when safe and project-standard.
5. Broad test suites only with explicit authorization.

Never run commands that deploy, mutate databases, contact production systems, require credentials, install unapproved dependencies, or perform destructive operations.

## File-Type Checks

| File Type | Preferred Check |
|---|---|
| Python | `python -m py_compile <file>` after preserving shebang/encoding cookie placement. |
| JavaScript | `node --check <file>` for plain JS when applicable; otherwise use existing parser/linter command. |
| TypeScript | Existing `tsc --noEmit` or project typecheck command when safe. |
| YAML | Parse with an available YAML parser; confirm structure unchanged. |
| Shell | `bash -n <file>` or `sh -n <file>` matching shebang. |
| Go | `go test` only when safe; do not run `gofmt -w` unless authorized. |
| Rust | `cargo check` only when local and safe. |
| Java/Kotlin | Existing compile/typecheck task only when safe; avoid broad builds by default. |
| SQL | Dialect-aware parser/formatter if known; otherwise inspect statement boundaries. |
| Dockerfile | Dockerfile linter/parser if available; otherwise inspect instruction boundaries. |
| Makefile | Preserve tabs; use dry-run only when target is known safe. |
| Markdown | Preserve frontmatter/fences; run docs tooling only when project-standard and safe. |
| Unknown | Do not edit directly. |

Record checks as Passed, Failed, or Not run with reasons.
