#!/usr/bin/env python3
"""Security regression tests for with_server.py server-command handling."""

from __future__ import annotations

import importlib.util
import os
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

MODULE_PATH = Path(__file__).resolve().parents[1] / 'with_server.py'
SPEC = importlib.util.spec_from_file_location('with_server', MODULE_PATH)
assert SPEC is not None
assert SPEC.loader is not None
ws = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = ws
SPEC.loader.exec_module(ws)


class ParseServerCommandTests(unittest.TestCase):
    def test_plain_command_becomes_argv(self) -> None:
        self.assertEqual(ws.parse_server_command('npm run dev'), (None, ['npm', 'run', 'dev']))

    def test_quoted_argument_keeps_spaces_as_one_argument(self) -> None:
        _, argv = ws.parse_server_command('python -c "print(1 + 1)"')
        self.assertEqual(argv, ['python', '-c', 'print(1 + 1)'])

    def test_cd_and_chain_sets_working_directory(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            (Path(root) / 'backend').mkdir()
            cwd, argv = ws.parse_server_command('cd backend && python server.py', base=root)
            self.assertEqual(Path(cwd or ''), Path(root) / 'backend')
            self.assertEqual(argv, ['python', 'server.py'])

    def test_chained_cd_is_cumulative(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            (Path(root) / 'a' / 'b').mkdir(parents=True)
            cwd, _ = ws.parse_server_command('cd a && cd b && node x.js', base=root)
            self.assertEqual(Path(cwd or ''), Path(root) / 'a' / 'b')

    def test_cd_into_missing_directory_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as root, self.assertRaises(ValueError):
            ws.parse_server_command('cd nope && node x.js', base=root)

    def test_shell_operators_are_rejected_not_executed(self) -> None:
        for command in (
            'npm start; rm -rf /',
            'npm start | tee log',
            'npm start || true',
            'npm start & echo hi',
            'npm start > out.txt',
            'npm start $(whoami)',
            'npm start `whoami`',
            'npm start && ',
            '&& npm start',
            'cd',
            'cd a b && npm start',
            '',
        ):
            with self.subTest(command=command), self.assertRaises(ValueError):
                ws.parse_server_command(command)

    def test_metacharacters_inside_quotes_are_data(self) -> None:
        _, argv = ws.parse_server_command("node app.js --name 'a;b|c&d'")
        self.assertEqual(argv, ['node', 'app.js', '--name', 'a;b|c&d'])


class StartServerTests(unittest.TestCase):
    def test_popen_never_uses_a_shell_and_receives_argv(self) -> None:
        with mock.patch.object(ws.subprocess, 'Popen') as popen:
            ws.start_server(f'"{sys.executable}" app.js --port 3000')
        args, kwargs = popen.call_args
        self.assertIsInstance(args[0], list)
        self.assertEqual(args[0][1:], ['app.js', '--port', '3000'])
        self.assertIs(kwargs.get('shell', False), False)

    def test_injection_payload_is_never_spawned(self) -> None:
        with mock.patch.object(ws.subprocess, 'Popen') as popen, self.assertRaises(ValueError):
            ws.start_server('node app.js; touch pwned')
        popen.assert_not_called()

    def test_cwd_is_passed_to_popen(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            (Path(root) / 'web').mkdir()
            with mock.patch.object(ws.subprocess, 'Popen') as popen:
                ws.start_server(f'cd web && "{sys.executable}" app.js', base=root)
            self.assertEqual(Path(popen.call_args.kwargs['cwd']), Path(root) / 'web')

    def test_missing_executable_raises_file_not_found(self) -> None:
        with self.assertRaises(FileNotFoundError):
            ws.start_server('definitely-not-a-real-binary-xyz --flag')

    def test_real_process_receives_metacharacters_as_data(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            marker = Path(root) / 'pwned'
            script = 'import sys; print(sys.argv[1])'
            out = run_for_output(f'"{sys.executable}" -c "{script}" "x; touch {marker}"', root)
            self.assertFalse(marker.exists())
            self.assertIn(b'touch', out)


class CleanupTests(unittest.TestCase):
    @staticmethod
    def _close(process: subprocess.Popen[bytes]) -> None:
        for stream in (process.stdout, process.stderr):
            if stream is not None:
                stream.close()

    def test_stop_server_force_kills_when_terminate_times_out(self) -> None:
        process = mock.Mock()
        process.poll.return_value = None
        process.wait.side_effect = [subprocess.TimeoutExpired('x', 5), None]
        with (
            mock.patch.object(ws, '_kill_tree') as kill_tree,
            mock.patch.object(ws.os, 'killpg', create=True),
        ):
            ws.stop_server(process)
        kill_tree.assert_called_once_with(process)
        self.assertEqual(process.wait.call_count, 2)

    def test_stop_server_ends_descendant_processes(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            beat = Path(root) / 'beat'
            (Path(root) / 'child.py').write_text(
                'import sys, time, pathlib\n'
                'p = pathlib.Path(sys.argv[1])\n'
                'while True:\n'
                "    with p.open('a') as f:\n"
                "        f.write('x')\n"
                '    time.sleep(0.05)\n',
                encoding='utf-8',
            )
            (Path(root) / 'parent.py').write_text(
                'import subprocess, sys, time\n'
                "subprocess.Popen([sys.executable, 'child.py', sys.argv[1]])\n"
                'time.sleep(60)\n',
                encoding='utf-8',
            )
            process = ws.start_server(f'cd . && "{sys.executable}" parent.py "{beat}"', base=root)
            deadline = time.time() + 20
            while not beat.exists() and time.time() < deadline:
                time.sleep(0.05)
            self.assertTrue(beat.exists(), 'descendant never started')
            ws.stop_server(process)
            self._close(process)
            time.sleep(0.5)
            before = beat.stat().st_size
            time.sleep(0.5)
            self.assertEqual(before, beat.stat().st_size, 'descendant kept running')

    def test_stop_server_does_not_touch_unrelated_processes(self) -> None:
        sleeper = [sys.executable, '-c', 'import time; time.sleep(60)']
        bystander = subprocess.Popen(sleeper)
        try:
            server = ws.start_server(f'"{sys.executable}" -c "import time; time.sleep(60)"')
            ws.stop_server(server)
            self.assertIsNotNone(server.poll())
            self.assertIsNone(bystander.poll(), 'an unrelated process was stopped')
            # Also safe to call again once the server is gone (PID may be reused).
            ws.stop_server(server)
            self.assertIsNone(bystander.poll())
        finally:
            bystander.kill()
            bystander.wait()

    def test_stop_server_is_safe_on_already_exited_process(self) -> None:
        process = ws.start_server(f'"{sys.executable}" -c "pass"')
        process.wait(timeout=20)
        ws.stop_server(process)
        self._close(process)

    def test_partial_startup_failure_stops_already_started_servers(self) -> None:
        started = mock.Mock()
        argv = [
            'with_server.py',
            '--server',
            'a',
            '--port',
            '1',
            '--server',
            'b',
            '--port',
            '2',
            '--',
            'echo',
        ]
        with (
            mock.patch.object(sys, 'argv', argv),
            mock.patch.object(ws, 'start_server', side_effect=[started, ValueError('bad')]),
            mock.patch.object(ws, 'is_server_ready', return_value=True),
            mock.patch.object(ws, 'stop_server') as stop,
            self.assertRaises(ValueError),
        ):
            ws.main()
        stop.assert_called_once_with(started)


class FinalCommandTests(unittest.TestCase):
    def test_final_command_uses_explicit_check_false_and_propagates_exit_code(self) -> None:
        argv = ['with_server.py', '--server', 'a', '--port', '1', '--', 'echo', 'hi']
        with (
            mock.patch.object(sys, 'argv', argv),
            mock.patch.object(ws, 'start_server', return_value=mock.Mock()),
            mock.patch.object(ws, 'is_server_ready', return_value=True),
            mock.patch.object(ws, 'stop_server'),
            mock.patch.object(ws.subprocess, 'run') as run,
            self.assertRaises(SystemExit) as cm,
        ):
            run.return_value = mock.Mock(returncode=7)
            ws.main()
        self.assertEqual(cm.exception.code, 7)
        run.assert_called_once()
        self.assertIs(run.call_args.kwargs.get('check'), False)
        self.assertIs(run.call_args.kwargs.get('shell'), False)


class PipeDrainTests(unittest.TestCase):
    NOISY = (
        'import sys, pathlib, time\n'
        "chunk = 'x' * 1023 + '\\n'\n"
        'for _ in range(4096):\n'
        '    sys.stdout.write(chunk)\n'
        '    sys.stderr.write(chunk)\n'
        'sys.stdout.flush(); sys.stderr.flush()\n'
        "pathlib.Path(sys.argv[1]).write_text('done')\n"
        'time.sleep(60)\n'
    )

    def test_chatty_server_is_not_blocked_by_unread_output(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            script = Path(root) / 'noisy.py'
            script.write_text(self.NOISY, encoding='utf-8')
            done = Path(root) / 'done'
            process = ws.start_server(f'"{sys.executable}" "{script}" "{done}"')
            try:
                deadline = time.time() + 20
                while not done.exists() and time.time() < deadline:
                    time.sleep(0.1)
                self.assertTrue(done.exists(), 'server blocked writing to an unread pipe')
            finally:
                ws.stop_server(process)
                for stream in (process.stdout, process.stderr):
                    if stream is not None:
                        stream.close()

    def test_output_is_kept_in_the_tail_for_diagnostics(self) -> None:
        self.assertIn(b'12345', run_for_output(f'"{sys.executable}" -c "print(12345)"'))


class BoundedOutputTests(unittest.TestCase):
    LIMIT = 4096

    def _noisy(self, root: str, megabytes: int) -> tuple[str, Path]:
        script = Path(root) / 'flood.py'
        done = Path(root) / 'done'
        script.write_text(
            'import sys, pathlib, time\n'
            "line = 'y' * 1023 + '\\n'\n"
            f'for _ in range({megabytes} * 1024):\n'
            '    sys.stdout.write(line)\n'
            '    sys.stderr.write(line)\n'
            "sys.stdout.write('LAST-LINE-MARKER\\n'); sys.stdout.flush()\n"
            "pathlib.Path(sys.argv[1]).write_text('done')\n"
            'time.sleep(60)\n',
            encoding='utf-8',
        )
        return f'"{sys.executable}" "{script}" "{done}"', done

    def test_high_volume_output_keeps_only_a_bounded_tail(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            command, done = self._noisy(root, megabytes=8)
            tail = ws.OutputTail(limit=self.LIMIT)
            process = ws.start_server(command, tail=tail)
            try:
                deadline = time.time() + 60
                while not done.exists() and time.time() < deadline:
                    time.sleep(0.1)
                self.assertTrue(done.exists(), 'server blocked on output')
                time.sleep(0.3)
                data = tail.read()
                self.assertLessEqual(len(data), self.LIMIT)
                self.assertIn(b'LAST-LINE-MARKER', data)
            finally:
                ws.stop_server(process)
                tail.close()

    def test_no_output_file_is_created_for_server_output(self) -> None:
        with (
            tempfile.TemporaryDirectory() as scratch,
            mock.patch.object(tempfile, 'tempdir', scratch),
        ):
            tail = ws.OutputTail(limit=self.LIMIT)
            process = ws.start_server(f'"{sys.executable}" -c "print(1)"', tail=tail)
            process.wait(timeout=20)
            tail.close()
            self.assertEqual(os.listdir(scratch), [])

    def test_close_releases_stream_and_thread(self) -> None:
        tail = ws.OutputTail(limit=self.LIMIT)
        process = ws.start_server(f'"{sys.executable}" -c "print(7)"', tail=tail)
        process.wait(timeout=20)
        tail.close()
        self.assertIn(b'7', tail.read())
        assert process.stdout is not None
        self.assertTrue(process.stdout.closed)

    def test_small_limit_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            ws.OutputTail(limit=0)


def run_for_output(command: str, base: str | None = None) -> bytes:
    """Run `command` to completion and return its (bounded) combined output."""
    tail = ws.OutputTail()
    process = ws.start_server(command, base=base, tail=tail)
    process.wait(timeout=20)
    tail.close()
    return tail.read()


class ParserEdgeCaseTests(unittest.TestCase):
    def test_adjacent_and_malformed_operator_attempts_are_rejected(self) -> None:
        for command in (
            'node a&&&b',
            'node a;;b',
            'node a&b',
            'node a;b',
            'node $(id)',
            'node `id`',
            'node a ||b',
            'node a <in',
            "node 'unterminated",
            'cd a && ; node x',
            'node a &&& node b',
        ):
            with self.subTest(command=command), self.assertRaises(ValueError):
                ws.parse_server_command(command)

    def test_operators_inside_a_longer_quoted_argument_are_data(self) -> None:
        _, argv = ws.parse_server_command("node x 'a && b' 'a||b'")
        self.assertEqual(argv, ['node', 'x', 'a && b', 'a||b'])

    def test_standalone_quoted_operator_is_still_rejected(self) -> None:
        with self.assertRaises(ValueError):
            ws.parse_server_command("node x ';'")

    def test_comment_text_is_dropped_like_a_shell_would(self) -> None:
        _, argv = ws.parse_server_command('node x # trailing note; rm -rf /')
        self.assertEqual(argv, ['node', 'x'])

    def test_newline_is_argument_separator_not_command_separator(self) -> None:
        _, argv = ws.parse_server_command('node x\nrm y')
        self.assertEqual(argv, ['node', 'x', 'rm', 'y'])

    def test_option_like_arguments_are_preserved(self) -> None:
        _, argv = ws.parse_server_command('npm run dev -- --port=5173 -x')
        self.assertEqual(argv, ['npm', 'run', 'dev', '--', '--port=5173', '-x'])

    def test_directory_with_spaces_and_repeated_cd(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            (Path(root) / 'my dir' / 'sub dir').mkdir(parents=True)
            cwd, _ = ws.parse_server_command('cd "my dir" && cd "sub dir" && node x', base=root)
            self.assertEqual(Path(cwd or ''), Path(root) / 'my dir' / 'sub dir')

    @unittest.skipUnless(os.name == 'nt', 'Windows path semantics')
    def test_windows_backslash_paths_survive_tokenisation(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            (Path(root) / 'web').mkdir()
            cwd, _ = ws.parse_server_command(f'cd {root}\\web && node x')
            self.assertEqual(Path(cwd or ''), Path(root) / 'web')


class ExecutableProvenanceTests(unittest.TestCase):
    @unittest.skipUnless(os.name == 'nt', 'Windows system directory lookup')
    def test_taskkill_location_ignores_environment_variables(self) -> None:
        with mock.patch.dict(os.environ, {'SYSTEMROOT': r'C:\evil', 'WINDIR': r'C:\evil'}):
            taskkill = ws._taskkill_path()
        self.assertNotIn('evil', taskkill.lower())
        self.assertTrue(taskkill.lower().endswith(r'system32\taskkill.exe'))
        self.assertTrue(os.path.isfile(taskkill))

    def test_batch_target_rejects_cmd_metacharacters(self) -> None:
        for argument in ('a&calc', 'a|b', 'a>b', '%PATH%', '"q"', 'a^b', '(x)', '!x!'):
            with self.subTest(argument=argument), self.assertRaises(ValueError):
                ws.prepare_argv(['bin/tool.cmd', argument])
        with self.assertRaises(ValueError):
            ws.prepare_argv(['bin/TOOL.BAT', 'a&b'])

    def test_batch_target_allows_ordinary_arguments(self) -> None:
        argv = ws.prepare_argv(['bin/tool.cmd', 'run', 'dev', '--port=5173', 'dir with space'])
        self.assertEqual(argv[1:], ['run', 'dev', '--port=5173', 'dir with space'])

    def test_batch_target_allows_backslash_paths(self) -> None:
        argv = ws.prepare_argv(['bin/tool.cmd', 'C:\\work\\app'])
        self.assertEqual(argv[1:], ['C:\\work\\app'])

    def test_non_batch_target_keeps_metacharacters_as_data(self) -> None:
        argv = ws.prepare_argv([sys.executable, '-c', 'a&b|c'])
        self.assertEqual(argv[1:], ['-c', 'a&b|c'])

    @unittest.skipUnless(os.name == 'nt', 'Windows cmd.exe shim behaviour')
    def test_real_cmd_shim_never_executes_injected_text(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            shim = Path(root) / 'shim.cmd'
            shim.write_text('@echo off\necho got:%1\n', encoding='utf-8')
            marker = Path(root) / 'pwned'
            with self.assertRaises(ValueError):
                ws.start_server(f'"{shim}" "x&type nul>{marker}"', base=root)
            self.assertFalse(marker.exists())
            out = run_for_output(f'"{shim}" safe-arg', root)
            self.assertIn(b'got:safe-arg', out)

    @unittest.skipUnless(os.name == 'nt', 'Windows searches the current directory first')
    def test_bare_name_from_current_directory_is_refused(self) -> None:
        with tempfile.TemporaryDirectory() as root:
            (Path(root) / 'plantedtool.cmd').write_text('@echo off\n', encoding='utf-8')
            previous = os.getcwd()
            os.chdir(root)
            # Default Windows behaviour: the current directory is searched first.
            with mock.patch.dict(os.environ):
                os.environ.pop('NoDefaultCurrentDirectoryInExePath', None)
                try:
                    with self.assertRaises(ValueError):
                        ws.resolve_executable('plantedtool')
                finally:
                    os.chdir(previous)

    def test_explicit_path_is_an_operator_choice(self) -> None:
        self.assertEqual(ws.resolve_executable(sys.executable), sys.executable)

    def test_final_command_runs_without_a_shell_using_validated_argv(self) -> None:
        argv = [
            'with_server.py',
            '--server',
            'node x',
            '--port',
            '1',
            '--',
            sys.executable,
            '-c',
            'pass',
        ]
        with (
            mock.patch.object(sys, 'argv', argv),
            mock.patch.object(ws, 'start_server', return_value=mock.Mock()),
            mock.patch.object(ws, 'is_server_ready', return_value=True),
            mock.patch.object(ws, 'stop_server'),
            mock.patch.object(ws.subprocess, 'run') as run,
            self.assertRaises(SystemExit),
        ):
            run.return_value.returncode = 0
            ws.main()
        self.assertEqual(run.call_args.args[0], [sys.executable, '-c', 'pass'])
        self.assertIs(run.call_args.kwargs['shell'], False)


if __name__ == '__main__':
    os.environ.setdefault('PYTHONUTF8', '1')
    unittest.main()
