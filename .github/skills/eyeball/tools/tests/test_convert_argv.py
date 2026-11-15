#!/usr/bin/env python3
"""Argument-injection regression test for eyeball's LibreOffice conversion."""

from __future__ import annotations

import importlib.util
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

MODULE_PATH = Path(__file__).resolve().parents[1] / 'eyeball.py'
SPEC = importlib.util.spec_from_file_location('eyeball', MODULE_PATH)
assert SPEC is not None
assert SPEC.loader is not None
eyeball = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = eyeball
SPEC.loader.exec_module(eyeball)


class LibreOfficeArgvTests(unittest.TestCase):
    def test_option_like_source_name_is_passed_as_absolute_path(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            previous = os.getcwd()
            os.chdir(root)
            try:
                with mock.patch.object(eyeball.subprocess, 'run') as run:
                    run.return_value.returncode = 1
                    eyeball._convert_with_libreoffice('soffice', '--evil.docx', 'out.pdf')
            finally:
                os.chdir(previous)
        argv = run.call_args.args[0]
        self.assertEqual(argv[0], 'soffice')
        self.assertTrue(os.path.isabs(argv[-1]))
        self.assertFalse(argv[-1].startswith('-'))
        self.assertFalse(run.call_args.kwargs.get('shell', False))


if __name__ == '__main__':
    unittest.main()
