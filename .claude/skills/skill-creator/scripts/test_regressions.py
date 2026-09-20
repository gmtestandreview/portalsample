"""Regression tests for skill-creator helper scripts."""

from __future__ import annotations

import ast
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from typing import TYPE_CHECKING
from unittest.mock import patch

if TYPE_CHECKING:
    import aggregate_benchmark
    import run_eval
    import run_red_green_eval
    from utils import parse_skill_md
elif __package__:
    from . import aggregate_benchmark, run_eval, run_red_green_eval
    from .utils import parse_skill_md
else:
    import aggregate_benchmark
    import run_eval
    import run_red_green_eval
    from utils import parse_skill_md

SCRIPTS_DIR = Path(__file__).resolve().parent


class CompatibilityTests(unittest.TestCase):
    def test_aggregate_benchmark_uses_python_310_compatible_utc(self) -> None:
        tree = ast.parse((SCRIPTS_DIR / "aggregate_benchmark.py").read_text(encoding="utf-8"))

        datetime_imports = [
            alias.name
            for node in ast.walk(tree)
            if isinstance(node, ast.ImportFrom) and node.module == "datetime"
            for alias in node.names
        ]

        self.assertNotIn("UTC", datetime_imports)
        self.assertIn("timezone", datetime_imports)


class ScriptEntrypointTests(unittest.TestCase):
    def test_scripts_with_shebangs_are_directly_executable_for_help(self) -> None:
        scripts = [
            "run_eval.py",
            "package_skill.py",
            "run_loop.py",
            "improve_description.py",
            "run_readiness_pressure_eval.py",
            "test_regressions.py",
        ]

        for script in scripts:
            with self.subTest(script=script):
                result = subprocess.run(
                    [sys.executable, str(SCRIPTS_DIR / script), "--help"],
                    capture_output=True,
                    text=True,
                    check=False,
                )

                self.assertEqual(result.returncode, 0, result.stderr)


