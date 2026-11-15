"""Portable package-route checks independent of optional CLI dependencies.

These tests validate authored resource wiring; they do not observe an agent's
activation behavior or substitute for RED/GREEN runtime evaluations.
"""

import re
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[2]
MAIN = ROOT / "SKILL.md"


def local_links(path: Path):
    # Remove fenced code examples; those are not package dependencies.
    active = []
    in_fence = False
    marker = ""
    for line in path.read_text(encoding="utf-8").splitlines():
        fence = re.match(r"^ {0,3}(`{3,}|~{3,})", line)
        if fence:
            if not in_fence:
                in_fence, marker = True, fence.group(1)[0]
            elif fence.group(1)[0] == marker:
                in_fence = False
            continue
        if not in_fence:
            active.append(line)
    text = "\n".join(active)
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    for match in re.finditer(r"(?<!!)\[[^]]+\]\(([^)]+)\)", text):
        target = match.group(1).split()[0]
        if target.startswith(("#", "http:", "https:", "mailto:", "/")):
            continue
        yield unquote(target.split("#")[0])


def broken_local_links(path: Path):
    return [
        target for target in local_links(path) if target and not (path.parent / target).is_file()
    ]


def test_routed_package_links_resolve():
    # Scope to policy, routing and the custom-GPT example, where links refer
    # to actual package resources rather than teaching hypothetical structures.
    selected = [
        MAIN,
        ROOT / "references/index.md",
        ROOT / "references/examples/ChaGPT GPT SKILL.md",
        ROOT / "references/using-scripts-in-skills.md",
        ROOT / "references/devils-advocate-rubric.md",
    ]
    missing = {
        str(path.relative_to(ROOT)): broken_local_links(path)
        for path in selected
        if broken_local_links(path)
    }
    assert not missing, missing


def test_six_area_review_and_pre_execution_gate_are_explicit():
    text = MAIN.read_text(encoding="utf-8")
    for phrase in (
        "## Purpose, objective, and success state",
        "## Pre-execution adversarial self-review",
        "## Expected output and completion contract",
        "references/devils-advocate-rubric.md",
        "references/file-review-rubric.md",
        "indirect positive",
        "near-miss",
    ):
        assert phrase in text


def test_distributable_routes_and_negative_oracle():
    index = (ROOT / "references/index.md").read_text(encoding="utf-8")
    assert "devils-advocate-rubric.md" in index
    assert "file-review-rubric.md" in index
    # Negative: a reference that does not exist must be detected, not silently accepted.
    assert not (ROOT / "references/never-in-this-package.md").exists()
    # Positive: every documented primary route is packaged.
    for path in (
        "references/index.md",
        "references/specification.md",
        "references/bounded-optimisation.md",
        "evals/README.md",
        "references/SKILL-testing-checklist.md",
    ):
        assert (ROOT / path).is_file()


def test_original_error_is_visible_to_negative_checker(tmp_path):
    """The sample below is intentionally invalid; it must fail resolution."""
    candidate = tmp_path / "example.md"
    candidate.write_text("See [missing](some-other-file.md).", encoding="utf-8")
    assert broken_local_links(candidate) == ["some-other-file.md"]


def test_user_rubric_precedence_is_explicit_across_resource_routes():
    """Positive: a supplied rubric governs numeric file scores, without blending."""
    main = MAIN.read_text(encoding="utf-8")
    index = (ROOT / "references/index.md").read_text(encoding="utf-8")
    # Normalise whitespace so prose re-wrapping (oxfmt proseWrap: always) is inert.
    rubric = " ".join(
        (ROOT / "references/file-review-rubric.md").read_text(encoding="utf-8").split()
    )
    assert "Use the user's supplied rubric when one is provided" in main
    assert "primary numeric authority" in index
    assert "user-supplied rubric" in rubric
    assert "Do **not** substitute the" in rubric
    assert "local ten-criterion weights" in rubric
    # Drop `_` emphasis markers so italics do not affect the match.
    assert "unscored diagnostic checks" in rubric.replace("_", "")
    assert "Scores from different rubrics" not in rubric  # no phantom equivalence


def test_no_user_rubric_preserves_explicit_file_fallback():
    """Negative/near-miss: absence of a supplied rubric must not erase fallback."""
    # Normalise whitespace so prose re-wrapping (oxfmt proseWrap: always) is inert.
    rubric = " ".join(
        (ROOT / "references/file-review-rubric.md").read_text(encoding="utf-8").split()
    )
    assert "No applicable user rubric" in rubric
    assert "default for first-party support files" in rubric
    assert "Fallback 100-point rubric" in rubric
    assert "P K C A U R V I M F" in rubric
