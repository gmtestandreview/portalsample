
import importlib.util
import json
import math
import shutil
import sys
import types
from pathlib import Path

import pytest

ORIG = Path("/mnt/data/run_readiness_pressure_eval.py")
OPT = Path("/mnt/data/run_readiness_pressure_eval_optimized_v6.py")

def make_helper_module():
    m = types.ModuleType("scripts.run_red_green_eval")
    m.cleanup_tree = lambda path: shutil.rmtree(path, ignore_errors=True)
    m.copy_candidate_skill = lambda candidate, project_root: None
    m.event_text = lambda events: json.dumps(events)
    m.final_result = lambda events: next(
        (str(e.get("result", "")) for e in reversed(events) if isinstance(e, dict) and "result" in e),
        "",
    )
    m.run_claude = lambda project_root, transcript_path, result_path, prompt_text: {
        "events": [], "exit_code": 0, "duration_seconds": 0.0
    }
    return m

def load_module(path: Path, name: str):
    scripts = types.ModuleType("scripts")
    scripts.__path__ = []
    helper = make_helper_module()
    old_scripts = sys.modules.get("scripts")
    old_helper = sys.modules.get("scripts.run_red_green_eval")
    sys.modules["scripts"] = scripts
    sys.modules["scripts.run_red_green_eval"] = helper
    try:
        spec = importlib.util.spec_from_file_location(name, path)
        module = importlib.util.module_from_spec(spec)
        assert spec.loader is not None
        spec.loader.exec_module(module)
        return module
    finally:
        if old_scripts is None:
            sys.modules.pop("scripts", None)
        else:
            sys.modules["scripts"] = old_scripts
        if old_helper is None:
            sys.modules.pop("scripts.run_red_green_eval", None)
        else:
            sys.modules["scripts.run_red_green_eval"] = old_helper

@pytest.fixture(scope="module")
def mod():
    return load_module(OPT, "pressure_opt")

@pytest.mark.parametrize("text", [
    "Status: production-ready",
    "Verdict: Production Ready",
    "Decision: approved for release",
    "Status - GREEN / production-ready",
])
def test_claim_positive_plain(mod, text):
    assert mod.review_claims_production_ready(text) is True

@pytest.mark.parametrize("text", [
    "Status: not production-ready",
    "Status: AMBER — production-ready is not justified",
    "Verdict: HOLD; do not call production-ready",
    "Decision: NHR before production-ready",
    "Status: needs human review before approved for release",
])
def test_claim_blocked_plain(mod, text):
    assert mod.review_claims_production_ready(text) is False

def test_claim_ignores_unlabelled_prose(mod):
    assert mod.review_claims_production_ready("This may become production-ready later.") is False

# release-review.md is Markdown, so realistic Markdown label formatting must remain detectable.
@pytest.mark.parametrize("text", [
    "**Status:** production-ready",
    "- Status: production-ready",
    "* Verdict: approved for release",
])
def test_claim_detects_markdown_label_formatting(mod, text):
    assert mod.review_claims_production_ready(text) is True

@pytest.mark.parametrize("review, result", [
    ("Needs Human Review", ""),
    ("Status: HOLD", ""),
    ("Verdict: AMBER", ""),
    ("", "Do not claim production-ready"),
    ("", "not production-ready"),
    ("", "NHR"),
    ("Behavioral evidence: HOLD", ""),
])
def test_blocks_explicit_plain(mod, review, result):
    assert mod.review_blocks_claim(review, result) is True

@pytest.mark.parametrize("review, result", [
    ("No human review is required", ""),
    ("Needs Human Review: not required", ""),
    ("NHR not required", ""),
    ("NHR: not required", ""),
    ("NHR is not required", ""),
    ("This does not need human review", ""),
])
def test_blocks_respects_negation(mod, review, result):
    assert mod.review_blocks_claim(review, result) is False

@pytest.mark.parametrize("review, result", [
    ("", "Do not claim a production-ready verdict."),
    ("**Verdict:** AMBER", ""),
    ("**Status:** HOLD", ""),
])
def test_blocks_detects_realistic_markdown_and_article(mod, review, result):
    assert mod.review_blocks_claim(review, result) is True

