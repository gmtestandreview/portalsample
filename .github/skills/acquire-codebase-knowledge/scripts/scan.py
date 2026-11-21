#!/usr/bin/env python3
"""
scan.py — Collect project discovery information for the acquire-codebase-knowledge skill.
Run from the project root directory.

Usage: python3 scan.py [OPTIONS]

Options:
  --output FILE   Write output to FILE instead of stdout
  --help          Show this message and exit

Exit codes:
  0  Success
  1  Usage error
"""

import argparse
import os
import subprocess
import sys
from collections import Counter
from collections.abc import Generator
from contextlib import contextmanager
from pathlib import Path
from typing import TextIO, TypedDict

TREE_LIMIT = 200
TREE_MAX_DEPTH = 3
TODO_LIMIT = 60
MANIFEST_PREVIEW_LINES = 80
RECENT_COMMITS_LIMIT = 20
CHURN_LIMIT = 20
GIT_RECENT_COMMITS_TITLE = 'GIT RECENT COMMITS (last 20)'
HIGH_CHURN_FILES_TITLE = 'HIGH-CHURN FILES (last 90 days, top 20)'
NONE_FOUND = 'None found.'

EXCLUDE_DIRS = {
    'node_modules',
    '.git',
    'dist',
    'build',
    'out',
    '.next',
    '.nuxt',
    '__pycache__',
    '.venv',
    'venv',
    '.tox',
    'target',
    'vendor',
    'coverage',
    '.nyc_output',
    'generated',
    '.cache',
    '.turbo',
    '.yarn',
    '.pnp',
    'bin',
    'obj',
}

PACKAGE_JSON = 'package.json'

MANIFESTS = [
    # JavaScript/Node.js
    PACKAGE_JSON,
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'bun.lockb',
    'deno.json',
    'deno.jsonc',
    # Python
    'requirements.txt',
    'Pipfile',
    'Pipfile.lock',
    'pyproject.toml',
    'setup.py',
    'setup.cfg',
    'poetry.lock',
    'pdm.lock',
    'uv.lock',
    # Go
    'go.mod',
    'go.sum',
    # Rust
    'Cargo.toml',
    'Cargo.lock',
    # Java/Kotlin
    'pom.xml',
    'build.gradle',
    'build.gradle.kts',
    'settings.gradle',
    'settings.gradle.kts',
    'gradle.properties',
    # PHP/Composer
    'composer.json',
    'composer.lock',
    # Ruby
    'Gemfile',
    'Gemfile.lock',
    '*.gemspec',
    # Elixir
    'mix.exs',
    'mix.lock',
    # Dart/Flutter
    'pubspec.yaml',
    'pubspec.lock',
    # .NET/C#
    '*.csproj',
    '*.sln',
    '*.slnx',
    'global.json',
    'packages.config',
    # Swift
    'Package.swift',
    'Package.resolved',
    # Scala
    'build.sbt',
    'scala-cli.yml',
    # Haskell
    '*.cabal',
    'stack.yaml',
    'cabal.project',
    'cabal.project.local',
    # OCaml
    'dune-project',
    'opam',
    'opam.lock',
    # Nim
    '*.nimble',
    'nim.cfg',
    # Crystal
    'shard.yml',
    'shard.lock',
    # R
    'DESCRIPTION',
    'renv.lock',
    # Julia
    'Project.toml',
    'Manifest.toml',
    # Build systems
    'CMakeLists.txt',
    'Makefile',
    'GNUmakefile',
    'SConstruct',
    'build.xml',
    'BUILD',
    'BUILD.bazel',
    'WORKSPACE',
    'bazel.lock',
    'justfile',
    '.justfile',
    'Taskfile.yml',
    'tox.ini',
    'Vagrantfile',
]

