"""Black-box graph renderer regressions using real Node and Graphviz artifacts."""

import base64
import locale
import os
import shutil
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

import pytest

RENDERER = Path(__file__).resolve().parents[1] / "render-graphs.js"


def _run(skill: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["node", str(RENDERER), str(skill), *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        timeout=30,
    )


@pytest.fixture(autouse=True)
def _graphviz_available(monkeypatch: pytest.MonkeyPatch):
    dot = shutil.which("dot")
    if not shutil.which("node") or not dot:
        pytest.skip("Renderer integration requires Node and Graphviz")
    monkeypatch.setenv("GRAPHVIZ_DOT", str(Path(dot).resolve()))


def _skill(tmp_path: Path, markdown: str, name: str = "graph-skill") -> Path:
    skill = tmp_path / name
    skill.mkdir()
    (skill / "SKILL.md").write_bytes(markdown.encode("utf-8"))
    return skill


def _text_labels(root: ET.Element) -> list[str]:
    labels: list[str] = []
    for node in root.iter("{http://www.w3.org/2000/svg}text"):
        assert node.text is not None, "SVG text node has no label"
        labels.append(node.text)
    return labels


def _labels(svg: Path) -> list[str]:
    root = ET.parse(svg).getroot()
    assert root.tag == "{http://www.w3.org/2000/svg}svg"
    labels = _text_labels(root)
    # SVG image data has its own document/namespace. Inspect the embedded
    # standalone image documents as an SVG consumer would, not DOT internals.
    for image in root.iter("{http://www.w3.org/2000/svg}image"):
        href = image.get("href", "")
        if href.startswith("data:image/svg+xml;base64,"):
            nested = ET.fromstring(base64.b64decode(href.split(",", 1)[1]))
            labels.extend(_text_labels(nested))
    return labels


def test_crlf_dot_fence_renders_svg(tmp_path: Path):
    skill = _skill(tmp_path, '```dot\r\ndigraph first { a [label="CRLF"]; }\r\n```')
    result = _run(skill)
    assert result.returncode == 0, result.stderr
    svgs = list((skill / "diagrams").glob("*.svg"))
    assert len(svgs) == 1
    assert "CRLF" in _labels(svgs[0])


@pytest.mark.parametrize(
    "header", ['digraph "quoted name"', "digraph", 'strict digraph "name with spaces"']
)
def test_combine_preserves_legal_dot_headers(tmp_path: Path, header: str):
    skill = _skill(tmp_path, f'```dot\n{header} {{ a [label="PRESERVED"]; }}\n```')
    result = _run(skill, "--combine")
    assert result.returncode == 0, result.stderr
    svgs = list((skill / "diagrams").glob("*.svg"))
    assert len(svgs) == 1
    assert "PRESERVED" in _labels(svgs[0])


def test_combine_preserves_independent_node_namespaces(tmp_path: Path):
    skill = _skill(
        tmp_path,
        '```dot\ndigraph first { a [label="FIRST"]; a -> b; }\n```\n'
        '```dot\ndigraph second { a [label="SECOND"]; a -> b; }\n```',
    )
    result = _run(skill, "--combine")
    assert result.returncode == 0, result.stderr
    labels = _labels(next((skill / "diagrams").glob("*.svg")))
    assert "FIRST" in labels
    assert "SECOND" in labels
    assert labels.count("b") == 2


def test_duplicate_graph_names_preserve_both_outputs(tmp_path: Path):
    skill = _skill(
        tmp_path,
        '```dot\ndigraph same { a [label="FIRST"]; }\n```\n'
        '```dot\ndigraph same { a [label="SECOND"]; }\n```',
    )
    result = _run(skill)
    assert result.returncode == 0, result.stderr
    svgs = list((skill / "diagrams").glob("*.svg"))
    assert len(svgs) == 2
    labels = [label for svg in svgs for label in _labels(svg)]
    assert "FIRST" in labels
    assert "SECOND" in labels


def test_case_colliding_names_have_distinct_portable_files(tmp_path: Path):
    skill = _skill(
        tmp_path,
        '```dot\ndigraph Flow { a [label="UPPER"]; }\n```\n'
        '```dot\ndigraph flow { a [label="LOWER"]; }\n```',
    )
    result = _run(skill)
    assert result.returncode == 0, result.stderr
    svgs = list((skill / "diagrams").glob("*.svg"))
    assert len(svgs) == 2
    assert len({svg.name.lower() for svg in svgs}) == 2
    labels = [label for svg in svgs for label in _labels(svg)]
    assert "UPPER" in labels
    assert "LOWER" in labels


def test_directory_and_graph_labels_are_portable(tmp_path: Path):
    skill = _skill(
        tmp_path,
        '```dot\ndigraph "../CON" { a [label="SAFE"]; }\n```',
        "skill directory",
    )
    argument_sets: list[tuple[str, ...]] = [(), ("--combine",)]
    for arguments in argument_sets:
        result = _run(skill, *arguments)
        assert result.returncode == 0, result.stderr
    svgs = list((skill / "diagrams").glob("*.svg"))
    assert len(svgs) == 2
    assert all("SAFE" in _labels(svg) for svg in svgs)
    assert not (tmp_path / "CON.svg").exists()


@pytest.mark.parametrize("arguments", [(), ("--combine",)])
def test_invalid_dot_returns_failure(tmp_path: Path, arguments: tuple[str, ...]):
    skill = _skill(tmp_path, "```dot\ndigraph bad { a -> ; }\n```")
    result = _run(skill, *arguments)
    assert result.returncode != 0
    assert "Failed" in result.stderr or "Error" in result.stderr
    assert not list((skill / "diagrams").glob("*.svg"))


@pytest.mark.parametrize("arguments", [("--typo",), ("extra-directory",)])
def test_invalid_arguments_do_not_write_outputs(tmp_path: Path, arguments: tuple[str, ...]):
    skill = _skill(tmp_path, "```dot\ndigraph first { a -> b; }\n```")
    result = _run(skill, *arguments)
    assert result.returncode != 0
    assert "Usage:" in result.stderr
    assert not (skill / "diagrams").exists()


def test_output_symlink_cannot_write_outside_skill(tmp_path: Path):
    skill = _skill(tmp_path, "```dot\ndigraph first { a -> b; }\n```")
    outside = tmp_path / "outside"
    outside.mkdir()
    try:
        os.symlink(outside, skill / "diagrams", target_is_directory=True)
    except OSError:
        pytest.skip("Directory symlinks require platform support or permission")
    result = _run(skill)
    assert result.returncode != 0
    assert list(outside.iterdir()) == []


def test_no_dot_blocks_has_no_output_side_effects(tmp_path: Path):
    skill = _skill(tmp_path, "# No diagrams here\n")
    result = _run(skill)
    assert result.returncode == 0, result.stderr
    assert "No" in result.stdout
    assert not (skill / "diagrams").exists()


def test_renderer_output_is_utf8_under_legacy_locale(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    skill = _skill(tmp_path, "# No diagrams here\n", "cafe-é")
    monkeypatch.setattr(locale, "getencoding", lambda: "cp1252")
    result = _run(skill)
    assert result.returncode == 0, result.stderr
    assert str(skill.resolve() / "SKILL.md") in result.stdout
    assert not (skill / "diagrams").exists()


@pytest.mark.parametrize("fence", ["````", "~~~~"])
def test_long_markdown_fences_render_diagrams(tmp_path: Path, fence: str):
    skill = _skill(tmp_path, f'{fence}dot\ndigraph g {{ a [label="FENCED"]; }}\n{fence}')
    result = _run(skill)
    assert result.returncode == 0, result.stderr
    svgs = list((skill / "diagrams").glob("*.svg"))
    assert len(svgs) == 1
    assert "FENCED" in _labels(svgs[0])


def test_multiple_graphs_in_one_fence_are_rejected(tmp_path: Path):
    skill = _skill(tmp_path, "```dot\ndigraph a { x; } digraph b { y; }\n```")
    result = _run(skill, "--combine")
    assert result.returncode != 0
    assert "one graph" in result.stderr.lower()
    assert not list((skill / "diagrams").glob("*.svg"))


def test_missing_external_image_diagnostic_is_not_discarded(tmp_path: Path):
    skill = _skill(tmp_path, '```dot\ndigraph g { a [image="missing.png", label="IMAGE"]; }\n```')
    result = _run(skill, "--combine")
    assert result.returncode != 0
    assert "missing.png" in result.stderr
    assert not list((skill / "diagrams").glob("*.svg"))


def test_braces_and_graph_words_inside_labels_and_comments_are_not_graphs(tmp_path: Path):
    skill = _skill(
        tmp_path,
        "```dot\n// digraph fake { ignored }\n"
        'digraph actual { a [label="digraph label { } \\"quoted\\""]; '
        "b [label=<<B>HTML { } 'text</B>>]; a -> b; } /* trailing { } */\n```",
    )
    result = _run(skill, "--combine")
    assert result.returncode == 0, result.stderr
    labels = _labels(next((skill / "diagrams").glob("*.svg")))
    assert 'digraph label { } "quoted"' in labels
    assert "HTML { } 'text" in labels


@pytest.mark.parametrize("arguments", [(), ("--combine",)])
def test_nested_graph_and_html_attributes_preserve_labels(
    tmp_path: Path, arguments: tuple[str, ...]
):
    skill = _skill(
        tmp_path,
        "```dot\n# ignored { }\n"
        'digraph nested { subgraph cluster_one { a [label="NESTED"]; } '
        'b [label=<<TABLE BORDER="0"><!-- ignored { } -->'
        '<TR><TD HREF="https://example.com/?a=&gt;">HTML</TD></TR></TABLE>>]; '
        "a -> b; } // trailing { }\n```",
    )
    result = _run(skill, *arguments)
    assert result.returncode == 0, result.stderr
    labels = _labels(next((skill / "diagrams").glob("*.svg")))
    assert "NESTED" in labels
    assert "HTML" in labels


@pytest.mark.parametrize(
    "content",
    [
        'digraph g { a [label="unclosed]; }',
        "digraph g { a; } /* unclosed",
        "digraph g { a [label=<<B>unclosed</B>]; }",
        "digraph g { a [label=<<B><!-- unclosed </B>>]; }",
        "digraph g { a; }}",
        "digraph g { subgraph s { a; }",
        "digraph g { a; } unexpected",
    ],
)
def test_incomplete_or_surplus_dot_tokens_fail_without_artifacts(tmp_path: Path, content: str):
    skill = _skill(tmp_path, f"```dot\n{content}\n```")
    result = _run(skill, "--combine")
    assert result.returncode != 0
    assert not list((skill / "diagrams").glob("*"))


def test_short_and_mismatched_fences_do_not_close_dot(tmp_path: Path):
    skill = _skill(tmp_path, "````dot\ndigraph g { a; }\n```\n~~~~")
    result = _run(skill)
    assert result.returncode != 0
    assert "Unclosed DOT" in result.stderr
    assert not (skill / "diagrams").exists()


def test_dot_example_inside_another_language_is_skipped(tmp_path: Path):
    skill = _skill(
        tmp_path,
        "````markdown\n```dot\ndigraph example { a; }\n```\n````\n"
        '   ~~~~dot\ndigraph real { a [label="REAL"]; }\n   ~~~~~ \t',
    )
    result = _run(skill)
    assert result.returncode == 0, result.stderr
    svgs = list((skill / "diagrams").glob("*.svg"))
    assert [svg.name for svg in svgs] == ["real.svg"]
    assert "REAL" in _labels(svgs[0])


def test_long_fence_lines_are_handled_without_losing_diagram(tmp_path: Path):
    fence = "`" * 20000
    skill = _skill(tmp_path, f'{fence}dot\ndigraph g {{ a [label="LONG"]; }}\n{fence}')
    result = _run(skill)
    assert result.returncode == 0, result.stderr
    assert "LONG" in _labels(skill / "diagrams" / "g.svg")


@pytest.mark.parametrize(
    ("name", "filename"),
    [("...name...", "name.svg"), ("...", "graph.svg"), ("CON", "_CON.svg")],
)
def test_boundary_dots_and_reserved_names_remain_portable(tmp_path: Path, name: str, filename: str):
    skill = _skill(tmp_path, f'```dot\ndigraph "{name}" {{ a; }}\n```')
    result = _run(skill)
    assert result.returncode == 0, result.stderr
    assert [svg.name for svg in (skill / "diagrams").glob("*.svg")] == [filename]
