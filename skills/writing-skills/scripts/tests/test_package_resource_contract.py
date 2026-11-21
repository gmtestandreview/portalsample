"""Portable package-route checks independent of optional CLI dependencies.

These tests validate authored resource wiring; they do not observe an agent's
activation behavior or substitute for RED/GREEN runtime evaluations.
"""

import re
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[2]
MAIN = ROOT / 'SKILL.md'


def local_links(path: Path):
    # Remove fenced code examples; those are not package dependencies.
    active: list[str] = []
    in_fence = False
    marker = ''
    for line in path.read_text(encoding='utf-8').splitlines():
        fence = re.match(r'^ {0,3}(`{3,}|~{3,})', line)
        if fence:
            if not in_fence:
                in_fence, marker = True, fence.group(1)[0]
            elif fence.group(1)[0] == marker:
                in_fence = False
            continue
        if not in_fence:
            active.append(line)
    text = '\n'.join(active)
    text = re.sub(r'<!--.*?-->', '', text, flags=re.S)
    for match in re.finditer(r'(?<!!)\[[^]]+\]\(([^)]+)\)', text):
        target = match.group(1).split()[0]
        if target.startswith(('#', 'http:', 'https:', 'mailto:', '/')):
            continue
        yield unquote(target.split('#')[0])


def broken_local_links(path: Path):
    return [
        target for target in local_links(path) if target and not (path.parent / target).is_file()
    ]


def test_routed_package_links_resolve():
    # Scope to policy, routing and the custom-GPT example, where links refer
    # to actual package resources rather than teaching hypothetical structures.
    selected = [
        MAIN,
        ROOT / 'references/index.md',
        ROOT / 'references/examples/ChaGPT GPT SKILL.md',
        ROOT / 'references/using-scripts-in-skills.md',
        ROOT / 'references/devils-advocate-rubric.md',
    ]
    missing = {
        str(path.relative_to(ROOT)): broken_local_links(path)
        for path in selected
        if broken_local_links(path)
    }
    assert not missing, missing


def test_six_area_review_and_pre_execution_gate_are_explicit():
    text = MAIN.read_text(encoding='utf-8')
    for phrase in (
        '## Purpose, objective, and success state',
        '## Pre-execution adversarial self-review',
        '## Expected output and completion contract',
        'references/devils-advocate-rubric.md',
        'references/file-review-rubric.md',
        'indirect positive',
        'near-miss',
    ):
        assert phrase in text


def test_distributable_routes_and_negative_oracle():
    index = (ROOT / 'references/index.md').read_text(encoding='utf-8')
    assert 'devils-advocate-rubric.md' in index
    assert 'file-review-rubric.md' in index
    # Negative: a reference that does not exist must be detected, not silently accepted.
    assert not (ROOT / 'references/never-in-this-package.md').exists()
    # Positive: every documented primary route is packaged.
    for path in (
        'references/index.md',
        'references/specification.md',
        'references/bounded-optimisation.md',
        'evals/README.md',
        'references/SKILL-testing-checklist.md',
    ):
        assert (ROOT / path).is_file()


def test_original_error_is_visible_to_negative_checker(tmp_path: Path):
    """The sample below is intentionally invalid; it must fail resolution."""
    candidate: Path = tmp_path / 'example.md'
    candidate.write_text('See [missing](some-other-file.md).', encoding='utf-8')
    assert broken_local_links(candidate) == ['some-other-file.md']


def test_user_rubric_precedence_is_explicit_across_resource_routes():
    """Positive: a supplied rubric governs numeric file scores, without blending."""
    main = MAIN.read_text(encoding='utf-8')
    index = (ROOT / 'references/index.md').read_text(encoding='utf-8')
    rubric = (ROOT / 'references/file-review-rubric.md').read_text(encoding='utf-8')
    assert 'A user-supplied rubric governs every artifact/file' in main
    assert 'primary numeric authority' in index
    assert 'user-supplied rubric' in rubric
    assert 'Do **not** substitute the' in rubric
    assert 'local ten-criterion weights' in rubric
    assert 'unscored diagnostic checks' in rubric
    assert 'Scores from different rubrics' not in rubric  # no phantom equivalence


def test_no_user_rubric_preserves_explicit_file_fallback():
    """Negative/near-miss: absence of a supplied rubric must not erase fallback."""
    rubric = (ROOT / 'references/file-review-rubric.md').read_text(encoding='utf-8')
    assert 'No applicable user rubric' in rubric
    assert 'default for first-party support files' in rubric
    assert 'Fallback 100-point rubric' in rubric
    assert 'P K C A U R V I M F' in rubric


def test_numeric_authority_is_consistent_across_entrypoint_and_fallback():
    """Static contract only; not a behavioral agent rubric-choice test."""
    main = MAIN.read_text(encoding='utf-8')
    index = (ROOT / 'references/index.md').read_text(encoding='utf-8')
    default = (ROOT / 'references/audit-scoring.md').read_text(encoding='utf-8')
    file_rubric = (ROOT / 'references/file-review-rubric.md').read_text(encoding='utf-8')
    assert 'freeze numeric authority and scope' in main
    assert 'Without one, use `audit-scoring.md`' in index
    assert 'fallback whole-skill score' in default
    assert 'user-supplied rubric; it alone' in default
    assert 'No applicable user rubric' in file_rubric
    assert 'Never blend their weighted totals' in default


def test_activation_cases_have_unique_positive_negative_and_evidence_oracles():
    """Document structure only; actual host selection/loading remains NHR."""
    import re

    cases = (ROOT / 'evals/activation-regression-cases.md').read_text(encoding='utf-8')
    rows = [line.split('|') for line in cases.splitlines() if re.match(r'^\| ACT-\d{3} \|', line)]
    ids = [row[1].strip() for row in rows]
    assert len(ids) == len(set(ids)) == 12
    for row in rows:
        assert len(row) == 7  # | ID | Request | Expected | Forbidden | Evidence |
        assert all(cell.strip() for cell in row[1:-1])
    for required in (
        'ACT-001',
        'ACT-002',
        'ACT-004',
        'ACT-005',
        'ACT-006',
        'ACT-007',
        'ACT-009',
        'ACT-012',
    ):
        assert required in ids
    assert 'Case definitions and static QAQ/RMI mapping never substitute' in cases


def test_swot_template_requires_falsification_and_source_preservation():
    """No template example is treated as executed external merge evidence."""
    template = (ROOT / 'assets/templates/swot-analysis.md').read_text(encoding='utf-8')
    assert 'most plausible wrong assumption' in template
    assert 'unique safety rules, activation constraints' in template
    assert 'This template does not perform the test' in template
    assert 'A decision to' in template
    assert 'keep skills separate' in template