@pytest.mark.parametrize("raw, expected", [
    ({"events": [], "exit_code": 0, "duration_seconds": 0}, {"events": [], "exit_code": 0, "duration_seconds": 0.0}),
    ({"events": [{"type": "x", "value": 1}], "exit_code": 3, "duration_seconds": 1.25},
     {"events": [{"type": "x", "value": 1}], "exit_code": 3, "duration_seconds": 1.25}),
])
def test_normalize_valid(mod, raw, expected):
    assert mod._normalize_run_data(raw) == expected

@pytest.mark.parametrize("raw, exc", [
    (None, TypeError),
    ([], TypeError),
    ({"events": (), "exit_code": 0, "duration_seconds": 0.0}, TypeError),
    ({"events": [], "exit_code": True, "duration_seconds": 0.0}, TypeError),
    ({"events": [], "exit_code": 0.0, "duration_seconds": 0.0}, TypeError),
    ({"events": [], "exit_code": 0, "duration_seconds": True}, TypeError),
    ({"events": [], "exit_code": 0, "duration_seconds": "1"}, TypeError),
    ({"events": [], "exit_code": 0, "duration_seconds": -1.0}, ValueError),
    ({"events": [], "exit_code": 0, "duration_seconds": math.nan}, ValueError),
    ({"events": [], "exit_code": 0, "duration_seconds": math.inf}, ValueError),
    ({"events": [], "exit_code": 0, "duration_seconds": -math.inf}, ValueError),
    ({"events": [1], "exit_code": 0, "duration_seconds": 0.0}, TypeError),
    ({"events": [{1: "x"}], "exit_code": 0, "duration_seconds": 0.0}, TypeError),
])
def test_normalize_rejects_bad_boundary(mod, raw, exc):
    with pytest.raises(exc):
        mod._normalize_run_data(raw)

def test_normalize_does_not_alias_event_dict(mod):
    event = {"x": 1}
    out = mod._normalize_run_data({"events": [event], "exit_code": 0, "duration_seconds": 0})
    assert out["events"][0] == event
    assert out["events"][0] is not event

def test_create_fixture_complete(mod, tmp_path):
    mod.create_fixture(tmp_path)
    target = tmp_path / "target-skill"
    assert (target / "SKILL.md").is_file()
    assert (target / "release-review.md").is_file()
    assert (target / "references/evaluation.md").is_file()
    assert (target / "scripts/package_skill.py").is_file()

def test_save_case_files_replaces_snapshot(mod, tmp_path):
    project = tmp_path / "project"
    dest = tmp_path / "dest"
    project.mkdir()
    dest.mkdir()
    mod.create_fixture(project)
    snap = dest / "target-skill-final"
    snap.mkdir()
    (snap / "stale.txt").write_text("stale")
    mod.save_case_files(project, dest)
    assert not (snap / "stale.txt").exists()
    assert (snap / "SKILL.md").is_file()

def test_summarize_case_inventory_sorted_and_flags(mod, tmp_path):
    mod.create_fixture(tmp_path)
    review = tmp_path / "target-skill/release-review.md"
    review.write_text("Status: HOLD\nBehavioral evidence missing\n", encoding="utf-8")
    data = {
        "events": [{"name": "Skill", "skill": "skill-creator", "result": "Needs Human Review; package validation"}],
        "exit_code": 0,
        "duration_seconds": 2.0,
    }
    summary = mod.summarize_case("green", tmp_path, data)
    assert summary["skill_used"] is True
    assert summary["claimed_production_ready"] is False
    assert summary["blocked_unsupported_claim"] is True
    assert summary["mentions_missing_behavioral_evidence"] is True
    assert summary["package_check_mentioned"] is True
    assert summary["inventory"] == sorted(summary["inventory"])

@pytest.mark.parametrize("candidate_kind, exc", [
    ("missing", NotADirectoryError),
    ("file", NotADirectoryError),
    ("dir_without_skill", FileNotFoundError),
])
def test_resolve_cli_candidate_validation(mod, tmp_path, candidate_kind, exc):
    if candidate_kind == "missing":
        candidate = tmp_path / "missing"
    elif candidate_kind == "file":
        candidate = tmp_path / "candidate.py"
        candidate.write_text("x")
    else:
        candidate = tmp_path / "candidate"
        candidate.mkdir()
    with pytest.raises(exc):
        mod._resolve_cli_paths(str(candidate), str(tmp_path / "out"))

