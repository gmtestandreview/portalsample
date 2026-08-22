---
name: draw-io
description: 'Create, edit, validate, or review draw.io diagrams and mxGraph XML. Use for .drawio, .drawio.svg, and .drawio.png files, diagram layout, XML structure fixes, templates, and rendering validation.'
---

# draw.io Diagram Skill

Use this skill when the task involves creating, editing, validating, or reviewing draw.io diagrams, mxGraph XML, or exported draw.io SVG/PNG files.

## When to Use This Skill

Use this skill when the user asks to:

- create a new draw.io diagram
- edit an existing `.drawio` file
- review or validate mxGraph XML
- fix broken draw.io XML structure
- create architecture, flowchart, sequence, ER, UML, network, or BPMN diagrams
- export or review `.drawio.svg` or `.drawio.png` files
- diagnose draw.io rendering or validation problems

Do not use this skill for ordinary Markdown, image editing, source-code diagrams, or non-draw.io formats unless the user explicitly asks to convert them into draw.io.

## Repository Conventions

- Prefer `.drawio` for version-controlled source diagrams.
- Prefer `.drawio.svg` when a diagram needs to be embedded in Markdown.
- Treat `.drawio.png` and `.drawio.svg` as exported or embedded formats unless the task explicitly requires editing them.
- Do not assume exported PNG/SVG diagram files are safe to edit as plain XML.
- Store diagrams in `docs/`, `architecture/`, or near the code they document.
- Use kebab-case file names, for example `order-flow.drawio`.
- If only an exported `.drawio.svg` or `.drawio.png` is available and no `.drawio` source exists, state that clearly before editing. Prefer asking for the source diagram or using a documented import/export workflow.

## Workflow

For create or edit tasks:

1. Identify the diagram type: flowchart, architecture, sequence, ER, UML, network, BPMN, or other.
2. Check for an existing matching diagram or template before creating a new structure.
3. Plan the layout before editing XML:
   - define tiers, actors, entities, or phases
   - decide page boundaries
   - choose major shapes and connectors
4. Edit the `.drawio` source when available.
5. Keep changes minimal when editing existing diagrams.
6. Avoid metadata-only churn, including timestamp-only changes.
7. Validate XML structure.
8. Confirm rendering when the local tools are available.
9. Report what changed, what was validated, and any remaining risk.

For review-only tasks:

1. Inspect the diagram structure and XML.
2. Report findings without regenerating the diagram unless explicitly asked.
3. Identify validation/rendering gaps clearly.
4. Recommend the smallest safe fix.

## mxGraph XML Guardrails

Preserve valid draw.io / mxGraph XML.

A minimal page structure should include:

```xml
<mxfile host="Electron">
  <diagram id="unique-id" name="Page Name">
    <mxGraphModel>
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

Required rules:

- `<mxCell id="0" />` must exist and be the first cell in each diagram root.
- `<mxCell id="1" parent="0" />` must exist and be the second cell in each diagram root.
- Every cell `id` must be unique within the diagram.
- Every vertex must have an `<mxGeometry as="geometry">` child.
- Every non-root cell must have a valid `parent`.
- Every edge should reference valid `source` and `target` vertex IDs.
- Floating edges may use `<mxPoint as="sourcePoint">` and `<mxPoint as="targetPoint">` inside geometry instead of `source` and `target`.
- Children of containers or swimlanes use coordinates relative to their parent.
- Escape XML attribute values correctly. Do not leave bare `&`, `<`, or `>` in attributes.

## Style and Layout

Use consistent, readable diagrams.

### Semantic color palette

| Role                       | fillColor | strokeColor |
| -------------------------- | --------- | ----------- |
| Primary / Info             | `#dae8fc` | `#6c8ebf`   |
| Success / Start / Positive | `#d5e8d4` | `#82b366`   |
| Warning / Decision         | `#fff2cc` | `#d6b656`   |
| Error / End / Danger       | `#f8cecc` | `#b85450`   |
| Neutral / Interface        | `#f5f5f5` | `#666666`   |
| External / Partner         | `#e1d5e7` | `#9673a6`   |

### Shape conventions

- Include `whiteSpace=wrap;html=1;` on vertex shapes.
- Use `html=1` when labels contain HTML tags such as `<b>`, `<i>`, or `<br>`.
- Prefer orthogonal connectors with `edgeStyle=orthogonalEdgeStyle;html=1;`.
- Align coordinates to a 10 px grid where practical.
- Keep spacing readable:
  - 40–60 px between same-row shapes
  - 80–120 px between tier rows
- Add a clear page title unless the existing diagram pattern intentionally differs.
- Split large diagrams into multiple pages instead of creating overcrowded diagrams.

## Diagram Type Hints

| Type         | Common structure                 | Connector guidance                   |
| ------------ | -------------------------------- | ------------------------------------ |
| Flowchart    | Start/end, process, decision     | Orthogonal connectors                |
| Architecture | Swimlanes or tiers               | Orthogonal connectors with labels    |
| Sequence     | Actors, lifelines, messages      | Sync arrows and dashed return arrows |
| ER diagram   | Tables, rows, relationship edges | Entity relationship edge styles      |
| UML class    | Class boxes, attributes, methods | Inheritance and realization arrows   |

Use existing templates or nearby diagrams as the first source of truth when available.

## Validation

When possible, run:

```bash
python .github/skills/draw-io/scripts/validate-drawio.py <file.drawio>
```

Check:

- root cells `id="0"` and `id="1"` are present and first
- cell IDs are unique
- edge sources and targets resolve
- vertices have geometry
- parents resolve
- XML is well-formed
- labels are escaped correctly
- style conventions are used consistently
- each page has a clear title where appropriate

When reporting completion, include:

- files created or edited
- whether XML validation was run
- whether render confirmation was performed
- any unavailable tools or residual risks

When possible, confirm the diagram renders in VS Code with the draw.io extension or another available draw.io-compatible viewer.

If validation or render confirmation cannot be performed, say so clearly and note the risk. Do not claim validation passed.

## Gotchas

- **Do not edit exported `.drawio.svg` or `.drawio.png` as if they are always plain source XML.** Prefer the `.drawio` source or a proper export/regeneration workflow.
- **Do not create timestamp-only diffs.** Preserve existing metadata unless a real content change requires an update.
- **Do not regenerate large diagrams unnecessarily.** Small source edits are easier to review.
- **Do not overcrowd one page.** Split large diagrams into logical pages.
- **Do not skip XML escaping.** Unescaped special characters in attributes can make diagrams fail to load.
- **Do not claim render validation if no renderer was available.**

## Optional Bundled Resources

Use these resources if they exist in the repository:

- `templates/` — reusable diagram templates
- `references/` — XML, style, and shape reference material
- `scripts/validate-drawio.py` — structural validator
- `scripts/add-shape.py` — helper for adding shapes safely

Do not invent these resources if they are missing. If a referenced resource is unavailable, report that clearly and proceed with the safest manual approach.

Do not create new templates, scripts, or reference files unless the user explicitly asks for them.
