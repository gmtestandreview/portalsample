# Comment Syntax Gotchas

Use this reference before editing syntax-sensitive files.

## Python

- Preserve shebang as line 1.
- Preserve encoding cookies on line 1 or 2.
- Do not insert comments between a module, class, or function opening and its docstring.
- Avoid comments inside implicit line continuations where placement could be confusing.

## YAML

- Preserve indentation-sensitive mappings, lists, anchors, aliases, document separators, and block scalars.
- Do not insert comments inside block scalars unless the text itself is intended to change.

## Makefiles

- Preserve tabs exactly in recipe lines.
- Place educational comments outside command continuations unless the comment is part of the recipe intentionally.

## Shell

- Preserve shebang as line 1.
- Avoid comments inside continued commands, here-documents, quoted strings, arrays, trap definitions, and command substitutions.

## JavaScript and TypeScript

- Avoid comments inside JSX/TSX expressions, decorators, import/export declarations, object literal shorthand, chained expressions, and sourcemap-related generated code.
- Prefer `//` for short educational notes unless a block comment is safer.

## SQL

- Avoid splitting statements, optimizer hints, dialect-specific syntax, and string literals.
- Use dialect-aware validation when possible.

## Markdown

- Preserve frontmatter and fenced code block boundaries.
- Do not insert inline code comments inside fenced examples unless requested.

## Dockerfiles

- Do not break line continuations with comments.
- Avoid altering instruction order or build-cache semantics.

## HTML/XML

- Avoid comments inside attributes, parser-sensitive regions, scripts, styles, templating delimiters, or conditional comments.

## TOML/INI

- Confirm comments are valid for the dialect.
- Preserve section ordering and keys when tooling depends on order.

## Generated or Formatted Files

If a formatter or generator will remove or rewrite comments, prefer sidecar notes.
