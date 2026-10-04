---
title: 'Using scripts in skills'
sidebarTitle: 'Using scripts'
description: 'How to run commands and bundle executable scripts in your skills.'
---

<!-- markdownlint-disable MD013 MD025 -->

# Using Scripts

## Applicability and validation boundary

Load when designing or reviewing shell commands or bundled scripts in a skill.
Input: task, runtime/dependencies, script interface, and permission/side-effect
constraints. Output: explicit invocation, output/error contract, and an executed
validation record or `NHR` for required unavailable runs. Adapted from
[Agent Skills script guidance](https://agentskills.io/skill-creation/using-scripts),
checked on 2026-10-04. Runtime behavior is provider/version-specific; recheck
the linked runtime documentation when versions or installation policy change.
Examples illustrate scripts to create in a candidate package; they are not
bundled here. They print `This is a test.` for the supplied HTML; missing
`p.info` is outside that toy example and must receive explicit handling in
production.

Run examples in an isolated scratch directory after checking the executable and
dependency policy. Package runners may download/execute third-party code;
formatters/scaffolders may write files. These examples do not authorize those
effects on a user's project. Pin exact versions where repeatability matters;
major versions, ranges, and `latest` are not exact pins. Respect host
permissions and established task authorization. Check stdout, stderr, exit
status, and expected changes; include missing input/dependency and denied-access
cases.

Navigate: [Commands](#one-off-commands),
[Paths](#referencing-scripts-from-skillmd),
[Dependencies](#self-contained-scripts),
[Interfaces](#designing-scripts-for-agentic-use).

<!-- markdownlint-disable MD033 -->

Skills can instruct agents to run shell commands and bundle reusable scripts in
a `scripts/` directory. This guide covers one-off commands, self-contained
scripts with their own dependencies, and how to design script interfaces for
agentic use.

## One-off commands

When an existing package already does what you need, you can reference it
directly in your `SKILL.md` instructions without a `scripts/` directory. Many
ecosystems provide tools that auto-resolve dependencies at runtime.

### Python runners: uvx and pipx

[uvx](https://docs.astral.sh/uv/guides/tools/) ships with separately installed
[uv](https://docs.astral.sh/uv/); [pipx](https://pipx.pypa.io/) is another
isolated Python tool runner. Both need installation and may download packages.

```bash
uvx ruff@0.8.0 check .
uvx black@24.10.0 .
pipx run 'black==24.10.0' .
pipx run 'ruff==0.8.0' check .
```

### JavaScript runners: npx and bunx

[npx](https://docs.npmjs.com/cli/commands/npx) requires npm;
[bunx](https://bun.sh/docs/cli/bunx) requires Bun. Choose the runner matching an
existing environment, rather than requiring another runtime for this example.
These illustrative major-version selections permit updates; use an exact tested
version in a production workflow. `--fix` writes files and scaffolding creates
`my-app`; execute only within the authorized target.

```bash
npx eslint@9 --fix .
npx create-vite@6 my-app
bunx eslint@9 --fix .
bunx create-vite@6 my-app
```

### Deno

[deno run](https://docs.deno.com/runtime/reference/cli/run/) requires Deno.
Permissions before the script name belong to Deno; arguments after the script
name belong to the script. Grant only the capabilities that the chosen tool
actually needs. A formatter using `--fix` needs write access as well as read
access; a read-only flag alone is insufficient.

```bash
# Read-only illustrative lint invocation; verify tool/config compatibility.
deno run --allow-read npm:eslint@9 .
```

### Go

[go run](https://pkg.go.dev/cmd/go#hdr-Compile_and_run_Go_program) requires Go.
Its package version can be pinned; downloads and compilation may occur.
`@latest` is an explicit moving selection rather than a reproducibility pin.

```bash
go run golang.org/x/tools/cmd/goimports@v0.28.0 .
go run github.com/golangci/golangci-lint/cmd/golangci-lint@v1.62.0 run
```

**Tips for one-off commands in skills:**

- **Pin versions** (e.g., `npx eslint@9.0.0`) so the command behaves the same
  over time.
- **State prerequisites** in your `SKILL.md` (e.g., "Requires Node.js 18+")
  rather than assuming the agent's environment has them. For runtime-level
  requirements, use the
  [`compatibility` frontmatter field](specification.md#compatibility-field).
- **Move complex commands into scripts.** A one-off command works well when
  you're invoking a tool with a few flags. When a command grows complex enough
  that it's hard to get right on the first try, a tested script in `scripts/` is
  more reliable.

## Referencing scripts from `SKILL.md`

Use **relative paths from the skill directory root** to describe bundled files.
Before execution, establish that working directory explicitly or invoke the
resolved absolute script path. Do not assume the host changes directory or
resolves script paths automatically. Markdown links in references resolve from
the containing document, separately from command working directories.

List available scripts in your `SKILL.md` so the agent knows they exist:

```markdown SKILL.md
## Available scripts

- **`scripts/validate.sh`** - Validates configuration files
- **`scripts/process.py`** - Processes input data
```

Then instruct the agent to run them:

````markdown SKILL.md
## Workflow

1. Run the validation script:

   ```bash
   bash scripts/validate.sh "$INPUT_FILE"
   ```

2. Process the results:
   ```bash
   python3 scripts/process.py --input results.json
   ```
````

The same command-path convention works in `references/*.md` when the workflow
explicitly establishes the **skill directory root** as its working directory.

## Self-contained scripts

When you need reusable logic, bundle a script in `scripts/` that declares its
own dependencies inline. The agent can run the script with a single command - no
separate manifest file or install step required.

Several languages support inline dependency declarations:

### Python: PEP 723

[PEP 723](https://peps.python.org/pep-0723/) uses TOML metadata in comment
markers. Save this illustrative file as `scripts/extract.py` in a scratch skill:

```python
# /// script
# requires-python = ">=3.10"
# dependencies = ["beautifulsoup4==4.12.3"]
# ///
from bs4 import BeautifulSoup

html = '<html><body><p class="info">This is a test.</p></body></html>'
paragraph = BeautifulSoup(html, "html.parser").select_one("p.info")
if paragraph is None:
    raise ValueError("Expected a p.info element")
print(paragraph.get_text())
```

```bash
uv run scripts/extract.py
# Or, when the installed pipx version supports script metadata:
pipx run scripts/extract.py
```

[uv script support](https://docs.astral.sh/uv/guides/scripts/) creates an
isolated dependency environment; use `uv lock --script scripts/extract.py` when
a resolved lock is needed. [PEP 508](https://peps.python.org/pep-0508/) ranges
such as `beautifulsoup4>=4.12,<5` constrain compatibility without locking the
precise version.

### Deno: URL/specifier dependencies

Deno supports versioned `npm:`/`jsr:` imports. Save as `scripts/extract.ts`:

```typescript
import * as cheerio from 'npm:cheerio@1.0.0';

const html = '<html><body><p class="info">This is a test.</p></body></html>';
const paragraph = cheerio.load(html)('p.info');
if (paragraph.length === 0) throw new Error('Expected a p.info element');
console.log(paragraph.text());
```

```bash
deno run scripts/extract.ts
```

Exact `@1.0.0` and compatible `@^1.0.0` specifiers differ. Cache/network and
native-addon requirements depend on the package/runtime; do not describe every
imported script as universally self-contained. `--reload` refreshes cached
imports when permitted.

### Bun: auto-install

[Bun auto-install](https://bun.sh/docs/runtime/auto-install) can resolve missing
packages for standalone scripts. An existing ancestor `node_modules` changes
resolution behavior. Save the following as `scripts/extract.ts` in an isolated
scratch directory, then run `bun run scripts/extract.ts`:

```typescript
import * as cheerio from 'cheerio@1.0.0';

const html = '<html><body><p class="info">This is a test.</p></body></html>';
const paragraph = cheerio.load(html)('p.info');
if (paragraph.length === 0) throw new Error('Expected a p.info element');
console.log(paragraph.text());
```

Bun handles TypeScript and caches packages; first resolution may download them.
Verify auto-install configuration and native dependencies for the actual
package.

### Ruby: Bundler inline

[Bundler inline](https://bundler.io/guides/bundler_in_a_single_file_ruby_script.html)
allows dependency declarations in a Ruby script. Save as `scripts/extract.rb`:

```ruby
require 'bundler/inline'

gemfile do
  source 'https://rubygems.org'
  gem 'nokogiri', '= 1.16.8'
end

html = '<html><body><p class="info">This is a test.</p></body></html>'
paragraph = Nokogiri::HTML(html).at_css('p.info')
raise 'Expected a p.info element' unless paragraph
puts paragraph.text
```

```bash
ruby scripts/extract.rb
```

Confirm Ruby/Bundler availability and gem compatibility. Inline declarations do
not supply a lockfile; an existing `Gemfile`/`BUNDLE_GEMFILE` may affect
execution. A version range such as `~> 1.16` is a compatibility constraint, not
an exact pin.

## Designing scripts for agentic use

When an agent runs your script, it reads stdout and stderr to decide what to do
next. A few design choices make scripts dramatically easier for agents to use.

### Avoid interactive prompts

Default skill scripts to non-interactive execution. Some hosts support a TTY,
but that does not make unattended prompts reliable. Reject missing input with a
bounded error instead of hanging; do not use `--force` to bypass authorization.

Accept all input via command-line flags, environment variables, or stdin:

```text
# Bad: hangs waiting for input
$ python scripts/deploy.py
Target environment: _

# Good: clear error with guidance
$ python scripts/deploy.py
Error: --env is required. Options: development, staging, production.
Usage: python scripts/deploy.py --env staging --tag v1.2.3
```

### Document usage with `--help`

`--help` output is the primary way an agent learns your script's interface.
Include a brief description, available flags, and usage examples:

```text
Usage: scripts/process.py [OPTIONS] INPUT_FILE

Process input data and produce a summary report.

Options:
  --format FORMAT    Output format: json, csv, table (default: json)
  --output FILE      Write output to FILE instead of stdout
  --verbose          Print progress to stderr

Examples:
  scripts/process.py data.csv
  scripts/process.py --format csv --output report.csv data.csv
```

Keep it concise - the output enters the agent's context window alongside
everything else it's working with.

### Write helpful error messages

When an agent gets an error, the message directly shapes its next attempt. An
opaque "Error: invalid input" wastes a turn. Instead, say what went wrong, what
was expected, and what to try:

```text
Error: --format must be one of: json, csv, table.
       Received: "xml"
```

### Use structured output

Prefer structured formats - JSON, CSV, TSV - over free-form text. Structured
formats can be consumed by both the agent and standard tools (`jq`, `cut`,
`awk`), making your script composable in pipelines.

```text
# Whitespace-aligned - hard to parse programmatically
NAME          STATUS    CREATED
my-service    running   2025-01-15

# Delimited - unambiguous field boundaries
{"name": "my-service", "status": "running", "created": "2025-01-15"}
```

**Separate data from diagnostics:** send structured data to stdout and progress
messages, warnings, and other diagnostics to stderr. This lets the agent capture
clean, parseable output while still having access to diagnostic information when
needed.

### Further considerations

- **Idempotency.** Agents may retry commands. "Create if not exists" is safer
  than "create and fail on duplicate."
- **Input constraints.** Reject ambiguous input with a clear error rather than
  guessing. Use enums and closed sets where possible.
- **Dry-run support.** For destructive or stateful operations, a `--dry-run`
  flag lets the agent preview what will happen.
- **Meaningful exit codes.** Use distinct exit codes for different failure types
  (not found, invalid arguments, auth failure) and document them in your
  `--help` output so the agent knows what each code means.
- **Safe defaults.** Consider whether destructive operations should require
  explicit confirmation flags (`--confirm`, `--force`) or other safeguards
  appropriate to the risk level.
- **Predictable output size.** Many agent harnesses automatically truncate tool
  output beyond a threshold (e.g., 10-30K characters), potentially losing
  critical information. If your script might produce large output, default to a
  summary or a reasonable limit, and support flags like `--offset` so the agent
  can request more information when needed. Alternatively, if output is large
  and not amenable to pagination, require agents to pass an `--output` flag that
  specifies either an output file or `-` to explicitly opt in to stdout.
