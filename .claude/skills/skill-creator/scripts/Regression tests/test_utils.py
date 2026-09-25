from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "utils.py"
SPEC = importlib.util.spec_from_file_location("utils_candidate", MODULE_PATH)
assert SPEC is not None
assert SPEC.loader is not None
utils = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(utils)


class ParseSkillMdTests(unittest.TestCase):
    def _parse(self, frontmatter: str) -> tuple[str, str, str]:
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = Path(temp_dir)
            content = f"---\n{frontmatter}---\n\n# Body\n"
            (skill_dir / "SKILL.md").write_text(content, encoding="utf-8")
            return utils.parse_skill_md(skill_dir)

    def test_literal_block_preserves_newlines(self) -> None:
        name, description, _ = self._parse(
            "name: demo\n"
            "description: |\n"
            "  line one\n"
            "  line two\n"
        )
        self.assertEqual(name, "demo")
        self.assertEqual(description, "line one\nline two")

    def test_literal_block_preserves_blank_lines(self) -> None:
        _, description, _ = self._parse(
            "name: demo\n"
            "description: |\n"
            "  line one\n"
            "\n"
            "  line two\n"
        )
        self.assertEqual(description, "line one\n\nline two")

    def test_indented_delimiter_is_scalar_content(self) -> None:
        _, description, _ = self._parse(
            "name: demo\n"
            "description: |\n"
            "  line one\n"
            "  ---\n"
            "  line two\n"
        )
        self.assertEqual(description, "line one\n---\nline two")

    def test_folded_block_remains_folded(self) -> None:
        _, description, _ = self._parse(
            "name: demo\n"
            "description: >\n"
            "  line one\n"
            "  line two\n"
        )
        self.assertEqual(description, "line one line two")


if __name__ == "__main__":
    unittest.main()
