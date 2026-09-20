from __future__ import annotations

import importlib.util
import os
import shutil
import stat
import subprocess
import sys
import tempfile
import types
import unittest
from pathlib import Path
from typing import Protocol, cast
from unittest.mock import patch


class InitSkillModule(Protocol):
    """Typed public surface exercised by the regression suite."""

    def init_skill(
        self,
        skill_name: str,
        path: str | Path,
        with_examples: bool = False,
    ) -> Path | None: ...


# test_init_skill.py lives in:
#   scripts/Regression tests/test_init_skill.py
# The implementation lives in:
#   scripts/init_skill.py
DEFAULT_TARGET = Path(__file__).resolve().parents[1] / "init_skill.py"
TARGET = Path(os.environ.get("INIT_SKILL_TARGET", DEFAULT_TARGET)).resolve()


def is_valid_skill_name(name: str) -> bool:
    """Test double matching the production validator's documented contract."""
    if not 1 <= len(name) <= 64:
        return False
    if name.startswith("-") or name.endswith("-") or "--" in name:
        return False

    for char in name:
        if char == "-":
            continue
        if not char.isalnum():
            return False
        if char.isalpha() and char != char.lower():
            return False
    return True


def load_candidate() -> InitSkillModule:
    """Load init_skill.py with an isolated validator dependency."""
    quick_validate = types.ModuleType("scripts.quick_validate")
    setattr(quick_validate, "is_valid_skill_name", is_valid_skill_name)

    scripts_package = types.ModuleType("scripts")
    setattr(scripts_package, "__path__", [])

    module_name = "_candidate_regression_test"
    spec = importlib.util.spec_from_file_location(module_name, TARGET)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load candidate module from {TARGET}")

    module = importlib.util.module_from_spec(spec)
    injected_modules = {
        "scripts": scripts_package,
        "scripts.quick_validate": quick_validate,
        "quick_validate": quick_validate,
    }
    with patch.dict(sys.modules, injected_modules):
        spec.loader.exec_module(module)

    return cast(InitSkillModule, module)


def generated_yaml_name(skill_dir: Path) -> str:
    """Read the quoted name scalar emitted by the fixed template."""
    skill_file = skill_dir / "SKILL.md"
    for line in skill_file.read_text(encoding="utf-8").splitlines():
        if not line.startswith("name: "):
            continue

        scalar = line.removeprefix("name: ")
        if len(scalar) < 2 or scalar[0] != '"' or scalar[-1] != '"':
            raise AssertionError(f"name must be emitted as a quoted YAML string: {line!r}")
        return scalar[1:-1]

    raise AssertionError("SKILL.md front matter has no name field")


