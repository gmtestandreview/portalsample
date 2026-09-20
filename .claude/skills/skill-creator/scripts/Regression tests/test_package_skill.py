from __future__ import annotations

import contextlib
import importlib.util
import io
import os
import sys
import tempfile
import types
import unittest
import zipfile
from pathlib import Path
from typing import Optional, Protocol, Union, cast
from unittest import mock


PathInput = Union[str, Path]
MODULE_PATH = Path(__file__).resolve().parent.parent / "package_skill.py"


class PackageSkillModule(Protocol):
    """Typed surface used by this regression suite."""

    def package_skill(
        self,
        skill_path: PathInput,
        output_dir: Optional[PathInput] = None,
    ) -> Optional[Path]:
        """Package a skill directory."""


def _validate_skill_stub(_skill_path: Path) -> tuple[bool, str]:
    return True, "ok"


def load_module() -> PackageSkillModule:
    """Load package_skill.py with its validator dependency stubbed."""
    scripts = types.ModuleType("scripts")
    quick_validate = types.ModuleType("scripts.quick_validate")
    setattr(quick_validate, "validate_skill", _validate_skill_stub)

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


def require_path(value: Optional[Path]) -> Path:
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

        with mock.patch.object(
            zipfile.ZipFile,
            "write",
            side_effect=OSError("simulated write failure"),
        ):
            with contextlib.redirect_stdout(io.StringIO()):
                result = self.module.package_skill(skill, output)

        self.assertIsNone(result)
        self.assertEqual(existing.read_bytes(), b"existing archive")
        self.assertEqual(list(output.glob(".*.skill.tmp")), [])

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
