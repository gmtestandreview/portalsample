from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
MODULE_PATH = SCRIPTS_DIR / "run_early_exit_eval.py"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))
SPEC = importlib.util.spec_from_file_location("run_early_exit_eval_candidate", MODULE_PATH)
assert SPEC is not None
assert SPEC.loader is not None
probe = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = probe
SPEC.loader.exec_module(probe)


def _assistant(*tool_uses: tuple[str, dict[str, object]]) -> str:
    content = [
        {"type": "tool_use", "name": name, "input": tool_input} for name, tool_input in tool_uses
    ]
    return json.dumps({"type": "assistant", "message": {"content": content}})


class ParseStreamTests(unittest.TestCase):
    def test_skips_blank_and_malformed_lines(self) -> None:
        text = "\n" + _assistant(("Skill", {"skill": "x"})) + "\nnot json\n[1, 2]\n"

        events = probe.parse_stream(text)

        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["type"], "assistant")


class EngagedWorkflowTests(unittest.TestCase):
    def _engaged(self, *lines: str) -> bool:
        return probe.engaged_workflow(probe.parse_stream("\n".join(lines)))

    def test_skill_load_and_skill_md_read_alone_do_not_count(self) -> None:
        self.assertFalse(
            self._engaged(
                _assistant(("Skill", {"skill": "skill-creator"})),
                _assistant(("Read", {"file_path": "/p/.claude/skills/skill-creator/SKILL.md"})),
            )
        )

    def test_reading_a_reference_or_agent_file_counts(self) -> None:
        for path in (
            "/p/.claude/skills/skill-creator/references/authoring-craft.md",
            "C:\\p\\.claude\\skills\\skill-creator\\references\\workflows.md",
            "/p/.claude/skills/skill-creator/agents/grader.md",
        ):
            with self.subTest(path=path):
                self.assertTrue(self._engaged(_assistant(("Read", {"file_path": path}))))

    def test_running_a_skill_script_counts(self) -> None:
        for command in (
            "python -m scripts.quick_validate .",
            "python scripts/package_skill.py . out",
        ):
            with self.subTest(command=command):
                self.assertTrue(self._engaged(_assistant(("Bash", {"command": command}))))

    def test_unrelated_tool_use_does_not_count(self) -> None:
        self.assertFalse(
            self._engaged(
                _assistant(("Read", {"file_path": "/p/src/content-script.js"})),
                _assistant(("Bash", {"command": "ls src"})),
                json.dumps({"type": "result", "result": "done"}),
            )
        )

    def test_no_events_is_not_engaged(self) -> None:
        self.assertFalse(probe.engaged_workflow([]))


class CopySkillTests(unittest.TestCase):
    def test_full_skill_is_copied_without_dev_artifacts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "demo"
            for rel in (
                "SKILL.md",
                "references/a.md",
                "scripts/run.py",
                "evals/x.json",
                ".remember/n.md",
            ):
                path = source / rel
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("x", encoding="utf-8")
            project = Path(tmp) / "project"

            probe.copy_skill(source, project)

            skill_dir = project / ".claude" / "skills" / "demo"
            copied = sorted(
                p.relative_to(skill_dir).as_posix() for p in skill_dir.rglob("*") if p.is_file()
            )
            self.assertEqual(copied, ["SKILL.md", "references/a.md", "scripts/run.py"])


class CaseEvaluationTests(unittest.TestCase):
    def test_exit_expected_case_passes_when_engagement_rate_below_threshold(self) -> None:
        self.assertTrue(probe.case_passes(expect_engaged=False, engaged=0, completed=4))
        self.assertFalse(probe.case_passes(expect_engaged=False, engaged=2, completed=4))

    def test_control_case_requires_engagement(self) -> None:
        self.assertTrue(probe.case_passes(expect_engaged=True, engaged=3, completed=4))
        self.assertFalse(probe.case_passes(expect_engaged=True, engaged=0, completed=4))

    def test_no_completed_runs_never_passes(self) -> None:
        self.assertFalse(probe.case_passes(expect_engaged=False, engaged=0, completed=0))


if __name__ == "__main__":
    unittest.main()
