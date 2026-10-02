# scripts/metrics-report.py
"""
A Team metrics report CLI.
Usage: python metrics-report.py [--days 7]
"""
import argparse
import gzip
import shutil
import sys
from contextlib import suppress
from datetime import date, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from metrics import read_events

DEFAULT_BASE_DIR = Path(__file__).parent.parent / ".agent-sync"


def _parse_event_line(line: str) -> tuple[str, str, str] | None:
    parts = line.split(" ", 2)
    if len(parts) < 2:
        return None
    ts, event_type = parts[0], parts[1]
    rest = parts[2] if len(parts) > 2 else ""
    return ts, event_type, rest


def _task_id(rest: str) -> str:
    return rest.split()[0] if rest else ""


def _record_task_completion(
    task_id: str,
    timestamp: str,
    active_tasks: dict[str, str],
    task_durations: list[float],
) -> None:
    if not task_id or task_id not in active_tasks:
        return
    try:
        start = datetime.fromisoformat(active_tasks.pop(task_id))
        end = datetime.fromisoformat(timestamp)
        task_durations.append((end - start).total_seconds())
    except ValueError:
        pass


def _record_event(
    timestamp: str,
    event_type: str,
    rest: str,
    stats: dict[str, int],
    active_tasks: dict[str, str],
    task_durations: list[float],
) -> None:
    if event_type == "session_start":
        stats["sessions"] += 1
        return
    if event_type == "task_dispatch":
        stats["dispatched"] += 1
        task_id = _task_id(rest)
        if task_id:
            active_tasks[task_id] = timestamp
        return
    if event_type == "task_complete":
        stats["complete"] += 1
        _record_task_completion(_task_id(rest), timestamp, active_tasks, task_durations)
        return
    if event_type == "task_failed":
        stats["failed"] += 1
        return
    if event_type == "human_intervention":
        stats["interventions"] += 1


def parse_events(days: int, base_dir: Path = None) -> dict:
    """Parse log events and return summary statistics.

    Returns dict with keys: sessions, dispatched, complete, failed,
    interventions, avg_time (str), success_rate (int 0-100).
    """
    if base_dir is None:
        base_dir = DEFAULT_BASE_DIR
    events = read_events(days, base_dir=base_dir)

    stats = {
        "sessions": 0,
        "dispatched": 0,
        "complete": 0,
        "failed": 0,
        "interventions": 0,
    }
    active_tasks: dict[str, str] = {}
    task_durations: list[float] = []

    for line in events:
        event = _parse_event_line(line)
        if event is not None:
            _record_event(*event, stats, active_tasks, task_durations)

    avg_time = ""
    if task_durations:
        avg_sec = sum(task_durations) / len(task_durations)
        mins, secs = divmod(int(avg_sec), 60)
        avg_time = f"{mins}m {secs:02d}s"

    success_rate = (
        int(stats["complete"] / stats["dispatched"] * 100)
        if stats["dispatched"]
        else 0
    )

    return {
        **stats,
        "avg_time": avg_time,
        "success_rate": success_rate,
    }


def _compress_old_logs(metrics_dir: Path, cutoff: date) -> None:
    if not metrics_dir.exists():
        return
    for log_file in metrics_dir.glob("*.log"):
        try:
            file_date = date.fromisoformat(log_file.stem)
            if file_date < cutoff:
                gz_path = log_file.with_suffix(".log.gz")
                with open(log_file, "rb") as f_in, gzip.open(gz_path, "wb") as f_out:
                    shutil.copyfileobj(f_in, f_out)
                log_file.unlink()
        except (ValueError, OSError):
            pass


def _remove_stale_queue_files(stale_dir: Path, cutoff: date) -> None:
    if not stale_dir.exists():
        return
    cutoff_ts = datetime.combine(cutoff, datetime.min.time()).timestamp()
    for stale_file in stale_dir.glob("*.json"):
        try:
            if stale_file.stat().st_mtime < cutoff_ts:
                stale_file.unlink()
        except OSError:
            pass


def rotate_logs(base_dir: Path = None) -> None:
    """Compress logs older than 30 days. Clean stale queue files older than 30 days."""
    if base_dir is None:
        base_dir = DEFAULT_BASE_DIR
    cutoff = date.today() - timedelta(days=30)
    _compress_old_logs(base_dir / "metrics", cutoff)
    _remove_stale_queue_files(base_dir / "queue" / "stale", cutoff)


def main() -> None:
    with suppress(AttributeError):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description="A Team metrics report")
    parser.add_argument("--days", type=int, default=7, help="Number of days to report")
    args = parser.parse_args()

    rotate_logs()
    stats = parse_events(args.days)

    sep = "━" * 35
    rate = f" ({stats['success_rate']}%)" if stats["dispatched"] else ""

    print(f"\nA Team — últimos {args.days} dias")
    print(sep)
    print(f"Sessões:              {stats['sessions']}")
    print(
        f"Tarefas:              {stats['dispatched']} despachadas · "
        f"{stats['complete']} concluídas · {stats['failed']} falhadas{rate}"
    )
    print(f"Intervenções humanas: {stats['interventions']}")
    if stats["avg_time"]:
        print(f"Tempo médio por tarefa: {stats['avg_time']}")
    print()


if __name__ == "__main__":
    main()
