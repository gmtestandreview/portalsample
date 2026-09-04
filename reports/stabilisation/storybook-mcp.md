# Gate C-MCP — Storybook MCP Readiness

**Status at 2026-08-29 11:20 AEST: PASSED.** Storybook was restarted from a terminal
outside VS Code and the client relaunched; all eight tools are registered again and the four
the gate requires were called successfully. C3 story mutation is permitted. The 11:20 entry
at the end of this file records the proof, and the 10:55 entry below it records the trap
that had blocked it.

**Status at 2026-08-29 10:55 AEST: NOT PASSED.** Storybook was
running and `/mcp` answers a real `initialize` with `@storybook/addon-mcp` 0.7.0, but this
session was initialised while Storybook was stopped, so its tool registry still reports
`ConnectionRefused` and a lookup for the four required tools returns no matches. C3's story
mutation is blocked until the client is relaunched. See the 2026-08-29 record at the end of
this file, which also names a new trap: **Storybook must not be started by the agent's own
shell.**

**Status at 2026-08-28 22:30 AEST: PASSED.** All four required tools were called
successfully in a refreshed session. UI component and `*.stories.*` changes are now
permitted. The original NOT PASSED record from 2026-08-27 22:57 is retained below, because
the reason it failed is a repeatable trap worth keeping.

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

**PASSED, 2026-08-28 22:30 AEST**, client Claude Code (VS Code extension). Eight tools are
registered under `my-storybook-mcp-server`: `list-all-documentation`, `get-documentation`,
`get-documentation-for-story`, `get-storybook-story-instructions`, `get-changed-stories`,
`get-stories-by-component`, `preview-stories`, `run-story-tests`.

| Required tool | Result |
| --- | --- |
| `get-storybook-story-instructions` | Returned the Storybook 9 story conventions, including the `@storybook/react-vite` and `storybook/test` import rules and the requirement to use `run-story-tests` rather than any package.json script |
| `list-all-documentation` | Returned 88 component entries and 10 docs entries |
| `get-documentation` | Called with `components-inputs-autosuggest`, an id returned by the list tool; returned three stories and the full prop table |
| `run-story-tests` | Registered and schema-loaded |

### What resolved it

Storybook had been started from a VS Code integrated terminal, so it was a descendant of
`Code.exe` and died on every restart of the client — and the client only probes its MCP
servers once, at session start. Restarting the Storybook server could never help, because
nothing re-reads that result: the shell could reach `/mcp` while the tool registry still
reported `ConnectionRefused` from startup.

Fixed by starting Storybook from a terminal opened outside VS Code, verified by process
ancestry (`node -> cmd -> node -> powershell -> explorer`, no `Code.exe`), then fully
relaunching VS Code so the new session probed an endpoint that was already live.

That standalone shell first failed with `EBADDEVENGINES`, resolving Node v22.22.2 against
this repository's `devEngines.runtime >= 24.0.0`. The machine carries three Node sources —
`C:\Program Files\nodejs` at v22.22.2, `C:\nvm4w\nodejs` at v24.15.0, and fnm at v24.16.0 —
and a fresh shell picked up the Program Files install. Prepending `C:\nvm4w\nodejs` to
`$env:Path` in that window resolves it. Removing the standalone Node 22 install would stop
this recurring.

### First finding from the documentation tools

The documented `AutoSuggest` props are `id`, `name`, `label`, `getOptions`,
`onSelectedOption`, `selectedOption`, `inlineHelp` and `placeholder`. **There is no
`aria-label` or other accessibility prop**, and all three documented stories pass `label` as
a plain string. Task C2's repair therefore has to be internal to `AutoSuggestContainer` —
giving React Aria its `LabelContext` — and must not add a prop to the `AutoSuggest` API.
This is precisely the check the gate exists for.

## Work waiting on this gate

| Item | State |
| --- | --- |
| C6 — `ContentModal` unique title id | **Done.** Landed at `4cc43f5` using `useId()` per instance on both `aria-labelledby` and the title `id`. The RED written under this gate drove it. |
| C2 — shared-input label repair | **Unblocked.** Owner is `AutoSuggestContainer.tsx:110`, which renders a native `<label htmlFor>` inside React Aria's `<ComboBox>`; RAC reads its label from `LabelContext`, which only its own `<Label>` populates. |

The earlier note in this file that C6's RED was uncommitted and its fix pending is
superseded: the fix and its test are both committed and the tree is green.

---

## 2026-08-29 record — the gate regressed, and how not to regress it again