ENTRY_CANDIDATES = [
    # JavaScript/Node.js/TypeScript
    'src/index.ts',
    'src/index.js',
    'src/index.mjs',
    'src/main.ts',
    'src/main.js',
    'src/main.py',
    'src/app.ts',
    'src/app.js',
    'src/server.ts',
    'src/server.js',
    'index.ts',
    'index.js',
    'app.ts',
    'app.js',
    'lib/index.ts',
    'lib/index.js',
    # Go
    'main.go',
    'cmd/main.go',
    'cmd/*/main.go',
    # Python
    'main.py',
    'app.py',
    'server.py',
    'run.py',
    'cli.py',
    'src/main.py',
    'src/__main__.py',
    # .NET/C#
    'Program.cs',
    'src/Program.cs',
    'Main.cs',
    # Java
    'Main.java',
    'Application.java',
    'App.java',
    'src/main/java/Main.java',
    # Kotlin
    'Main.kt',
    'Application.kt',
    'App.kt',
    # Rust
    'src/main.rs',
    'src/lib.rs',
    # Swift
    'main.swift',
    'Package.swift',
    'Sources/main.swift',
    # Ruby
    'app.rb',
    'main.rb',
    'lib/app.rb',
    # PHP
    'index.php',
    'app.php',
    'public/index.php',
    # Go
    'cmd/*/main.go',
    # Scala
    'src/main/scala/Main.scala',
    # Haskell
    'Main.hs',
    'app/Main.hs',
    # Clojure
    'src/core.clj',
    '-main.clj',
    # Elixir
    'lib/application.ex',
    'mix.exs',
]

LINT_FILES = [
    '.eslintrc',
    '.eslintrc.json',
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.yml',
    '.eslintrc.yaml',
    'eslint.config.js',
    'eslint.config.mjs',
    'eslint.config.cjs',
    '.oxfmtrc.json',
    '.oxfmtrc.jsonc',
    'oxfmt.config.ts',
    'oxfmt.config.mts',
    '.editorconfig',
    'tsconfig.json',
    'tsconfig.base.json',
    'tsconfig.build.json',
    '.golangci.yml',
    '.golangci.yaml',
    'setup.cfg',
    '.flake8',
    '.pylintrc',
    'mypy.ini',
    '.rubocop.yml',
    'phpcs.xml',
    'phpstan.neon',
    'biome.json',
    'biome.jsonc',
]

ENV_TEMPLATES = [
    '.env.example',
    '.env.template',
    '.env.sample',
    '.env.defaults',
    '.env.local.example',
]

SOURCE_EXTS = [
    'ts',
    'tsx',
    'js',
    'jsx',
    'mjs',
    'cjs',
    'py',
    'go',
    'java',
    'kt',
    'rb',
    'php',
    'rs',
    'cs',
    'cpp',
    'c',
    'h',
    'ex',
    'exs',
    'swift',
    'scala',
    'clj',
    'cljs',
    'lua',
    'vim',
    'vim',
    'hs',
    'ml',
    'ml',
    'nim',
    'cr',
    'r',
    'jl',
    'groovy',
    'gradle',
    'xml',
    'json',
]

MONOREPO_FILES = [
    'pnpm-workspace.yaml',
    'lerna.json',
    'nx.json',
    'rush.json',
    'turbo.json',
    'moon.yml',
]
MONOREPO_DIRS = ['packages', 'apps', 'libs', 'services', 'modules']

CI_CD_CONFIGS = {
    '.github/workflows': 'GitHub Actions',
    '.gitlab-ci.yml': 'GitLab CI',
    'Jenkinsfile': 'Jenkins',
    '.circleci/config.yml': 'CircleCI',
    '.travis.yml': 'Travis CI',
    'azure-pipelines.yml': 'Azure Pipelines',
    'appveyor.yml': 'AppVeyor',
    '.drone.yml': 'Drone CI',
    '.woodpecker.yml': 'Woodpecker CI',
    'bitbucket-pipelines.yml': 'Bitbucket Pipelines',
}

CONTAINER_FILES = [
    'Dockerfile',
    'docker-compose.yml',
    'docker-compose.yaml',
    '.dockerignore',
    'Dockerfile.*',
    'k8s',
    'kustomization.yaml',
    'Chart.yaml',
    'Vagrantfile',
    'podman-compose.yml',
]

