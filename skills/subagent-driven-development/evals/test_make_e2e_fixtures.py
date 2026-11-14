"""Tests for the git allow-list in make-e2e-fixtures.py.

Run from the repository root:
    python -I skills/subagent-driven-development/evals/test_make_e2e_fixtures.py
"""

import importlib.util
import tempfile
import unittest
from pathlib import Path

_SCRIPT = Path(__file__).with_name("make-e2e-fixtures.py")
_SPEC = importlib.util.spec_from_file_location("make_e2e_fixtures", _SCRIPT)
assert _SPEC is not None
assert _SPEC.loader is not None
fixtures = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(fixtures)


class CheckGitArgsTest(unittest.TestCase):
    def test_every_subcommand_the_script_uses_is_allowed(self) -> None:
        calls = [
            ("init", "-q", "-b", "main"),
            ("init", "-q", "--bare", "-b", "main", "remote.git"),
            ("clone", "-q", "remote.git", "seed"),
            ("add", "-A"),
            ("commit", "-q", "-m", "msg"),
            ("switch", "-q", "-c", "feat/p"),
            ("branch", "--show-current"),
            ("remote", "add", "origin", "remote.git"),
            ("push", "-q", "origin", "main"),
            ("rev-parse", "--short", "HEAD"),
            ("rev-list", "--count", "HEAD"),
        ]
        for call in calls:
            with self.subTest(call=call):
                fixtures.check_git_args(call)

    def test_rejects_subcommands_outside_the_allow_list(self) -> None:
        for call in [
            (),
            ("config", "core.sshCommand", "evil"),
            ("-c", "core.pager=evil", "log"),
            ("daemon",),
            ("filter-branch",),
            ("--exec-path=/tmp",),
        ]:
            with self.subTest(call=call), self.assertRaises(ValueError):
                fixtures.check_git_args(call)

    def test_rejects_options_that_run_external_programs(self) -> None:
        for call in [
            ("clone", "--upload-pack=evil", "remote.git", "seed"),
            ("push", "--receive-pack=evil", "origin", "main"),
            ("clone", "--config", "core.sshCommand=evil", "a", "b"),
            ("init", "--template=/tmp/hooks"),
        ]:
            with self.subTest(call=call), self.assertRaises(ValueError):
                fixtures.check_git_args(call)

    def test_git_refuses_before_running_anything(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, self.assertRaises(ValueError):
            fixtures.git(Path(tmp), "config", "user.name", "x")


class MainTest(unittest.TestCase):
    def _run_main(self, target: Path) -> int:
        original = fixtures.sys.argv
        fixtures.sys.argv = ["make-e2e-fixtures.py", str(target)]
        try:
            return fixtures.main()
        finally:
            fixtures.sys.argv = original

    def test_builds_the_three_fixture_repos(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "fx"
            self.assertEqual(self._run_main(out), 0)
            for name in ("c1-resume", "b1-destructive", "c5-conflict"):
                self.assertTrue((out / name / ".git").is_dir(), name)

    def test_refuses_to_overwrite_an_existing_directory(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(self._run_main(Path(tmp)), 2)


if __name__ == "__main__":
    unittest.main()
