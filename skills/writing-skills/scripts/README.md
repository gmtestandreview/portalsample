# skills-ref

Reference library for Agent Skills.

> [!IMPORTANT]
> This library is intended for demonstration purposes only. It is not meant to be used in production.

## Installation

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

After installation, the `skills-ref` executable will be available on your `PATH` (within the activated virtual environment).

## Running Tests

Run commands from this `scripts/` directory so the local package and `pyproject.toml` settings resolve correctly.

These commands run deterministic parser, validator, prompt, and CLI tests. They do not execute behavioral skill-output evaluations. For output-quality evals, read and apply `../references/evaluating-skill-output.md`, then use `evals/README.md` for this skill's seeded evaluation suite.

Using `uv`:

```bash
uv run --group dev pytest
```

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

## Agent Prompt Integration

Use `to-prompt` to generate the suggested `<available_skills>` XML block for your agent's system prompt. This format is recommended for Anthropic's models, but Skill Clients may choose to format it differently based on the model being used.

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

The `<location>` element tells the agent where to find the full skill instructions.

## License

Apache 2.0