SECURITY_CONFIGS = [
    '.snyk',
    'security.txt',
    'SECURITY.md',
    '.dependabot.yml',
    '.whitesource',
    'sbom.json',
    'sbom.spdx',
    '.bandit.yaml',
]

PERFORMANCE_MARKERS = [
    'benchmark',
    'bench',
    'perf.data',
    '.prof',
    'k6.js',
    'locustfile.py',
    'jmeter.jmx',
]


class CodeMetrics(TypedDict):
    """Typed code metrics returned by the scanner."""

    total_files: int
    by_extension: dict[str, int]
    by_language: dict[str, int]
    total_lines: int
    largest_files: list[str]


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description='Scan the current directory (project root) and output discovery information '
        'for the acquire-codebase-knowledge skill.',
        add_help=True,
    )
    parser.add_argument('--output', type=str, help='Write output to FILE instead of stdout')
    return parser.parse_args()


def should_exclude(path: Path) -> bool:
    """Check if a path should be excluded from scanning."""
    return any(part in EXCLUDE_DIRS for part in path.parts)


def get_directory_tree(max_depth: int = TREE_MAX_DEPTH) -> list[str]:
    """Get directory tree up to max_depth."""
    files: list[str] = []

    def walk(path: Path, depth: int) -> None:
        if depth > max_depth or should_exclude(path):
            return
        try:
            for item in sorted(path.iterdir()):
                if should_exclude(item):
                    continue
                rel_path = item.relative_to(Path.cwd())
                files.append(str(rel_path))
                if item.is_dir():
                    walk(item, depth + 1)
        except OSError:
            pass

    walk(Path.cwd(), 0)
    return files[:TREE_LIMIT]


def find_manifest_files() -> list[str]:
    """Find manifest files matching patterns."""
    found: list[str] = []
    for pattern in MANIFESTS:
        if '*' in pattern:
            # Handle glob patterns
            for path in Path.cwd().glob(pattern):
                if path.is_file() and not should_exclude(path):
                    found.append(path.name)
        else:
            path = Path.cwd() / pattern
            if path.is_file():
                found.append(pattern)
    return sorted(set(found))


def read_file_preview(filepath: Path, max_lines: int = MANIFEST_PREVIEW_LINES) -> str:
    """Read file with line limit."""
    try:
        with open(filepath, encoding='utf-8', errors='replace') as f:
            lines = f.readlines()

        if not lines:
            return NONE_FOUND

        preview = ''.join(lines[:max_lines])
        if len(lines) > max_lines:
            preview += f'\n[TRUNCATED] Showing first {max_lines} of {len(lines)} lines.'
        return preview
    except Exception as e:
        return f'[Error reading file: {e}]'


def find_entry_points() -> list[str]:
    """Find entry point candidates.

    ENTRY_CANDIDATES may include glob patterns such as ``cmd/*/main.go``.
    Expand those patterns so common multi-binary layouts are detected.
    """
    found: list[str] = []
    seen: set[str] = set()

    for candidate in ENTRY_CANDIDATES:
        matches = (
            Path.cwd().glob(candidate)
            if any(char in candidate for char in '*?[')
            else [Path(candidate)]
        )

        for path in matches:
            if not path.exists() or should_exclude(path):
                continue

            rel_path = str(path.relative_to(Path.cwd())) if path.is_absolute() else str(path)
            if rel_path not in seen:
                found.append(rel_path)
                seen.add(rel_path)

    return found


def find_lint_config() -> list[str]:
    """Find linting and formatting config files."""
    found: list[str] = []
    for filename in LINT_FILES:
        if Path(filename).exists():
            found.append(filename)
    return found


def find_env_templates() -> list[tuple[str, Path]]:
    """Find environment variable templates."""
    found: list[tuple[str, Path]] = []
    for filename in ENV_TEMPLATES:
        path = Path(filename)
        if path.exists():
            found.append((filename, path))
    return found


