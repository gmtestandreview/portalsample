from __future__ import annotations

import http.client
import importlib.util
import json
import os
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch

MODULE_PATH = Path(__file__).with_name("generate_review.py")
SPEC = importlib.util.spec_from_file_location("generate_review", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
review = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = review
SPEC.loader.exec_module(review)


def write_metadata(eval_dir: Path, *, eval_id: object = 1, prompt: object = "prompt") -> None:
    eval_dir.mkdir(parents=True, exist_ok=True)
    data = {}
    if eval_id is not None:
        data["eval_id"] = eval_id
    if prompt is not None:
        data["prompt"] = prompt
    (eval_dir / "eval_metadata.json").write_text(json.dumps(data), encoding="utf-8")


class GenerateReviewOptimizedTests(unittest.TestCase):
    def test_metadata_fields_fallback_independently(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            eval_dir = root / "eval-1"
            run = eval_dir / "with_skill" / "run-1"
            run.mkdir(parents=True)
            write_metadata(eval_dir, eval_id=17, prompt=None)
            (run / "transcript.md").write_text(
                "## Eval Prompt\n\nPrompt from transcript\n\n## Result\nx",
                encoding="utf-8",
            )

            built = review.build_run(root, run)

            self.assertEqual(built["eval_id"], 17)
            self.assertEqual(built["prompt"], "Prompt from transcript")

    def test_string_eval_id_is_preserved(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            eval_dir = root / "eval-alpha"
            run = eval_dir / "with_skill" / "run-1"
            (run / "outputs").mkdir(parents=True)
            write_metadata(eval_dir, eval_id="alpha", prompt="p")

            runs = review.find_runs(root)

            self.assertEqual(runs[0]["eval_id"], "alpha")

    def test_run_id_collision_is_deterministically_disambiguated(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            first = root / "a-b" / "run-1"
            second = root / "a" / "b-run-1"
            (first / "outputs").mkdir(parents=True)
            (second / "outputs").mkdir(parents=True)

            runs = review.find_runs(root)
            ids = [run["id"] for run in runs]

            self.assertEqual(len(ids), 2)
            self.assertEqual(len(set(ids)), 2)
            self.assertTrue(all("--" in value for value in ids))
            self.assertEqual(ids, [run["id"] for run in review.find_runs(root)])

    def test_run_order_is_natural_1_2_10(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            eval_dir = root / "eval-1"
            write_metadata(eval_dir, eval_id=1, prompt="p")
            for number in (10, 1, 2):
                (eval_dir / "with_skill" / f"run-{number}" / "outputs").mkdir(parents=True)

            runs = review.find_runs(root)

            self.assertEqual(
                [run["id"].rsplit("-", 1)[-1] for run in runs],
                ["1", "2", "10"],
            )

    def test_failed_run_without_outputs_is_still_visible(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            run = root / "eval-1" / "with_skill" / "run-1"
            run.mkdir(parents=True)
            write_metadata(root / "eval-1", eval_id=1, prompt="p")

            runs = review.find_runs(root)

            self.assertEqual(len(runs), 1)
            self.assertEqual(runs[0]["outputs"], [])
            self.assertIsNone(runs[0]["grading"])

    def test_empty_grading_object_is_preserved(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            run = root / "run-1"
            (run / "outputs").mkdir(parents=True)
            (run / "grading.json").write_text("{}", encoding="utf-8")

            built = review.build_run(root, run)

            self.assertEqual(built["grading"], {})

    @unittest.skipIf(not hasattr(os, "symlink"), "symlinks unavailable")
    def test_external_file_symlink_is_not_embedded(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, tempfile.TemporaryDirectory() as outside:
            root = Path(tmp)
            run = root / "run-1"
            outputs = run / "outputs"
            outputs.mkdir(parents=True)
            secret = Path(outside) / "secret.txt"
            secret.write_text("SECRET", encoding="utf-8")
            link = outputs / "secret.txt"
            os.symlink(secret, link)

            built = review.build_run(root, run)

            self.assertEqual(built["outputs"][0]["type"], "error")
            self.assertNotIn("SECRET", built["outputs"][0].get("content", ""))

    @unittest.skipIf(not hasattr(os, "symlink"), "symlinks unavailable")
    def test_external_directory_symlink_is_not_traversed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, tempfile.TemporaryDirectory() as outside:
            root = Path(tmp)
            run = root / "run-1"
            outputs = run / "outputs"
            outputs.mkdir(parents=True)
            outside_dir = Path(outside)
            (outside_dir / "secret.txt").write_text("SECRET", encoding="utf-8")
            os.symlink(outside_dir, outputs / "outside", target_is_directory=True)

            built = review.build_run(root, run)

            serialized = json.dumps(built["outputs"])
            self.assertNotIn("SECRET", serialized)

    def test_feedback_normalization_preserves_blank_as_no_comment(self) -> None:
        normalized = review._normalize_feedback_payload(
            {"reviews": [{"run_id": "r1", "feedback": ""}], "status": "complete"},
            allowed_run_ids={"r1"},
        )

        self.assertEqual(normalized["reviews"][0]["feedback"], "")
        self.assertEqual(normalized["status"], "complete")
        self.assertTrue(normalized["reviews"][0]["timestamp"].endswith("Z"))

    def test_feedback_rejects_duplicate_or_unknown_run_ids(self) -> None:
        with self.assertRaises(ValueError):
            review._normalize_feedback_payload(
                {
                    "reviews": [
                        {"run_id": "r1", "feedback": "a"},
                        {"run_id": "r1", "feedback": "b"},
                    ]
                },
                allowed_run_ids={"r1"},
            )
        with self.assertRaises(ValueError):
            review._normalize_feedback_payload(
                {"reviews": [{"run_id": "other", "feedback": "a"}]},
                allowed_run_ids={"r1"},
            )

    def test_json_embedding_escapes_script_terminators(self) -> None:
        encoded = review._json_for_script({"x": "</script><script>alert(1)</script>"})
        self.assertNotIn("</script>", encoded)
        self.assertIn("\\u003c", encoded)

    def test_generate_html_requires_exactly_one_marker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            module_dir = Path(tmp)
            fake_module = module_dir / "generate_review.py"
            fake_module.write_text("", encoding="utf-8")
            (module_dir / "viewer.html").write_text("<html>no marker</html>", encoding="utf-8")
            old_file = review.__file__
            review.__file__ = str(fake_module)
            try:
                with self.assertRaises(ValueError):
                    review.generate_html([], "skill")
            finally:
                review.__file__ = old_file

    def test_http_feedback_boundary_and_schema_normalization(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            run = root / "run-1"
            (run / "outputs").mkdir(parents=True)
            run_id = review.find_runs(root)[0]["id"]
            feedback_path = root / "feedback.json"

            handler = review.partial(
                review.ReviewHandler,
                root,
                "skill",
                feedback_path,
                {},
                None,
            )
            server = review.ReviewHTTPServer(("127.0.0.1", 0), handler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            port = server.server_address[1]

            try:
                conn = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
                conn.request("GET", "/api/feedback")
                response = conn.getresponse()
                self.assertEqual(response.status, 200)
                default = json.loads(response.read())
                self.assertEqual(default, {"reviews": [], "status": "in_progress"})
                conn.close()

                conn = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
                conn.request(
                    "POST",
                    "/api/feedback",
                    body='{"reviews":[]}',
                    headers={"Content-Type": "text/plain"},
                )
                response = conn.getresponse()
                self.assertEqual(response.status, 415)
                response.read()
                conn.close()

                conn = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
                payload = json.dumps(
                    {
                        "reviews": [{"run_id": run_id, "feedback": ""}],
                        "status": "complete",
                    }
                )
                conn.request(
                    "POST",
                    "/api/feedback",
                    body=payload,
                    headers={"Content-Type": "application/json"},
                )
                response = conn.getresponse()
                self.assertEqual(response.status, 200)
                response.read()
                conn.close()

                saved = json.loads(feedback_path.read_text(encoding="utf-8"))
                self.assertEqual(saved["status"], "complete")
                self.assertEqual(saved["reviews"][0]["feedback"], "")
                self.assertIn("timestamp", saved["reviews"][0])

                conn = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
                conn.request(
                    "POST",
                    "/api/feedback",
                    body=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Origin": "https://example.com",
                    },
                )
                response = conn.getresponse()
                self.assertEqual(response.status, 403)
                response.read()
                conn.close()
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)

    def test_static_output_directory_returns_clean_error(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "run-1" / "outputs").mkdir(parents=True)
            static_dir = root / "already-a-directory"
            static_dir.mkdir()

            with patch.object(
                review,
                "generate_html",
                return_value="<html></html>",
            ):
                result = review.main(
                    [str(root), "--static", str(static_dir)]
                )

            self.assertEqual(result, 1)

    def test_port_zero_uses_actual_bound_port(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "run-1" / "outputs").mkdir(parents=True)
            opened: list[str] = []

            class FakeServer:
                server_address = ("127.0.0.1", 43210)

                def serve_forever(self) -> None:
                    return None

                def server_close(self) -> None:
                    return None

            with (
                patch.object(review, "_create_server", return_value=FakeServer()),
                patch.object(review.webbrowser, "open", side_effect=opened.append),
            ):
                result = review.main([str(root), "--port", "0"])

            self.assertEqual(result, 0)
            self.assertEqual(opened, ["http://localhost:43210"])

    def test_invalid_benchmark_argument_is_controlled_error(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "run-1" / "outputs").mkdir(parents=True)
            bad = root / "benchmark.json"
            bad.write_text('{"not":"a benchmark"}', encoding="utf-8")

            result = review.main([str(root), "--benchmark", str(bad), "--static", str(root / "x.html")])

            self.assertEqual(result, 1)


if __name__ == "__main__":
    unittest.main()