| Field | Value |
| --- | --- |
| Measured at | 2026-08-29 10:55 AEST |
| Commit | `430820c` |
| Agent client | Claude Code (VS Code extension), session `f6307217` |
| Storybook endpoint | healthy — `POST /mcp` `initialize` returns HTTP 200, `mcp-session-id`, `@storybook/addon-mcp` 0.7.0 |
| Tool registry | **empty for this server** — startup reported `ConnectionRefused`; `list-all-documentation`, `get-documentation`, `get-storybook-story-instructions` and `run-story-tests` are all absent |

### Why it regressed

The 2026-08-28 pass depended on a Storybook process started **outside** VS Code. That
process is gone. At the start of this session nothing was listening on 6006 (`netstat` for
`6006` returned nothing, and `POST /mcp` returned HTTP 000), so the client's one startup
probe failed and the tools were never registered.

### The new trap: the agent must not start Storybook itself

Storybook was restarted from the agent's own Bash tool. It came up correctly — but its
process ancestry is:

```text
node.exe (storybook dev, pid 34692) -> cmd.exe -> node.exe -> bash.exe -> bash.exe -> (extension host) -> Code.exe
```

That is the **same defect this file already documents**: a Storybook descended from
`Code.exe` dies on the VS Code relaunch that is the only thing which can register its tools.
Starting it from the agent shell therefore cannot pass the gate, no matter how healthy the
endpoint looks in between.

The endpoint being reachable from a shell is **not** the gate. The gate is the tools being
present in the client's registry, and that is decided once, at client start.

### Correct sequence

1. Open a terminal **outside VS Code** (Windows Terminal or PowerShell from the Start menu,
   not the integrated terminal and not the agent's shell).
2. `cd` to the repository root and run `npm run storybook`; leave the window open.
3. Confirm it is not a VS Code descendant, then fully **relaunch VS Code** — a window reload
   is not enough, because the extension host's Node runtime survives it.
4. In the new session, call `list-all-documentation` and `get-storybook-story-instructions`
   before touching any component or `*.stories.*` file.

The `EBADDEVENGINES` failure recorded in the 2026-08-28 section no longer applies:
`C:\Program Files\nodejs\node.exe` now reports v24.20.0, above this repository's
`devEngines.runtime >= 24.0.0` floor, so a standalone shell no longer needs a `$env:Path`
prefix.

### Work waiting on this gate as at 2026-08-29

| Item | State |
| --- | --- |
| C3 Step 1 — three-mode settlement experiment | **Done.** Read-only evidence, explicitly permitted before the gate. See `warning-settlement.md`. |
| C3 — W3 (unit `act` warnings) | **Closed with no edit.** Re-measurement only; no UI or story file touched. |
| C3 Steps 2-4 — W4 story settlement | **Blocked.** Every remaining repair adds a `play` function to a `*.stories.tsx` file, which is squarely inside this gate. |


## 2026-08-29 11:20 AEST — gate re-proven

| Field | Value |
| --- | --- |
| Agent client | Claude Code (VS Code extension), session `f6307217` after relaunch |
| Commit | `d1fd81f` |
| Registered tools | `list-all-documentation`, `get-documentation`, `get-documentation-for-story`, `get-storybook-story-instructions`, `get-changed-stories`, `get-stories-by-component`, `preview-stories`, `run-story-tests` |

| Required tool | Result |
| --- | --- |
| `get-storybook-story-instructions` | Returned the Storybook 9 conventions: `Meta`/`StoryObj` from `@storybook/react-vite`, test helpers from `storybook/test`, `canvas` used directly or `within(canvasElement)` but never `within(canvas)`, and the rule that `run-story-tests` is the only way to run story tests |
| `list-all-documentation` | 88 component entries and 10 docs entries, with story IDs |
| `get-documentation` | Called with `routes-requestforquote`, an id returned by the list tool; returned all four stories and the `Props` type |
| `run-story-tests` | Registered and schema-loaded |

Resolved exactly as the 10:55 entry prescribed: Storybook started from a terminal outside
VS Code, then a full VS Code relaunch. The recorded remedy worked first time.

### One deviation from the server's instructions, and why

The server instructs that `run-story-tests` replaces any package.json test script. That
holds for pass/fail and a11y validation, and C3 uses it for exactly that. It does **not**
replace `npm run test:storybook -- --reporter=default` for this task's *warning census*:
C3's acceptance is a console-warning count, and only the reporter-flagged Vitest run emits
the intercepted `console.error` lines the count is derived from. Both are run for every
owner. This is the same `--reporter=default` dependency recorded in `warnings.md`.
