"""Python 3.14 selection through the real hook launcher, with owned fixtures."""

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
WRAPPER = ROOT / "scripts/pre_tool_use_wrapper.mjs"
LAUNCHER = ROOT / "scripts/python314.mjs"

# Execute the real ESM launcher in a VM; only interpreter subprocess calls are
# stubbed. Every filesystem read is limited to maintained source/dependencies.
PROBE = """
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const scenario = JSON.parse(process.argv[2]), calls = [];
let code = 0, stderr = '';
const stop = {};
const fakeProcess = {
  platform: scenario.platform || 'win32',
  argv: [],
  env: {CLAUDE_PROJECT_DIR: '/owned-project'},
  cwd: () => '/owned-project',
  stderr: {write: text => { stderr += text; }},
  exit: status => { code = status; throw stop; },
};
const child = {spawnSync(command, args, options) {
  const key = command + (command === 'py' ? ' ' + args[0] : '');
  const version = scenario.versions[key];
  calls.push({command, args, options});
  if (scenario.failures?.[key]) return {status: null, error: {code: scenario.failures[key]}};
  if (args.includes('-c')) return {status: version === '3.14' ? 0 : 1};
  return {status: 0};
}};
const thisContext = vm.createContext({process: fakeProcess, Buffer, console});
function syntheticModule(identifier, exports) {
  return new vm.SyntheticModule(Object.keys(exports), function () {
    for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
  }, {context: thisContext, identifier});
}
const module = new vm.SourceTextModule(fs.readFileSync(process.argv[1], 'utf8'), {
  context: thisContext,
  identifier: process.argv[1],
});
await module.link(async specifier => {
  if (specifier === 'node:child_process') return syntheticModule(specifier, {spawnSync: child.spawnSync});
  if (specifier === 'node:path') return syntheticModule(specifier, {resolve: path.resolve});
  if (specifier === 'node:url') return syntheticModule(specifier, {fileURLToPath: () => process.argv[1]});
  throw new Error(`Unexpected import: ${specifier}`);
});
try {
  await module.evaluate();
  if (scenario.launch) {
    code = module.namespace.runPython314(['owned.py']);
  } else {
    module.namespace.findPython314();
  }
} catch (error) { if (error !== stop) throw error; }
console.log(JSON.stringify({code, stderr, calls}));
"""


@pytest.mark.parametrize(
    ("versions", "expected_command", "expected_prefix"),
    [
        ({"python": "3.13"}, None, []),
        ({"python": "3.15"}, None, []),
        ({"python": "3.14"}, "python", []),
        ({"python": "3.13", "python3": "3.14"}, "python3", []),
        ({"python3.14": "3.14", "python": "3.14"}, "python3.14", []),
        ({"py -3.14": "3.14", "python": "3.13"}, "py", ["-3.14"]),
        ({}, None, []),
    ],
)
def test_guard_selects_only_python314(
    versions: dict[str, str], expected_command: str | None, expected_prefix: list[str]
) -> None:
    node = shutil.which("node")
    assert node is not None
    result = subprocess.run(
        [
            node,
            "--experimental-vm-modules",
            "-e",
            PROBE,
            str(LAUNCHER),
            json.dumps({"versions": versions}),
        ],
        capture_output=True,
        text=True,
        timeout=20,
    )
    assert result.returncode == 0, result.stderr
    outcome = json.loads(result.stdout)
    if expected_command is None:
        assert outcome["code"] == 0, "selection must not execute a guard script"
        assert outcome["calls"]
        assert all("-c" in call["args"] for call in outcome["calls"])
    else:
        assert outcome["code"] == 0
        execution = outcome["calls"][-1]
        assert execution["command"] == expected_command
        assert execution["args"][:-2] == [*expected_prefix, "-I", "-S"]


