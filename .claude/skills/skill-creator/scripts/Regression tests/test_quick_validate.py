from __future__ import annotations

import importlib.util
import os
import tempfile
import unittest
from pathlib import Path
from typing import Protocol, cast


class QuickValidateModule(Protocol):
    """Typed public surface exercised by the regression suite."""

    def is_valid_skill_name(self, name: str) -> bool: ...

    def validate_skill(self, skill_path: str | Path) -> tuple[bool, str]: ...


# test_quick_validate.py lives in:
#   scripts/Regression tests/test_quick_validate.py
# The implementation lives in:
#   scripts/quick_validate.py
DEFAULT_TARGET = Path(__file__).resolve().parents[1] / "quick_validate.py"
TARGET = Path(os.environ.get("QUICK_VALIDATE_TARGET", DEFAULT_TARGET)).resolve()

RESERVED_NAMES = ("con", "prn", "aux", "nul", "com1", "com9", "lpt1", "lpt9")
NEAR_MISS_NAMES = ("console", "con-sole", "com0", "com10", "lpt0", "my-con", "nul-1")


def load_candidate() -> QuickValidateModule:
    spec = importlib.util.spec_from_file_location("_quick_validate_regression", TARGET)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load candidate module from {TARGET}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return cast(QuickValidateModule, module)


class ReservedNameTests(unittest.TestCase):
    mod: QuickValidateModule

    def setUp(self) -> None:
        self.mod = load_candidate()

    def test_windows_reserved_device_names_are_invalid(self) -> None:
        for name in RESERVED_NAMES:
            with self.subTest(name=name):
                self.assertFalse(self.mod.is_valid_skill_name(name))

    def test_reserved_name_near_misses_remain_valid(self) -> None:
        for name in NEAR_MISS_NAMES:
            with self.subTest(name=name):
                self.assertTrue(self.mod.is_valid_skill_name(name))

    def test_validate_skill_reports_reserved_name(self) -> None:
        # The directory is deliberately not named after the device: creating a
        # reserved-name directory is exactly the hazard being guarded against.
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = Path(temp_dir) / "other-dir"
            skill_dir.mkdir()
            (skill_dir / "SKILL.md").write_text(
                '---\nname: "con"\ndescription: Reserved name probe.\n---\n',
                encoding="utf-8",
            )

            valid, message = self.mod.validate_skill(skill_dir)

        self.assertFalse(valid)
        self.assertIn("reserved", message)


class SuperscriptReservedNameTests(unittest.TestCase):
    mod: QuickValidateModule

    def setUp(self) -> None:
        self.mod = load_candidate()

    def test_superscript_device_names_are_invalid(self) -> None:
        # Windows 10+ also reserves COM/LPT followed by superscript 1-3.
        for name in ("com¹", "com²", "com³", "lpt¹", "lpt²", "lpt³"):
            with self.subTest(name=name):
                self.assertFalse(self.mod.is_valid_skill_name(name))

    def test_other_superscripts_remain_valid(self) -> None:
        for name in ("com⁴", "con²", "my-lpt¹"):
            with self.subTest(name=name):
                self.assertTrue(self.mod.is_valid_skill_name(name))


class HostileFrontmatterTests(unittest.TestCase):
    """validate_skill must report bad input as (False, message), never raise."""

    VALID_HEAD = b"---\nname: demo\ndescription: d\n"
    mod: QuickValidateModule

    def setUp(self) -> None:
        self.mod = load_candidate()

    def validate_raw(self, raw: bytes) -> tuple[bool, str]:
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = Path(temp_dir) / "demo"
            skill_dir.mkdir()
            (skill_dir / "SKILL.md").write_bytes(raw)
            return self.mod.validate_skill(skill_dir)

    def test_baseline_is_valid(self) -> None:
        self.assertEqual(self.validate_raw(self.VALID_HEAD + b"---\n"), (True, "Skill is valid"))

    def test_undecodable_skill_md_is_reported(self) -> None:
        valid, message = self.validate_raw(self.VALID_HEAD + b"---\n\xff\xfe")

        self.assertFalse(valid)
        self.assertIn("Cannot read SKILL.md", message)

    def test_out_of_range_yaml_date_is_reported(self) -> None:
        valid, message = self.validate_raw(b"---\nname: demo\ndescription: 2023-13-45\n---\n")

        self.assertFalse(valid)
        self.assertIn("Invalid YAML frontmatter", message)

    def test_deeply_nested_yaml_is_reported(self) -> None:
        nested = b"[" * 3000 + b"]" * 3000
        valid, message = self.validate_raw(self.VALID_HEAD + b"metadata: " + nested + b"\n---\n")

        self.assertFalse(valid)
        self.assertIn("Invalid YAML frontmatter", message)


if __name__ == "__main__":
    unittest.main()
