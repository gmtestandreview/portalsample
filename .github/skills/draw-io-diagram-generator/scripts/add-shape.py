#!/usr/bin/env python3
"""add-shape.py — Add a new vertex shape to an existing .drawio diagram file.

Usage:
    python scripts/add-shape.py <diagram.drawio> <label> <x> <y> [options]

Examples:
    python scripts/add-shape.py docs/flowchart.drawio "New Step" 400 300
    python scripts/add-shape.py docs/arch.drawio "Decision" 400 400 \\
        --width 160 --height 80 \\
        --style "rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;"
    python scripts/add-shape.py docs/arch.drawio "Preview Node" 200 200 --dry-run
"""

from __future__ import annotations

import argparse
import sys
import uuid
from collections.abc import Iterator
from pathlib import Path
from typing import Any, Protocol

from defusedxml import DefusedXmlException
from defusedxml import ElementTree as ET

DEFAULT_STYLE = 'rounded=1;whiteSpace=wrap;html=1;'


class _XmlNode(Protocol):
    """Structural type for the parts of an element that _indent_xml touches."""

    text: str | None
    tail: str | None

    def __len__(self) -> int: ...

    def __iter__(self) -> Iterator[_XmlNode]: ...


def _indent_xml(elem: _XmlNode, level: int = 0) -> None:
    """Indent XML tree in-place. Replaces ET.indent() for Python 3.8 compatibility."""
    indent = '\n' + '  ' * level
    if len(elem):
        if not elem.text or not elem.text.strip():
            elem.text = indent + '  '
        if not elem.tail or not elem.tail.strip():
            elem.tail = indent
        children = list(elem)
        for child in children:
            _indent_xml(child, level + 1)
        # last child tail
        last = children[-1]
        if not last.tail or not last.tail.strip():
            last.tail = indent
    else:
        if level and (not elem.tail or not elem.tail.strip()):
            elem.tail = indent
    if not level:
        elem.tail = '\n'


def _generate_id() -> str:
    """Generate a short random cell id (not security-sensitive)."""
    return 'auto_' + uuid.uuid4().hex[:8]


def _locate_page(mxfile: Any, diagram_index: int) -> tuple[Any, Any] | str:
    """Return (diagram, root) elements for the page, or an error message."""
    if mxfile.tag != 'mxfile':
        return f'Root element must be <mxfile>, got <{mxfile.tag}>'

    diagrams = mxfile.findall('diagram')
    if diagram_index >= len(diagrams):
        return (
            f'diagram-index {diagram_index} is out of range (file has {len(diagrams)} diagram(s))'
        )

    diagram = diagrams[diagram_index]
    graph_model = diagram.find('mxGraphModel')
    if graph_model is None:
        return '<mxGraphModel> not found as direct child. Compressed diagrams are not supported.'

    root_elem = graph_model.find('root')
    if root_elem is None:
        return '<root> element not found inside <mxGraphModel>'
    return diagram, root_elem


def _pick_parent_id(existing_ids: set[str | None]) -> str:
    """Default to the standard layer "1"; else the first non-root cell id."""
    if '1' in existing_ids:
        return '1'
    return next((cid for cid in existing_ids if cid and cid != '0'), '1')


def add_shape(
    path: Path,
    label: str,
    x: int,
    y: int,
    width: int = 120,
    height: int = 60,
    style: str = DEFAULT_STYLE,
    diagram_index: int = 0,
    dry_run: bool = False,
) -> int:
    """Parse the .drawio file, insert a new vertex cell into the specified diagram page,
    and write the file back (unless dry_run is True).

    Returns:
        0 on success, 1 on failure.
    """
    try:
        tree = ET.parse(path)
    except (ET.ParseError, DefusedXmlException) as exc:
        print(f"ERROR: XML parse error in '{path}': {exc}")
        return 1

    mxfile = tree.getroot()
    if mxfile is None:
        print('ERROR: XML document has no root element')
        return 1
    located = _locate_page(mxfile, diagram_index)
    if isinstance(located, str):
        print(f'ERROR: {located}')
        return 1
    diagram, root_elem = located

    existing_ids = {c.get('id') for c in root_elem.findall('mxCell') if c.get('id')}
    parent_id = _pick_parent_id(existing_ids)

    new_id = _generate_id()
    while new_id in existing_ids:
        new_id = _generate_id()

    # Build the new mxCell element
    # Elements are built from the parsed tree (makeelement) so no native xml import is needed.
    new_cell = root_elem.makeelement(
        'mxCell',
        {'id': new_id, 'value': label, 'style': style, 'vertex': '1', 'parent': parent_id},
    )
    new_cell.append(
        new_cell.makeelement(
            'mxGeometry',
            {
                'x': str(x),
                'y': str(y),
                'width': str(width),
                'height': str(height),
                'as': 'geometry',
            },
        )
    )

    if dry_run:
        print('DRY RUN — new cell XML (not written):')
        print(ET.tostring(new_cell, encoding='unicode'))
        print(f"\nWould add to diagram '{diagram.get('name', diagram_index)}' in '{path}'")
        return 0

    root_elem.append(new_cell)

    # Write back preserving XML declaration (uses _indent_xml for Python 3.8 compat)
    _indent_xml(mxfile)
    tree.write(str(path), encoding='utf-8', xml_declaration=True)

    print(
        f'Added shape id="{new_id}" to page {diagram_index} '
        f"('{diagram.get('name', '')}') of {path}"
    )
    return 0


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Add a shape to an existing .drawio diagram file.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument('diagram', help='Path to the .drawio file')
    parser.add_argument('label', help='Text label for the new shape')
    parser.add_argument('x', type=int, help='X coordinate (pixels)')
    parser.add_argument('y', type=int, help='Y coordinate (pixels)')
    parser.add_argument('--width', type=int, default=120, help='Shape width (default: 120)')
    parser.add_argument('--height', type=int, default=60, help='Shape height (default: 60)')
    parser.add_argument(
        '--style',
        default=DEFAULT_STYLE,
        help=f'draw.io style string (default: "{DEFAULT_STYLE}")',
    )
    parser.add_argument(
        '--diagram-index',
        type=int,
        default=0,
        help='0-based index of the diagram page to add to (default: 0)',
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Print the new cell XML without writing to file',
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    path = Path(args.diagram)

    if not path.exists():
        print(f'ERROR: File not found: {path}')
        return 1
    if not path.is_file():
        print(f'ERROR: Not a file: {path}')
        return 1

    return add_shape(
        path=path,
        label=args.label,
        x=args.x,
        y=args.y,
        width=args.width,
        height=args.height,
        style=args.style,
        diagram_index=args.diagram_index,
        dry_run=args.dry_run,
    )


if __name__ == '__main__':
    sys.exit(main())