def test_settings_use_python314_for_post_tool_and_watcher() -> None:
    settings = json.loads((ROOT / ".claude/settings.json").read_text(encoding="utf-8"))
    hooks = settings["hooks"]
    post = hooks["PostToolUse"][0]["hooks"][0]["command"]
    assert "python314.mjs" in post
    startup = [hook["command"] for group in hooks["SessionStart"] for hook in group["hooks"]]
    watcher = next(
        command for command in startup if "scripts/watcher.py" in command and "&" in command
    )
    assert "python314.mjs" in watcher


@pytest.mark.parametrize("failure", ["ETIMEDOUT", "ENOENT"])
def test_failed_probe_falls_back_with_bounded_timeout(failure: str) -> None:
    result = subprocess.run(
        [
            "node",
            "--experimental-vm-modules",
            "-e",
            PROBE,
            str(LAUNCHER),
            json.dumps(
                {
                    "versions": {"python": "3.14"},
                    "failures": {"python3.14": failure, "py -3.14": failure},
                }
            ),
        ],
        capture_output=True,
        text=True,
        timeout=20,
    )
    assert result.returncode == 0, result.stderr
    outcome = json.loads(result.stdout)
    assert outcome["code"] == 0
    assert outcome["calls"][-1]["command"] == "python"
    for probe in outcome["calls"][:-1]:
        assert 0 < probe["options"]["timeout"] <= 3000


def test_launcher_reports_missing_python314() -> None:
    result = subprocess.run(
        [
            "node",
            "--experimental-vm-modules",
            "-e",
            PROBE,
            str(LAUNCHER),
            json.dumps({"versions": {}, "launch": True}),
        ],
        capture_output=True,
        text=True,
        timeout=20,
    )
    assert result.returncode == 0, result.stderr
    outcome = json.loads(result.stdout)
    assert outcome["code"] == 1
    assert "Python 3.14 is required" in outcome["stderr"]


def test_launcher_forwards_arguments_stdin_and_exit_code() -> None:
    with tempfile.TemporaryDirectory(prefix="python314-launcher-") as directory:
        root = Path(directory)
        script = root / "probe with spaces.py"
        script.write_text(
            "import json,sys\n"
            "assert sys.version_info[:2] == (3,14)\n"
            "print(json.dumps([sys.argv[1:],sys.stdin.read()]))\n"
            "print('owned stderr',file=sys.stderr)\n"
            "sys.exit(2)\n",
            encoding="utf-8",
        )
        result = subprocess.run(
            ["node", str(LAUNCHER), script.name, "argument with spaces"],
            input="owned input",
            text=True,
            capture_output=True,
            timeout=20,
            cwd=root,
            env={**os.environ, "CLAUDE_PROJECT_DIR": str(root)},
        )
        assert result.returncode == 2, result.stderr
        assert json.loads(result.stdout) == [["argument with spaces"], "owned input"]
        assert result.stderr.strip() == "owned stderr"


@pytest.mark.parametrize(
    "relative",
    [
        "scripts/pre_tool_use.py",
        "scripts/post_tool_use.py",
        "scripts/watcher.py",
        "scripts/process_utils.py",
        "templates/watcher.py",
        ".claude/hooks/secret-scanner.py",
    ],
)
def test_scoped_script_imports_on_python314(relative: str) -> None:
    source = """
import importlib.util, sys
assert sys.version_info[:2] == (3,14)
sys.path.insert(0, sys.argv[2])
spec = importlib.util.spec_from_file_location("candidate", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
"""
    with tempfile.TemporaryDirectory(prefix="python314-import-") as directory:
        result = subprocess.run(
            [
                sys.executable,
                "-I",
                "-S",
                "-W",
                "error::SyntaxWarning",
                "-c",
                source,
                str(ROOT / relative),
                str(ROOT / "scripts"),
            ],
            cwd=directory,
            capture_output=True,
            text=True,
            timeout=20,
        )
        assert result.returncode == 0, result.stderr
        assert result.stdout == ""
        assert result.stderr == ""
