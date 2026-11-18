"""Static negative-oracle checks for optional skill authoring and hook references.

These are not Claude host matching, activation or hook-installation tests.
"""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REF = ROOT / 'references'


class ReferenceContractTests(unittest.TestCase):
    def test_user_selected_six_category_file_scoring_is_not_overridden(self) -> None:
        rubric = (REF / 'adversarial-quality-review.md').read_text()
        self.assertIn('keep these exact six weights for every file', rubric)
        self.assertIn('minimum', (ROOT / 'SKILL.md').read_text())

    def test_all_activation_oracles_remain_binary_and_runner_compatible(self) -> None:
        all_ids: set[str] = set()
        for stem, expected_count in [
            ('activation-smoke', 4),
            ('activation-eval', 20),
            ('activation-holdout', 8),
        ]:
            cases = json.loads((REF / 'activation-cases' / f'{stem}.json').read_text())
            self.assertEqual(len(cases), expected_count)
            seen: set[str] = set()
            for case in cases:
                self.assertEqual(set(case), {'id', 'query', 'should_trigger'})
                self.assertIsInstance(case['should_trigger'], bool)
                self.assertTrue(case['query'].strip())
                self.assertNotIn(case['id'], seen | all_ids)
                seen.add(case['id'])
            all_ids.update(seen)
        readme = (REF / 'activation-cases' / 'README.md').read_text()
        self.assertIn('NOT an independent/private', readme)

    def test_reference_regex_examples_discriminate_positive_and_negative(self) -> None:
        regexes = {
            'feature': (
                r'(add|create|implement|build).*?(feature|endpoint|route|service|controller)',
                'Create an API endpoint',
                'Review an API endpoint design',
            ),
            'component': (
                r'(create|add|make|build).*?(component|UI|page|modal|dialog|form)',
                'Create a React component',
                'Explain component architecture',
            ),
            'database': (
                r'(add|create|modify|update).*?(user|table|column|field|schema|migration)',
                'Modify a database table',
                'What is a database schema?',
            ),
            'testing': (
                r'(write|create|add).*?(test|spec|unit.*?test)',
                'Write a unit test',
                'Read the test summary',
            ),
        }
        for name, (regex, positive, negative) in regexes.items():
            with self.subTest(pattern=name):
                self.assertIsNotNone(re.search(regex, positive, re.I))
                self.assertIsNone(re.search(regex, negative, re.I))

    def test_security_hook_reference_does_not_claim_hook_source_is_bundled(self) -> None:
        hook = (REF / 'claude-code-hook-mechanisms.md').read_text()
        self.assertIn('external project prerequisites', hook)
        self.assertIn('HOLD', hook)
        advanced = (REF / 'claude-code-advanced.md').read_text()
        self.assertIn('Proposal-only ideas', advanced)

    def test_historical_schema_evidence_remains_historical(self) -> None:
        old = json.loads((REF / 'validation-results.json').read_text())
        self.assertEqual(old['verification_date'], '2026-10-05')
        current = REF / 'schema-validation-2026-11-17-py313.json'
        if current.exists():
            new = json.loads(current.read_text())
            self.assertNotEqual(old['observations'][0]['sha256'], new['observations'][0]['sha256'])
            self.assertIn('DIAGNOSTIC', new['validation_kind'])


if __name__ == '__main__':
    unittest.main()