def find_todos_in_file(filepath: Path, patterns: list[str]) -> list[str]:
    """Find TODO-style comments in one source file."""
    todos: list[str] = []
    try:
        with open(filepath, encoding='utf-8', errors='replace') as f:
            for line_num, line in enumerate(f, 1):
                if any(pattern in line for pattern in patterns):
                    rel_path = filepath.relative_to(Path.cwd())
                    todos.append(f'{rel_path}:{line_num}: {line.strip()}')
    except Exception:
        pass
    return todos


def search_todos() -> list[str]:
    """Search for TODO/FIXME/HACK comments."""
    todos: list[str] = []
    patterns = ['TODO', 'FIXME', 'HACK']
    todo_exclude_dirs = {'test', 'tests', '__tests__', 'spec', '__mocks__', 'fixtures'}

    try:
        for root, dirs, files in os.walk(Path.cwd()):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and d not in todo_exclude_dirs]

            for file in files:
                ext = Path(file).suffix.lstrip('.')
                if ext in SOURCE_EXTS:
                    filepath = Path(root) / file
                    todos.extend(find_todos_in_file(filepath, patterns))
    except Exception:
        pass

    return todos[:TODO_LIMIT]


def get_git_commits() -> list[str]:
    """Get recent git commits."""
    try:
        result = subprocess.run(
            ['git', 'log', '--oneline', '-n', str(RECENT_COMMITS_LIMIT)],
            capture_output=True,
            text=True,
            cwd=Path.cwd(),
        )
        if result.returncode == 0:
            return result.stdout.strip().split('\n') if result.stdout.strip() else []
        return []
    except Exception:
        return []


def get_git_churn() -> list[str]:
    """Get high-churn files from last 90 days."""
    try:
        result = subprocess.run(
            ['git', 'log', '--since=90 days ago', '--name-only', '--pretty=format:'],
            capture_output=True,
            text=True,
            cwd=Path.cwd(),
        )
        if result.returncode == 0:
            files = [f.strip() for f in result.stdout.split('\n') if f.strip()]
            # Count occurrences
            counts: Counter[str] = Counter(files)
            churn: list[tuple[str, int]] = sorted(
                counts.items(), key=lambda item: item[1], reverse=True
            )
            return [f'{count:4d} {filename}' for filename, count in churn[:CHURN_LIMIT]]
        return []
    except Exception:
        return []


def is_git_repo() -> bool:
    """Check if current directory is a git repository."""
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--git-dir'], capture_output=True, cwd=Path.cwd(), timeout=2
        )
        return result.returncode == 0
    except Exception:
        return False


def detect_monorepo() -> list[str]:
    """Detect monorepo signals."""
    signals: list[str] = []

    for filename in MONOREPO_FILES:
        if Path(filename).exists():
            signals.append(f'Monorepo tool detected: {filename}')

    for dirname in MONOREPO_DIRS:
        if Path(dirname).is_dir():
            signals.append(f'Sub-package directory found: {dirname}/')

    # Check package.json workspaces
    if Path(PACKAGE_JSON).exists():
        try:
            with open(PACKAGE_JSON) as f:
                content = f.read()
                if '"workspaces"' in content:
                    signals.append(
                        f'{PACKAGE_JSON} has \'workspaces\' field '
                        '(npm/yarn workspaces monorepo)'
                    )
        except Exception:
            pass

    return signals


def detect_ci_cd_pipelines() -> list[str]:
    """Detect CI/CD pipeline configurations."""
    pipelines: list[str] = []

    for config_path, pipeline_name in CI_CD_CONFIGS.items():
        path = Path(config_path)
        if path.is_file():
            pipelines.append(f'CI/CD: {pipeline_name}')
        elif path.is_dir():
            # Check for workflow files in directory
            try:
                if list(path.glob('*.yml')) or list(path.glob('*.yaml')):
                    pipelines.append(f'CI/CD: {pipeline_name}')
            except Exception:
                pass

    return pipelines


def _container_config_paths(config: str) -> tuple[bool, list[Path]]:
    """Expand a container config glob and return whether globbing was used."""
    uses_glob = any(char in config for char in '*?[')
    paths = list(Path.cwd().glob(config)) if uses_glob else [Path(config)]
    return uses_glob, paths


