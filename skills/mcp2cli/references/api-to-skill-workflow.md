# Generating a skill from an API

Load this only when asked to turn an MCP server, OpenAPI spec, or GraphQL endpoint into a new, reusable Agent Skill in this repo (not for a one-off CLI call — see `SKILL.md`'s core workflow for that).

This composes with the `writing-skills` skill: `writing-skills` governs the `SKILL.md` you end up writing (frontmatter, name-matches-folder, progressive disclosure); this file governs the mcp2cli-specific steps that come before it.

## 1. Discover

```bash
uvx mcp2cli --mcp https://target.example.com/sse --list
```

## 2. Inspect each command

```bash
uvx mcp2cli --mcp https://target.example.com/sse <command> --help
```

## 3. Test key commands and probe edge cases

```bash
uvx mcp2cli --mcp https://target.example.com/sse <command> --param value
```

Specifically test for, and write down what you find — this is the material that goes in the skill's "Gotchas" section, because it's exactly what `--help` output does not tell you:

- **Large responses** — `--head 3` to preview. Any field produce oversized output (geo_shape, embedded blobs)?
- **Date/time formats** — ISO 8601? Unix timestamps? A custom syntax?
- **Pagination** — does the API return everything, or does it need `--offset`/`--limit`?
- **Error messages** — informative on invalid parameters, or opaque?
- **Binary vs. text** — any endpoint return non-JSON (xlsx, parquet, images)? Binary formats must not be piped through text encoding — use `--raw > output.ext`.
- **Scope confusion** — does the data contain more than expected (e.g. national data when regional was expected)?

## 4. Bake the connection

```bash
uvx mcp2cli bake create <name> \
  --mcp https://target.example.com/sse \
  --auth-header "Authorization:env:<NAME>_TOKEN" \
  --exclude "delete-*" --methods GET,POST
```

## 5. Install the wrapper into the new skill's scripts/

```bash
uvx mcp2cli bake install <name> --dir .claude/skills/<name>/scripts/
```

## 6. Write the SKILL.md

Hand off to the `writing-skills` skill for the authoring conventions (frontmatter, RED/GREEN evidence, progressive disclosure, and the scaffolding checklist that registers the new skill in `CLAUDE.md`, `AGENTS.md`, and `using-a-team`'s trigger table).

The content itself should go beyond `--help` output — the "Knowledge Delta Principle": document what actually matters for common tasks, default behaviors that surprise, parameter combinations that don't work, and rate limits/response-size limits found in step 3. Do not re-list every flag `--help` already prints.

Structure to cover, matching this skill's own shape:

- **Core workflow** — `${CLAUDE_SKILL_DIR}/scripts/<name> --list` / `<command> --help` / `<command> --param value --pretty`
- **Before Querying checklist** — target dataset, pagination needed?, oversized fields to `--head`?, date/filter format?
- **Gotchas** — everything found in step 3
- **Output processing** — `--pretty`, `--head`, piping to `jq`
- **Export formats**, if the API supports more than JSON — which are text-safe vs. binary

The baked wrapper script is the skill's execution layer; the `SKILL.md` stays a thin operational guide on top of it, not a restatement of the API's own docs.
