---
name: mcp2cli
description: Turn any MCP server, OpenAPI spec, or GraphQL endpoint into an ad-hoc CLI at runtime, no codegen. Use when asked to call an MCP server, REST/OpenAPI API, or GraphQL API from a shell (not from inside a Claude Code chat that already has that server wired up as a native tool), to discover a server's available tools/endpoints from bash, or to generate a new Agent Skill from an API. Triggers include "mcp2cli", "call this MCP server from the CLI", "hit this API from bash", "list tools from <server>", "bake a tool for <API>", "generate a skill from this OpenAPI/GraphQL spec".
---

# mcp2cli

CLI wrapper that turns an MCP server, OpenAPI spec, or GraphQL endpoint into runnable subcommands — no client code, no generated SDK.

## When to use this vs. calling the tool directly

This repo already wires `github`, `react-aria`, `sonarqube`, `my-storybook-mcp-server`, `typescript-mcp`, and `playwright` as native MCP servers (`.mcp.json`, `.codex/config.toml`, `.vscode/mcp.json`) with direct tool-calling (`mcp__github__*`, `mcp__react-aria__*`, etc.).

**Inside a Claude Code session with those tools available, call them directly.** Don't shell out through `mcp2cli` to a server you already have a native tool for — it costs a subprocess, loses the permission scoping `.claude/settings.json` already grants per-tool, and adds nothing.

Reach for `mcp2cli` when:

- You're in **Codex CLI or GitHub Copilot chat**, which don't expose these MCP servers as native chat tools — `mcp2cli` is the way to call them from a shell command instead.
- You need an **OpenAPI or GraphQL source with no MCP server at all**.
- You're **scripting/automating outside a chat session** (a shell script, a CI step).
- You're **generating a new Agent Skill from an API** (see below).

## Install

Nothing to install ahead of time — `uv` is present on this machine and `uvx` fetches mcp2cli on first run:

```bash
uvx mcp2cli --version   # confirmed working here: mcp2cli 3.7.0
```

## Core workflow

1. **Connect** to a source: `--mcp <url>` (HTTP/SSE), `--mcp-stdio "<command>"` (stdio), `--spec <openapi-url-or-file>`, or `--graphql <url>`.
2. **Discover**: `--list` (add `--search <pattern>` to filter, `--compact` for a token-minimal name-only listing).
3. **Inspect**: `<command> --help`.
4. **Execute**: `<command> --flag value`.

```bash
# This repo's react-aria MCP server, from a shell (verified working)
uvx mcp2cli --mcp-stdio "npx @react-aria/mcp@latest" --list

uvx mcp2cli --mcp-stdio "npx @react-aria/mcp@latest" get-react-aria-page --page button

# An OpenAPI spec
uvx mcp2cli --spec https://petstore3.swagger.io/api/v3/openapi.json --list

# A GraphQL endpoint
uvx mcp2cli --graphql https://api.example.com/graphql users --limit 10
```

## Authentication — always env:/file:, never a literal secret

```bash
uvx mcp2cli --spec ./spec.json --auth-header "Authorization:env:API_TOKEN" list-items
uvx mcp2cli --mcp https://mcp.example.com/sse --auth-header "x-api-key:file:/run/secrets/api_key" search --query test
```

A literal token on the command line lands in shell history and process listings. This mirrors how `scripts/github-mcp-server.cmd` already sources `GH_PERSONAL_ACCESS_TOKEN`/`GITHUB_PERSONAL_ACCESS_TOKEN` from the environment rather than a hardcoded value.

## Persistent sessions (stdio servers)

Every `--mcp-stdio` call spawns a fresh subprocess. For repeated calls against the same stdio server, start a session daemon once and route calls through it:

```bash
uvx mcp2cli --mcp-stdio "npx @react-aria/mcp@latest" --session-start react-aria
uvx mcp2cli --session react-aria --list
uvx mcp2cli --session react-aria get-react-aria-page --page button
uvx mcp2cli --session-list
uvx mcp2cli --session-stop react-aria
```

## Bake mode — saved connections

Save connection settings once, reuse with `@name`:

```bash
uvx mcp2cli bake create react-aria --mcp-stdio "npx @react-aria/mcp@latest"
uvx mcp2cli @react-aria --list
uvx mcp2cli bake list
uvx mcp2cli bake show react-aria      # secrets masked
uvx mcp2cli bake install react-aria   # wrapper script; --dir to target a skill's scripts/
```

## Output shaping (token efficiency)

- `--compact` — space-separated tool names only (~2 tokens/tool) for a first pass over a large server.
- `--top N` / `--sort {usage,recent,alpha,default}` — narrow `--list` to the tools that matter.
- `--head N` — truncate a large array/text result.
- `--toon` — Token-Oriented Object Notation instead of JSON for large uniform arrays (needs `@toon-format/cli`).
- `--pretty` / `--raw` / `--json` — JSON formatting controls; `--json` forces a valid-JSON envelope for every command, including `--list`.

## Generating a new skill from an API

When asked to turn an MCP server, OpenAPI spec, or GraphQL endpoint into a reusable skill for this repo, follow `references/api-to-skill-workflow.md` — it walks discovery → testing edge cases → baking → installing the wrapper into `.claude/skills/<name>/scripts/` → writing the `SKILL.md` (per the `writing-skills` skill's conventions, not a copy of `--help` output).

## Full flag reference

`references/cli-reference.md` has the complete, version-verified (`mcp2cli 3.7.0`) flag list — OAuth, resources/prompts, transport selection, caching. Load it only when a flag isn't covered above.

## Gotchas

- `--toon` requires `@toon-format/cli` installed separately (`npm install -g @toon-format/cli`) — it is not bundled.
- `--json` takes precedence over both `--raw` and `--toon` if combined.
- `bake show` masks secrets in its own output, but the underlying config file (`~/.config/mcp2cli/baked.json`) is plaintext on disk — treat it accordingly.
- Specs and MCP tool lists are cached for 1h by default (`~/.cache/mcp2cli/`); local spec files are never cached. Use `--refresh` if a source changed and results look stale.
