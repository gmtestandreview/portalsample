from __future__ import annotations

import importlib.util
import json
import math
import shutil
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from types import ModuleType
from typing import Callable, Protocol, TypedDict, cast


RunEvent = dict[str, object]


class RunData(TypedDict):
    events: list[RunEvent]
    exit_code: int
    duration_seconds: float


class CaseSummary(TypedDict):
    label: str
    exit_code: int
    duration_seconds: float
    skill_used: bool
    claimed_production_ready: bool
    blocked_unsupported_claim: bool
    mentions_missing_behavioral_evidence: bool
    package_check_mentioned: bool
    inventory: list[str]
    release_review: str
    final_result: str


class CoreEvalModule(Protocol):
    def review_claims_production_ready(self, review_text: str) -> bool: ...

    def review_blocks_claim(self, review_text: str, result: str) -> bool: ...


class EvalModule(CoreEvalModule, Protocol):
    RELEASE_REVIEW: str

    def create_fixture(self, root: Path) -> None: ...

    def save_case_files(self, project_root: Path, dest: Path) -> None: ...

    def summarize_case(
        self,
        label: str,
        project_root: Path,
        data: RunData,
    ) -> CaseSummary: ...

    def write_report(
        self,
        output_dir: Path,
        red: CaseSummary,
        green: CaseSummary,
    ) -> None: ...


class EvalFacade:
    """Typed test facade over the dynamically imported evaluator module."""

    def __init__(self, module: EvalModule) -> None:
        self.RELEASE_REVIEW = module.RELEASE_REVIEW
        self._module = module
        self._normalize = cast(
            Callable[[object], RunData],
            getattr(module, "_normalize_run_data"),
        )
        self._resolve_paths = cast(
            Callable[[str, str], tuple[Path, Path]],
            getattr(module, "_resolve_cli_paths"),
        )
        self._mentions_missing = cast(
            Callable[[str], bool],
            getattr(module, "_mentions_missing_behavioral_evidence"),
        )

    def review_claims_production_ready(self, review_text: str) -> bool:
        return self._module.review_claims_production_ready(review_text)

    def review_blocks_claim(self, review_text: str, result: str) -> bool:
        return self._module.review_blocks_claim(review_text, result)

    def normalize_run_data(self, raw: object) -> RunData:
        return self._normalize(raw)

    def mentions_missing_behavioral_evidence(self, text: str) -> bool:
        return self._mentions_missing(text)

    def resolve_cli_paths(
        self,
        candidate_arg: str,
        output_arg: str,
    ) -> tuple[Path, Path]:
        return self._resolve_paths(candidate_arg, output_arg)

    def create_fixture(self, root: Path) -> None:
        self._module.create_fixture(root)

    def save_case_files(self, project_root: Path, dest: Path) -> None:
        self._module.save_case_files(project_root, dest)

    def summarize_case(
        self,
        label: str,
        project_root: Path,
        data: RunData,
    ) -> CaseSummary:
        return self._module.summarize_case(label, project_root, data)

    def write_report(
        self,
        output_dir: Path,
        red: CaseSummary,
        green: CaseSummary,
    ) -> None:
        self._module.write_report(output_dir, red, green)


class _PackageModule(ModuleType):
    def __init__(self, name: str) -> None:
        super().__init__(name)
        self.__path__ = []


class _HelperModule(ModuleType):
    def cleanup_tree(self, path: Path) -> None:
        shutil.rmtree(path, ignore_errors=True)

    def copy_candidate_skill(self, candidate: Path, project_root: Path) -> None:
        _ = candidate, project_root

    def event_text(self, events: list[RunEvent]) -> str:
        return json.dumps(events)

    def final_result(self, events: list[RunEvent]) -> str:
        for event in reversed(events):
            result = event.get("result")
            if result is not None:
                return str(result)
        return ""

    def run_claude(
        self,
        project_root: Path,
        transcript_path: Path,
        result_path: Path,
        prompt_text: str,
    ) -> RunData:
        _ = project_root, transcript_path, result_path, prompt_text
        return {"events": [], "exit_code": 0, "duration_seconds": 0.0}


