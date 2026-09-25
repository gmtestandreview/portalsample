from __future__ import annotations

import contextlib
import importlib.util
import io
import os
import stat
import sys
import tempfile
import types
import unittest
import zipfile
from pathlib import Path
from typing import Protocol, cast
from unittest import mock

PathInput = str | Path
MODULE_PATH = Path(__file__).resolve().parent.parent / "package_skill.py"


class PackageSkillModule(Protocol):
    """Typed surface used by this regression suite."""

    def package_skill(
        self,
        skill_path: PathInput,
        output_dir: PathInput | None = None,
    ) -> Path | None:
        """Package a skill directory."""

    def main(self) -> None:
        """Run the command-line entry point."""


def _validate_skill_stub(_skill_path: Path) -> tuple[bool, str]:
    return True, "ok"


def load_module() -> PackageSkillModule:
    """Load package_skill.py with its validator dependency stubbed."""
    scripts = types.ModuleType("scripts")
    quick_validate = types.ModuleType("scripts.quick_validate")
    setattr(quick_validate, "validate_skill", _validate_skill_stub)  # noqa: B010

    spec = importlib.util.spec_from_file_location(
        "package_skill_under_test",
        MODULE_PATH,
    )
    if spec is None:
        raise RuntimeError(f"Unable to create import spec for {MODULE_PATH}")
    if spec.loader is None:
        raise RuntimeError(f"Import spec has no loader for {MODULE_PATH}")

    module = importlib.util.module_from_spec(spec)
    with mock.patch.dict(
        sys.modules,
        {
            "scripts": scripts,
            "scripts.quick_validate": quick_validate,
        },
    ):
        spec.loader.exec_module(module)

    return cast(PackageSkillModule, module)


def make_skill(root: Path) -> Path:
    skill = root / "demo"
    skill.mkdir()
    (skill / "SKILL.md").write_text("# demo", encoding="utf-8")
    (skill / "ok.txt").write_text("ok", encoding="utf-8")
    return skill


def require_path(value: Path | None) -> Path:
    if value is None:
        raise AssertionError("Expected package_skill() to return an archive path")
    return value


