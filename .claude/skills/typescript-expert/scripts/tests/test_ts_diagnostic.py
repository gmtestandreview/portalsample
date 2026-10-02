#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import subprocess
import tempfile
import unittest
import sys
from pathlib import Path
from unittest import mock

MODULE_PATH = Path(__file__).resolve().parents[1] / "ts_diagnostic.py"
SPEC = importlib.util.spec_from_file_location("ts_diagnostic", MODULE_PATH)
assert SPEC is not None
assert SPEC.loader is not None
tsd = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = tsd
SPEC.loader.exec_module(tsd)


class StrictProfileTests(unittest.TestCase):
    def config(self, **overrides: object) -> dict[str, object]:
        compiler: dict[str, object] = {name: True for name in tsd.STRICT_TRUE}
        compiler.update({name: True for name in tsd.RECOMMENDED_TRUE})
        compiler.update(overrides)
        return {"compilerOptions": compiler}

    def test_full_baseline_passes(self) -> None:
        results = tsd.check_strict(self.config())
        self.assertEqual(results[0].status, tsd.PASS)

    def test_documented_exception_warns_not_passes(self) -> None:
        results = tsd.check_strict(
            self.config(noUncheckedIndexedAccess=False),
            allowed_exceptions={"noUncheckedIndexedAccess"},
        )
        self.assertEqual(results[0].status, tsd.WARN)
        self.assertIn("not a full-baseline PASS", results[0].detail)

    def test_unapproved_exception_fails(self) -> None:
        results = tsd.check_strict(self.config(noUncheckedIndexedAccess=False))
        self.assertEqual(results[0].status, tsd.FAIL)