class InitSkillRegressionTests(unittest.TestCase):
    mod: InitSkillModule
    temp_dir: tempfile.TemporaryDirectory[str]
    root: Path

    def setUp(self) -> None:
        self.mod = load_candidate()
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        self.root = Path(self.temp_dir.name)

    def test_basic_create(self) -> None:
        result = self.mod.init_skill("demo-skill", self.root)

        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result, self.root.resolve() / "demo-skill")
        self.assertTrue((result / "SKILL.md").is_file())

    def test_examples_create_expected_tree(self) -> None:
        result = self.mod.init_skill("demo-skill", self.root, True)

        self.assertIsNotNone(result)
        assert result is not None

        expected = {
            "SKILL.md",
            "scripts",
            "scripts/example.py",
            "references",
            "references/reference.md",
            "assets",
            "assets/example_asset.txt",
        }
        actual = {
            path.relative_to(result).as_posix()
            for path in result.rglob("*")
        }
        self.assertEqual(actual, expected)

        example_script = result / "scripts" / "example.py"
        self.assertTrue(example_script.is_file())
        if os.name != "nt":
            mode = stat.S_IMODE(example_script.stat().st_mode)
            self.assertNotEqual(mode & stat.S_IXUSR, 0)

    def test_invalid_names_do_not_create(self) -> None:
        invalid_names = (
            "",
            "-a",
            "a-",
            "a--b",
            "A",
            "a/b",
            r"a\b",
            "..",
            ".",
            "a b",
            "a\nb",
            "a:b",
            "a_b",
            "x" * 65,
        )

        for name in invalid_names:
            with self.subTest(name=name):
                case_root = self.root / f"case-{len(list(self.root.iterdir()))}"
                case_root.mkdir()
                self.assertIsNone(self.mod.init_skill(name, case_root))
                self.assertEqual(list(case_root.iterdir()), [])

    def test_valid_yaml_ambiguous_names_remain_strings(self) -> None:
        ambiguous_names = (
            "123",
            "true",
            "false",
            "null",
            "yes",
            "no",
            "on",
            "off",
            "2026-09-17",
            "0123",
            "0x10",
        )

        for index, name in enumerate(ambiguous_names):
            with self.subTest(name=name):
                self.assertTrue(is_valid_skill_name(name))
                case_root = self.root / f"yaml-{index}"
                case_root.mkdir()

                result = self.mod.init_skill(name, case_root)

                self.assertIsNotNone(result)
                assert result is not None
                self.assertEqual(generated_yaml_name(result), name)

    def test_write_failure_rolls_back(self) -> None:
        original = Path.write_text

        def fail_skill_md(
            path: Path,
            data: str,
            encoding: str | None = None,
            errors: str | None = None,
            newline: str | None = None,
        ) -> int:
            if path.name == "SKILL.md":
                raise OSError("injected")
            return original(
                path,
                data,
                encoding=encoding,
                errors=errors,
                newline=newline,
            )

        with patch.object(Path, "write_text", new=fail_skill_md):
            result = self.mod.init_skill("demo-skill", self.root)

        self.assertIsNone(result)
        self.assertFalse((self.root / "demo-skill").exists())

    def test_existing_directory_is_untouched(self) -> None:
        destination = self.root / "demo-skill"
        destination.mkdir()
        marker = destination / "marker"
        marker.write_text("keep", encoding="utf-8")

        result = self.mod.init_skill("demo-skill", self.root)

        self.assertIsNone(result)
        self.assertEqual(marker.read_text(encoding="utf-8"), "keep")

    def test_path_attacks_are_rejected(self) -> None:
        attacks = (
            "../escape",
            "../../escape",
            "/tmp/escape",
            r"..\escape",
            r"C:\tmp\escape",
            r"\\server\share",
        )

        for index, name in enumerate(attacks):
            with self.subTest(name=name):
                case_root = self.root / f"attack-{index}"
                case_root.mkdir()
                self.assertIsNone(self.mod.init_skill(name, case_root))
                self.assertEqual(list(case_root.iterdir()), [])

    def test_dangling_destination_symlink_is_not_removed(self) -> None:
        destination = self.root / "demo-skill"
        try:
            destination.symlink_to(
                self.root / "missing",
                target_is_directory=True,
            )
        except OSError as exc:
            self.skipTest(f"Symlink creation is unavailable: {exc}")

        result = self.mod.init_skill("demo-skill", self.root)

        self.assertIsNone(result)
        self.assertTrue(destination.is_symlink())

    def test_nested_import_error_is_not_masked(self) -> None:
        candidate = self.root / "candidate.py"
        shutil.copy2(TARGET, candidate)

        scripts = self.root / "scripts"
        scripts.mkdir()
        (scripts / "__init__.py").write_text("", encoding="utf-8")
        (scripts / "quick_validate.py").write_text(
            "import missing_internal_dependency\n",
            encoding="utf-8",
        )
        (self.root / "quick_validate.py").write_text(
            "def is_valid_skill_name(name: str) -> bool:\n"
            "    return True\n",
            encoding="utf-8",
        )

        process = subprocess.run(
            [sys.executable, "-c", "import candidate"],
            cwd=self.root,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertNotEqual(process.returncode, 0)
        self.assertIn("missing_internal_dependency", process.stderr)


if __name__ == "__main__":
    unittest.main()
