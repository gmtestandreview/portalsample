---
name: webapp-testing
description:
  Toolkit for interacting with and testing local web applications using
  Playwright. Supports verifying frontend functionality, debugging UI behavior,
  capturing browser screenshots, and viewing browser logs.
license: Complete terms in LICENSE.txt
---

# Web Application Testing

To test local web applications, write native Python Playwright scripts.

**Helper Scripts Available**:

- `scripts/with_server.py` - Manages server lifecycle (supports multiple
  servers)

**Always run scripts with `--help` first** to see usage. DO NOT read the source
until you try running the script first and find that a customized solution is
abslutely necessary. These scripts can be very large and thus pollute your
context window. They exist to be called directly as black-box scripts rather
than ingested into your context window.

## Decision Tree: Choosing Your Approach

```
User task → Is it static HTML?
    ├─ Yes → Read HTML file directly to identify selectors
    │         ├─ Success → Write Playwright script using selectors
    │         └─ Fails/Incomplete → Treat as dynamic (below)
    │
    └─ No (dynamic webapp) → Is the server already running?
        ├─ No → Run: python scripts/with_server.py --help
        │        Then use the helper + write simplified Playwright script
        │
        └─ Yes → Reconnaissance-then-action:
            1. Navigate and wait for networkidle
            2. Take screenshot or inspect DOM
            3. Identify selectors from rendered state
            4. Execute actions with discovered selectors
```

## Example: Using with_server.py

To start a server, run `--help` first, then use the helper:

**Single server:**

```bash
python scripts/with_server.py --server "npm run dev" --port 5173 -- python your_automation.py
```

**Multiple servers (e.g., backend + frontend):**

```bash
python scripts/with_server.py \
  --server "cd backend && python server.py" --port 3000 \
  --server "cd frontend && npm run dev" --port 5173 \
  -- python your_automation.py
```

### `--server` command syntax

`with_server.py` never starts a shell. Each `--server` value is parsed into an
argument list and the program is launched directly.

- **Supported:** `COMMAND ARG...`, optionally preceded by one or more
  `cd DIR &&` prefixes. The `cd` prefixes set the working directory (relative to
  where you run the script, cumulative across prefixes). Quote any argument or
  directory that contains spaces: `--server 'cd "my app" && npm run dev'`.
- **Quoted text is data.** `'a;b'` or `'x && y'` inside a longer quoted argument
  is passed unchanged to the program, never interpreted.
- **Rejected with an error (not executed):** pipes, `;`, `||`, a lone `&`,
  redirects (`>`, `<`), `$(...)` and backticks, any `&&` segment other than
  `cd DIR`, and a command that ends in `cd`. A standalone operator such as `';'`
  is rejected even when quoted. Environment assignments (`FOO=1 cmd`), variable
  expansion and globbing are not performed. A trailing `# comment` is dropped,
  as in a shell.
- **Need a pipeline or compound command?** Put it in a script file and pass
  `--server "python start.py"`.
- **Executables:** a bare name (`npm`, `python`) is resolved through `PATH` (so
  `npm.cmd` shims work on Windows). On Windows, a bare name that exists only in
  the current directory is refused. Give an explicit path to choose a specific
  binary.
- **Windows batch files (`.cmd`/`.bat`, including npm/pnpm shims):** `cmd.exe`
  re-parses their arguments, so only letters, digits and `_ @ + = : , . / \ -`
  and spaces are accepted; anything else (`& | < > ^ % ! " ( )`) is rejected.
  Use the underlying `node`/`python` executable if you need other characters.
- **Shutdown:** servers and their child processes are stopped when the command
  finishes or startup fails. On Windows the whole tree is force-killed with
  `taskkill`; on POSIX the process group gets SIGTERM, then SIGKILL.
- **Server output:** stdout and stderr (merged) are written to a temporary
  file, not shown live and never piped, so a chatty server cannot block. If a
  server does not become ready in time, the last 2000 bytes are printed.
  Earlier versions piped the output without reading it.
- **Compatibility change:** earlier versions ran the string through a shell, so
  pipelines, `;` chains and env-var prefixes worked. They now fail fast.
- The command after `--` is run directly with the same executable rules, not
  through a shell.

To create an automation script, include only Playwright logic (servers are
managed automatically):

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True) # Always launch chromium in headless mode
    page = browser.new_page()
    page.goto('http://localhost:5173') # Server already running and ready
    page.wait_for_load_state('networkidle') # CRITICAL: Wait for JS to execute
    # ... your automation logic
    browser.close()
```

## Reconnaissance-Then-Action Pattern

1. **Inspect rendered DOM**:

   ```python
   page.screenshot(path='/tmp/inspect.png', full_page=True)
   content = page.content()
   page.locator('button').all()
   ```

2. **Identify selectors** from inspection results

3. **Execute actions** using discovered selectors

## Common Pitfall

❌ **Don't** inspect the DOM before waiting for `networkidle` on dynamic apps ✅
**Do** wait for `page.wait_for_load_state('networkidle')` before inspection

## Best Practices

- **Use bundled scripts as black boxes** - To accomplish a task, consider
  whether one of the scripts available in `scripts/` can help. These scripts
  handle common, complex workflows reliably without cluttering the context
  window. Use `--help` to see usage, then invoke directly.
- Use `sync_playwright()` for synchronous scripts
- Always close the browser when done
- Use descriptive selectors: `text=`, `role=`, CSS selectors, or IDs
- Add appropriate waits: `page.wait_for_selector()` or `page.wait_for_timeout()`

## Reference Files

- **examples/** - Examples showing common patterns:
  - `element_discovery.py` - Discovering buttons, links, and inputs on a page
  - `static_html_automation.py` - Using file:// URLs for local HTML
  - `console_logging.py` - Capturing console logs during automation
