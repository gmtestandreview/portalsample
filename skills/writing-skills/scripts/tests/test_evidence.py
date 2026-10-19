"""Evidence publication and optional-dispatch contracts (V3 regression cases)."""

import hashlib
import json

import pytest
from click.testing import CliRunner

from skills_ref.cli import main


@pytest.fixture
def record(tmp_path):
    artifacts = []
    for role in ("candidate", "oracle", "rubric", "raw", "checkpoint"):
        path = tmp_path / f"{role}.md"
        path.write_text(f"Frozen {role}\n", encoding="utf-8")
        artifacts.append(
            {
                "id": role,
                "role": role,
                "path": path.name,
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            }
        )
    return {
        "run_id": "test-1",
        "controller": "writing-skills",
        "target": "target-skill",
        "acceptance_owner": "human owner",
        "revision": "frozen-1",
        "artifacts": artifacts,
        "environment": {
            "host": "synthetic",
            "interpreter": "Python test",
            "tool": "fixture",
            "tool_version": "1",
            "config": "default",
            "rules": "fixture",
            "file_count": 1,
        },
        "evaluation": {
            "evaluator": "test",
            "kind": "behavioral",
            "expected_case_ids": ["A", "B"],
            "cases": [
                {"id": "A", "status": "PASS", "passed": True, "evidence": "raw"},
                {"id": "B", "status": "NHR", "passed": None, "evidence": "raw"},
            ],
        },
        "summary": {"PASS": 1, "AMBER": 0, "FAIL": 0, "NHR": 1, "N/A": 0},
        "score": {"kind": "static", "value": 96, "operator": ">", "threshold": 95},
        "gates": {
            "static": "PASS",
            "behavioral": "NHR",
            "discovery": "NHR",
            "loading": "NHR",
            "application": "NHR",
            "artifact": "NHR",
            "runtime": "NHR",
            "delivery": "PASS",
        },
        "budget": {
            "optional_waves": 0,
            "max_optional_waves": 2,
            "remaining_capacity": 40,
            "closeout_reserve": 20,
            "uncertainty": "unresolved boundary",
            "acceptance_impact": "merge hold",
        },
        "telemetry": {
            "tokens": None,
            "cached_tokens": None,
            "agent_invocations": 1,
            "elapsed_seconds": 1,
        },
        "recommendation": "hold",
    }


def run_record(tmp_path, record, dispatch=False):
    path = tmp_path / "run.json"
    path.write_text(json.dumps(record), encoding="utf-8")
    args = ["validate-evidence", str(path)] + (["--dispatch"] if dispatch else [])
    return CliRunner().invoke(main, args)


def test_consistent_hold_is_valid_but_not_acceptance(tmp_path, record):
    result = run_record(tmp_path, record)
    assert result.exit_code == 0, result.output
    assert "hold" in result.output


@pytest.mark.parametrize("role", ["candidate", "oracle", "rubric", "raw", "checkpoint"])
def test_modified_artifact_rejects_stale_evidence(tmp_path, record, role):
    (tmp_path / f"{role}.md").write_text("changed", encoding="utf-8")
    result = run_record(tmp_path, record)
    assert result.exit_code == 1
    assert "hash" in result.output


def test_missing_raw_output_cannot_publish_pass(tmp_path, record):
    (tmp_path / "raw.md").unlink()
    result = run_record(tmp_path, record)
    assert result.exit_code == 1
    assert "raw" in result.output


def test_amber_cannot_be_counted_as_pass(tmp_path, record):
    record["evaluation"]["cases"][0].update(status="AMBER", passed=None)
    result = run_record(tmp_path, record)
    assert result.exit_code == 1
    assert "summary" in result.output


@pytest.mark.parametrize("value", [None, 1, "true", False])
def test_pass_requires_literal_true(tmp_path, record, value):
    record["evaluation"]["cases"][0]["passed"] = value
    assert run_record(tmp_path, record).exit_code == 1


def test_nhr_is_not_boolean_fail(tmp_path, record):
    record["evaluation"]["cases"][1]["passed"] = False
    assert run_record(tmp_path, record).exit_code == 1


def test_missing_case_cannot_inflate_result(tmp_path, record):
    record["evaluation"]["cases"].pop()
    record["summary"]["NHR"] = 0
    assert run_record(tmp_path, record).exit_code == 1


def test_duplicate_case_cannot_inflate_result(tmp_path, record):
    record["evaluation"]["cases"][1]["id"] = "A"
    assert run_record(tmp_path, record).exit_code == 1


def test_unbound_raw_reference_rejected(tmp_path, record):
    record["evaluation"]["cases"][0]["evidence"] = "candidate"
    assert run_record(tmp_path, record).exit_code == 1


