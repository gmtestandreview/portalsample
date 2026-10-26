"""Regression tests for the A Team status line script."""

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

import status  # noqa: E402


def test_count_agents_reads_only_the_active_agents_section(tmp_path: Path) -> None:
    (tmp_path / "TEAM.md").write_text(
        """# Active Team

## Active Agents (2)

| Agent | Reason kept |
| --- | --- |
| `alpha` | Required |
| `beta` | Required |

## Pruned Agents (1)

| Agent | Reason removed |
| --- | --- |
| `gamma` | Not needed |

## Active Skills (1)

| Skill | Reason kept |
| --- | --- |
| `testing` | Required |
""",
        encoding="utf-8",
    )

    assert status.count_agents(tmp_path) == 2


def test_count_agents_stops_at_nested_headings(tmp_path: Path) -> None:
    (tmp_path / "TEAM.md").write_text(
        """## Active Agents (1)

| Agent | Reason kept |
| --- | --- |
| `alpha` | Required |

### Notes

| Nested table | Must not count |
| --- | --- |
| `not-an-agent` | Nested content |
""",
        encoding="utf-8",
    )

    assert status.count_agents(tmp_path) == 1


def test_count_agents_does_not_enter_an_unrelated_active_agents_heading(
    tmp_path: Path,
) -> None:
    (tmp_path / "TEAM.md").write_text(
        """## Active Agents notes

| Agent | Reason kept |
| --- | --- |
| `not-an-agent` | Unrelated heading |

## Active Agents (1)

| Agent | Reason kept |
| --- | --- |
| `alpha` | Required |
""",
        encoding="utf-8",
    )

    assert status.count_agents(tmp_path) == 1


def test_count_agents_ignores_non_heading_hash_text(tmp_path: Path) -> None:
    (tmp_path / "TEAM.md").write_text(
        """## Active Agents (2)

| Agent | Reason kept |
| --- | --- |
| `alpha` | Required |

#not-a-heading

| `beta` | Required |
""",
        encoding="utf-8",
    )

    assert status.count_agents(tmp_path) == 2


@pytest.mark.parametrize(
    "team_text",
    [
        "# Active Team\n",
        "## Active Agents (0)\n\n| Agent | Reason kept |\n| --- | --- |\n",
    ],
)
def test_count_agents_returns_none_when_the_active_roster_is_empty(
    tmp_path: Path, team_text: str
) -> None:
    (tmp_path / "TEAM.md").write_text(team_text, encoding="utf-8")

    assert status.count_agents(tmp_path) is None


def test_count_agents_returns_none_when_team_file_is_missing(tmp_path: Path) -> None:
    assert status.count_agents(tmp_path) is None


def test_count_agents_returns_none_for_an_unreadable_team_file(tmp_path: Path) -> None:
    (tmp_path / "TEAM.md").write_bytes(b"\xff")

    assert status.count_agents(tmp_path) is None


def test_count_agents_counts_rows_with_separator_text_in_the_reason(
    tmp_path: Path,
) -> None:
    (tmp_path / "TEAM.md").write_text(
        """## Active Agents (1)

| Agent | Reason kept |
| --- | --- |
| `alpha` | Requires --- fallback |
""",
        encoding="utf-8",
    )

    assert status.count_agents(tmp_path) == 1


def test_count_agents_ignores_alignment_separator_rows(tmp_path: Path) -> None:
    (tmp_path / "TEAM.md").write_text(
        """## Active Agents (1)

| Agent | Reason kept |
| :--- | ---: |
| `alpha` | Required |
""",
        encoding="utf-8",
    )

    assert status.count_agents(tmp_path) == 1


def test_checked_in_team_reports_the_declared_active_agent_count() -> None:
    assert status.count_agents(ROOT / ".agent-sync") == 17


def test_status_main_reports_the_fixture_agent_count(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    (tmp_path / "TEAM.md").write_text(
        """## Active Agents (2)

| Agent | Reason kept |
| --- | --- |
| `alpha` | Required |
| `beta` | Required |
""",
        encoding="utf-8",
    )

    status.main(tmp_path)

    assert "2 agentes" in capsys.readouterr().out
