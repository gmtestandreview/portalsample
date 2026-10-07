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
        name, description, _ = self._parse("name: demo\ndescription: |\n  line one\n  line two\n")
        self.assertEqual(name, "demo")
        self.assertEqual(description, "line one\nline two")

    def test_literal_block_preserves_blank_lines(self) -> None:
        _, description, _ = self._parse("name: demo\ndescription: |\n  line one\n\n  line two\n")
        self.assertEqual(description, "line one\n\nline two")

    def test_indented_delimiter_is_scalar_content(self) -> None:
        _, description, _ = self._parse(
            "name: demo\ndescription: |\n  line one\n  ---\n  line two\n"
        )
        self.assertEqual(description, "line one\n---\nline two")

    def test_folded_block_remains_folded(self) -> None:
        _, description, _ = self._parse("name: demo\ndescription: >\n  line one\n  line two\n")
        self.assertEqual(description, "line one line two")

    def test_double_quoted_yaml_escapes_are_decoded(self) -> None:
        name, description, _ = self._parse(
            'name: "de\\u006do"\ndescription: "Use for \\"quoted\\" text\\nwith a second line."\n'
        )
        self.assertEqual(name, "demo")
        self.assertEqual(description, 'Use for "quoted" text\nwith a second line.')

    def test_single_quoted_yaml_apostrophe_is_decoded(self) -> None:
        _, description, _ = self._parse("name: demo\ndescription: 'Use the user''s data.'\n")
        self.assertEqual(description, "Use the user's data.")

    def test_yaml_description_escapes_are_decoded(self) -> None:
        _, description, _ = self._parse(
            'name: demo\ndescription: "Use \\"quotes\\"\\nand a new line."\n'
        )
        self.assertEqual(description, 'Use "quotes"\nand a new line.')

    def test_invalid_yaml_and_non_string_fields_are_controlled_errors(self) -> None:
        for frontmatter in (
            'name: demo\ndescription: "unfinished\n',
            "name: demo\ndescription: [one, two]\n",
            "name: 123\ndescription: text\n",
            "- demo\n",
        ):
            with self.subTest(frontmatter=frontmatter), self.assertRaises(ValueError):
                self._parse(frontmatter)

    def test_missing_fields_retain_empty_string_compatibility(self) -> None:
        name, description, _ = self._parse("license: MIT\n")
        self.assertEqual((name, description), ("", ""))

    def test_quoted_description_keeps_decoded_trailing_newline(self) -> None:
        _, description, _ = self._parse('name: demo\ndescription: "line one\\n"\n')
        self.assertEqual(description, "line one\n")

    def test_last_duplicate_quoted_description_keeps_its_newline(self) -> None:
        _, description, _ = self._parse(
            'name: demo\ndescription: |\n  first\ndescription: "last\\n"\n'
        )
        self.assertEqual(description, "last\n")

    def test_last_duplicate_block_description_is_trimmed(self) -> None:
        _, description, _ = self._parse(
            'name: first\nname: demo\ndescription: "first\\n"\ndescription: |+\n  last\n\n'
        )
        self.assertEqual(description, "last")

    def test_merged_block_description_is_trimmed(self) -> None:
        name, description, _ = self._parse(
            "defaults: &defaults\n  name: demo\n  description: |\n    inherited\n<<: *defaults\n"
        )
        self.assertEqual((name, description), ("demo", "inherited"))

    def test_explicit_description_overrides_merged_block_style(self) -> None:
        for frontmatter in (
            "defaults: &defaults\n  description: |\n    inherited\n"
            '<<: *defaults\nname: demo\ndescription: "explicit\\n"\n',
            "defaults: &defaults\n  description: |\n    inherited\n"
            'name: demo\ndescription: "explicit\\n"\n<<: *defaults\n',
        ):
            with self.subTest(frontmatter=frontmatter):
                _, description, _ = self._parse(frontmatter)
                self.assertEqual(description, "explicit\n")

    def test_merge_sequence_uses_first_mapping_description_and_style(self) -> None:
        _, description, _ = self._parse(
            "first: &first\n  description: |\n    first\n"
            'second: &second\n  description: "second\\n"\n'
            "name: demo\n<<: [*first, *second]\n"
        )
        self.assertEqual(description, "first")

    def test_aliased_description_preserves_scalar_style(self) -> None:
        for frontmatter, expected in (
            ("text: &text |\n  block\nname: demo\ndescription: *text\n", "block"),
            ('text: &text "quoted\\n"\nname: demo\ndescription: *text\n', "quoted\n"),
        ):
            with self.subTest(frontmatter=frontmatter):
                _, description, _ = self._parse(frontmatter)
                self.assertEqual(description, expected)

    def test_malformed_explicit_tags_raise_bounded_value_errors(self) -> None:
        for scalar in (
            "!!bool private-marker",
            "!!timestamp private-marker",
            '!!int ""',
            '!!float ""',
        ):
            with self.subTest(scalar=scalar):
                with self.assertRaises(ValueError) as caught:
                    self._parse(f"name: demo\ndescription: {scalar}\n")
                message = str(caught.exception)
                self.assertIn("Invalid YAML", message)
                self.assertNotIn("private-marker", message)
                self.assertLessEqual(len(message), 200)

    def test_empty_and_null_frontmatter_keep_empty_defaults_and_content(self) -> None:
        for frontmatter in ("", "# comment\n", "null\n", "{}\n"):
            with self.subTest(frontmatter=frontmatter):
                name, description, content = self._parse(frontmatter)
                self.assertEqual((name, description), ("", ""))
                self.assertEqual(content, f"---\n{frontmatter}---\n\n# Body\n")

    def test_unsafe_tags_and_non_string_metadata_are_rejected(self) -> None:
        for value in (
            "!!python/object:builtins.object {}",
            "*unknown",
            "null",
            "false",
            "123",
            "[one]",
            "{nested: value}",
        ):
            with self.subTest(value=value), self.assertRaises(ValueError):
                self._parse(f"name: demo\ndescription: {value}\n")

    def test_delimiter_errors_remain_controlled(self) -> None:
        for content in ("", "# no frontmatter\n", "---\nname: demo\n", "---\nname: demo\n  ---\n"):
            with self.subTest(content=content), tempfile.TemporaryDirectory() as temp_dir:
                skill_dir = Path(temp_dir)
                (skill_dir / "SKILL.md").write_text(content, encoding="utf-8")
                with self.assertRaisesRegex(ValueError, "missing frontmatter"):
                    utils.parse_skill_md(skill_dir)

    def test_invalid_yaml_error_is_bounded_and_does_not_echo_source(self) -> None:
        with self.assertRaises(ValueError) as caught:
            self._parse('name: demo\ndescription: "private-marker-unfinished\n')

        message = str(caught.exception)
        self.assertIn("Invalid YAML", message)
        self.assertTrue("private-marker" not in message and "\n" not in message)
        self.assertLessEqual(len(message), 200)


if __name__ == "__main__":
    unittest.main()
