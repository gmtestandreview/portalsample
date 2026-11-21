from __future__ import annotations

import http.client
import http.server
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import threading
import unittest
from collections.abc import Callable
from functools import partial
from pathlib import Path
from types import ModuleType
from typing import Protocol, TypedDict, cast
from unittest.mock import patch


class OutputItem(TypedDict, total=False):
    type: str
    content: str


class ReviewRun(TypedDict):
    """Mirror the required fields returned by generate_review.build_run()."""

    id: str
    prompt: str
    eval_id: int | str | None
    outputs: list[OutputItem]
    grading: dict[str, object] | None


class ReviewModule(Protocol):
    __file__: str
    ReviewHandler: Callable[..., http.server.BaseHTTPRequestHandler]
    ReviewHTTPServer: Callable[
        [tuple[str, int], Callable[..., http.server.BaseHTTPRequestHandler]],
        http.server.HTTPServer,
    ]
    webbrowser: ModuleType

    def generate_html(self, runs: list[ReviewRun], skill_name: str) -> str: ...

    def build_run(self, root: Path, run_dir: Path) -> ReviewRun: ...

    def find_runs(self, root: Path) -> list[ReviewRun]: ...

    def main(self, argv: list[str] | None = None) -> int: ...


class GenerateEvalReviewModule(Protocol):
    def generate_review(
        self,
        evals: list[dict[str, object]],
        skill_path: Path,
        template_path: Path,
    ) -> str: ...


def _load_module(name: str, path: Path, *, package: bool = False) -> ModuleType:
    # The standalone trigger generator imports its sibling `utils` module.
    # Package mode gives relative imports a stable root without mutating sys.path.
    locations = [str(path.parent)] if package else None
    spec = importlib.util.spec_from_file_location(name, path, submodule_search_locations=locations)
    if spec is None or spec.loader is None:
        raise ImportError(f'Unable to load {name!r} from {path}')
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    try:
        spec.loader.exec_module(module)
    except BaseException:
        # An incomplete import must not masquerade as a usable test module.
        if sys.modules.get(spec.name) is module:
            del sys.modules[spec.name]
        raise
    return module


MODULE_PATH = Path(__file__).resolve().parents[2] / 'eval-viewer' / 'generate_review.py'
GENERATE_EVAL_REVIEW_PATH = Path(__file__).resolve().parents[1] / 'generate_eval_review.py'

review = cast(ReviewModule, _load_module('generate_review', MODULE_PATH))
_generate_eval_review: GenerateEvalReviewModule | None = None


def _get_generate_eval_review() -> GenerateEvalReviewModule:
    global _generate_eval_review
    if _generate_eval_review is None:
        _generate_eval_review = cast(
            GenerateEvalReviewModule,
            _load_module('generate_eval_review', GENERATE_EVAL_REVIEW_PATH, package=True),
        )
    return _generate_eval_review


def write_metadata(eval_dir: Path, *, eval_id: object = 1, prompt: object = 'prompt') -> None:
    eval_dir.mkdir(parents=True, exist_ok=True)
    data = {}
    if eval_id is not None:
        data['eval_id'] = eval_id
    if prompt is not None:
        data['prompt'] = prompt
    (eval_dir / 'eval_metadata.json').write_text(json.dumps(data), encoding='utf-8')


class TriggerReviewSecurityTests(unittest.TestCase):
    def test_duplicate_data_marker_is_rejected_before_writing_page(self) -> None:
        generate_eval_review = _get_generate_eval_review()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            skill = root / 'skill'
            skill.mkdir()
            (skill / 'SKILL.md').write_text('---\nname: demo\ndescription: demo skill\n---\n')
            source = root / 'template.html'
            source.write_text('data=__REVIEW_DATA_PLACEHOLDER__;__REVIEW_DATA_PLACEHOLDER__')
            with self.assertRaisesRegex(ValueError, 'exactly one'):
                generate_eval_review.generate_review(
                    [{'query': 'one', 'should_trigger': True}],
                    skill,
                    source,
                )

    def test_untrusted_query_is_json_script_escaped(self) -> None:
        generate_eval_review = _get_generate_eval_review()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            skill = root / 'skill'
            skill.mkdir()
            (skill / 'SKILL.md').write_text('---\nname: demo\ndescription: demo skill\n---\n')
            html = generate_eval_review.generate_review(
                [{'query': '</script><script>alert(1)</script>', 'should_trigger': False}],
                skill,
                Path(__file__).resolve().parents[2] / 'assets/eval_review.html',
            )
            self.assertNotIn('</script><script>alert(1)', html)
            self.assertIn('\\u003c/script\\u003e', html)