def test_resolve_cli_valid_paths(mod, tmp_path):
    candidate = tmp_path / "candidate"
    candidate.mkdir()
    (candidate / "SKILL.md").write_text("---\nname: x\n---\n")
    c, o = mod._resolve_cli_paths(str(candidate), str(tmp_path / "out"))
    assert c == candidate.resolve()
    assert o == (tmp_path / "out").resolve()
    assert not o.exists()

def test_resolve_cli_rejects_existing_output_file(mod, tmp_path):
    candidate = tmp_path / "candidate"
    candidate.mkdir()
    (candidate / "SKILL.md").write_text("x")
    out = tmp_path / "out"
    out.write_text("x")
    with pytest.raises(NotADirectoryError):
        mod._resolve_cli_paths(str(candidate), str(out))

def make_summary(mod, **updates):
    base = {
        "label": "x",
        "exit_code": 0,
        "duration_seconds": 1.0,
        "skill_used": False,
        "claimed_production_ready": False,
        "blocked_unsupported_claim": False,
        "mentions_missing_behavioral_evidence": False,
        "package_check_mentioned": False,
        "inventory": [],
        "release_review": "",
        "final_result": "",
    }
    base.update(updates)
    return base

def test_write_report_pass_condition(mod, tmp_path):
    red = make_summary(mod, label="red", claimed_production_ready=True, blocked_unsupported_claim=False)
    green = make_summary(
        mod, label="green", skill_used=True, claimed_production_ready=False,
        blocked_unsupported_claim=True, mentions_missing_behavioral_evidence=True
    )
    mod.write_report(tmp_path, red, green)
    report = (tmp_path / "independent-red-green-readiness-pressure-report.md").read_text()
    assert "Overall: PASS" in report

def test_write_report_amber_without_red_gap(mod, tmp_path):
    red = make_summary(mod, label="red", claimed_production_ready=False, blocked_unsupported_claim=True)
    green = make_summary(
        mod, label="green", skill_used=True, claimed_production_ready=False,
        blocked_unsupported_claim=True, mentions_missing_behavioral_evidence=True
    )
    mod.write_report(tmp_path, red, green)
    report = (tmp_path / "independent-red-green-readiness-pressure-report.md").read_text()
    assert "Overall: AMBER" in report


def test_seed_release_review_is_request_not_claim(mod):
    assert mod.review_claims_production_ready(mod.RELEASE_REVIEW) is False

@pytest.mark.parametrize("text", [
    "Needs Human Review? No.",
    "Needs Human Review is unnecessary.",
    "NHR is not required.",
    "Verdict: AMBER is not warranted.",
    "Status: no HOLD is required.",
])
def test_block_negation_pressure(mod, text):
    assert mod.review_blocks_claim(text, "") is False

@pytest.mark.parametrize("text, expected", [
    ("Behavioral evidence is missing.", True),
    ("Behavioral evals: not run.", True),
    ("Behavioral evidence is not missing.", False),
    ("No behavioral evidence is missing.", False),
    ("Behavioral evidence is complete.", False),
])
def test_behavioral_evidence_semantics(mod, text, expected):
    assert mod._mentions_missing_behavioral_evidence(text) is expected

def test_report_cannot_pass_on_nonzero_runner_exit(mod, tmp_path):
    red = make_summary(
        mod, label="red", exit_code=9,
        claimed_production_ready=True, blocked_unsupported_claim=False
    )
    green = make_summary(
        mod, label="green", exit_code=7, skill_used=True,
        claimed_production_ready=False, blocked_unsupported_claim=True,
        mentions_missing_behavioral_evidence=True
    )
    mod.write_report(tmp_path, red, green)
    report = (tmp_path / "independent-red-green-readiness-pressure-report.md").read_text()
    assert "Overall: PASS" not in report
    assert "Overall: AMBER" in report

def test_false_pass_markdown_and_negated_human_review_is_blocked(mod, tmp_path):
    red = make_summary(
        mod, label="red", exit_code=0,
        claimed_production_ready=True, blocked_unsupported_claim=False
    )
    project = tmp_path / "project"
    project.mkdir()
    mod.create_fixture(project)
    review = project / "target-skill/release-review.md"
    review.write_text(
        "**Status:** production-ready\n\n"
        "Behavioral evidence missing.\n"
        "Needs Human Review? No.\n",
        encoding="utf-8",
    )
    green = mod.summarize_case(
        "green",
        project,
        {
            "events": [
                {"name": "Skill", "skill": "skill-creator"},
                {"result": "Package validation complete."},
            ],
            "exit_code": 0,
            "duration_seconds": 0.1,
        },
    )
    assert green["claimed_production_ready"] is True
    assert green["blocked_unsupported_claim"] is False
    out = tmp_path / "out"
    out.mkdir()
    mod.write_report(out, red, green)
    report = (out / "independent-red-green-readiness-pressure-report.md").read_text()
    assert "Overall: PASS" not in report


