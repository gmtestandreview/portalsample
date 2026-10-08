import json
import re
from pathlib import Path
from typing import Protocol, cast

import yaml

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "SKILL.md"
EVALS = ROOT / "evals" / "evals.json"
ALLOWED_FIELDS = {"name", "description", "license", "compatibility", "metadata", "allowed-tools"}


class _YamlApi(Protocol):
    def safe_load(self, stream: str) -> object: ...


_YAML_API = cast(_YamlApi, yaml)


def normalized_text(text: str) -> str:
    return " ".join(text.split()).casefold()


def parse_skill() -> tuple[str, dict[str, object], str]:
    text = SKILL.read_text(encoding="utf-8")
    assert text.startswith("---\n")
    end = text.find("\n---\n", 4)
    assert end != -1
    fm_text = text[4:end]
    body = text[end + 5:]
    fm = cast(dict[str, object], _YAML_API.safe_load(fm_text))
    return text, fm, body

def test_spec_frontmatter_and_structure():
    text, fm, body = parse_skill()
    assert SKILL.name == "SKILL.md"
    assert isinstance(fm, dict)
    assert set(fm) <= ALLOWED_FIELDS
    name = fm["name"]
    assert isinstance(name, str)
    assert name == "import-refactor"
    assert ROOT.name == name
    assert 1 <= len(name) <= 64
    assert re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name)
    desc = fm["description"]
    assert isinstance(desc, str)
    assert 1 <= len(desc) <= 1024
    assert body.strip()
    assert len(text.splitlines()) < 200

def test_activation_contract_has_positive_and_near_miss_boundary():
    _, fm, _ = parse_skill()
    description = fm["description"]
    assert isinstance(description, str)
    desc = description.lower()
    assert any(term in desc for term in ("move", "rename", "restructure", "consolidation"))
    assert "python" in desc
    assert "typescript" in desc
    assert "javascript" in desc
    assert "do not use" in desc
    assert "sorting" in desc or "style-only" in desc

def test_workflow_contract_is_falsifiable():
    _, _, body = parse_skill()
    normalized_body = normalized_text(body)
    required = [
        "old → new",
        "Resolve ambiguous mappings before bulk edits",
        "generated, vendored, cache, and build-output",
        "do not use an unreviewed repository-wide text replacement",
        "Targets",
        "Residuals",
        "Static checks",
        "Focused tests",
        "Diff review",
        "report it as unverified instead of claiming success",
        "Do not report the refactor complete unless",
    ]
    for phrase in required:
        assert normalized_text(phrase) in normalized_body, phrase

def test_technique_eval_coverage():
    data = json.loads(EVALS.read_text(encoding="utf-8"))
    assert data["skill_name"] == "import-refactor"
    cases = data["evals"]
    assert len(cases) >= 7
    for case in cases:
        for field in ("id", "prompt", "expected_output", "files"):
            assert field in case
        assert case["prompt"].strip()
        assert case["expected_output"].strip()
        assert isinstance(case["files"], list)
    joined = "\n".join(c["prompt"] + "\n" + c["expected_output"] for c in cases).lower()
    for concept in (
        "style-only", "ambiguous", "generated", "case-only",
        "python", "typescript", "unverified"
    ):
        assert concept in joined, concept

def test_eval_readme_preserves_evidence_boundary():
    text = (ROOT / "evals" / "README.md").read_text(encoding="utf-8")
    assert "without" in text
    assert "with" in text
    assert "RED" in text
    assert "GREEN" in text
    assert "do **not** substitute" in text
    for state in ("PASS", "AMBER", "FAIL", "NHR", "N/A"):
        assert state in text

def test_test_resource_usage_is_documented():
    text = normalized_text(
        (ROOT / "tests" / "README.md").read_text(encoding="utf-8")
    )
    assert normalized_text("python -m pytest -q tests/test_skill_contract.py") in text
    assert normalized_text("pytest") in text
    assert normalized_text("PyYAML") in text
    assert normalized_text("not runtime dependencies") in text
    assert normalized_text("does not establish behavioral RED/GREEN evidence") in text
