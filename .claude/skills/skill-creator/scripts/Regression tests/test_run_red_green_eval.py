from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import run_red_green_eval
try:
    from scripts.eval_control import ClaudeCliError, EvaluationControl
except ModuleNotFoundError:
    from eval_control import ClaudeCliError, EvaluationControl


class RedGreenControlTests(unittest.TestCase):
    def test_result_error_event_preserves_rate_limit_status(self) -> None:
        with self.assertRaises(ClaudeCliError) as raised:
            run_red_green_eval._result_event_decision({
                "type": "result",
                "is_error": True,
                "api_error_status": 429,
                "result": "rate limited",
            })
        self.assertEqual(raised.exception.status, 429)

    def test_artifact_manifest_rejects_escape_and_digest_mismatch(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "evidence.txt").write_text("evidence", encoding="utf-8")
            manifest = run_red_green_eval.artifact_manifest(root)
            self.assertIsNone(run_red_green_eval.validate_artifact_manifest(root, manifest))
            self.assertEqual(
                run_red_green_eval.validate_artifact_manifest(
                    root,
                    [{"relative_path": "../outside", "sha256": "x"}],
                ),
                "artifact path escapes workspace",
            )
            manifest[0]["sha256"] = "0" * 64
            self.assertIn("digest mismatch", run_red_green_eval.validate_artifact_manifest(root, manifest) or "")


if __name__ == "__main__":
    unittest.main()
