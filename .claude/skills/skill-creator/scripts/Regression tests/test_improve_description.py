from __future__ import annotations

import importlib
import subprocess
import sys
import tempfile
import unittest
from collections.abc import Callable
from pathlib import Path
from types import ModuleType
from typing import Protocol, cast
from unittest.mock import patch

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))


class _CheckpointStore(Protocol):
    """Structural type for the checkpoint store used by these regression tests."""


class _EvaluationControl(Protocol):
    attempted_calls: int
    successful_calls: int
    resumed_calls: int


class _CheckpointStoreFactory(Protocol):
    def __call__(self, path: Path) -> _CheckpointStore: ...


class _EvaluationControlFactory(Protocol):
    def __call__(
        self,
        *,
        max_calls: int,
        planned_calls: int,
        checkpoint: _CheckpointStore | None,
        deadline_seconds: float | None,
        clock: Callable[[], float] | None = None,
    ) -> _EvaluationControl: ...


class _EvalControlModule(Protocol):
    CheckpointStore: _CheckpointStoreFactory
    EvaluationControl: _EvaluationControlFactory


class _ImproveDescriptionModule(Protocol):
    subprocess: ModuleType
    os: ModuleType
    shutil: ModuleType

    def improve_description(
        self,
        *,
        skill_name: str,
        skill_content: str,
        current_description: str,
        eval_results: object,
        history: object,
        model: str,
        iteration: int | None = None,
        log_dir: Path | None = None,
        control: object | None = None,
    ) -> str: ...


def _load_module(name: str) -> ModuleType:
    """Import one of the sibling scripts used by these tests."""
    if name == 'eval_control':
        return importlib.import_module('eval_control')
    if name == 'improve_description':
        return importlib.import_module('improve_description')
    raise ImportError(f'Unsupported regression test module: {name!r}')


eval_control = cast(_EvalControlModule, _load_module('eval_control'))
_improve_description_module = _load_module('improve_description')
improve_description = cast(_ImproveDescriptionModule, _improve_description_module)

# These helpers are deliberately private production implementation details.
# The regression suite exercises them through typed test-only adapters so
# Pylance does not mistake intentional white-box testing for public API usage.
extract_description = cast(
    Callable[[str], str],
    _improve_description_module._extract_description,
)
call_claude = cast(
    Callable[[str, str], str],
    _improve_description_module._call_claude,
)

CheckpointStore = eval_control.CheckpointStore
EvaluationControl = eval_control.EvaluationControl


