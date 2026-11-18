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
    from scripts.eval_control import ClaudeCliError
except ModuleNotFoundError:
    from eval_control import ClaudeCliError


class RedGreenControlTests(unittest.TestCase):
    def test_checkpoint_identity_changes_when_loaded_reference_changes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'SKILL.md').write_text(
                '---\nname: demo\ndescription: demo skill\n---\n', encoding='utf-8'
            )
            reference = root / 'references' / 'rules.md'
            reference.parent.mkdir()
            reference.write_text('Requirement A', encoding='utf-8')
            initial = run_red_green_eval._skill_content_digest(root)
            reference.write_text('Requirement B', encoding='utf-8')
            self.assertNotEqual(initial, run_red_green_eval._skill_content_digest(root))

    def test_stream_parser_requires_terminal_success(self) -> None:
        # Malformed diagnostic lines are ignored, but cannot count as a successful run.
        events = run_red_green_eval._parse_stream_events('{"type":"result","value":NaN}\n')
        self.assertEqual(events, [])
        self.assertFalse(run_red_green_eval._has_terminal_success(events))
        self.assertFalse(run_red_green_eval._has_terminal_success([{'type': 'assistant'}]))
        self.assertTrue(
            run_red_green_eval._has_terminal_success([{'type': 'result', 'is_error': False}])
        )
        with self.assertRaises(ClaudeCliError):
            run_red_green_eval._parse_stream_events(
                '{"type":"result","is_error":true,"api_error_status":429,"result":"limit"}\n'
            )

    def test_result_error_event_preserves_rate_limit_status(self) -> None:
        with self.assertRaises(ClaudeCliError) as raised:
            run_red_green_eval.result_event_decision({
                'type': 'result',
                'is_error': True,
                'api_error_status': 429,
                'result': 'rate limited',
            })
        self.assertEqual(raised.exception.status, 429)

    def test_artifact_manifest_rejects_escape_and_digest_mismatch(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'evidence.txt').write_text('evidence', encoding='utf-8')
            manifest = run_red_green_eval.artifact_manifest(root)
            self.assertIsNone(run_red_green_eval.validate_artifact_manifest(root, manifest))
            self.assertEqual(
                run_red_green_eval.validate_artifact_manifest(
                    root,
                    [{'relative_path': '../outside', 'sha256': 'x'}],
                ),
                'artifact path escapes workspace',
            )
            invalid_manifest: list[object] = [{1: 'evidence.txt', 'sha256': 'x'}]
            self.assertEqual(
                run_red_green_eval.validate_artifact_manifest(
                    root,
                    invalid_manifest,
                ),
                'artifact evidence has invalid fields',
            )
            manifest[0]['sha256'] = '0' * 64
            self.assertIn(
                'digest mismatch',
                run_red_green_eval.validate_artifact_manifest(root, manifest) or '',
            )


if __name__ == '__main__':
    unittest.main()
