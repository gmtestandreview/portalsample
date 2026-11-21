"""Offline Chromium regression tests for the shipped viewer template."""

from __future__ import annotations

import json
import math
import shutil
import unittest
from pathlib import Path
from typing import cast

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / 'eval-viewer' / 'viewer.html'
EMBEDDED_DATA_MARKER = '/*__EMBEDDED_DATA__*/'


def _embed_data(template: str, payload: dict[str, object]) -> str:
    """Embed JSON as a JS literal without permitting a script-tag breakout."""
    if template.count(EMBEDDED_DATA_MARKER) != 1:
        raise ValueError('Viewer template must have exactly one embedded-data marker')

    encoded = (
        json
        .dumps(payload, ensure_ascii=True, allow_nan=False)
        .replace('<', r'\u003c')
        .replace('>', r'\u003e')
        .replace('&', r'\u0026')
    )
    return template.replace('__CSP_NONCE__', 'test-nonce').replace(
        EMBEDDED_DATA_MARKER, f'const EMBEDDED_DATA = {encoded};'
    )


def _render_viewer_html(payload: dict[str, object]) -> str:
    return _embed_data(TEMPLATE.read_text(encoding='utf-8'), payload)


def _json_object(value: object, description: str) -> dict[str, object]:
    """Narrow a decoded JSON object; JSON object keys are always strings."""
    if not isinstance(value, dict):
        raise AssertionError(f'{description} must be a JSON object')
    return cast(dict[str, object], value)


def _json_array(value: object, description: str) -> list[object]:
    """Narrow a decoded JSON array without assuming its element schema."""
    if not isinstance(value, list):
        raise AssertionError(f'{description} must be a JSON array')
    return cast(list[object], value)


class ViewerEmbeddingTests(unittest.TestCase):
    def test_script_terminator_is_escaped(self) -> None:
        dangerous = '</script><img src=x onerror="window.__unsafe = true">'
        payload: dict[str, object] = {
            'skill_name': dangerous,
            'runs': [],
            'previous_feedback': {},
            'previous_outputs': {},
        }
        rendered = _embed_data(f'<script>{EMBEDDED_DATA_MARKER}</script>', payload)
        self.assertEqual(rendered.count('</script>'), 1)
        self.assertNotIn(dangerous, rendered)
        self.assertIn(r'\u003c/script\u003e', rendered)

    def test_json_round_trip_with_hostile_text(self) -> None:
        text = '</script><img onerror="window.__unsafe = true">\n\r\u2028\u2029&😺'
        payload: dict[str, object] = {
            'skill_name': text,
            'runs': [{'id': 'run-1', 'prompt': text, 'outputs': []}],
            'previous_feedback': {'run-1': text},
            'previous_outputs': {},
        }
        prefix = '<script>const EMBEDDED_DATA = '
        suffix = ';</script>'
        rendered = _embed_data(f'<script>{EMBEDDED_DATA_MARKER}</script>', payload)
        self.assertTrue(rendered.startswith(prefix))
        self.assertTrue(rendered.endswith(suffix))
        self.assertEqual(json.loads(rendered[len(prefix) : -len(suffix)]), payload)
        self.assertEqual(rendered.count('</script>'), 1)

    def test_nonfinite_json_values_are_rejected(self) -> None:
        for value in (math.nan, math.inf, -math.inf):
            with self.subTest(value=value), self.assertRaises(ValueError):
                _embed_data(EMBEDDED_DATA_MARKER, {'value': value})

    def test_embedded_data_marker_must_be_unique(self) -> None:
        payload: dict[str, object] = {
            'skill_name': 'demo',
            'runs': [],
            'previous_feedback': {},
            'previous_outputs': {},
        }
        for count in (0, 2):
            with (
                self.subTest(marker_count=count),
                self.assertRaisesRegex(ValueError, 'exactly one'),
            ):
                _embed_data(EMBEDDED_DATA_MARKER * count, payload)


