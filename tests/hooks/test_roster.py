"""Contract tests for the A Team roster verifier."""

import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

import roster  # noqa: E402


def _write_team(root: Path, agents: list[str], skills: list[str]) -> None:
    lines = [
        f"## Active Agents ({len(agents)})",
        "",
        "| Agent | Reason kept |",
        "| --- | --- |",
        *[f"| `{agent}` | Required |" for agent in agents],
        "",
        f"## Active Skills ({len(skills)})",
        "",
        "| Skill | Reason kept |",
        "| --- | --- |",
        *[f"| `{skill}` | Required |" for skill in skills],
        "",
    ]
    sync = root / ".agent-sync"
    sync.mkdir(parents=True)
    (sync / "TEAM.md").write_text("\n".join(lines), encoding="utf-8")

    agents_dir = root / ".claude" / "agents"
    agents_dir.mkdir(parents=True)
    for agent in agents:
        (agents_dir / f"{agent}.md").write_text("# Agent\n", encoding="utf-8")

    for skill in skills:
        skill_dir = root / "skills" / skill
        skill_dir.mkdir(parents=True)
        (skill_dir / "SKILL.md").write_text("# Skill\n", encoding="utf-8")

    codex_dir = root / ".codex"
    codex_dir.mkdir(parents=True)
    (codex_dir / "config.toml").write_text(
        '[mcp_servers.tokensave]\ncommand = "tokensave"\n', encoding="utf-8"
    )


def test_check_roster_accepts_a_valid_codex_project_installation(tmp_path: Path) -> None:
    _write_team(tmp_path, ["alpha", "beta"], ["using-a-team", "smart-init"])

    errors, agent_count, skill_count = roster.check_roster(tmp_path)

    assert errors == []
    assert (agent_count, skill_count) == (2, 2)


def test_check_roster_rejects_count_and_installation_drift(tmp_path: Path) -> None:
    _write_team(tmp_path, ["alpha"], ["using-a-team"])
    team_file = tmp_path / ".agent-sync" / "TEAM.md"
    team_file.write_text(
        team_file.read_text(encoding="utf-8").replace(
            "## Active Agents (1)", "## Active Agents (2)"
        ),
        encoding="utf-8",
    )
    (tmp_path / ".claude" / "agents" / "alpha.md").unlink()
    (tmp_path / "skills" / "using-a-team" / "SKILL.md").unlink()
    (tmp_path / ".codex" / "config.toml").unlink()

    errors, _, _ = roster.check_roster(tmp_path)

    assert any("active agents count" in error.lower() for error in errors)
    assert any("agent file" in error for error in errors)
    assert any("skill file" in error for error in errors)
    assert any(".codex/config.toml" in error for error in errors)


def test_check_roster_ignores_rows_after_the_active_sections(tmp_path: Path) -> None:
    _write_team(tmp_path, ["alpha"], ["using-a-team"])
    team_file = tmp_path / ".agent-sync" / "TEAM.md"
    team_file.write_text(
        team_file.read_text(encoding="utf-8")
        + "\n## Notes\n\n| Not a roster row | Ignore |\n| --- | --- |\n",
        encoding="utf-8",
    )

    errors, agent_count, skill_count = roster.check_roster(tmp_path)

    assert errors == []
    assert (agent_count, skill_count) == (1, 1)


def test_check_roster_rejects_an_empty_codex_config(tmp_path: Path) -> None:
    _write_team(tmp_path, ["alpha"], ["using-a-team"])
    (tmp_path / ".codex" / "config.toml").write_text("[mcp_servers.tokensave]\n", encoding="utf-8")

    errors, _, _ = roster.check_roster(tmp_path)

    assert any("tokensave" in error for error in errors)


def test_check_roster_reports_an_invalid_absolute_name(tmp_path: Path) -> None:
    sync = tmp_path / ".agent-sync"
    sync.mkdir(parents=True)
    (sync / "TEAM.md").write_text(
        """## Active Agents (1)

| Agent | Reason kept |
| --- | --- |
| `/escape` | Invalid |

## Active Skills (1)

| Skill | Reason kept |
| --- | --- |
| `using-a-team` | Required |
""",
        encoding="utf-8",
    )
    skill_dir = tmp_path / "skills" / "using-a-team"
    skill_dir.mkdir(parents=True)
    (skill_dir / "SKILL.md").write_text("# Skill\n", encoding="utf-8")
    codex_dir = tmp_path / ".codex"
    codex_dir.mkdir()
    (codex_dir / "config.toml").write_text(
        '[mcp_servers.tokensave]\ncommand = "tokensave"\n', encoding="utf-8"
    )

    errors, _, _ = roster.check_roster(tmp_path)

    assert any("invalid active agents entry" in error.lower() for error in errors)


def test_check_roster_rejects_duplicate_sections(tmp_path: Path) -> None:
    _write_team(tmp_path, ["alpha"], ["using-a-team"])
    team_file = tmp_path / ".agent-sync" / "TEAM.md"
    duplicate_section = (
        "\n## Active Agents (1)\n\n| Agent | Reason kept |\n| --- | --- |\n| `beta` | Required |\n"
    )
    team_file.write_text(
        team_file.read_text(encoding="utf-8") + duplicate_section,
        encoding="utf-8",
    )

    errors, _, _ = roster.check_roster(tmp_path)

    assert any("duplicate" in error.lower() for error in errors)