class ImproveDescriptionControlTests(unittest.TestCase):
    def test_module_loader_rejects_names_outside_the_allowlist(self) -> None:
        with patch.object(importlib, 'import_module') as import_module:
            with self.assertRaises(ImportError):
                _load_module('json')
        import_module.assert_not_called()

    @staticmethod
    def _response(text: str) -> subprocess.CompletedProcess[str]:
        return subprocess.CompletedProcess(['claude'], 0, text, '')

    @staticmethod
    def _control(
        directory: str,
        *,
        max_calls: int,
        planned_calls: int,
    ) -> _EvaluationControl:
        return EvaluationControl(
            max_calls=max_calls,
            planned_calls=planned_calls,
            checkpoint=CheckpointStore(Path(directory) / 'checkpoint.jsonl'),
            deadline_seconds=None,
        )

    def test_hostile_or_ambiguous_model_response_rejected(self) -> None:
        invalid_responses = (
            '',
            'model refused',
            '<new_description></new_description>',
            '<new_description>safe</new_description> trailing',
            '<new_description>safe</new_description>\n<new_description>another</new_description>',
            '<new_description>safe\x00description</new_description>',
            '<new_description>\u0001control</new_description>',
        )
        for response in invalid_responses:
            with self.subTest(response=response), self.assertRaises(RuntimeError):
                extract_description(response)

        self.assertEqual(
            extract_description('<new_description>"quoted"</new_description>'),
            'quoted',
        )
        self.assertEqual(
            extract_description('<new_description>"quoted</new_description>'),
            '"quoted',
        )

    def test_rewrite_and_shortening_use_distinct_permits(self) -> None:
        over_limit = 'x' * 1025
        responses = [
            self._response(f'<new_description>{over_limit}</new_description>'),
            self._response('<new_description>short description</new_description>'),
        ]
        with (
            tempfile.TemporaryDirectory() as directory,
            patch.object(
                improve_description.subprocess,
                'run',
                side_effect=responses,
            ) as run,
        ):
            control = self._control(directory, max_calls=2, planned_calls=2)
            result = improve_description.improve_description(
                skill_name='demo',
                skill_content='body',
                current_description='old',
                eval_results={
                    'description': 'old',
                    'summary': {'passed': 0, 'failed': 1, 'total': 1},
                    'results': [],
                },
                history=[],
                model='claude-sonnet-4-6',
                iteration=1,
                control=control,
            )

        self.assertEqual(result, 'short description')
        self.assertEqual(run.call_count, 2)
        self.assertEqual(control.attempted_calls, 2)
        self.assertEqual(control.successful_calls, 2)

    def test_cap_one_blocks_shortening_before_launch(self) -> None:
        over_limit = 'x' * 1025
        with (
            tempfile.TemporaryDirectory() as directory,
            patch.object(
                improve_description.subprocess,
                'run',
                return_value=self._response(f'<new_description>{over_limit}</new_description>'),
            ) as run,
        ):
            control = self._control(directory, max_calls=1, planned_calls=2)
            with self.assertRaisesRegex(RuntimeError, 'budget_exhausted'):
                improve_description.improve_description(
                    skill_name='demo',
                    skill_content='body',
                    current_description='old',
                    eval_results={
                        'description': 'old',
                        'summary': {'passed': 0, 'failed': 1, 'total': 1},
                        'results': [],
                    },
                    history=[],
                    model='claude-sonnet-4-6',
                    iteration=1,
                    control=control,
                )

        self.assertEqual(run.call_count, 1)
        self.assertEqual(control.attempted_calls, 1)
        self.assertEqual(control.successful_calls, 1)

    def test_claude_invocation_disables_shell_execution(self) -> None:
        response = self._response('<new_description>safe result</new_description>')
        resolved_executable = r'C:\Program Files\Claude\claude.cmd'
        with (
            patch.object(improve_description.os, 'name', 'nt'),
            patch.object(
                improve_description.shutil,
                'which',
                return_value=resolved_executable,
            ),
            patch.object(
                improve_description.subprocess,
                'run',
                return_value=response,
            ) as run,
        ):
            result = call_claude(
                'prompt',
                'claude-sonnet-4-6',
            )

        self.assertEqual(result, response.stdout)
        self.assertEqual(run.call_args.args[0][0], resolved_executable)
        self.assertFalse(run.call_args.kwargs['shell'])

    def test_cached_rewrite_skips_claude_and_counts_as_resumed(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            checkpoint = CheckpointStore(Path(directory) / 'checkpoint.jsonl')
            first = EvaluationControl(
                max_calls=1,
                planned_calls=1,
                checkpoint=checkpoint,
                deadline_seconds=None,
            )
            with patch.object(
                improve_description.subprocess,
                'run',
                return_value=self._response('<new_description>cached result</new_description>'),
            ) as first_run:
                first_result = improve_description.improve_description(
                    skill_name='demo',
                    skill_content='body',
                    current_description='old',
                    eval_results={
                        'description': 'old',
                        'summary': {'passed': 0, 'failed': 1, 'total': 1},
                        'results': [],
                    },
                    history=[],
                    model='claude-sonnet-4-6',
                    iteration=1,
                    control=first,
                )

            second = EvaluationControl(
                max_calls=1,
                planned_calls=1,
                checkpoint=checkpoint,
                deadline_seconds=None,
            )
            with patch.object(
                improve_description.subprocess,
                'run',
            ) as second_run:
                second_result = improve_description.improve_description(
                    skill_name='demo',
                    skill_content='body',
                    current_description='old',
                    eval_results={
                        'description': 'old',
                        'summary': {'passed': 0, 'failed': 1, 'total': 1},
                        'results': [],
                    },
                    history=[],
                    model='claude-sonnet-4-6',
                    iteration=1,
                    control=second,
                )

        self.assertEqual(first_result, 'cached result')
        self.assertEqual(second_result, 'cached result')
        self.assertEqual(first_run.call_count, 1)
        self.assertEqual(second_run.call_count, 0)
        self.assertEqual(second.resumed_calls, 1)


if __name__ == '__main__':
    unittest.main()