class WorkspaceResolutionTests(unittest.TestCase):
    def test_tool_root_lockfile_selects_package_manager(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            base = Path(td)
            project = base / "packages" / "api"
            project.mkdir(parents=True)
            (base / "pnpm-lock.yaml").write_text("lockfileVersion: '9.0'\n")
            pm = tsd.package_manager(
                project,
                {},
                tool_root=base,
                tool_package={"packageManager": "pnpm@10.0.0"},
            )
            self.assertEqual(pm, "pnpm")

    def test_project_binary_precedes_tool_root_binary(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            base = Path(td)
            project = base / "packages" / "api"
            project_bin = project / "node_modules" / ".bin"
            tool_bin = base / "node_modules" / ".bin"
            project_bin.mkdir(parents=True)
            tool_bin.mkdir(parents=True)
            name = "tsc.cmd" if tsd.os.name == "nt" else "tsc"
            project_tsc = project_bin / name
            tool_tsc = tool_bin / name
            project_tsc.write_text("")
            tool_tsc.write_text("")
            self.assertEqual(
                tsd.local_binary(project, "tsc", tool_root=base),
                str(project_tsc),
            )


class RealProjectRegressionTests(unittest.TestCase):
    """Defects found by running the diagnostic on the real portal project."""

    def test_large_show_config_output_is_parsed_not_truncated(self) -> None:
        files = [f"src/file{i}.ts" for i in range(1000)]
        payload = json.dumps({"compilerOptions": {"strict": True}, "files": files})
        self.assertGreater(len(payload), 8000)
        completed = subprocess.CompletedProcess([], 0, stdout=payload, stderr="")
        with tempfile.TemporaryDirectory() as td:
            with mock.patch.object(tsd.subprocess, "run", return_value=completed):
                result, config = tsd.show_config(
                    "tsc",
                    root=Path(td),
                    tsconfig=Path(td) / "tsconfig.json",
                    timeout=1,
                )
        self.assertEqual(result.status, tsd.PASS)
        self.assertIsNotNone(config)

    @unittest.skipUnless(tsd.os.name == "nt", "Windows .cmd shim resolution")
    def test_run_command_resolves_cmd_shim_on_windows(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            base = Path(td)
            (base / "fakepm.cmd").write_text("@echo shim-ok\r\n")
            path = f"{base}{tsd.os.pathsep}{tsd.os.environ['PATH']}"
            with mock.patch.dict(tsd.os.environ, {"PATH": path}):
                code, output, _ = tsd.run_command(
                    ["fakepm", "run", "lint"], cwd=base, timeout=10
                )
        self.assertEqual(code, 0)
        self.assertIn("shim-ok", output)


class SonarEvidenceTests(unittest.TestCase):
    def test_waited_gate_does_not_claim_profile_assignment(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            project = Path(td)
            bindir = project / "node_modules" / ".bin"
            bindir.mkdir(parents=True)
            if tsd.os.name == "nt":
                scanner = bindir / "sonar-scanner.cmd"
                scanner.write_text("@exit /b 0\r\n")
            else:
                scanner = bindir / "sonar-scanner"
                scanner.write_text("#!/bin/sh\nexit 0\n")
                scanner.chmod(0o755)
            result = tsd.sonar_gate(
                root=project,
                package={},
                pm=None,
                timeout=1,
                tool_root=project,
            )
            self.assertEqual(result.status, tsd.PASS)
            self.assertIn("not verified", result.detail)

class TimeoutOutputTests(unittest.TestCase):
    """`TimeoutExpired.stdout/stderr` are bytes even when `text=True` was requested."""

    def run_with_timeout(self, exc: subprocess.TimeoutExpired):
        with (
            tempfile.TemporaryDirectory() as td,
            mock.patch.object(tsd.subprocess, "run", side_effect=exc),
        ):
            return tsd.run_command(["tool"], cwd=Path(td), timeout=1)

    def test_bytes_partial_output_is_decoded(self) -> None:
        exc = subprocess.TimeoutExpired(
            cmd=["tool"], timeout=1, output=b"partial out", stderr=b"partial err"
        )
        code, output, _ = self.run_with_timeout(exc)
        self.assertEqual(code, 124)
        self.assertIn("partial out", output)
        self.assertIn("partial err", output)

    def test_text_partial_output_is_kept(self) -> None:
        exc = subprocess.TimeoutExpired(
            cmd=["tool"], timeout=1, output="text out", stderr=None
        )
        code, output, _ = self.run_with_timeout(exc)
        self.assertEqual(code, 124)
        self.assertEqual(output, "text out")

    def test_no_output_reports_the_timeout(self) -> None:
        code, output, _ = self.run_with_timeout(
            subprocess.TimeoutExpired(cmd=["tool"], timeout=1)
        )
        self.assertEqual(code, 124)
        self.assertEqual(output, "Timed out after 1s")


class JsonObjectTests(unittest.TestCase):
    def test_object_is_returned_and_other_values_are_none(self) -> None:
        self.assertEqual(tsd.as_json_object({"a": 1}), {"a": 1})
        self.assertEqual(tsd.as_json_object({}), {})
        not_objects: tuple[object, ...] = (None, [], "text", 3)
        for value in not_objects:
            self.assertIsNone(tsd.as_json_object(value))

    def test_package_scripts_keeps_only_string_commands(self) -> None:
        package: dict[str, object] = {"scripts": {"a": "x", "b": 2}}
        self.assertEqual(tsd.package_scripts(package), {"a": "x"})
        self.assertEqual(tsd.package_scripts({"scripts": []}), {})


class ArgumentValidationTests(unittest.TestCase):
    def parse(self, *argv: str):
        return tsd.build_parser().parse_args(list(argv))

    def test_files_requires_typecheck(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            (Path(td) / "tsconfig.json").write_text("{}")
            args = self.parse("--root", td, "--files", "src/a.ts")
            message = tsd.argument_error(
                args, Path(td), Path(td), Path(td) / "tsconfig.json"
            )
        self.assertIn("--files requires --typecheck", message or "")

    def test_all_satisfies_files_and_exception_requirements(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            (Path(td) / "tsconfig.json").write_text("{}")
            args = self.parse(
                "--all", "--files", "src/a.ts",
                "--allow-strict-exception", "noUncheckedIndexedAccess",
            )
            tsd.expand_all(args)
            message = tsd.argument_error(
                args, Path(td), Path(td), Path(td) / "tsconfig.json"
            )
        self.assertIsNone(message)

    def test_missing_root_is_reported_before_flag_errors(self) -> None:
        args = self.parse("--files", "src/a.ts")
        message = tsd.argument_error(
            args, Path("missing-root"), Path("missing-root"), Path("x.json")
        )
        self.assertIn("project root does not exist", message or "")

    def test_non_positive_timeout_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            (Path(td) / "tsconfig.json").write_text("{}")
            args = self.parse("--timeout", "0")
            message = tsd.argument_error(
                args, Path(td), Path(td), Path(td) / "tsconfig.json"
            )
        self.assertIn("--timeout must be positive", message or "")


class ScopedTypecheckTests(unittest.TestCase):
    OUTPUT = "\n".join(
        [
            "src/a.ts(1,1): error TS2345: bad arg",
            "  continuation line",
            "src\\b.ts(2,2): error TS18048: maybe undefined",
            "src/other.ts(3,3): error TS2375: elsewhere",
        ]
    )

    def scoped(self, code: int, output: str, scope: list[str]):
        return tsd.scoped_typecheck_result(["tsc"], code, output, 0.1, scope)

    def test_errors_in_scope_fail_and_outside_errors_are_only_counted(self) -> None:
        result = self.scoped(2, self.OUTPUT, ["src/a.ts"])
        self.assertEqual(result.status, tsd.FAIL)
        self.assertIn("1 error(s) in scope; 2 outside scope", result.detail)
        self.assertNotIn("other.ts", result.output or "")

    def test_windows_separators_match_scope(self) -> None:
        result = self.scoped(2, self.OUTPUT, ["src/b.ts"])
        self.assertEqual(result.status, tsd.FAIL)

    def test_clean_scope_passes_even_when_project_fails(self) -> None:
        result = self.scoped(2, self.OUTPUT, ["src/clean.ts"])
        self.assertEqual(result.status, tsd.PASS)
        self.assertIn("3 outside scope", result.detail)

    def test_unparseable_failure_is_never_clean(self) -> None:
        result = self.scoped(1, "error TS5083: Cannot read file", ["src/a.ts"])
        self.assertEqual(result.status, tsd.FAIL)


if __name__ == "__main__":
    unittest.main()