@pytest.mark.parametrize(
    ("operator", "threshold", "expected"), [(">", 96, 1), (">", 95, 0), (">=", 96, 0)]
)
def test_exact_comparator_controls_deploy(tmp_path, record, operator, threshold, expected):
    record["evaluation"]["cases"][1].update(status="PASS", passed=True)
    record["summary"].update(PASS=2, NHR=0)
    record["gates"] = dict.fromkeys(record["gates"], "PASS")
    record["score"].update(operator=operator, threshold=threshold)
    record["recommendation"] = "deploy"
    assert run_record(tmp_path, record).exit_code == expected


def test_static_score_cannot_override_runtime_hold(tmp_path, record):
    record["recommendation"] = "deploy"
    result = run_record(tmp_path, record)
    assert result.exit_code == 1
    assert "deploy" in result.output


@pytest.mark.parametrize("value", [float("nan"), float("inf"), True, "96"])
def test_invalid_score_is_not_a_number(tmp_path, record, value):
    record["score"]["value"] = value
    assert run_record(tmp_path, record).exit_code == 1


def test_oversized_integer_is_a_controlled_error(tmp_path, record):
    record["score"]["value"] = 10**1000
    result = run_record(tmp_path, record)
    assert result.exit_code == 1
    assert isinstance(result.exception, SystemExit)


@pytest.mark.parametrize(
    ("literal", "operator", "expected"),
    [("95.999999999999999999", ">=", 1), ("96.000000000000000001", ">", 0)],
)
def test_literal_decimal_score_does_not_round_across_threshold(
    tmp_path, record, literal, operator, expected
):
    record["evaluation"]["cases"][1].update(status="PASS", passed=True)
    record["summary"].update(PASS=2, NHR=0)
    record["gates"] = dict.fromkeys(record["gates"], "PASS")
    record["score"].update(operator=operator, threshold=96)
    record["recommendation"] = "deploy"
    path = tmp_path / "run.json"
    path.write_text(
        json.dumps(record).replace('"value": 96', f'"value": {literal}'), encoding="utf-8"
    )
    result = CliRunner().invoke(main, ["validate-evidence", str(path)])
    assert result.exit_code == expected, result.output


def test_literal_capacity_just_above_reserve_is_not_rounded_down(tmp_path, record):
    path = tmp_path / "run.json"
    path.write_text(
        json.dumps(record).replace(
            '"remaining_capacity": 40', '"remaining_capacity": 20.000000000000000001'
        ),
        encoding="utf-8",
    )
    result = CliRunner().invoke(main, ["validate-evidence", str(path), "--dispatch"])
    assert result.exit_code == 0, result.output


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("remaining_capacity", None),
        ("remaining_capacity", 20),
        ("optional_waves", 2),
        ("uncertainty", ""),
        ("acceptance_impact", ""),
    ],
)
def test_optional_dispatch_requires_capacity_and_new_question(tmp_path, record, field, value):
    record["budget"][field] = value
    assert run_record(tmp_path, record, dispatch=True).exit_code == 1
    assert run_record(tmp_path, record).exit_code == 0


def test_optional_dispatch_accepts_focused_question_with_checkpoint(tmp_path, record):
    assert run_record(tmp_path, record, dispatch=True).exit_code == 0


def test_absent_usage_counters_remain_null(tmp_path, record):
    assert run_record(tmp_path, record).exit_code == 0
    record["telemetry"]["tokens"] = "estimated 1000"
    assert run_record(tmp_path, record).exit_code == 1


@pytest.mark.parametrize(
    "payload", ["[]", "null", "{", '{"run_id": 1}', '{"run_id":"a","run_id":"b"}']
)
def test_malformed_records_are_controlled_errors(tmp_path, payload):
    path = tmp_path / "run.json"
    path.write_text(payload, encoding="utf-8")
    result = CliRunner().invoke(main, ["validate-evidence", str(path)])
    assert result.exit_code == 1
    assert isinstance(result.exception, SystemExit)


def test_unsupported_winner_claim_is_rejected(tmp_path, record):
    record["winner"] = "with_skill"
    assert run_record(tmp_path, record).exit_code == 1


def test_environment_and_ownership_are_required(tmp_path, record):
    record["controller"] = "two owners"
    record["environment"]["file_count"] = 0
    assert run_record(tmp_path, record).exit_code == 1


def test_artifact_paths_stay_inside_evidence_bundle(tmp_path, record):
    record["artifacts"][0]["path"] = "../outside.md"
    assert run_record(tmp_path, record).exit_code == 1
