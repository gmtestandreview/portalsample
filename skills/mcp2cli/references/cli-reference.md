# mcp2cli CLI reference (verified against mcp2cli 3.7.0)

Captured from `uvx mcp2cli --help`, `uvx mcp2cli bake --help`, `uvx mcp2cli bake create --help`, and `uvx mcp2cli bake install --help` run in this repo. Re-verify if the installed version drifts (`uvx mcp2cli --version`).

## Source (mutually exclusive, one required)

| Flag | Meaning |
|---|---|
| `--spec SPEC` | OpenAPI spec URL or file path |
| `--mcp MCP` | MCP server URL (HTTP/SSE) |
| `--mcp-stdio CMD` | MCP server command (stdio) |
| `--graphql URL` | GraphQL endpoint URL |

## Discovery / output

| Flag | Meaning |
|---|---|
| `--list` | List available subcommands |
| `--search PATTERN` | Case-insensitive substring match on name/description |
| `--verbose` | Full tool descriptions in `--list`, wrapped to terminal width |
| `--sort {usage,recent,alpha,default}` | `usage`=call frequency, `recent`=last-used, `alpha`, `default`=insertion order. Defaults to `usage` if usage data exists, else `default`. |
| `--top N` | Only the top N tools in `--list` |
| `--compact` | Space-separated tool names only, no descriptions (~2 tokens/tool) |
| `--pretty` | Pretty-print JSON |
| `--raw` | Print raw response body |
| `--json` | Force valid JSON for every command (`--list` → JSON array; MCP calls → full envelope incl. `structuredContent`/`isError`). Takes precedence over `--raw` and `--toon`. |
| `--toon` | TOON encoding instead of JSON — 40-60% fewer tokens for uniform arrays, 15-20% for semi-uniform. Requires `@toon-format/cli` (`npm install -g @toon-format/cli`), not bundled. |
| `--head N` | First N records (arrays) or N lines (text) |
| `--fields FIELDS` | Override auto-generated GraphQL selection set (e.g. `'id name email'`) |

## Auth

| Flag | Meaning |
|---|---|
| `--auth-header NAME:VALUE` | Repeatable. Value supports `env:VAR` and `file:/path` prefixes — never pass a literal secret |
| `--base-url URL` | Override base URL from spec |

## OAuth (MCP HTTP only)

| Flag | Meaning |
|---|---|
| `--oauth` | Authorization code + PKCE flow |
| `--oauth-client-id` / `--oauth-client-secret` | Support `env:VAR` / `file:/path` prefixes |
| `--oauth-client-name` | Client name sent during Dynamic Client Registration (default `mcp2cli`); some servers require a specific name |
| `--oauth-scope SCOPE` | Scope(s) to request |
| `--oauth-redirect-uri URI` | Overrides the default `http://127.0.0.1:<random-port>/callback` |
| `--oauth-flow {auto,authorization_code,client_credentials}` | `auto` picks `client_credentials` when both client-id and client-secret are set, else `authorization_code`. Force `authorization_code` for confidential-client servers (e.g. Slack) that still need PKCE. |
| `--oauth-manual-callback` | No local callback server — print the auth URL, read the redirect URL from stdin. For headless hosts (VPS over SSH). |

Tokens cache in `~/.cache/mcp2cli/oauth/` and refresh automatically.

## MCP-specific

| Flag | Meaning |
|---|---|
| `--transport {auto,sse,streamable}` | `auto` tries streamable then SSE; `sse`/`streamable` skip the fallback |
| `--env KEY=VALUE` | Env var for the stdio server process (repeatable) |
| `--root PATH\|FILE_URI` | Expose a filesystem path/URI to the server (repeatable); workspace-scoped servers request these via `roots/list` |
| `--complete REF:ARG=PREFIX` | Complete a prompt/resource-template argument, e.g. `--complete 'my-prompt:city=San'`. REF is a prompt name, or a resource URI template if it contains `://` |
| `--list-resources` / `--list-resource-templates` / `--read-resource URI` | Resource discovery/read |
| `--list-prompts` / `--get-prompt NAME` / `--prompt-arg KEY=VALUE` | Prompt discovery/get (repeatable `--prompt-arg`) |

## Sessions (persistent stdio connections)

| Flag | Meaning |
|---|---|
| `--session-start NAME` | Start a persistent daemon (requires `--mcp` or `--mcp-stdio`) |
| `--session NAME` | Route a command through an existing session |
| `--session-stop NAME` | Stop a named session |
| `--session-list` | List active sessions with PID/alive status |

## Caching

| Flag | Meaning |
|---|---|
| `--cache-key KEY` | Custom cache key |
| `--cache-ttl SECONDS` | Cache TTL (default 3600) |
| `--refresh` | Bypass cache |

Specs and MCP tool lists cache in `~/.cache/mcp2cli/`; local spec files are never cached.

## `bake` subcommands

```
mcp2cli bake create NAME [source flags] [--include GLOB] [--exclude GLOB] [--methods GET,POST] [--description TEXT] [--force]
mcp2cli bake list
mcp2cli bake show NAME       # secrets masked in output; underlying ~/.config/mcp2cli/baked.json is plaintext
mcp2cli bake update NAME [...]
mcp2cli bake remove NAME
mcp2cli bake install NAME [--dir DIR]   # default ~/.local/bin; pass --dir to target a skill's scripts/
```

`bake create` accepts every source, auth, transport, env, cache-ttl, and OAuth flag from the top-level command, plus `--include`/`--exclude` (comma-separated globs) and `--methods` (comma-separated HTTP methods, OpenAPI only) as filters, and `--description`/`--force`.

Run a baked tool with `mcp2cli @NAME [args]`.
