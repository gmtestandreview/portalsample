"""Command parser contract, exercised without executing any fixture command."""

import json
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

GUARD = Path(__file__).resolve().parents[2] / "scripts" / "pre_tool_use.py"
_PARSE = """
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location('guard', sys.argv[1])
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)
print(json.dumps(guard.commands(sys.argv[2])))
"""
CASES: list[tuple[str, list[tuple[str, list[str]]]]] = [
    ("cat a | grep b", [("cat", ["a"]), ("grep", ["b"])]),
    ("echo 'rm -r" + "f /'", [("echo", ["rm -r" + "f /"])]),
    ("sudo rm -r a; ls", [("rm", ["-r", "a"]), ("ls", [])]),
    ("bash -c 'rm x'", [("bash", ["-c", "rm x"]), ("rm", ["x"])]),
    ("echo $(rm y)", [("rm", ["y"]), ("echo", ["$(rm", "y)"])]),
    ("python - <<'EOF'\ncat x\nEOF", [("python", ["-"])]),
    ("$s = @'\ncat x\n'@\n$s | python -", [("$s", ["="]), ("$s", []), ("python", ["-"])]),
    ("echo hi >.out", [("echo", ["hi", ">", ".out"])]),
    ("Remove-Item C:\\temp\\x", [("remove-item", ["C:\\temp\\x"])]),
    ("echo '$(rm y)'", [("echo", ["$(rm y)"])]),
    ("echo '`rm y`'", [("echo", ["`rm y`"])]),
    ('echo "$(rm y)"', [("rm", ["y"]), ("echo", ["$(rm y)"])]),
    ("echo '<<EOF'\nrm x", [("echo", ["<<EOF"]), ("rm", ["x"])]),
    ("sudo -n -u root rm x", [("rm", ["x"])]),
    ("python - <<EOF\n$(rm y)\nEOF", [("rm", ["y"]), ("python", ["-"])]),
]


@pytest.mark.parametrize(("command", "expected"), CASES)
def test_parser_preserves_command_and_data_boundaries(
    command: str, expected: list[tuple[str, list[str]]]
) -> None:
    with tempfile.TemporaryDirectory(prefix="guard-parser-") as directory:
        result = subprocess.run(
            [sys.executable, "-I", "-S", "-c", _PARSE, str(GUARD), command],
            cwd=directory,
            capture_output=True,
            text=True,
            timeout=20,
        )
    assert result.returncode == 0, result.stderr
    assert json.loads(result.stdout) == json.loads(json.dumps(expected))


if __name__ == "__main__":
    raise SystemExit(pytest.main([str(Path(__file__).resolve()), "-q"]))
