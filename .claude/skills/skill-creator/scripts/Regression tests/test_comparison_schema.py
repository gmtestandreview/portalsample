"""Regression coverage for the comparator's persisted JSON boundary."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path
from typing import Protocol, TypedDict, cast

from jsonschema import Draft202012Validator, ValidationError

SKILL_ROOT = Path(__file__).resolve().parents[2]


class ComparisonValidator(Protocol):
    """The single-argument validation boundary exercised by these tests."""

    def validate(self, instance: object) -> None: ...


class RubricSide(TypedDict):
    content: dict[str, float]
    structure: dict[str, float]
    content_score: float
    structure_score: float
    overall_score: float


class QualitySide(TypedDict):
    score: float
    strengths: list[str]
    weaknesses: list[str]


class ExpectationDetail(TypedDict):
    text: str
    passed: bool


class ExpectationSide(TypedDict):
    passed: int
    total: int
    pass_rate: float
    details: list[ExpectationDetail]


class DocumentedComparison(TypedDict):
    rubric: dict[str, RubricSide]
    output_quality: dict[str, QualitySide]
    expectation_results: dict[str, ExpectationSide]


class ComparisonSchemaTests(unittest.TestCase):
    def setUp(self) -> None:
        schema: dict[str, object] = json.loads(
            (SKILL_ROOT / "references/schemas/comparison.schema.json").read_text(encoding="utf-8")
        )
        Draft202012Validator.check_schema(schema)
        self.validator: ComparisonValidator = Draft202012Validator(schema)
        self.comparison: dict[str, object] = {
            "winner": "A",
            "reasoning": "A includes the required value that B omits.",
            "rubric": {
                "A": {
                    "content": {"correctness": 5},
                    "structure": {"usability": 4},
                    "content_score": 5,
                    "structure_score": 4,
                    "overall_score": 9,
                },
                "B": {
                    "content": {"correctness": 3},
                    "structure": {"usability": 4},
                    "content_score": 3,
                    "structure_score": 4,
                    "overall_score": 7,
                },
            },
            "output_quality": {
                "A": {"score": 9, "strengths": ["Required value present"], "weaknesses": []},
                "B": {"score": 7, "strengths": [], "weaknesses": ["Required value omitted"]},
            },
        }

    def test_comparison_without_expectations_is_valid(self) -> None:
        self.validator.validate(self.comparison)

    def test_comparison_with_complete_expectation_results_remains_valid(self) -> None:
        self.comparison["expectation_results"] = {
            "A": {
                "passed": 1,
                "total": 1,
                "pass_rate": 1,
                "details": [{"text": "Required value present", "passed": True}],
            },
            "B": {
                "passed": 0,
                "total": 1,
                "pass_rate": 0,
                "details": [{"text": "Required value present", "passed": False}],
            },
        }
        self.validator.validate(self.comparison)

    def test_optional_expectation_results_still_require_both_sides(self) -> None:
        self.comparison["expectation_results"] = {}
        with self.assertRaises(ValidationError):
            self.validator.validate(self.comparison)

    def test_tie_does_not_become_a_supported_winner(self) -> None:
        self.comparison["winner"] = "TIE"
        with self.assertRaises(ValidationError):
            self.validator.validate(self.comparison)

    def _documented_example(self) -> DocumentedComparison:
        document = (SKILL_ROOT / "agents/comparator.md").read_text(encoding="utf-8")
        match = re.search(r"```json\n(.*?)\n```", document, re.DOTALL)
        self.assertIsNotNone(match)
        assert match is not None
        example: object = json.loads(match.group(1))
        self.validator.validate(example)
        # Schema validation establishes these field types before typed access.
        return cast(DocumentedComparison, example)

    def test_documented_example_expectation_counts_match_details(self) -> None:
        example = self._documented_example()
        for side in ("A", "B"):
            with self.subTest(side=side):
                result = example["expectation_results"][side]
                self.assertEqual(result["total"], len(result["details"]))
                self.assertEqual(
                    result["passed"], sum(item["passed"] for item in result["details"])
                )
                self.assertAlmostEqual(result["pass_rate"], result["passed"] / result["total"])

    def test_documented_example_quality_scores_match_rubric(self) -> None:
        example = self._documented_example()
        for side in ("A", "B"):
            with self.subTest(side=side):
                rubric = example["rubric"][side]
                content = list(rubric["content"].values())
                structure = list(rubric["structure"].values())
                self.assertTrue(content)
                self.assertTrue(structure)
                content_mean = sum(content) / len(content)
                structure_mean = sum(structure) / len(structure)
                self.assertAlmostEqual(rubric["content_score"], round(content_mean, 1))
                self.assertAlmostEqual(rubric["structure_score"], round(structure_mean, 1))
                overall = round(content_mean + structure_mean, 1)
                self.assertAlmostEqual(rubric["overall_score"], overall)
                self.assertAlmostEqual(example["output_quality"][side]["score"], overall)

    def test_documented_example_uses_shared_rubric_keys(self) -> None:
        example = self._documented_example()
        for dimension in ("content", "structure"):
            self.assertEqual(
                set(example["rubric"]["A"][dimension]),
                set(example["rubric"]["B"][dimension]),
            )


if __name__ == "__main__":
    unittest.main()