class SkillMdParserTests(unittest.TestCase):
    def test_empty_skill_md_reports_frontmatter_error(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            skill_dir = Path(tmp)
            (skill_dir / "SKILL.md").write_text("", encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "frontmatter"):
                parse_skill_md(skill_dir)


class AggregateBenchmarkTests(unittest.TestCase):
    def test_malformed_run_directory_is_skipped(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            benchmark_dir = Path(tmp)
            run_dir = benchmark_dir / "eval-1" / "with_skill" / "run-latest"
            run_dir.mkdir(parents=True)
            (run_dir / "grading.json").write_text(
                '{"summary": {"pass_rate": 1.0, "passed": 1, "failed": 0, "total": 1}}',
                encoding="utf-8",
            )

            results = aggregate_benchmark.load_run_results(benchmark_dir)

            self.assertEqual(results.get("with_skill"), [])

    def test_explicit_zero_duration_is_not_replaced_by_timing_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            benchmark_dir = Path(tmp)
            run_dir = benchmark_dir / "eval-1" / "with_skill" / "run-1"
            run_dir.mkdir(parents=True)
            (run_dir / "grading.json").write_text(
                (
                    '{"summary": {"pass_rate": 1.0, "passed": 1, "failed": 0, "total": 1}, '
                    '"timing": {"total_duration_seconds": 0.0}}'
                ),
                encoding="utf-8",
            )
            (run_dir / "timing.json").write_text(
                '{"total_duration_seconds": 12.5, "total_tokens": 100}',
                encoding="utf-8",
            )

            results = aggregate_benchmark.load_run_results(benchmark_dir)

            result = results["with_skill"][0]
            self.assertIn("time_seconds", result)
            self.assertEqual(result.get("time_seconds"), 0.0)


class RunEvalValidationTests(unittest.TestCase):
    def test_invalid_should_trigger_is_reported_as_value_error(self) -> None:
        eval_set = [{"query": "Create a useful skill", "should_trigger": "yes"}]

        with self.assertRaises(ValueError):
            run_eval._validate_eval_set(  # pyright: ignore[reportPrivateUsage]
                eval_set,
                runs_per_query=1,
                trigger_threshold=0.5,
            )


class RunEvalRegistrationTests(unittest.TestCase):
    def test_run_single_query_registers_temp_agent_skill_not_slash_command(self) -> None:
        class FakeUuid:
            hex = "1234567890abcdef"

        class FakeStdout:
            def __init__(self) -> None:
                self._lines = [b'{"type":"result","is_error":false}\n', b""]

            def readline(self) -> bytes:
                return self._lines.pop(0)

        class FakeProcess:
            stdout = FakeStdout()
            returncode = 0

            def poll(self) -> int:
                return 0

            def kill(self) -> None:
                raise AssertionError("process should not need to be killed")

            def wait(self) -> int:
                return 0

        def fake_popen(
            cmd: list[str],
            *_args: object,
            **kwargs: object,
        ) -> FakeProcess:
            cwd = kwargs.get("cwd")
            if not isinstance(cwd, str):
                raise AssertionError("expected subprocess cwd to be a string")
            root = Path(cwd)
            skill_md = root / ".claude" / "skills" / "example-skill-12345678" / "SKILL.md"
            command_file = root / ".claude" / "commands" / "example-skill-12345678.md"
            self.assertNotEqual(root, project_root)
            self.assertTrue(skill_md.is_file())
            self.assertFalse(command_file.exists())
            self.assertIn("--setting-sources", cmd)
            self.assertEqual(cmd[cmd.index("--setting-sources") + 1], "project")
            return FakeProcess()

        with tempfile.TemporaryDirectory() as tmp:
            project_root = Path(tmp)
            (project_root / ".claude").mkdir()
            with (
                patch.object(run_eval.uuid, "uuid4", return_value=FakeUuid()),
                patch.object(run_eval.subprocess, "Popen", side_effect=fake_popen),
            ):
                triggered = run_eval.run_single_query(
                    query="Create an Agent Skill",
                    skill_name="example",
                    skill_description="Use when creating Agent Skills.",
                    timeout=5,
                    project_root=str(project_root),
                )

            self.assertFalse(triggered)
            self.assertFalse((project_root / ".claude" / "skills").exists())
            self.assertFalse((project_root / ".claude" / "commands").exists())

    def test_run_single_query_ignores_partial_assistant_snapshots_before_tool_use(self) -> None:
        class FakeUuid:
            hex = "1234567890abcdef"

        class FakeStdout:
            def __init__(self) -> None:
                self._lines = [
                    b'{"type":"assistant","message":{"content":[{"type":"thinking","thinking":"checking"}]}}\n',
                    (
                        b'{"type":"assistant","message":{"content":[{"type":"tool_use",'
                        b'"name":"Skill","input":{"skill":"example-skill-12345678"}}]}}\n'
                    ),
                    b"",
                ]

            def readline(self) -> bytes:
                return self._lines.pop(0)

        class FakeProcess:
            stdout = FakeStdout()
            returncode = 0

            def poll(self) -> int:
                return 0

            def kill(self) -> None:
                raise AssertionError("process should not need to be killed")

            def wait(self) -> int:
                return 0

        with tempfile.TemporaryDirectory() as tmp:
            project_root = Path(tmp)
            (project_root / ".claude").mkdir()
            with (
                patch.object(run_eval.uuid, "uuid4", return_value=FakeUuid()),
                patch.object(run_eval.subprocess, "Popen", return_value=FakeProcess()),
            ):
                triggered = run_eval.run_single_query(
                    query="Create an Agent Skill",
                    skill_name="example",
                    skill_description="Use when creating Agent Skills.",
                    timeout=5,
                    project_root=str(project_root),
                )

            self.assertTrue(triggered)

    def test_run_single_query_preserves_claude_error_details(self) -> None:
        class FakeUuid:
            hex = "1234567890abcdef"

        class FakeStdout:
            def __init__(self) -> None:
                self._lines = [
                    (
                        b'{"type":"result","is_error":true,"api_error_status":429,'
                        b'"result":"You have hit your limit"}\n'
                    ),
                    b"",
                ]

            def readline(self) -> bytes:
                return self._lines.pop(0)

        class FakeProcess:
            stdout = FakeStdout()
            returncode = 0

            def poll(self) -> int:
                return 0

            def kill(self) -> None:
                raise AssertionError("process should not need to be killed")

            def wait(self) -> int:
                return 0

        with tempfile.TemporaryDirectory() as tmp:
            project_root = Path(tmp)
            (project_root / ".claude").mkdir()
            with (
                patch.object(run_eval.uuid, "uuid4", return_value=FakeUuid()),
                patch.object(run_eval.subprocess, "Popen", return_value=FakeProcess()),
                self.assertRaisesRegex(RuntimeError, "429: You have hit your limit"),
            ):
                run_eval.run_single_query(
                    query="Create an Agent Skill",
                    skill_name="example",
                    skill_description="Use when creating Agent Skills.",
                    timeout=5,
                    project_root=str(project_root),
                )

    def test_run_single_query_detects_top_level_stream_events(self) -> None:
        class FakeUuid:
            hex = "1234567890abcdef"

        class FakeStdout:
            def __init__(self) -> None:
                self._lines = [
                    (
                        b'{"type":"content_block_start","content_block":'
                        b'{"type":"tool_use","name":"Skill","input":{}}}\n'
                    ),
                    (
                        b'{"type":"content_block_delta","delta":{"type":"input_json_delta",'
                        b'"partial_json":"{\\"skill\\": \\"example-skill-12345678\\"}"}}\n'
                    ),
                    b'{"type":"content_block_stop"}\n',
                    b"",
                ]

            def readline(self) -> bytes:
                return self._lines.pop(0)

        class FakeProcess:
            stdout = FakeStdout()
            returncode = 0

            def poll(self) -> int:
                return 0

            def kill(self) -> None:
                raise AssertionError("process should not need to be killed")

            def wait(self, timeout: int | None = None) -> int:
                return 0

        with tempfile.TemporaryDirectory() as tmp:
            project_root = Path(tmp)
            (project_root / ".claude").mkdir()
            with (
                patch.object(run_eval.uuid, "uuid4", return_value=FakeUuid()),
                patch.object(run_eval.subprocess, "Popen", return_value=FakeProcess()),
            ):
                triggered = run_eval.run_single_query(
                    query="Create an Agent Skill",
                    skill_name="example",
                    skill_description="Use when creating Agent Skills.",
                    timeout=5,
                    project_root=str(project_root),
                )

            self.assertTrue(triggered)

    def test_run_single_query_waits_after_unrelated_tool_message_stop(self) -> None:
        class FakeUuid:
            hex = "1234567890abcdef"

        class FakeStdout:
            def __init__(self) -> None:
                self._lines = [
                    (
                        b'{"type":"assistant","message":{"content":[{"type":"tool_use",'
                        b'"name":"Glob","input":{"pattern":"**/SKILL.md"}}]}}\n'
                    ),
                    b'{"type":"message_stop"}\n',
                    (
                        b'{"type":"assistant","message":{"content":[{"type":"tool_use",'
                        b'"name":"Read","input":{"file_path":'
                        b'"C:/tmp/.claude/skills/example-skill-12345678/SKILL.md"}}]}}\n'
                    ),
                    b"",
                ]

            def readline(self) -> bytes:
                return self._lines.pop(0)

        class FakeProcess:
            stdout = FakeStdout()
            returncode = 0

            def poll(self) -> int:
                return 0

            def kill(self) -> None:
                raise AssertionError("process should not need to be killed")

            def wait(self, timeout: int | None = None) -> int:
                return 0

        with tempfile.TemporaryDirectory() as tmp:
            project_root = Path(tmp)
            (project_root / ".claude").mkdir()
            with (
                patch.object(run_eval.uuid, "uuid4", return_value=FakeUuid()),
                patch.object(run_eval.subprocess, "Popen", return_value=FakeProcess()),
            ):
                triggered = run_eval.run_single_query(
                    query="Refactor this SKILL.md",
                    skill_name="example",
                    skill_description="Use when creating Agent Skills.",
                    timeout=5,
                    project_root=str(project_root),
                )

            self.assertTrue(triggered)


class RedGreenEvalTests(unittest.TestCase):
    def test_run_claude_terminates_process_tree_on_timeout(self) -> None:
        class FakeProcess:
            returncode = None

            def __init__(self) -> None:
                self.communicate_calls = 0

            def communicate(self, timeout: int | None = None) -> tuple[str, str]:
                self.communicate_calls += 1
                if self.communicate_calls == 1:
                    raise subprocess.TimeoutExpired(["claude"], timeout or 0)
                return "", "timed out"

        fake_process = FakeProcess()

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            transcript_path = root / "transcript.jsonl"
            stderr_path = root / "stderr.txt"
            with (
                patch.object(run_red_green_eval.subprocess, "Popen", return_value=fake_process),
                patch.object(run_red_green_eval, "_terminate_process_tree") as terminate,
                self.assertRaisesRegex(TimeoutError, "exceeded 360s"),
            ):
                run_red_green_eval.run_claude(  # pyright: ignore[reportUnknownMemberType]
                    root,
                    transcript_path,
                    stderr_path,
                )

        terminate.assert_called_once_with(fake_process)


def _find_subprocess_call(filename: str, func_name: str) -> ast.Call:
    tree = ast.parse((SCRIPTS_DIR / filename).read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and node.func.attr == func_name
            and isinstance(node.func.value, ast.Name)
            and node.func.value.id == "subprocess"
        ):
            return node
    raise AssertionError(f"no subprocess.{func_name} call found in {filename}")


class WindowsClaudeCliInvocationTests(unittest.TestCase):
    """npm installs `claude` as claude.cmd/.ps1 on Windows. CreateProcess
    cannot launch those directly, so subprocess.Popen(["claude", ...]) fails
    with WinError 2 even though shutil.which("claude") finds it. Both call
    sites must pass shell= so cmd.exe resolves the shim."""

    def test_run_eval_popen_passes_shell_kwarg(self) -> None:
        call = _find_subprocess_call("run_eval.py", "Popen")
        self.assertIn("shell", {kw.arg for kw in call.keywords})

    def test_improve_description_run_passes_shell_kwarg(self) -> None:
        call = _find_subprocess_call("improve_description.py", "run")
        self.assertIn("shell", {kw.arg for kw in call.keywords})


if __name__ == "__main__":
    unittest.main()