def test_check_roster_reports_invalid_utf8(tmp_path: Path) -> None:
    sync = tmp_path / ".agent-sync"
    sync.mkdir(parents=True)
    (sync / "TEAM.md").write_bytes(b"\xff")

    errors, _, _ = roster.check_roster(tmp_path)

    assert any("unreadable" in error.lower() for error in errors)


def test_check_roster_rejects_an_agent_symlink_outside_the_repository(
    tmp_path: Path,
) -> None:
    _write_team(tmp_path, ["alpha"], ["using-a-team"])
    agent_file = tmp_path / ".claude" / "agents" / "alpha.md"
    outside_file = tmp_path.parent / "outside-agent.md"
    outside_file.write_text("# Outside\n", encoding="utf-8")
    agent_file.unlink()
    try:
        agent_file.symlink_to(outside_file)
    except OSError, NotImplementedError:
        pytest.skip("symbolic links are unavailable in this environment")

    errors, _, _ = roster.check_roster(tmp_path)

    assert any("outside repository" in error for error in errors)


@pytest.mark.parametrize("team_text", ["", "## Active Agents notes\n"])
def test_check_roster_rejects_missing_canonical_sections(tmp_path: Path, team_text: str) -> None:
    sync = tmp_path / ".agent-sync"
    sync.mkdir(parents=True)
    (sync / "TEAM.md").write_text(team_text, encoding="utf-8")

    errors, agent_count, skill_count = roster.check_roster(tmp_path)

    assert any("Active Agents" in error for error in errors)
    assert any("Active Skills" in error for error in errors)
    assert (agent_count, skill_count) == (0, 0)


def test_main_reports_success_for_a_valid_installation(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    _write_team(tmp_path, ["alpha"], ["using-a-team"])

    assert roster.main(tmp_path) == 0
    assert "ROSTER OK: 1 active agents, 1 active skills" in capsys.readouterr().out


def test_cli_supports_verify_and_named_checks(tmp_path: Path) -> None:
    _write_team(tmp_path, ["alpha"], ["using-a-team"])

    assert roster.main(tmp_path, ["verify"]) == 0
    assert roster.main(tmp_path, ["check", "Agent", "alpha"]) == 0
    assert roster.main(tmp_path, ["check", "Skill", "missing"]) == 1


def test_main_returns_nonzero_for_a_missing_team_file(tmp_path: Path) -> None:
    assert roster.main(tmp_path) == 1


def test_checked_in_roster_is_consistent() -> None:
    errors, agent_count, skill_count = roster.check_roster(ROOT)

    assert errors == []
    assert (agent_count, skill_count) == (17, 19)


def test_cli_subprocess_supports_named_checks(tmp_path: Path) -> None:
    _write_team(tmp_path, ["alpha"], ["using-a-team"])

    result = subprocess.run(
        [
            sys.executable,
            str(SCRIPTS / "roster.py"),
            "--root",
            str(tmp_path),
            "check",
            "Agent",
            "alpha",
        ],
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0
    assert "active agent installed: alpha" in result.stdout


def test_check_roster_rejects_a_team_file_symlink_outside_the_repository(
    tmp_path: Path,
) -> None:
    _write_team(tmp_path, ["alpha"], ["using-a-team"])
    team_file = tmp_path / ".agent-sync" / "TEAM.md"
    outside_file = tmp_path.parent / "outside-team.md"
    outside_file.write_text(team_file.read_text(encoding="utf-8"), encoding="utf-8")
    team_file.unlink()
    try:
        team_file.symlink_to(outside_file)
    except OSError, NotImplementedError:
        pytest.skip("symbolic links are unavailable in this environment")

    errors, _, _ = roster.check_roster(tmp_path)

    assert any("team.md" in error.lower() and "outside" in error.lower() for error in errors)


def test_check_roster_rejects_a_codex_config_symlink_outside_the_repository(
    tmp_path: Path,
) -> None:
    _write_team(tmp_path, ["alpha"], ["using-a-team"])
    config_file = tmp_path / ".codex" / "config.toml"
    outside_file = tmp_path.parent / "outside-codex.toml"
    outside_file.write_text(config_file.read_text(encoding="utf-8"), encoding="utf-8")
    config_file.unlink()
    try:
        config_file.symlink_to(outside_file)
    except OSError, NotImplementedError:
        pytest.skip("symbolic links are unavailable in this environment")

    errors, _, _ = roster.check_roster(tmp_path)

    assert any("config.toml" in error.lower() and "outside" in error.lower() for error in errors)


@pytest.mark.parametrize(
    "config_text",
    [
        '[mcp_servers.tokensave]\ncommand = "   "\n',
        '[mcp_servers.tokensave]\nurl = "not-a-url"\n',
    ],
)
def test_check_roster_rejects_an_unusable_tokensave_config(
    tmp_path: Path, config_text: str
) -> None:
    _write_team(tmp_path, ["alpha"], ["using-a-team"])
    (tmp_path / ".codex" / "config.toml").write_text(config_text, encoding="utf-8")

    errors, _, _ = roster.check_roster(tmp_path)

    assert any("tokensave" in error for error in errors)