class ViewerBrowserTests(unittest.TestCase):
    def test_untrusted_skill_and_prompt_render_as_text(self) -> None:
        try:
            from playwright.sync_api import expect, sync_playwright
        except ImportError:
            self.skipTest('Python Playwright missing; live browser evidence NHR')

        dangerous = '</script><img src=x onerror="window.__unsafe = true">'
        payload: dict[str, object] = {
            'skill_name': dangerous,
            'runs': [
                {
                    'id': 'run-1-with_skill',
                    'prompt': dangerous,
                    'eval_id': 1,
                    'outputs': [{'name': 'output.txt', 'type': 'text', 'content': dangerous}],
                    'grading': None,
                }
            ],
            'previous_feedback': {},
            'previous_outputs': {},
        }
        html = _render_viewer_html(payload)
        with sync_playwright() as playwright:
            managed = Path(playwright.chromium.executable_path)
            system = shutil.which('chromium') or shutil.which('google-chrome')
            if not managed.is_file() and system is None:
                self.skipTest('Chromium unavailable; run python -m playwright install chromium')
            if managed.is_file():
                browser = playwright.chromium.launch(args=['--no-sandbox'])
            else:
                # The fallback is only reached when system was found above.
                assert system is not None
                browser = playwright.chromium.launch(executable_path=system, args=['--no-sandbox'])
            try:
                page = browser.new_page()
                page.route('**/*', lambda route: route.abort())
                # Wait for load/error handlers before checking injection side effects.
                page.set_content(html, wait_until='load')
                expect(page.locator('#skill-name')).to_have_text(dangerous)
                self.assertEqual(page.locator('#skill-name').inner_text(), dangerous)
                self.assertEqual(page.locator('#prompt-text').inner_text(), dangerous)
                rendered_output = page.locator('#outputs-body .output-file-content pre')
                self.assertEqual(rendered_output.count(), 1)
                self.assertEqual(rendered_output.text_content(), dangerous)
                self.assertEqual(
                    page.locator(
                        '#skill-name img, #prompt-text img, #outputs-body .output-file-content img'
                    ).count(),
                    0,
                )
                self.assertFalse(page.evaluate('Boolean(window.__unsafe)'))
                self.assertFalse(page.locator('#done-btn').is_disabled())
            finally:
                browser.close()


class ViewerFeedbackInteractionTests(unittest.TestCase):
    def test_navigation_preserves_feedback_and_requires_explicit_submission(
        self,
    ) -> None:
        try:
            from playwright.sync_api import expect, sync_playwright
        except ImportError:
            self.skipTest('Python Playwright missing; interactive feedback NHR')

        runs: list[dict[str, object]] = [
            {
                'id': f'run-{i}-with_skill',
                'prompt': f'prompt {i}',
                'eval_id': i,
                'outputs': [],
                'grading': None,
            }
            for i in (1, 2)
        ]
        payload: dict[str, object] = {
            'skill_name': 'demo',
            'runs': runs,
            'previous_feedback': {},
            'previous_outputs': {},
        }
        content = _render_viewer_html(payload)
        with sync_playwright() as playwright:
            managed = Path(playwright.chromium.executable_path)
            system = shutil.which('chromium') or shutil.which('google-chrome')
            if not managed.is_file() and system is None:
                self.skipTest('Chromium unavailable; run python -m playwright install chromium')
            if managed.is_file():
                browser = playwright.chromium.launch(args=['--no-sandbox'])
            else:
                # The fallback is only reached when system was found above.
                assert system is not None
                browser = playwright.chromium.launch(executable_path=system, args=['--no-sandbox'])
            try:
                page = browser.new_page(accept_downloads=True)
                page.route('**/*', lambda route: route.abort())
                page.set_content(content, wait_until='load')
                expect(page.locator('#skill-name')).to_have_text('demo')
                self.assertTrue(page.locator('#done-btn').is_disabled())
                page.locator('#feedback').fill('first review')
                page.locator('#next-btn').click()
                page.locator('#feedback').fill('second review')
                self.assertFalse(page.locator('#done-btn').is_disabled())
                page.locator('#prev-btn').click()
                self.assertEqual(page.locator('#feedback').input_value(), 'first review')
                page.locator('#next-btn').click()
                self.assertEqual(page.locator('#feedback').input_value(), 'second review')
                self.assertNotEqual(page.locator('#feedback-status').inner_text(), 'Submitted')
                # Offline: download feedback.json, without claiming server persistence.
                with page.expect_download(timeout=8000) as download_info:
                    page.locator('#done-btn').click()
                downloaded = download_info.value
                self.assertEqual(downloaded.suggested_filename, 'feedback.json')
                contents: object = json.loads(downloaded.path().read_text(encoding='utf-8'))
                feedback = _json_object(contents, 'Downloaded feedback')
                self.assertEqual(feedback.get('status'), 'complete')
                reviews = _json_array(feedback.get('reviews'), 'Downloaded reviews')
                self.assertEqual(len(reviews), 2)
                for i, raw_review in enumerate(reviews, start=1):
                    review = _json_object(raw_review, f'Review {i}')
                    self.assertEqual(review.get('run_id'), f'run-{i}-with_skill')
                    self.assertEqual(
                        review.get('feedback'),
                        'first review' if i == 1 else 'second review',
                    )
                    self.assertIsInstance(review.get('timestamp'), str)
                self.assertIn('downloaded', page.locator('#done-message').inner_text().lower())
                self.assertEqual(page.locator('#feedback-status').inner_text(), 'Submitted')
            finally:
                browser.close()


if __name__ == '__main__':
    unittest.main()
