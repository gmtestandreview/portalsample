"""Valid/invalid fixture pairs for schema contracts; semantics remain a separate gate."""

from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parents[2]
SCHEMA_ROOT = ROOT / 'references' / 'schemas'
VALID = {
    'analysis': {
        'comparison_summary': {
            'winner': 'A',
            'winner_skill': 'candidate',
            'loser_skill': 'baseline',
            'comparator_reasoning': 'Evidence identifies a required value',
        },
        'winner_strengths': ['observable'],
        'loser_weaknesses': [],
        'instruction_following': {
            'winner': {'score': 8, 'issues': []},
            'loser': {'score': 5, 'issues': ['missing evidence']},
        },
        'improvement_suggestions': [],
        'transcript_insights': {
            'winner_execution_pattern': 'verified step',
            'loser_execution_pattern': 'omitted step',
        },
    },
    'eval-metadata': {
        'eval_id': 1,
        'eval_name': 'case 1',
        'prompt': 'create skill',
        'expectations': [],
    },
    'evals': {
        'skill_name': 'candidate',
        'evals': [{'id': 1, 'prompt': 'create skill', 'expected_output': 'valid SKILL.md'}],
    },
    'feedback': {
        'reviews': [{'run_id': 'run-1', 'feedback': '', 'timestamp': '2026-11-17T00:00:00Z'}],
        'status': 'in_progress',
    },
    'grading': {
        'expectations': [{'text': 'correctly parsed', 'passed': True, 'evidence': 'parser output'}],
        'summary': {'passed': 1, 'failed': 0, 'total': 1, 'pass_rate': 1.0},
    },
    'history': {
        'started_at': '2026-11-17T00:00:00Z',
        'skill_name': 'demo',
        'current_best': 'v1',
        'iterations': [
            {'version': 'v1', 'parent': None, 'grading_result': 'baseline', 'is_current_best': True}
        ],
    },
}


class SchemaFixtureContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        resources = {}
        for path in SCHEMA_ROOT.glob('*.schema.json'):
            data = json.loads(path.read_text(encoding='utf-8'))
            Draft202012Validator.check_schema(data)
            resources[path.name] = Resource.from_contents(data)
        cls.registry = Registry().with_resources(resources.items())

    def test_documented_schemas_accept_valid_and_reject_missing_required(self) -> None:
        for name, item in VALID.items():
            with self.subTest(schema=name):
                schema = json.loads((SCHEMA_ROOT / f'{name}.schema.json').read_text())
                validator = Draft202012Validator(
                    schema, registry=self.registry, format_checker=FormatChecker()
                )
                validator.validate(item)
                missing = copy.deepcopy(item)
                missing.pop(schema['required'][0])
                self.assertTrue(list(validator.iter_errors(missing)), name)
                extras = copy.deepcopy(item)
                extras['__not_a_supported_field__'] = 1
                self.assertTrue(list(validator.iter_errors(extras)), name)

    def test_schema_passing_with_inconsistent_counts_does_not_prove_semantics(self) -> None:
        schema = json.loads((SCHEMA_ROOT / 'grading.schema.json').read_text())
        validator = Draft202012Validator(schema, registry=self.registry)
        bad = copy.deepcopy(VALID['grading'])
        bad['summary']['total'] = 9
        validator.validate(
            bad
        )  # This shows exactly why downstream semantic validation is required.
        self.assertNotEqual(
            bad['summary']['passed'] + bad['summary']['failed'], bad['summary']['total']
        )

    def test_all_schema_sources_have_stable_identifiers(self) -> None:
        ids = set()
        for path in SCHEMA_ROOT.glob('*.schema.json'):
            schema = json.loads(path.read_text())
            self.assertNotIn(schema['$id'], ids)
            ids.add(schema['$id'])
        self.assertEqual(len(ids), 11)


if __name__ == '__main__':
    unittest.main()
