#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import tempfile
import unittest
import sys
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "ts_diagnostic.py"
SPEC = importlib.util.spec_from_file_location("ts_diagnostic", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
tsd = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = tsd
SPEC.loader.exec_module(tsd)


class StrictProfileTests(unittest.TestCase):
    def config(self, **overrides: object) -> dict[str, object]:
        compiler = {name: True for name in tsd.STRICT_TRUE}
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

if __name__ == "__main__":
    unittest.main()