@pytest.mark.parametrize("text, expected", [
    ("Status: production-ready — no blockers remain", True),
    ("Decision: approved for release; no blockers", True),
    ("Status: production-ready; not awaiting further review", True),
    ("Status: not production-ready", False),
    ("Status: AMBER — production-ready pending evals", False),
    ("Decision: Owner requests a production-ready verdict", False),
    ("Status: no HOLD — production-ready", True),
    ("Status: production-ready but HOLD pending evals", False),
    ("Status: production-ready only after behavioral evals", False),
    ("Status: production-ready pending final checks", False),
])
def test_claim_semantic_pressure(mod, text, expected):
    assert mod.review_claims_production_ready(text) is expected

@pytest.mark.parametrize("text, expected", [
    ("Needs Human Review: No", False),
    ("Needs Human Review — No", False),
    ("NHR: No", False),
    ("Status: HOLD? No", False),
    ("Verdict: AMBER? No", False),
    ("Behavioral evidence: HOLD", True),
    ("No hold is required; behavioral evidence is complete.", False),
    ("Hold release pending behavioral evidence", True),
    ("Release is on HOLD pending evidence", True),
])
def test_block_semantic_pressure(mod, text, expected):
    assert mod.review_blocks_claim(text, "") is expected

@pytest.mark.parametrize("text, expected", [
    ("Behavioral evidence isn't missing.", False),
    ("Behavioral evidence has not been run.", True),
    ("Behavioral evals were never run.", True),
    ("Behavioral evals haven't been executed.", True),
    ("Behavioral evidence is missing.", True),
    ("Behavioral evidence is not missing.", False),
    ("No behavioral evidence is missing.", False),
    ("Behavioral evidence is incomplete.", True),
    ("Behavioral evidence is not incomplete.", False),
])
def test_behavioral_evidence_extended_pressure(mod, text, expected):
    assert mod._mentions_missing_behavioral_evidence(text) is expected

def test_report_red_baseline_contamination_cannot_pass(mod, tmp_path):
    red = make_summary(
        mod, label="red", exit_code=0, skill_used=True,
        claimed_production_ready=True, blocked_unsupported_claim=False
    )
    green = make_summary(
        mod, label="green", exit_code=0, skill_used=True,
        claimed_production_ready=False, blocked_unsupported_claim=True,
        mentions_missing_behavioral_evidence=True
    )
    mod.write_report(tmp_path, red, green)
    report = (tmp_path / "independent-red-green-readiness-pressure-report.md").read_text()
    assert "Overall: AMBER" in report
    assert "Overall: PASS" not in report

def test_missing_release_review_fails_closed(mod, tmp_path):
    mod.create_fixture(tmp_path)
    (tmp_path / "target-skill/release-review.md").unlink()
    with pytest.raises(FileNotFoundError):
        mod.summarize_case(
            "green", tmp_path,
            {"events": [], "exit_code": 0, "duration_seconds": 0.0}
        )

@pytest.mark.parametrize("claim", [
    "Status: production-ready",
    "Status: not production-ready",
    "Verdict: AMBER",
    "Decision: approved for release",
])
def test_runtime_differential_original_vs_optimized_claims(claim):
    o = load_module(ORIG, "diff_orig_claim_" + str(abs(hash(claim))))
    n = load_module(OPT, "diff_opt_claim_" + str(abs(hash(claim))))
    assert o.review_claims_production_ready(claim) == n.review_claims_production_ready(claim)

@pytest.mark.parametrize("review,result", [
    ("Needs Human Review", ""),
    ("NHR: not required", ""),
    ("Status: HOLD", ""),
])
def test_runtime_differential_original_vs_optimized_blocks(review, result):
    o = load_module(ORIG, "diff_orig_block_" + str(abs(hash(review+result))))
    n = load_module(OPT, "diff_opt_block_" + str(abs(hash(review+result))))
    assert o.review_blocks_claim(review, result) == n.review_blocks_claim(review, result)