class PackageSkillTests(unittest.TestCase):
    """Regression and boundary tests for package_skill.py."""

    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.module = load_module()

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_external_file_symlink_is_rejected(self) -> None:
        skill = make_skill(self.root)
        outside = self.root / "secret.txt"
        outside.write_text("TOP-SECRET", encoding="utf-8")
        link = skill / "linked.txt"
        try:
            link.symlink_to(outside)
        except OSError:
            self.skipTest("symlinks unavailable on this platform")

        output = self.root / "out"
        with contextlib.redirect_stdout(io.StringIO()):
            result = self.module.package_skill(skill, output)

        self.assertIsNone(result)
        self.assertFalse((output / "demo.skill").exists())

    def test_external_skill_md_symlink_is_rejected(self) -> None:
        skill = self.root / "demo"
        skill.mkdir()
        outside = self.root / "outside-skill.md"
        outside.write_text("# external", encoding="utf-8")
        try:
            (skill / "SKILL.md").symlink_to(outside)
        except OSError:
            self.skipTest("symlinks unavailable on this platform")

        with contextlib.redirect_stdout(io.StringIO()):
            result = self.module.package_skill(skill, self.root / "out")

        self.assertIsNone(result)

    def test_internal_file_symlink_is_preserved(self) -> None:
        skill = make_skill(self.root)
        target = skill / "target.txt"
        target.write_text("inside", encoding="utf-8")
        link = skill / "alias.txt"
        try:
            link.symlink_to(target)
        except OSError:
            self.skipTest("symlinks unavailable on this platform")

        with contextlib.redirect_stdout(io.StringIO()):
            result = self.module.package_skill(skill, self.root / "out")

        archive_path = require_path(result)
        with zipfile.ZipFile(archive_path) as archive:
            self.assertEqual(archive.read("demo/alias.txt"), b"inside")

    def test_root_evals_excluded_but_nested_evals_kept(self) -> None:
        skill = make_skill(self.root)
        (skill / "evals").mkdir()
        (skill / "evals" / "drop.txt").write_text("drop", encoding="utf-8")
        nested = skill / "nested" / "evals"
        nested.mkdir(parents=True)
        (nested / "keep.txt").write_text("keep", encoding="utf-8")

        with contextlib.redirect_stdout(io.StringIO()):
            result = self.module.package_skill(skill, self.root / "out")

        archive_path = require_path(result)
        with zipfile.ZipFile(archive_path) as archive:
            names = archive.namelist()

        self.assertNotIn("demo/evals/drop.txt", names)
        self.assertIn("demo/nested/evals/keep.txt", names)

    def test_archive_members_are_sorted_deterministically(self) -> None:
        skill = make_skill(self.root)
        for name in ("z.txt", "a.txt", "m.txt"):
            (skill / name).write_text(name, encoding="utf-8")

        with contextlib.redirect_stdout(io.StringIO()):
            result = self.module.package_skill(skill, self.root / "out")

        archive_path = require_path(result)
        with zipfile.ZipFile(archive_path) as archive:
            names = archive.namelist()

        self.assertEqual(names, sorted(names))

    def test_output_inside_skill_is_rejected_without_side_effect(self) -> None:
        skill = make_skill(self.root)
        output = skill / "dist"

        with contextlib.redirect_stdout(io.StringIO()):
            result = self.module.package_skill(skill, output)

        self.assertIsNone(result)
        self.assertFalse(output.exists())

    def test_failed_zip_write_preserves_existing_archive_and_cleans_temp(
        self,
    ) -> None:
        skill = make_skill(self.root)
        output = self.root / "out"
        output.mkdir()
        existing = output / "demo.skill"
        existing.write_bytes(b"existing archive")

        with (
            mock.patch.object(
                zipfile.ZipFile,
                "open",
                side_effect=OSError("simulated write failure"),
            ),
            contextlib.redirect_stdout(io.StringIO()),
        ):
            result = self.module.package_skill(skill, output)

        self.assertIsNone(result)
        self.assertEqual(existing.read_bytes(), b"existing archive")
        self.assertEqual(list(output.glob(".*.skill.tmp")), [])

    def test_skill_folder_named_like_excluded_dir_keeps_its_files(self) -> None:
        parent = self.root / "parent"
        parent.mkdir()
        skill = parent / "node_modules"
        skill.mkdir()
        (skill / "SKILL.md").write_text("# demo", encoding="utf-8")

        with contextlib.redirect_stdout(io.StringIO()):
            result = self.module.package_skill(skill, self.root / "out")

        archive_path = require_path(result)
        with zipfile.ZipFile(archive_path) as archive:
            self.assertIn("node_modules/SKILL.md", archive.namelist())

    def test_pre_1980_mtime_does_not_crash_packaging(self) -> None:
        skill = make_skill(self.root)
        os.utime(skill / "ok.txt", (0, 0))

        with contextlib.redirect_stdout(io.StringIO()):
            result = self.module.package_skill(skill, self.root / "out")

        archive_path = require_path(result)
        with zipfile.ZipFile(archive_path) as archive:
            self.assertEqual(archive.read("demo/ok.txt"), b"ok")

    def _package_quietly(self, skill: Path, output: Path) -> Path:
        with contextlib.redirect_stdout(io.StringIO()):
            return require_path(self.module.package_skill(skill, output))

    def _run_main(self, *argv: str) -> int:
        with (
            mock.patch.object(sys, "argv", ["package_skill.py", *argv]),
            contextlib.redirect_stdout(io.StringIO()),
            self.assertRaises(SystemExit) as raised,
        ):
            self.module.main()
        code = raised.exception.code
        return code if isinstance(code, int) else 1

    def test_generated_and_junk_files_are_excluded(self) -> None:
        skill = make_skill(self.root)
        (skill / "__pycache__").mkdir()
        (skill / "__pycache__" / "a.txt").write_text("x", encoding="utf-8")
        (skill / "sub" / "node_modules").mkdir(parents=True)
        (skill / "sub" / "node_modules" / "n.js").write_text("x", encoding="utf-8")
        (skill / "mod.pyc").write_text("x", encoding="utf-8")
        (skill / ".DS_Store").write_text("x", encoding="utf-8")

        archive_path = self._package_quietly(skill, self.root / "out")

        with zipfile.ZipFile(archive_path) as archive:
            self.assertEqual(sorted(archive.namelist()), ["demo/SKILL.md", "demo/ok.txt"])

    def test_tool_caches_and_session_memory_are_excluded_at_any_depth(self) -> None:
        skill = make_skill(self.root)
        for junk in (".remember", ".mypy_cache", ".pytest_cache", ".ruff_cache"):
            (skill / junk / "logs").mkdir(parents=True)
            (skill / junk / "logs" / "a.log").write_text("x", encoding="utf-8")
            (skill / "sub" / junk).mkdir(parents=True)
            (skill / "sub" / junk / "b.log").write_text("x", encoding="utf-8")

        archive_path = self._package_quietly(skill, self.root / "out")

        with zipfile.ZipFile(archive_path) as archive:
            self.assertEqual(sorted(archive.namelist()), ["demo/SKILL.md", "demo/ok.txt"])

    def test_validator_failure_returns_none_and_writes_nothing(self) -> None:
        skill = make_skill(self.root)
        output = self.root / "out"

        with (
            mock.patch.object(self.module, "validate_skill", return_value=(False, "bad")),
            contextlib.redirect_stdout(io.StringIO()),
        ):
            result = self.module.package_skill(skill, output)

        self.assertIsNone(result)
        self.assertFalse(output.exists())

    def test_missing_and_non_directory_skill_paths_are_rejected(self) -> None:
        not_a_dir = self.root / "file.txt"
        not_a_dir.write_text("x", encoding="utf-8")

        with contextlib.redirect_stdout(io.StringIO()):
            missing = self.module.package_skill(self.root / "nope", self.root / "o")
            non_dir = self.module.package_skill(not_a_dir, self.root / "o")

        self.assertIsNone(missing)
        self.assertIsNone(non_dir)

    def test_cli_exit_codes(self) -> None:
        skill = make_skill(self.root)
        output = self.root / "out"

        self.assertEqual(self._run_main(str(skill), str(output)), 0)
        self.assertTrue((output / "demo.skill").exists())
        self.assertEqual(self._run_main(str(self.root / "nope")), 1)
        with contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(self._run_main(), 2)

    def test_dangling_and_directory_symlinks_are_reported_as_skipped(self) -> None:
        skill = make_skill(self.root)
        target_dir = self.root / "elsewhere"
        target_dir.mkdir()
        try:
            (skill / "dangling").symlink_to(self.root / "missing")
            (skill / "dirlink").symlink_to(target_dir, target_is_directory=True)
        except OSError:
            self.skipTest("symlinks unavailable on this platform")

        log = io.StringIO()
        with contextlib.redirect_stdout(log):
            result = self.module.package_skill(skill, self.root / "out")

        with zipfile.ZipFile(require_path(result)) as archive:
            self.assertEqual(sorted(archive.namelist()), ["demo/SKILL.md", "demo/ok.txt"])
        self.assertIn("Skipped: demo", log.getvalue())
        self.assertIn("dangling", log.getvalue())
        self.assertIn("dirlink", log.getvalue())

    @unittest.skipIf(os.name == "nt", "POSIX permission bits are not meaningful")
    def test_archive_file_mode_follows_umask(self) -> None:
        skill = make_skill(self.root)
        previous = os.umask(0o022)
        try:
            archive_path = self._package_quietly(skill, self.root / "out")
        finally:
            os.umask(previous)

        self.assertEqual(stat.S_IMODE(archive_path.stat().st_mode), 0o644)

    def test_archive_bytes_do_not_depend_on_file_mtimes(self) -> None:
        skill = make_skill(self.root)
        first = self._package_quietly(skill, self.root / "out1").read_bytes()
        for name in ("SKILL.md", "ok.txt"):
            os.utime(skill / name, (1_700_000_000, 1_700_000_000))
        second = self._package_quietly(skill, self.root / "out2").read_bytes()

        self.assertEqual(first, second)

    def test_accepts_string_paths_for_compatibility(self) -> None:
        skill = make_skill(self.root)
        output = self.root / "out"

        with contextlib.redirect_stdout(io.StringIO()):
            result = self.module.package_skill(str(skill), str(output))

        self.assertEqual(result, output / "demo.skill")

    def test_empty_string_output_dir_preserves_legacy_behavior(self) -> None:
        skill_parent = self.root / "skills"
        skill_parent.mkdir()
        skill = make_skill(skill_parent)
        original_cwd = Path.cwd()

        try:
            os.chdir(self.root)
            with contextlib.redirect_stdout(io.StringIO()):
                result = self.module.package_skill(skill, "")
        finally:
            os.chdir(original_cwd)

        archive_path = require_path(result)
        self.assertEqual(archive_path, skill_parent / "demo.skill")
        self.assertTrue(archive_path.exists())


if __name__ == "__main__":
    unittest.main()