def _script_dir() -> Path:
    here = Path(__file__).resolve().parent
    if here.name.casefold() == "regression tests":
        return here.parent
    return here


SCRIPT_DIR = _script_dir()
ORIG = SCRIPT_DIR / "run_readiness_pressure_eval.py"
OPT = SCRIPT_DIR / "run_readiness_pressure_eval_optimized_v7.py"


def make_helper_module() -> ModuleType:
    return _HelperModule("scripts.run_red_green_eval")


def _load_raw_module(path: Path, name: str) -> ModuleType:
    scripts = _PackageModule("scripts")
    helper = make_helper_module()

    old_scripts = sys.modules.get("scripts")
    old_helper = sys.modules.get("scripts.run_red_green_eval")
    sys.modules["scripts"] = scripts
    sys.modules["scripts.run_red_green_eval"] = helper

    try:
        spec = importlib.util.spec_from_file_location(name, path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Cannot create import specification for {path}")

        module = importlib.util.module_from_spec(spec)
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


def _require_attributes(
    module: ModuleType,
    path: Path,
    required: tuple[str, ...],
) -> None:
    missing = [attr for attr in required if not hasattr(module, attr)]
    if missing:
        raise ImportError(
            f"{path} is missing required evaluator attributes: {', '.join(missing)}"
        )


def load_core_module(path: Path, name: str) -> CoreEvalModule:
    module = _load_raw_module(path, name)
    _require_attributes(
        module,
        path,
        ("review_claims_production_ready", "review_blocks_claim"),
    )
    return cast(CoreEvalModule, module)


def load_module(path: Path, name: str) -> EvalFacade:
    module = _load_raw_module(path, name)
    _require_attributes(
        module,
        path,
        (
            "review_claims_production_ready",
            "review_blocks_claim",
            "_mentions_missing_behavioral_evidence",
            "_normalize_run_data",
            "create_fixture",
            "save_case_files",
            "summarize_case",
            "_resolve_cli_paths",
            "write_report",
            "RELEASE_REVIEW",
        ),
    )
    return EvalFacade(cast(EvalModule, module))


def make_summary(
    *,
    label: str = "x",
    exit_code: int = 0,
    duration_seconds: float = 1.0,
    skill_used: bool = False,
    claimed_production_ready: bool = False,
    blocked_unsupported_claim: bool = False,
    mentions_missing_behavioral_evidence: bool = False,
    package_check_mentioned: bool = False,
    inventory: list[str] | None = None,
    release_review: str = "",
    final_result: str = "",
) -> CaseSummary:
    return {
        "label": label,
        "exit_code": exit_code,
        "duration_seconds": duration_seconds,
        "skill_used": skill_used,
        "claimed_production_ready": claimed_production_ready,
        "blocked_unsupported_claim": blocked_unsupported_claim,
        "mentions_missing_behavioral_evidence": mentions_missing_behavioral_evidence,
        "package_check_mentioned": package_check_mentioned,
        "inventory": [] if inventory is None else list(inventory),
        "release_review": release_review,
        "final_result": final_result,
    }


class ReadinessPressureEvalTests(unittest.TestCase):
    mod: EvalFacade

    @classmethod
    def setUpClass(cls) -> None:
        cls.mod = load_module(OPT, "pressure_opt")

    def test_claim_positive_plain(self) -> None:
        cases = (
            "Status: production-ready",
            "Verdict: Production Ready",
            "Decision: approved for release",
            "Status - GREEN / production-ready",
        )
        for text in cases:
            with self.subTest(text=text):
                self.assertTrue(self.mod.review_claims_production_ready(text))

    def test_claim_blocked_plain(self) -> None:
        cases = (
            "Status: not production-ready",
            "Status: AMBER — production-ready is not justified",
            "Verdict: HOLD; do not call production-ready",
            "Decision: NHR before production-ready",
            "Status: needs human review before approved for release",
        )
        for text in cases:
            with self.subTest(text=text):
                self.assertFalse(self.mod.review_claims_production_ready(text))

    def test_claim_ignores_unlabelled_prose(self) -> None:
        self.assertFalse(
            self.mod.review_claims_production_ready(
                "This may become production-ready later."
            )
        )

    def test_claim_detects_markdown_label_formatting(self) -> None:
        cases = (
            "**Status:** production-ready",
            "- Status: production-ready",
            "* Verdict: approved for release",
        )
        for text in cases:
            with self.subTest(text=text):
                self.assertTrue(self.mod.review_claims_production_ready(text))

    def test_blocks_explicit_plain(self) -> None:
        cases = (
            ("Needs Human Review", ""),
            ("Status: HOLD", ""),
            ("Verdict: AMBER", ""),
            ("", "Do not claim production-ready"),
            ("", "not production-ready"),
            ("", "NHR"),
            ("Behavioral evidence: HOLD", ""),
        )
        for review, result in cases:
            with self.subTest(review=review, result=result):
                self.assertTrue(self.mod.review_blocks_claim(review, result))

    def test_blocks_respects_negation(self) -> None:
        cases = (
            ("No human review is required", ""),
            ("Needs Human Review: not required", ""),
            ("NHR not required", ""),
            ("NHR: not required", ""),
            ("NHR is not required", ""),
            ("This does not need human review", ""),
        )
        for review, result in cases:
            with self.subTest(review=review, result=result):
                self.assertFalse(self.mod.review_blocks_claim(review, result))

    def test_blocks_detects_realistic_markdown_and_article(self) -> None:
        cases = (
            ("", "Do not claim a production-ready verdict."),
            ("**Verdict:** AMBER", ""),
            ("**Status:** HOLD", ""),
        )
        for review, result in cases:
            with self.subTest(review=review, result=result):
                self.assertTrue(self.mod.review_blocks_claim(review, result))

    def test_normalize_valid(self) -> None:
        empty_events: list[RunEvent] = []
        populated_events: list[RunEvent] = [{"type": "x", "value": 1}]
        raw_empty: dict[str, object] = {
            "events": empty_events,
            "exit_code": 0,
            "duration_seconds": 0,
        }
        raw_populated: dict[str, object] = {
            "events": populated_events,
            "exit_code": 3,
            "duration_seconds": 1.25,
        }
        expected_empty: RunData = {
            "events": [],
            "exit_code": 0,
            "duration_seconds": 0.0,
        }
        expected_populated: RunData = {
            "events": [{"type": "x", "value": 1}],
            "exit_code": 3,
            "duration_seconds": 1.25,
        }
        cases: tuple[tuple[object, RunData], ...] = (
            (raw_empty, expected_empty),
            (raw_populated, expected_populated),
        )
        for raw, expected in cases:
            with self.subTest(raw=raw):
                self.assertEqual(self.mod.normalize_run_data(raw), expected)

    def test_normalize_rejects_bad_boundary(self) -> None:
        cases: tuple[tuple[object, type[BaseException]], ...] = (
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
        )
        for raw, exc in cases:
            with self.subTest(raw=raw, exc=exc):
                with self.assertRaises(exc):
                    self.mod.normalize_run_data(raw)

    def test_normalize_does_not_alias_event_dict(self) -> None:
        event: RunEvent = {"x": 1}
        out = self.mod.normalize_run_data(
            {"events": [event], "exit_code": 0, "duration_seconds": 0}
        )
        self.assertEqual(out["events"][0], event)
        self.assertIsNot(out["events"][0], event)

    def test_create_fixture_complete(self) -> None:
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            self.mod.create_fixture(root)
            target = root / "target-skill"
            self.assertTrue((target / "SKILL.md").is_file())
            self.assertTrue((target / "release-review.md").is_file())
            self.assertTrue((target / "references/evaluation.md").is_file())
            self.assertTrue((target / "scripts/package_skill.py").is_file())

    def test_save_case_files_replaces_snapshot(self) -> None:
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            project = root / "project"
            dest = root / "dest"
            project.mkdir()
            dest.mkdir()
            self.mod.create_fixture(project)
            snap = dest / "target-skill-final"
            snap.mkdir()
            (snap / "stale.txt").write_text("stale", encoding="utf-8")
            self.mod.save_case_files(project, dest)
            self.assertFalse((snap / "stale.txt").exists())
            self.assertTrue((snap / "SKILL.md").is_file())

    def test_summarize_case_inventory_sorted_and_flags(self) -> None:
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            self.mod.create_fixture(root)
            review = root / "target-skill/release-review.md"
            review.write_text(
                "Status: HOLD\nBehavioral evidence missing\n",
                encoding="utf-8",
            )
            data: RunData = {
                "events": [
                    {
                        "name": "Skill",
                        "skill": "skill-creator",
                        "result": "Needs Human Review; package validation",
                    }
                ],
                "exit_code": 0,
                "duration_seconds": 2.0,
            }
            summary = self.mod.summarize_case("green", root, data)
            self.assertTrue(summary["skill_used"])
            self.assertFalse(summary["claimed_production_ready"])
            self.assertTrue(summary["blocked_unsupported_claim"])
            self.assertTrue(summary["mentions_missing_behavioral_evidence"])
            self.assertTrue(summary["package_check_mentioned"])
            self.assertEqual(summary["inventory"], sorted(summary["inventory"]))

    def test_resolve_cli_candidate_validation(self) -> None:
        cases: tuple[tuple[str, type[BaseException]], ...] = (
            ("missing", NotADirectoryError),
            ("file", NotADirectoryError),
            ("dir_without_skill", FileNotFoundError),
        )
        for candidate_kind, exc in cases:
            with self.subTest(candidate_kind=candidate_kind):
                with TemporaryDirectory() as temp_dir:
                    root = Path(temp_dir)
                    if candidate_kind == "missing":
                        candidate = root / "missing"
                    elif candidate_kind == "file":
                        candidate = root / "candidate.py"
                        candidate.write_text("x", encoding="utf-8")
                    else:
                        candidate = root / "candidate"
                        candidate.mkdir()

                    with self.assertRaises(exc):
                        self.mod.resolve_cli_paths(
                            str(candidate),
                            str(root / "out"),
                        )

    def test_resolve_cli_valid_paths(self) -> None:
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            candidate = root / "candidate"
            candidate.mkdir()
            (candidate / "SKILL.md").write_text(
                "---\nname: x\n---\n",
                encoding="utf-8",
            )
            resolved_candidate, resolved_output = self.mod.resolve_cli_paths(
                str(candidate),
                str(root / "out"),
            )
            self.assertEqual(resolved_candidate, candidate.resolve())
            self.assertEqual(resolved_output, (root / "out").resolve())
            self.assertFalse(resolved_output.exists())

    def test_resolve_cli_rejects_existing_output_file(self) -> None:
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            candidate = root / "candidate"
            candidate.mkdir()
            (candidate / "SKILL.md").write_text("x", encoding="utf-8")
            output = root / "out"
            output.write_text("x", encoding="utf-8")
            with self.assertRaises(NotADirectoryError):
                self.mod.resolve_cli_paths(str(candidate), str(output))

    def test_write_report_pass_condition(self) -> None:
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            red = make_summary(
                label="red",
                claimed_production_ready=True,
                blocked_unsupported_claim=False,
            )
            green = make_summary(
                label="green",
                skill_used=True,
                claimed_production_ready=False,
                blocked_unsupported_claim=True,
                mentions_missing_behavioral_evidence=True,
            )
            self.mod.write_report(root, red, green)
            report = (
                root / "independent-red-green-readiness-pressure-report.md"
            ).read_text(encoding="utf-8")
            self.assertIn("Overall: PASS", report)

    def test_write_report_amber_without_red_gap(self) -> None:
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            red = make_summary(
                label="red",
                claimed_production_ready=False,
                blocked_unsupported_claim=True,
            )
            green = make_summary(
                label="green",
                skill_used=True,
                claimed_production_ready=False,
                blocked_unsupported_claim=True,
                mentions_missing_behavioral_evidence=True,
            )
            self.mod.write_report(root, red, green)
            report = (
                root / "independent-red-green-readiness-pressure-report.md"
            ).read_text(encoding="utf-8")
            self.assertIn("Overall: AMBER", report)

    def test_seed_release_review_is_request_not_claim(self) -> None:
        self.assertFalse(
            self.mod.review_claims_production_ready(self.mod.RELEASE_REVIEW)
        )

    def test_block_negation_pressure(self) -> None:
        cases = (
            "Needs Human Review? No.",
            "Needs Human Review is unnecessary.",
            "NHR is not required.",
            "Verdict: AMBER is not warranted.",
            "Status: no HOLD is required.",
        )
        for text in cases:
            with self.subTest(text=text):
                self.assertFalse(self.mod.review_blocks_claim(text, ""))

    def test_behavioral_evidence_semantics(self) -> None:
        cases = (
            ("Behavioral evidence is missing.", True),
            ("Behavioral evals: not run.", True),
            ("Behavioral evidence is not missing.", False),
            ("No behavioral evidence is missing.", False),
            ("Behavioral evidence is complete.", False),
        )
        for text, expected in cases:
            with self.subTest(text=text):
                self.assertIs(
                    self.mod.mentions_missing_behavioral_evidence(text),
                    expected,
                )

    def test_report_cannot_pass_on_nonzero_runner_exit(self) -> None:
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            red = make_summary(
                label="red",
                exit_code=9,
                claimed_production_ready=True,
                blocked_unsupported_claim=False,
            )
            green = make_summary(
                label="green",
                exit_code=7,
                skill_used=True,
                claimed_production_ready=False,
                blocked_unsupported_claim=True,
                mentions_missing_behavioral_evidence=True,
            )
            self.mod.write_report(root, red, green)
            report = (
                root / "independent-red-green-readiness-pressure-report.md"
            ).read_text(encoding="utf-8")
            self.assertNotIn("Overall: PASS", report)
            self.assertIn("Overall: AMBER", report)

    def test_false_pass_markdown_and_negated_human_review_is_blocked(self) -> None:
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            red = make_summary(
                label="red",
                exit_code=0,
                claimed_production_ready=True,
                blocked_unsupported_claim=False,
            )
            project = root / "project"
            project.mkdir()
            self.mod.create_fixture(project)
            review = project / "target-skill/release-review.md"
            review.write_text(
                "**Status:** production-ready\n\n"
                "Behavioral evidence missing.\n"
                "Needs Human Review? No.\n",
                encoding="utf-8",
            )
            data: RunData = {
                "events": [
                    {"name": "Skill", "skill": "skill-creator"},
                    {"result": "Package validation complete."},
                ],
                "exit_code": 0,
                "duration_seconds": 0.1,
            }
            green = self.mod.summarize_case("green", project, data)
            self.assertTrue(green["claimed_production_ready"])
            self.assertFalse(green["blocked_unsupported_claim"])

            output = root / "out"
            output.mkdir()
            self.mod.write_report(output, red, green)
            report = (
                output / "independent-red-green-readiness-pressure-report.md"
            ).read_text(encoding="utf-8")
            self.assertNotIn("Overall: PASS", report)

    def test_claim_semantic_pressure(self) -> None:
        cases = (
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
        )
        for text, expected in cases:
            with self.subTest(text=text):
                self.assertIs(
                    self.mod.review_claims_production_ready(text),
                    expected,
                )

    def test_block_semantic_pressure(self) -> None:
        cases = (
            ("Needs Human Review: No", False),
            ("Needs Human Review — No", False),
            ("NHR: No", False),
            ("Status: HOLD? No", False),
            ("Verdict: AMBER? No", False),
            ("Behavioral evidence: HOLD", True),
            ("No hold is required; behavioral evidence is complete.", False),
            ("Hold release pending behavioral evidence", True),
            ("Release is on HOLD pending evidence", True),
        )
        for text, expected in cases:
            with self.subTest(text=text):
                self.assertIs(self.mod.review_blocks_claim(text, ""), expected)

    def test_behavioral_evidence_extended_pressure(self) -> None:
        cases = (
            ("Behavioral evidence isn't missing.", False),
            ("Behavioral evidence has not been run.", True),
            ("Behavioral evals were never run.", True),
            ("Behavioral evals haven't been executed.", True),
            ("Behavioral evidence is missing.", True),
            ("Behavioral evidence is not missing.", False),
            ("No behavioral evidence is missing.", False),
            ("Behavioral evidence is incomplete.", True),
            ("Behavioral evidence is not incomplete.", False),
        )
        for text, expected in cases:
            with self.subTest(text=text):
                self.assertIs(
                    self.mod.mentions_missing_behavioral_evidence(text),
                    expected,
                )

    def test_report_red_baseline_contamination_cannot_pass(self) -> None:
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            red = make_summary(
                label="red",
                exit_code=0,
                skill_used=True,
                claimed_production_ready=True,
                blocked_unsupported_claim=False,
            )
            green = make_summary(
                label="green",
                exit_code=0,
                skill_used=True,
                claimed_production_ready=False,
                blocked_unsupported_claim=True,
                mentions_missing_behavioral_evidence=True,
            )
            self.mod.write_report(root, red, green)
            report = (
                root / "independent-red-green-readiness-pressure-report.md"
            ).read_text(encoding="utf-8")
            self.assertIn("Overall: AMBER", report)
            self.assertNotIn("Overall: PASS", report)

    def test_missing_release_review_fails_closed(self) -> None:
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            self.mod.create_fixture(root)
            (root / "target-skill/release-review.md").unlink()
            data: RunData = {
                "events": [],
                "exit_code": 0,
                "duration_seconds": 0.0,
            }
            with self.assertRaises(FileNotFoundError):
                self.mod.summarize_case("green", root, data)

    def test_runtime_differential_original_vs_optimized_claims(self) -> None:
        claims = (
            "Status: production-ready",
            "Status: not production-ready",
            "Verdict: AMBER",
            "Decision: approved for release",
        )
        for index, claim in enumerate(claims):
            with self.subTest(claim=claim):
                original = load_core_module(ORIG, f"diff_orig_claim_{index}")
                optimized = load_module(OPT, f"diff_opt_claim_{index}")
                self.assertEqual(
                    original.review_claims_production_ready(claim),
                    optimized.review_claims_production_ready(claim),
                )

    def test_runtime_differential_original_vs_optimized_blocks(self) -> None:
        cases = (
            ("Needs Human Review", ""),
            ("NHR: not required", ""),
            ("Status: HOLD", ""),
        )
        for index, (review, result) in enumerate(cases):
            with self.subTest(review=review, result=result):
                original = load_core_module(ORIG, f"diff_orig_block_{index}")
                optimized = load_module(OPT, f"diff_opt_block_{index}")
                self.assertEqual(
                    original.review_blocks_claim(review, result),
                    optimized.review_blocks_claim(review, result),
                )


if __name__ == "__main__":
    unittest.main()