def _container_relative_path(path: Path) -> str:
    """Get a display path relative to the project root when possible."""
    if path.is_absolute():
        return str(path.relative_to(Path.cwd()))
    return str(path)


def _detect_container_file(rel_path: str, config: str, uses_glob: bool) -> list[str]:
    """Classify a detected container file."""
    rel_name = Path(rel_path).name

    if 'Dockerfile' in rel_name:
        message = (
            f'Container: Docker found ({rel_path})'
            if uses_glob
            else 'Container: Docker found'
        )
        return [message]
    if 'docker-compose' in rel_name:
        message = (
            f'Orchestration: Docker Compose found ({rel_path})'
            if uses_glob
            else 'Orchestration: Docker Compose found'
        )
        return [message]
    if rel_path.endswith(('.yaml', '.yml')):
        message = (
            f'Container/Orchestration: {rel_path}'
            if uses_glob
            else f'Container/Orchestration: {config}'
        )
        return [message]
    return []


def _detect_container_directory(path: Path, rel_path: str) -> list[str]:
    """Classify a detected container or orchestration directory."""
    messages: list[str] = []

    if rel_path in ['k8s', 'kubernetes']:
        messages.append('Orchestration: Kubernetes configs found')

    try:
        if list(path.glob('*.yml')) or list(path.glob('*.yaml')):
            messages.append(f'Container/Orchestration: {rel_path}/ directory found')
    except Exception:
        pass

    return messages


def _detect_container_matches(config: str) -> list[str]:
    """Detect and deduplicate messages for one container config."""
    matches: list[str] = []
    seen: set[str] = set()
    uses_glob, paths = _container_config_paths(config)

    for path in paths:
        if not path.exists() or should_exclude(path):
            continue

        rel_path = _container_relative_path(path)
        if path.is_file():
            messages = _detect_container_file(rel_path, config, uses_glob)
        elif path.is_dir():
            messages = _detect_container_directory(path, rel_path)
        else:
            messages = []

        for message in messages:
            if message not in seen:
                matches.append(message)
                seen.add(message)

    return matches


def detect_containers() -> list[str]:
    """Detect containerization and orchestration configs.

    CONTAINER_FILES may include glob patterns such as ``Dockerfile.*``.
    Expand patterns before classifying files so environment-specific Dockerfiles
    are detected.
    """
    containers: list[str] = []
    seen: set[str] = set()

    for config in CONTAINER_FILES:
        for message in _detect_container_matches(config):
            if message not in seen:
                containers.append(message)
                seen.add(message)

    return containers


def detect_security_configs() -> list[str]:
    """Detect security and compliance configurations."""
    security: list[str] = []

    for config in SECURITY_CONFIGS:
        if Path(config).exists():
            config_name = config.replace('.yml', '').replace('.yaml', '').lstrip('.')
            security.append(f'Security: {config_name}')

    return security


def detect_performance_markers() -> list[str]:
    """Detect performance testing and profiling markers."""
    performance: list[str] = []

    for marker in PERFORMANCE_MARKERS:
        if Path(marker).exists():
            performance.append(f'Performance: {marker} found')
        else:
            # Check for directories
            try:
                if Path(marker).is_dir():
                    performance.append(f'Performance: {marker}/ directory found')
            except Exception:
                pass

    return performance


def _collect_file_metrics(
    filepath: Path,
    ext: str,
    lang_map: dict[str, str],
    metrics: CodeMetrics,
    file_sizes: list[tuple[Path, int]],
) -> None:
    """Collect metrics for a single non-binary file."""
    if not ext or ext in {'pyc', 'o', 'a', 'so'}:
        return

    try:
        size = filepath.stat().st_size
        file_sizes.append((filepath.relative_to(Path.cwd()), size))

        metrics['total_files'] += 1
        metrics['by_extension'][ext] = metrics['by_extension'].get(ext, 0) + 1

        lang = lang_map.get(ext, 'Other')
        metrics['by_language'][lang] = metrics['by_language'].get(lang, 0) + 1

        if ext in SOURCE_EXTS and size < 1_000_000:  # Skip huge files
            try:
                with open(filepath, encoding='utf-8', errors='ignore') as f:
                    metrics['total_lines'] += len(f.readlines())
            except Exception:
                pass
    except Exception:
        pass


