#!/usr/bin/env python3
"""
Skill Packager - Creates a distributable .skill file of a skill folder.

Usage:
    python -m scripts.package_skill <path/to/skill-folder> [output-directory]

Example:
    python -m scripts.package_skill skills/public/my-skill
    python -m scripts.package_skill skills/public/my-skill ./dist
"""

import argparse
import fnmatch
import os
import tempfile
import zipfile
from pathlib import Path
from typing import Optional, Union

try:
    from scripts.quick_validate import validate_skill
except ModuleNotFoundError as exc:
    # Support direct execution without masking a missing dependency imported
    # from inside scripts.quick_validate.
    if exc.name not in {"scripts", "scripts.quick_validate"}:
        raise
    from quick_validate import validate_skill

PathInput = Union[str, Path]

# Patterns to exclude when packaging skills.
EXCLUDE_DIRS = {"__pycache__", "node_modules"}
EXCLUDE_GLOBS = {"*.pyc"}
EXCLUDE_FILES = {".DS_Store"}
# Directories excluded only at the skill root (not when nested deeper).
ROOT_EXCLUDE_DIRS = {"evals"}


def should_exclude(rel_path: Path) -> bool:
    """Return whether a relative archive path should be excluded."""
    parts = rel_path.parts
    if any(part in EXCLUDE_DIRS for part in parts):
        return True
    # rel_path is relative to skill_path.parent, so parts[0] is the skill
    # folder name and parts[1] (if present) is the first subdirectory.
    if len(parts) > 1 and parts[1] in ROOT_EXCLUDE_DIRS:
        return True
    name = rel_path.name
    if name in EXCLUDE_FILES:
        return True
    return any(fnmatch.fnmatch(name, pattern) for pattern in EXCLUDE_GLOBS)


def _is_within(path: Path, root: Path) -> bool:
    """Return whether *path* is contained by *root* after resolution."""
    try:
        path.relative_to(root)
    except ValueError:
        return False
    return True


def _resolve_packaged_file(file_path: Path, skill_path: Path) -> Optional[Path]:
    """Resolve a packaged file and reject links escaping the skill directory."""
    try:
        resolved = file_path.resolve(strict=True)
    except OSError:
        return None
    if not resolved.is_file() or not _is_within(resolved, skill_path):
        return None
    return resolved


def _validate_skill_directory(skill_path: Path) -> bool:
    """Validate the skill directory and its required SKILL.md file."""
    if not skill_path.exists():
        print(f"❌ Error: Skill folder not found: {skill_path}")
        return False

    if not skill_path.is_dir():
        print(f"❌ Error: Path is not a directory: {skill_path}")
        return False

    skill_md = skill_path / "SKILL.md"
    if _resolve_packaged_file(skill_md, skill_path) is None:
        print(f"❌ Error: SKILL.md must be a file contained in {skill_path}")
        return False

    return True


def _run_skill_validation(skill_path: Path) -> bool:
    """Run the project skill validator and report a controlled failure."""
    print("🔍 Validating skill...")
    valid, message = validate_skill(skill_path)
    if not valid:
        print(f"❌ Validation failed: {message}")
        print("   Please fix the validation errors before packaging.")
        return False

    print(f"✅ {message}\n")
    return True


def _get_output_path(skill_path: Path, output_dir: Optional[PathInput]) -> Path:
    """Resolve the archive output directory while preserving legacy behavior."""
    # Preserve the original falsey-string behavior: an empty output directory
    # means "place the archive beside the skill".
    if not output_dir:
        return skill_path.parent
    return Path(output_dir).resolve()


def _collect_archive_members(
    skill_path: Path,
) -> Optional[list[tuple[Path, Path]]]:
    """Return validated archive members, rejecting files that escape the skill."""
    members: list[tuple[Path, Path]] = []
    candidates = sorted(
        skill_path.rglob("*"),
        key=lambda path: path.relative_to(skill_path).as_posix(),
    )

    for file_path in candidates:
        if not file_path.is_file():
            continue

        arcname = file_path.relative_to(skill_path.parent)
        if should_exclude(arcname):
            print(f"  Skipped: {arcname}")
            continue

        resolved_file = _resolve_packaged_file(file_path, skill_path)
        if resolved_file is None:
            print(f"❌ Error: packaged file escapes or is invalid: {file_path}")
            return None

        members.append((resolved_file, arcname))

    return members


def _write_archive(
    archive_members: list[tuple[Path, Path]],
    output_path: Path,
    skill_name: str,
    skill_filename: Path,
) -> bool:
    """Write an archive atomically, preserving any existing archive on failure."""
    try:
        output_path.mkdir(parents=True, exist_ok=True)
        temp_fd, temp_name = tempfile.mkstemp(
            dir=output_path,
            prefix=f".{skill_name}.",
            suffix=".skill.tmp",
        )
        os.close(temp_fd)
        temp_path = Path(temp_name)

        try:
            with zipfile.ZipFile(temp_path, "w", zipfile.ZIP_DEFLATED) as zipf:
                for resolved_file, arcname in archive_members:
                    zipf.write(resolved_file, arcname)
                    print(f"  Added: {arcname}")
            temp_path.replace(skill_filename)
        finally:
            # On success the temporary path has been replaced and no longer
            # exists; on failure this removes the partial archive.
            temp_path.unlink(missing_ok=True)

    except (OSError, zipfile.BadZipFile) as exc:
        print(f"❌ Error creating .skill file: {exc}")
        return False

    return True


def package_skill(
    skill_path: PathInput,
    output_dir: Optional[PathInput] = None,
) -> Optional[Path]:
    """
    Package a skill folder into a .skill file.

    Args:
        skill_path: Path to the skill folder.
        output_dir: Optional output directory for the .skill file. The default
            places the archive beside the skill directory.

    Returns:
        Path to the created .skill file, or None on a controlled packaging error.
    """
    resolved_skill_path = Path(skill_path).resolve()
    if not _validate_skill_directory(resolved_skill_path):
        return None

    if not _run_skill_validation(resolved_skill_path):
        return None

    skill_name = resolved_skill_path.name
    output_path = _get_output_path(resolved_skill_path, output_dir)
    skill_filename = output_path / f"{skill_name}.skill"

    if _is_within(skill_filename, resolved_skill_path):
        print(
            "❌ Error: output archive must be outside the skill directory: "
            f"{skill_filename}"
        )
        return None

    # Resolve and validate every source before opening the output archive. This
    # prevents a file symlink from copying data outside the skill directory and
    # avoids leaving a partial archive when such a boundary violation is found.
    archive_members = _collect_archive_members(resolved_skill_path)
    if archive_members is None:
        return None

    if not _write_archive(
        archive_members,
        output_path,
        skill_name,
        skill_filename,
    ):
        return None

    print(f"\n✅ Successfully packaged skill to: {skill_filename}")
    return skill_filename


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Package an Agent Skill as a .skill archive"
    )
    parser.add_argument("skill_path", type=Path)
    parser.add_argument("output_directory", nargs="?", type=Path, default=None)
    args = parser.parse_args()

    print(f"Packaging skill: {args.skill_path}")
    if args.output_directory is not None:
        print(f"Output directory: {args.output_directory}")

    result = package_skill(args.skill_path, args.output_directory)
    raise SystemExit(0 if result is not None else 1)


if __name__ == "__main__":
    main()