class TriggerReviewCliTests(unittest.TestCase):
    def test_invalid_input_has_concise_error_and_preserves_existing_output(self) -> None:
        script = Path(__file__).resolve().parent.parent / 'generate_eval_review.py'
        invalid_inputs = (
            ('[{"query":"q","should_trigger":"yes"}]', 'should_trigger'),
            ('[{"query":"","should_trigger":true}]', 'query'),
            ('{broken', 'Error'),
            (None, 'Error'),
            ('{"query":"q"}', 'array'),
        )
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            skill = root / 'skill'
            skill.mkdir()
            (skill / 'SKILL.md').write_text(
                '---\nname: demo\ndescription: test skill\n---\n', encoding='utf-8'
            )
            source = root / 'evals.json'
            output = root / 'review.html'
            for raw, expected in invalid_inputs:
                for existing in (False, True):
                    with self.subTest(raw=raw, existing=existing):
                        source.unlink(missing_ok=True)
                        output.unlink(missing_ok=True)
                        if raw is not None:
                            source.write_text(raw, encoding='utf-8')
                        if existing:
                            output.write_bytes(b'previous valid review')
                        result = subprocess.run(
                            [
                                sys.executable,
                                str(script),
                                '--eval-set',
                                str(source),
                                '--skill-path',
                                str(skill),
                                '--output',
                                str(output),
                            ],
                            capture_output=True,
                            text=True,
                            check=False,
                        )
                        self.assertNotEqual(result.returncode, 0)
                        self.assertNotIn('Traceback', result.stderr)
                        self.assertIn(expected, result.stderr)
                        self.assertLessEqual(len(result.stderr.splitlines()), 2)
                        if existing:
                            self.assertEqual(output.read_bytes(), b'previous valid review')
                        else:
                            self.assertFalse(output.exists())

    def test_output_io_error_has_concise_cli_error(self) -> None:
        script = Path(__file__).resolve().parent.parent / 'generate_eval_review.py'
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            skill = root / 'skill'
            skill.mkdir()
            (skill / 'SKILL.md').write_text(
                '---\nname: demo\ndescription: test skill\n---\n', encoding='utf-8'
            )
            source = root / 'evals.json'
            source.write_text('[{"query":"q","should_trigger":true}]', encoding='utf-8')
            output = root / 'existing-directory'
            output.mkdir()
            result = subprocess.run(
                [
                    sys.executable,
                    str(script),
                    '--eval-set',
                    str(source),
                    '--skill-path',
                    str(skill),
                    '--output',
                    str(output),
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertNotIn('Traceback', result.stderr)
            self.assertIn('Error', result.stderr)
            self.assertLessEqual(len(result.stderr.splitlines()), 2)
            self.assertEqual(list(output.iterdir()), [])


class GenerateReviewOptimizedTests(unittest.TestCase):
    def test_direct_html_generator_rejects_duplicate_review_ids(self) -> None:
        one: ReviewRun = {
            'id': 'same-run',
            'prompt': 'test',
            'eval_id': 1,
            'outputs': [],
            'grading': None,
        }
        with self.assertRaisesRegex(ValueError, 'unique IDs'):
            duplicate: ReviewRun = {
                'id': one['id'],
                'prompt': one['prompt'],
                'eval_id': one['eval_id'],
                'outputs': list(one['outputs']),
                'grading': one['grading'],
            }
            review.generate_html([one, duplicate], 'demo')

    def test_direct_html_generator_rejects_missing_review_id(self) -> None:
        invalid: ReviewRun = {
            'id': '',
            'prompt': 'test',
            'eval_id': 1,
            'outputs': [],
            'grading': None,
        }
        with self.assertRaisesRegex(ValueError, 'non-empty string'):
            review.generate_html([invalid], 'demo')

    def test_metadata_fields_fallback_independently(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            eval_dir = root / 'eval-1'
            run = eval_dir / 'with_skill' / 'run-1'
            run.mkdir(parents=True)
            write_metadata(eval_dir, eval_id=17, prompt=None)
            (run / 'transcript.md').write_text(
                '## Eval Prompt\n\nPrompt from transcript\n\n## Result\nx',
                encoding='utf-8',
            )

            built = review.build_run(root, run)

            self.assertEqual(built['eval_id'], 17)
            self.assertEqual(built['prompt'], 'Prompt from transcript')

    def test_string_eval_id_is_preserved(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            eval_dir = root / 'eval-alpha'
            run = eval_dir / 'with_skill' / 'run-1'
            (run / 'outputs').mkdir(parents=True)
            write_metadata(eval_dir, eval_id='alpha', prompt='p')

            runs = review.find_runs(root)

            self.assertEqual(runs[0]['eval_id'], 'alpha')

    def test_run_id_collision_is_deterministically_disambiguated(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            first = root / 'a-b' / 'run-1'
            second = root / 'a' / 'b-run-1'
            (first / 'outputs').mkdir(parents=True)
            (second / 'outputs').mkdir(parents=True)

            runs = review.find_runs(root)
            ids = [run['id'] for run in runs]

            self.assertEqual(len(ids), 2)
            self.assertEqual(len(set(ids)), 2)
            self.assertTrue(all('--' in value for value in ids))
            self.assertEqual(ids, [run['id'] for run in review.find_runs(root)])

    def test_run_order_is_natural_1_2_10(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            eval_dir = root / 'eval-1'
            write_metadata(eval_dir, eval_id=1, prompt='p')
            for number in (10, 1, 2):
                (eval_dir / 'with_skill' / f'run-{number}' / 'outputs').mkdir(parents=True)

            runs = review.find_runs(root)

            self.assertEqual(
                [run['id'].rsplit('-', 1)[-1] for run in runs],
                ['1', '2', '10'],
            )

    def test_failed_run_without_outputs_is_still_visible(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            run = root / 'eval-1' / 'with_skill' / 'run-1'
            run.mkdir(parents=True)
            write_metadata(root / 'eval-1', eval_id=1, prompt='p')

            runs = review.find_runs(root)

            self.assertEqual(len(runs), 1)
            self.assertEqual(runs[0]['outputs'], [])
            self.assertIsNone(runs[0]['grading'])

    def test_empty_grading_object_is_preserved(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            run = root / 'run-1'
            (run / 'outputs').mkdir(parents=True)
            (run / 'grading.json').write_text('{}', encoding='utf-8')

            built = review.build_run(root, run)

            self.assertEqual(built['grading'], {})

    @unittest.skipIf(not hasattr(os, 'symlink'), 'symlinks unavailable')
    def test_external_file_symlink_is_not_embedded(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, tempfile.TemporaryDirectory() as outside:
            root = Path(tmp)
            run = root / 'run-1'
            outputs = run / 'outputs'
            outputs.mkdir(parents=True)
            secret = Path(outside) / 'secret.txt'
            secret.write_text('SECRET', encoding='utf-8')
            link = outputs / 'secret.txt'
            os.symlink(secret, link)

            built = review.build_run(root, run)

            self.assertEqual(built['outputs'][0].get('type'), 'error')
            self.assertNotIn('SECRET', built['outputs'][0].get('content', ''))

    @unittest.skipIf(not hasattr(os, 'symlink'), 'symlinks unavailable')
    def test_external_directory_symlink_is_not_traversed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, tempfile.TemporaryDirectory() as outside:
            root = Path(tmp)
            run = root / 'run-1'
            outputs = run / 'outputs'
            outputs.mkdir(parents=True)
            outside_dir = Path(outside)
            (outside_dir / 'secret.txt').write_text('SECRET', encoding='utf-8')
            os.symlink(outside_dir, outputs / 'outside', target_is_directory=True)

            built = review.build_run(root, run)

            serialized = json.dumps(built['outputs'])
            self.assertNotIn('SECRET', serialized)

    def _post_feedback(
        self, workspace: Path, payload: dict[str, object]
    ) -> tuple[int, dict[str, object]]:
        """Exercise feedback normalization through its supported HTTP interface."""
        handler = partial(
            review.ReviewHandler,
            workspace,
            'skill',
            workspace / 'feedback.json',
            {},
            None,
        )
        server = review.ReviewHTTPServer(('127.0.0.1', 0), handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            port = server.server_address[1]
            connection = http.client.HTTPConnection('127.0.0.1', port, timeout=2)
            try:
                connection.request(
                    'POST',
                    '/api/feedback',
                    body=json.dumps(payload),
                    headers={'Content-Type': 'application/json'},
                )
                response = connection.getresponse()
                status = response.status
                raw_response: object = json.loads(response.read())
                self.assertIsInstance(raw_response, dict)
                return status, cast(dict[str, object], raw_response)
            finally:
                connection.close()
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

    def test_feedback_normalization_preserves_blank_as_no_comment(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'run-1' / 'outputs').mkdir(parents=True)
            run_id = review.find_runs(root)[0]['id']
            status, response = self._post_feedback(
                root,
                {'reviews': [{'run_id': run_id, 'feedback': ''}], 'status': 'complete'},
            )
            self.assertEqual(status, 200)
            self.assertEqual(response, {'ok': True})

            raw_saved: object = json.loads((root / 'feedback.json').read_text(encoding='utf-8'))
            self.assertIsInstance(raw_saved, dict)
            saved = cast(dict[str, object], raw_saved)
            self.assertEqual(saved.get('status'), 'complete')
            reviews = saved.get('reviews')
            self.assertIsInstance(reviews, list)
            entries = cast(list[object], reviews)
            self.assertEqual(len(entries), 1)
            entry: object = entries[0]
            self.assertIsInstance(entry, dict)
            feedback_entry = cast(dict[str, object], entry)
            self.assertEqual(feedback_entry.get('feedback'), '')
            timestamp = feedback_entry.get('timestamp')
            if isinstance(timestamp, str):
                self.assertTrue(timestamp.endswith('Z'))
            else:
                self.fail(f'Expected a string timestamp, got {timestamp!r}')

    def test_feedback_rejects_duplicate_or_unknown_run_ids(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'run-1' / 'outputs').mkdir(parents=True)
            run_id = review.find_runs(root)[0]['id']

            status, response = self._post_feedback(
                root,
                {
                    'reviews': [
                        {'run_id': run_id, 'feedback': 'a'},
                        {'run_id': run_id, 'feedback': 'b'},
                    ]
                },
            )
            self.assertEqual(status, 400)
            self.assertIn('duplicate', str(response.get('error')))
            self.assertFalse((root / 'feedback.json').exists())

            status, response = self._post_feedback(
                root,
                {'reviews': [{'run_id': 'other', 'feedback': 'a'}]},
            )
            self.assertEqual(status, 400)
            self.assertIn('unknown', str(response.get('error')))
            self.assertFalse((root / 'feedback.json').exists())

    def test_json_embedding_escapes_script_terminators(self) -> None:
        untrusted_prompt = '</script><script>alert(1)</script>'
        html = review.generate_html(
            [
                {
                    'id': 'run-1',
                    'prompt': untrusted_prompt,
                    'eval_id': None,
                    'outputs': [],
                    'grading': None,
                }
            ],
            'demo',
        )
        self.assertNotIn(untrusted_prompt, html)
        self.assertIn('\\u003c/script\\u003e', html)

    def test_generate_html_requires_exactly_one_marker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            module_dir = Path(tmp)
            fake_module = module_dir / 'generate_review.py'
            fake_module.write_text('', encoding='utf-8')
            (module_dir / 'viewer.html').write_text('<html>no marker</html>', encoding='utf-8')
            old_file = review.__file__
            review.__file__ = str(fake_module)
            try:
                with self.assertRaises(ValueError):
                    review.generate_html([], 'skill')
            finally:
                review.__file__ = old_file

    def test_http_feedback_boundary_and_schema_normalization(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            run = root / 'run-1'
            (run / 'outputs').mkdir(parents=True)
            run_id = review.find_runs(root)[0]['id']
            feedback_path = root / 'feedback.json'

            handler = partial(
                review.ReviewHandler,
                root,
                'skill',
                feedback_path,
                {},
                None,
            )
            server = review.ReviewHTTPServer(('127.0.0.1', 0), handler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            port = server.server_address[1]

            try:
                conn = http.client.HTTPConnection('127.0.0.1', port, timeout=2)
                conn.request('GET', '/api/feedback')
                response = conn.getresponse()
                self.assertEqual(response.status, 200)
                default = json.loads(response.read())
                self.assertEqual(default, {'reviews': [], 'status': 'in_progress'})
                conn.close()

                conn = http.client.HTTPConnection('127.0.0.1', port, timeout=2)
                conn.request(
                    'POST',
                    '/api/feedback',
                    body='{"reviews":[]}',
                    headers={'Content-Type': 'text/plain'},
                )
                response = conn.getresponse()
                self.assertEqual(response.status, 415)
                response.read()
                conn.close()

                conn = http.client.HTTPConnection('127.0.0.1', port, timeout=2)
                payload = json.dumps({
                    'reviews': [{'run_id': run_id, 'feedback': ''}],
                    'status': 'complete',
                })
                conn.request(
                    'POST',
                    '/api/feedback',
                    body=payload,
                    headers={'Content-Type': 'application/json'},
                )
                response = conn.getresponse()
                self.assertEqual(response.status, 200)
                response.read()
                conn.close()

                saved = json.loads(feedback_path.read_text(encoding='utf-8'))
                self.assertEqual(saved['status'], 'complete')
                self.assertEqual(saved['reviews'][0]['feedback'], '')
                self.assertIn('timestamp', saved['reviews'][0])

                conn = http.client.HTTPConnection('127.0.0.1', port, timeout=2)
                conn.request(
                    'POST',
                    '/api/feedback',
                    body=payload,
                    headers={
                        'Content-Type': 'application/json',
                        'Origin': 'https://example.com',
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

    def test_rejected_post_with_unread_body_still_delivers_the_response(self) -> None:
        # Rejecting before reading a large body and then closing the socket
        # sends a TCP reset that can discard the response the client has not
        # read yet, so the rejection must be delivered reliably.
        json_type = {'Content-Type': 'application/json'}
        rejected_bodies = (
            ({'Content-Type': 'text/plain'}, 500_000, 415),
            ({**json_type, 'Origin': 'https://x.example'}, 500_000, 403),
            ({**json_type, 'Content-Length': 'abc'}, 500_000, 400),
            (json_type, 3_000_000, 413),
        )
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'run-1' / 'outputs').mkdir(parents=True)
            handler = partial(review.ReviewHandler, root, 'skill', root / 'feedback.json', {}, None)
            server = review.ReviewHTTPServer(('127.0.0.1', 0), handler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            port = server.server_address[1]
            try:
                for headers, body_size, expected in rejected_bodies:
                    body = b'x' * body_size
                    for attempt in range(8):
                        with self.subTest(status=expected, attempt=attempt):
                            conn = http.client.HTTPConnection('127.0.0.1', port, timeout=2)
                            try:
                                conn.request('POST', '/api/feedback', body=body, headers=headers)
                                response = conn.getresponse()
                                self.assertEqual(response.status, expected)
                                response.read()
                            finally:
                                conn.close()
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)

    def test_static_output_directory_returns_clean_error(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'run-1' / 'outputs').mkdir(parents=True)
            static_dir = root / 'already-a-directory'
            static_dir.mkdir()

            with patch.object(
                review,
                'generate_html',
                return_value='<html></html>',
            ):
                result = review.main([str(root), '--static', str(static_dir)])

            self.assertEqual(result, 1)

    def test_port_zero_uses_actual_bound_port(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'run-1' / 'outputs').mkdir(parents=True)
            opened: list[str] = []

            class FakeServer:
                server_address = ('127.0.0.1', 43210)

                def serve_forever(self) -> None:
                    return None

                def server_close(self) -> None:
                    return None

            with (
                patch.object(review, '_create_server', return_value=FakeServer()),
                patch.object(review.webbrowser, 'open', side_effect=opened.append),
            ):
                result = review.main([str(root), '--port', '0'])

            self.assertEqual(result, 0)
            self.assertEqual(opened, ['http://localhost:43210'])

    def test_invalid_benchmark_argument_is_controlled_error(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'run-1' / 'outputs').mkdir(parents=True)
            bad = root / 'benchmark.json'
            bad.write_text('{"not":"a benchmark"}', encoding='utf-8')

            result = review.main([
                str(root),
                '--benchmark',
                str(bad),
                '--static',
                str(root / 'x.html'),
            ])

            self.assertEqual(result, 1)


if __name__ == '__main__':
    unittest.main()