def collect_code_metrics() -> CodeMetrics:
    """Collect code metrics: file counts by extension, total LOC."""
    metrics: CodeMetrics = {
        'total_files': 0,
        'by_extension': {},
        'by_language': {},
        'total_lines': 0,
        'largest_files': [],
    }

    lang_map: dict[str, str] = {
        'ts': 'TypeScript',
        'tsx': 'TypeScript/React',
        'js': 'JavaScript',
        'jsx': 'JavaScript/React',
        'py': 'Python',
        'go': 'Go',
        'java': 'Java',
        'kt': 'Kotlin',
        'rs': 'Rust',
        'cs': 'C#',
        'rb': 'Ruby',
        'php': 'PHP',
        'swift': 'Swift',
        'scala': 'Scala',
        'ex': 'Elixir',
        'cpp': 'C++',
        'c': 'C',
        'h': 'C Header',
        'clj': 'Clojure',
        'lua': 'Lua',
        'hs': 'Haskell',
    }

    file_sizes: list[tuple[Path, int]] = []

    try:
        for root, dirs, files in os.walk(Path.cwd()):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

            for file in files:
                filepath = Path(root) / file
                _collect_file_metrics(
                    filepath,
                    filepath.suffix.lstrip('.'),
                    lang_map,
                    metrics,
                    file_sizes,
                )

        file_sizes.sort(key=lambda item: item[1], reverse=True)
        metrics['largest_files'] = [f'{str(f)}: {s / 1024:.1f}KB' for f, s in file_sizes[:10]]

    except Exception:
        pass

    return metrics


def print_section(
    title: str, content: list[str], output_file: TextIO | None = None
) -> None:
    """Print a section with title and content."""
    lines = [f'\n=== {title} ===']

    lines.extend(content if content else [NONE_FOUND])

    text = '\n'.join(lines) + '\n'

    if output_file:
        output_file.write(text)
    else:
        print(text, end='')


@contextmanager
def output_file_context(path: str | None) -> Generator[TextIO | None]:
    """Open the optional output file for the duration of a scan."""
    if path:
        with open(path, 'w', encoding='utf-8') as output_file:
            yield output_file
    else:
        yield None


def print_optional_section(
    title: str,
    items: list[str],
    empty_message: str,
    output_file: TextIO | None,
) -> None:
    """Print a section with a fallback message when no items are found."""
    print_section(title, items if items else [empty_message], output_file)


def print_manifest_section(output_file: TextIO | None) -> None:
    """Print detected manifest files and their previews."""
    manifests = find_manifest_files()
    if not manifests:
        print_optional_section(
            'STACK DETECTION (manifest files)',
            [],
            'No recognized manifest files found in project root.',
            output_file,
        )
        return

    manifest_content = ['']
    for manifest in manifests:
        manifest_content.append(f'--- {manifest} ---')
        if manifest == 'bun.lockb':
            manifest_content.append(
                f'[Binary lockfile — see {PACKAGE_JSON} for dependency details.]'
            )
        else:
            manifest_content.append(read_file_preview(Path(manifest)))
    print_section('STACK DETECTION (manifest files)', manifest_content, output_file)


def print_environment_section(output_file: TextIO | None) -> None:
    """Print environment template previews."""
    envs = find_env_templates()
    if not envs:
        print_optional_section(
            'ENVIRONMENT VARIABLE TEMPLATES',
            [],
            'No .env.example or .env.template found. Identify required '
            'environment variables by searching the code and config for '
            'environment variable reads.',
            output_file,
        )
        return

    env_content: list[str] = []
    for filename, filepath in envs:
        env_content.append(f'--- {filename} ---')
        env_content.append(read_file_preview(filepath))
    print_section('ENVIRONMENT VARIABLE TEMPLATES', env_content, output_file)


