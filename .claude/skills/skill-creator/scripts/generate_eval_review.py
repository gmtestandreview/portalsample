#!/usr/bin/env python3
"""Generate a safe standalone trigger-eval review page."""

from __future__ import annotations

import argparse
import json
from collections.abc import Sequence
from pathlib import Path
from typing import cast

try:
    from scripts.utils import parse_skill_md
except ModuleNotFoundError as exc:
    if exc.name not in {"scripts", "scripts.utils"}:
        raise
    from utils import parse_skill_md


def _json_for_script(data: object) -> str:
    return (
        json.dumps(data)
        .replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("&", "\\u0026")
        .replace("\u2028", "\\u2028")
        .replace("\u2029", "\\u2029")
    )


def _validated_eval_set(data: Sequence[object]) -> list[dict[str, object]]:
    eval_set: list[dict[str, object]] = []
    for index, raw_item in enumerate(data):
        if not isinstance(raw_item, dict):
            raise TypeError(f"eval item {index} must be an object")

        # JSON object keys are strings. The cast narrows json.loads()'s
        # untyped boundary after the runtime container check above.
        item = cast(dict[str, object], raw_item)
        query = item.get("query")
        if not isinstance(query, str) or not query.strip():
            raise ValueError(f"eval item {index} has an invalid query")

        should_trigger = item.get("should_trigger")
        if not isinstance(should_trigger, bool):
            raise TypeError(f"eval item {index} should_trigger must be boolean")

        eval_set.append(item)

    return eval_set


def generate_review(
    eval_set: Sequence[object],
    skill_path: Path,
    template_path: Path,
) -> str:
    name, description, _ = parse_skill_md(skill_path)
    validated_eval_set = _validated_eval_set(eval_set)

    template = template_path.read_text(encoding="utf-8")
    payload: dict[str, object] = {
        "skill_name": name,
        "skill_description": description,
        "evals": validated_eval_set,
    }
    marker = "__REVIEW_DATA_PLACEHOLDER__"
    if marker not in template:
        raise ValueError(f"template is missing {marker}")
    return template.replace(marker, _json_for_script(payload))


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a trigger-eval review HTML file")
    parser.add_argument("--eval-set", required=True, type=Path)
    parser.add_argument("--skill-path", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--template",
        type=Path,
        default=None,
        help="Template override (default: assets/eval_review.html in the skill)",
    )
    args = parser.parse_args()

    raw_eval_set: object = json.loads(args.eval_set.read_text(encoding="utf-8"))
    if not isinstance(raw_eval_set, list):
        raise SystemExit("eval set must be a JSON array")
    eval_set = cast(list[object], raw_eval_set)

    template = args.template or (
        Path(__file__).resolve().parents[1] / "assets" / "eval_review.html"
    )
    html = generate_review(eval_set, args.skill_path, template)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(html, encoding="utf-8")
    print(f"Review written to: {args.output}")


if __name__ == "__main__":
    main()
