# skills-ref

Reference library for Agent Skills.

> [!IMPORTANT] This library is intended for demonstration purposes only. It is
> not meant to be used in production.

## Installation

Run installation commands from this `scripts/` directory with Python 3.11 or
newer. The graph renderer described below also needs Node.js 22.7 or newer and
Graphviz; those tools are separate from the Python package.

### macOS / Linux

Using pip:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

Or using [uv](https://docs.astral.sh/uv/):

```bash
uv sync
source .venv/bin/activate
```

### Windows

Using pip (PowerShell):

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e .
```

Using pip (Command Prompt):

```cmd
python -m venv .venv
.venv\Scripts\activate.bat
pip install -e .
```

Or using [uv](https://docs.astral.sh/uv/):

```powershell
uv sync
.venv\Scripts\Activate.ps1
```

After installation, the `skills-ref` executable will be available on your `PATH`
(within the activated virtual environment).

## Running Tests

Run commands from this `scripts/` directory so the local package and
`pyproject.toml` settings resolve correctly.

These commands run deterministic parser, validator, prompt, and CLI tests. They
do not execute behavioral skill-output evaluations. For output-quality evals,
read and apply `../references/evaluating-skill-output.md`, then use
`../evals/README.md` for this skill's seeded evaluation suite.

Using `uv`:

```bash
uv run --group dev pytest
```

If pytest reports a permission error for its shared temporary directory on
Windows, give the run a fresh, task-owned base directory, for example:

```powershell
$testTemp = Join-Path $env:TEMP ("skills-ref-tests-" + [guid]::NewGuid())
uv run --group dev pytest --basetemp $testTemp
```

Use a new directory for each run; pytest owns and manages its base directory.

Using pip:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
python -m pytest
```

Using pip on Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
python -m pytest
```

Use targeted tests while iterating:

```bash
python -m pytest tests/test_validator.py
python -m pytest tests/test_parser.py
python -m pytest tests/test_prompt.py
python -m pytest tests/test_cli.py
```

## Usage

### CLI

```bash
# Validate a skill
skills-ref validate path/to/skill

# Read skill properties (outputs JSON)
skills-ref read-properties path/to/skill

# Generate <available_skills> XML for agent prompts
skills-ref to-prompt path/to/skill-a path/to/skill-b
```

### Python API

```python
from pathlib import Path
from skills_ref import validate, read_properties, to_prompt

# Validate a skill directory
problems = validate(Path("my-skill"))
if problems:
    print("Validation errors:", problems)

# Read skill properties
props = read_properties(Path("my-skill"))
print(f"Skill: {props.name} - {props.description}")

# Generate prompt for available skills
prompt = to_prompt([Path("skill-a"), Path("skill-b")])
print(prompt)
```

`read_properties` checks required fields and optional field types, but does not
perform the complete name, directory, length, or allowed-field validation. Call
`validate` for those checks before accepting a skill. Frontmatter text must be
UTF-8 and contain Unicode characters valid in XML 1.0; raw or escaped forbidden
controls, surrogate code points, and noncharacters U+FFFE/U+FFFF raise a
controlled `SkillError`. These restrictions keep the JSON and XML interfaces
usable. Duplicate YAML keys and non-mapping frontmatter are rejected.

## Render diagrams

Run the renderer directly from the skill checkout; it is separate from the
installed `skills-ref` Python wheel:

```bash
node render-graphs.js path/to/skill
node render-graphs.js path/to/skill --combine
```

Each fenced `dot` block in `SKILL.md` must contain one Graphviz graph. Both LF
and CRLF line endings work, including quoted and anonymous graph names. Backtick
and tilde fences use at least three matching markers, with up to three leading
spaces; the closing fence must be at least as long as its opener. Unclosed DOT
fences fail with a diagnostic. Other fenced languages are skipped. Graphviz
`dot` must be in a standard installation location, or set `GRAPHVIZ_DOT` to its
absolute executable path.

Separate mode writes SVG files under the skill's `diagrams/` directory. Names
are made portable, and suffixes keep duplicate and case-colliding graph names
distinct. Existing regular output files are replaced on subsequent runs. Linked
output directories and linked output files are rejected. Unknown flags and
surplus positional arguments fail before output is written.

`--combine` renders each graph independently, then vertically composes one
standalone SVG using embedded SVG images. This preserves each graph's labels,
layout, and identifier namespace; the result presents the diagrams visually and
does not expose interactive links inside embedded images. Graphs referring to
external image files are rejected in combined mode because those images would
not be standalone. The accompanying `.dot` file preserves the original
multi-graph inputs for debugging; it does not recreate the composed SVG layout.

Exit code 0 means all requested diagrams rendered successfully, or no `dot`
blocks were present. Exit code 1 reports an argument, read, render, or write
failure. Separate mode may leave successful diagrams when another diagram fails;
combined mode renders every input before writing its composed artifact. Graphviz
diagnostics on stderr, including warnings about missing images or unsupported
attributes, count as failures and are included in the error message. File-write
failures can leave previously completed outputs. A render subprocess has a
30-second timeout and a 10 MiB output limit.

## Agent Prompt Integration

Use `to-prompt` to generate the suggested `<available_skills>` XML block for
your agent's system prompt. This format is recommended for Anthropic's models,
but Skill Clients may choose to format it differently based on the model being
used.

```xml
<available_skills>
<skill>
<name>
my-skill
</name>
<description>
What this skill does and when to use it
</description>
<location>
/path/to/my-skill/SKILL.md
</location>
</skill>
</available_skills>
```

The `<location>` element tells the agent where to find the full skill
instructions.

## License

Apache 2.0