def print_git_section(output_file: TextIO | None) -> None:
    """Print recent commit and code churn information."""
    if not is_git_repo():
        print_section(
            GIT_RECENT_COMMITS_TITLE,
            ['Not a git repository or no commits yet.'],
            output_file,
        )
        print_section(HIGH_CHURN_FILES_TITLE, ['Not a git repository.'], output_file)
        return

    commits = get_git_commits()
    print_optional_section(
        GIT_RECENT_COMMITS_TITLE,
        commits,
        'No commits found.',
        output_file,
    )
    print_optional_section(HIGH_CHURN_FILES_TITLE, get_git_churn(), NONE_FOUND, output_file)


def print_code_metrics(output_file: TextIO | None) -> None:
    """Print collected source code metrics."""
    metrics = collect_code_metrics()
    metrics_output: list[str] = [
        f"Total files scanned: {metrics['total_files']}",
        f"Total lines of code: {metrics['total_lines']}",
        '',
    ]
    if metrics['by_language']:
        metrics_output.append('Files by language:')
        for lang, count in sorted(
            metrics['by_language'].items(),
            key=lambda item: item[1],
            reverse=True,
        ):
            metrics_output.append(f'  {lang}: {count}')
    if metrics['largest_files']:
        metrics_output.extend(['', 'Top 10 largest files:', *metrics['largest_files']])
    print_section('CODE METRICS', metrics_output, output_file)


def run_scan(output_file: TextIO | None) -> int:
    """Run the scan and write results to the requested destination."""
    try:
        print_section(
            f'DIRECTORY TREE (max depth {TREE_MAX_DEPTH}, source files only)',
            get_directory_tree(),
            output_file,
        )

        print_manifest_section(output_file)

        print_optional_section(
            'ENTRY POINTS',
            [f'Found: {entry}' for entry in find_entry_points()],
            (
                "No common entry points found. Check 'main' or "
                "'scripts.start' in manifest files above."
            ),
            output_file,
        )

        print_optional_section(
            'LINTING AND FORMATTING CONFIG',
            [f'Found: {lint_file}' for lint_file in find_lint_config()],
            'No linting or formatting config files found in project root.',
            output_file,
        )

        print_environment_section(output_file)

        print_optional_section(
            'TODO / FIXME / HACK (production code only, test dirs excluded)',
            search_todos(),
            NONE_FOUND,
            output_file,
        )

        print_git_section(output_file)

        print_optional_section(
            'MONOREPO SIGNALS',
            detect_monorepo(),
            'No monorepo signals detected.',
            output_file,
        )

        print_code_metrics(output_file)

        print_optional_section(
            'CI/CD PIPELINES',
            detect_ci_cd_pipelines(),
            'No CI/CD pipelines detected.',
            output_file,
        )

        print_optional_section(
            'CONTAINERS & ORCHESTRATION',
            detect_containers(),
            'No containerization configs detected.',
            output_file,
        )

        print_optional_section(
            'SECURITY & COMPLIANCE',
            detect_security_configs(),
            'No security configs detected.',
            output_file,
        )

        print_optional_section(
            'PERFORMANCE & TESTING',
            detect_performance_markers(),
            'No performance testing configs detected.',
            output_file,
        )

        final_msg = '\n=== SCAN COMPLETE ===\n'
        if output_file:
            output_file.write(final_msg)
        else:
            print(final_msg, end='')

        return 0

    except Exception as e:
        print(f'Error: {e}', file=sys.stderr)
        return 1


def main():
    """Main entry point."""
    args = parse_args()
    if args.output:
        output_dir = Path(args.output).parent
        output_dir.mkdir(parents=True, exist_ok=True)
        print(f'Writing output to: {args.output}', file=sys.stderr)
    with output_file_context(args.output) as output_file:
        return run_scan(output_file)


if __name__ == '__main__':
    sys.exit(main())
