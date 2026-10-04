# Deterministic Tests

These maintainer tests validate the `SKILL.md` artifact and evaluation assets.
They are not runtime dependencies of the skill.

## Run

```bash
python -m pytest -q tests/test_skill_contract.py
```

Test dependencies:

- Python 3
- `pytest`
- `PyYAML`

The suite checks frontmatter/spec constraints applicable to this candidate,
activation-boundary wording, required workflow/validation clauses,
representative Technique eval coverage, and evidence-boundary documentation.

If a test dependency or execution environment is unavailable, record the
deterministic suite as `NHR` rather than a pass. Passing these tests does not
establish behavioral RED/GREEN evidence.
