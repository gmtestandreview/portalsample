from __future__ import annotations

import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

VIEWER = Path(__file__).resolve().parents[2] / "eval-viewer" / "viewer.html"


class ViewerOptimizedTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.text = VIEWER.read_text(encoding="utf-8")

    def test_embedded_data_marker_is_unique(self) -> None:
        self.assertEqual(self.text.count("/*__EMBEDDED_DATA__*/"), 1)

    def test_blank_feedback_is_not_approval(self) -> None:
        self.assertIn("Blank feedback means no comment, not approval.", self.text)
        self.assertNotIn("no feedback (looks good)", self.text)

    def test_missing_benchmark_values_are_not_coerced_to_zero(self) -> None:
        self.assertNotIn("((r.pass_rate || 0)", self.text)
        self.assertNotIn("(r.errors || 0)", self.text)
        self.assertIn("variable or incomplete run counts", self.text)

    def test_missing_formal_grading_is_visible(self) -> None:
        self.assertIn("Formal grading evidence is unavailable for this run.", self.text)

    def test_current_feedback_is_loaded_even_with_previous_context(self) -> None:
        self.assertIn("await loadCurrentFeedback();", self.text)

    def test_completed_review_is_not_downgraded_by_closing_dialog(self) -> None:
        start = self.text.index("function closeDoneDialog()")
        end = self.text.index("function showToast", start)
        self.assertNotIn("saveCurrentFeedback", self.text[start:end])
        self.assertNotIn("postFeedback('in_progress'", self.text[start:end])

    def test_spreadsheet_preview_uses_text_nodes_not_sheet_to_html(self) -> None:
        self.assertIn("sheet_to_json", self.text)
        self.assertNotIn("sheet_to_html", self.text)

    def test_google_fonts_removed_and_csp_present(self) -> None:
        self.assertNotIn("fonts.googleapis.com", self.text)
        self.assertNotIn("fonts.gstatic.com", self.text)
        self.assertIn("Content-Security-Policy", self.text)

    def test_main_javascript_parses_when_node_is_available(self) -> None:
        node = shutil.which("node")
        if node is None:
            self.skipTest("node unavailable")
        scripts = re.findall(r"<script(?:\s[^>]*)?>(.*?)</script\b[^>]*>", self.text, flags=re.S | re.I)
        self.assertTrue(scripts)
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "viewer.js"
            path.write_text(scripts[-1], encoding="utf-8")
            result = subprocess.run(
                [node, "--check", str(path)],
                capture_output=True,
                text=True,
                timeout=30,
            )
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
