# Gate C-MCP — Storybook MCP Readiness

**Status at 2026-08-27 22:57 AEST: NOT PASSED.** The endpoint is healthy; the tools are
absent from the session that measured it. Step 4 is unmet, so no UI component or
`*.stories.*` file may be changed yet.

| Field | Value |
| --- | --- |
| Server name | `my-storybook-mcp-server` |
| Endpoint | `http://localhost:6006/mcp` |
| Transport | streamable HTTP (`"type": "http"` in `.mcp.json`) |
| Server | `@storybook/addon-mcp` 0.7.0 |
| Agent client | Claude Code (VS Code extension), session `44fb1e2e` |
| Measured at | 2026-08-27 22:57 AEST |
| Commit | `ea0f1c6` |

## Step 1 — Storybook running

Passed. `http://localhost:6006/` returns HTTP 200 and PID 34996 is listening on 6006
(IPv4 and IPv6).

## Step 2 — Endpoint and configured server

Passed, but **the plan's probe command is wrong and must not be used as the gate check.**

The plan runs:

```powershell
Invoke-WebRequest -Uri "http://localhost:6006/mcp" -Headers @{ Accept = "text/html" }
```

A bare GET with `Accept: text/html` is not the MCP protocol. Against a healthy server it
fails — `curl` reports HTTP 000, a connection failure rather than a 404 — so the plan's
check reports a false negative on a working endpoint and would send the reader to restart
things that are already correct.

The endpoint is proven instead with a real `initialize` call:

```bash
curl -s -i -X POST http://localhost:6006/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"probe","version":"1"}}}'
```

Response: `HTTP/1.1 200 OK`, `content-type: text/event-stream`, a `mcp-session-id`, and a
result naming `@storybook/addon-mcp` 0.7.0 with `tools.listChanged` and
`resources.listChanged` capabilities.

Configuration is consistent across every file the gate names — `.mcp.json`, `AGENTS.md`,
`CLAUDE.md` and the umbrella plan all use `my-storybook-mcp-server`, and `.mcp.json` points
at the exact URL above. The three-way name mismatch resolved in `99795e9` has not regressed.

Note: this repository's agent client is Claude Code, not Codex, so the plan's
`codex mcp get` / `codex mcp list` commands do not apply. `.mcp.json` is the equivalent
declaration and is verified above.

## Step 3 — Client refresh required

**This is the outstanding step.** The measuring session was initialised while Storybook was
stopped, so its tool inventory omits the Storybook tools. Confirmed by direct lookup: a
search for `list-all-documentation`, `get-documentation`,
`get-storybook-story-instructions` and `run-story-tests` under the
`my-storybook-mcp-server` prefix returns no matches.

This is the condition the plan anticipates — configuration alone does not inject tools into
an already-initialised session. The remedy is to leave Storybook running and restart the
client.

For this repository the restart must be a **full VS Code relaunch, not a window reload.** A
reload leaves the extension host's Node runtime in place, and the MCP servers die on
`EBADDEVENGINES` against the `>=24.0.0` engines floor.

## Step 4 — Prove the tools in the refreshed session

Not yet performed. It cannot be performed by the session that recorded this file, because a
relaunch necessarily starts a new one.

The next session must, before touching any UI component or story:

1. Confirm Storybook is still serving on 6006.
2. Call `list-all-documentation` and `get-storybook-story-instructions`.
3. Call `get-documentation` with an id returned by the list tool.
4. Append the results, timestamp and client to this file and mark the gate PASSED.

If the tools remain absent after one relaunch, stop UI and story mutation, preserve the
client log, and continue only with independent work.

## Work waiting on this gate

| Item | Blocked because |
| --- | --- |
| C2 shared-input label repair | Modifies `AutoSuggestContainer.tsx` and three `*.stories.tsx` |
| C6 option B — `ContentModal` unique title id | Modifies `ContentModal/index.tsx` |

**The working tree is red while this gate is closed.** Task C6's RED is written and verified
in `tests/unit/components/modals/contentModal.accessibility.test.tsx` — 3 failing, 1 passing
— and is deliberately **not committed**, because its fix is a gated UI change and committing
a failing test would break the suite. The next session should land the fix and the test
together in one commit.

The defect it proves: `ContentModal` hardcodes `id='modal-content'` on its title and points
every instance's `aria-labelledby` at that literal, while `Footer` mounts three instances.
With two open, `getByRole('dialog', { name: 'Portal Terms of Use' })` matches **two**
elements and `'Privacy collection statement'` names nothing.
