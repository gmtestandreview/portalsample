#!/usr/bin/env python3
"""Create a spec-conformant Agent Skill scaffold."""

from __future__ import annotations

import argparse
from pathlib import Path

try:
    from scripts.quick_validate import is_valid_skill_name
except ModuleNotFoundError:
    from quick_validate import is_valid_skill_name


SKILL_TEMPLATE = """---
name: {skill_name}
description: TODO - Describe what this skill does and when it should be used.
---

# {skill_title}

## Purpose

TODO: State the reusable outcome this skill enables.

## Workflow

1. TODO: Add the smallest set of instructions needed for correct execution.
2. TODO: Move detailed examples, schemas, or long references into bundled resources when justified.

## Edge cases

- TODO: Add only non-obvious failure modes or boundaries that materially affect execution.
"""

EXAMPLE_SCRIPT = '''#!/usr/bin/env python3
"""Replace or delete this example helper."""

def main() -> None:
    raise SystemExit("TODO: implement or delete scripts/example.py")


if __name__ == "__main__":
    main()
'''

EXAMPLE_REFERENCE = """# Reference

Replace this file with focused domain or workflow material, or delete it.
"""

EXAMPLE_ASSET = """Replace this placeholder with a real output asset, or delete it.
"""


def title_case_skill_name(skill_name: str) -> str:
    return " ".join(word.capitalize() for word in skill_name.split("-"))


def init_skill(skill_name: str, path: str | Path, with_examples: bool = False) -> Path | None:
    """Initialize a skill directory, returning its path or None on failure."""
    if not is_valid_skill_name(skill_name):
        print(
            "Error: skill name must be 1-64 Unicode lowercase alphanumeric/hyphen "
            "characters, with no leading, trailing, or consecutive hyphens"
        )
        return None

    skill_dir = Path(path).resolve() / skill_name
    if skill_dir.exists():
        print(f"Error: skill directory already exists: {skill_dir}")
        return None

    try:
        skill_dir.mkdir(parents=True, exist_ok=False)
        skill_content = SKILL_TEMPLATE.format(
            skill_name=skill_name,
            skill_title=title_case_skill_name(skill_name),
        )
        (skill_dir / "SKILL.md").write_text(skill_content, encoding="utf-8")

        if with_examples:
            scripts_dir = skill_dir / "scripts"
            references_dir = skill_dir / "references"
            assets_dir = skill_dir / "assets"
            scripts_dir.mkdir()
            references_dir.mkdir()
            assets_dir.mkdir()
            example_script = scripts_dir / "example.py"
            example_script.write_text(EXAMPLE_SCRIPT, encoding="utf-8")
            example_script.chmod(0o755)
            (references_dir / "reference.md").write_text(EXAMPLE_REFERENCE, encoding="utf-8")
            (assets_dir / "example_asset.txt").write_text(EXAMPLE_ASSET, encoding="utf-8")
    except OSError as exc:
        print(f"Error creating skill: {exc}")
        return None

    print(f"Created skill: {skill_dir}")
    print("Next: replace the TODO description/body, add only needed resources, then validate.")
    return skill_dir


def main() -> None:
    parser = argparse.ArgumentParser(description="Create an Agent Skill scaffold")
    parser.add_argument("skill_name", help="Skill name; must match the created directory")
    parser.add_argument("--path", required=True, type=Path, help="Parent directory")
    parser.add_argument(
        "--with-examples",
        action="store_true",
        help="Also create minimal scripts/references/assets placeholders",
    )
    args = parser.parse_args()

    result = init_skill(args.skill_name, args.path, args.with_examples)
    raise SystemExit(0 if result else 1)


if __name__ == "__main__":
    main()
