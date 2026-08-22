---
description: 'This instruction routes tasks involving draw.io diagrams to the draw.io skill and provides guardrails for editing diagram files. Follow these guidelines when working with .drawio, .drawio.svg, or .drawio.png files to ensure safe and consistent handling of draw.io diagrams in the repository.'
applyTo: '**/*.drawio,**/*.drawio.svg,**/*.drawio.png'
---

# draw.io diagram routing

Use this instruction only for draw.io diagram files.

For creating, editing, validating, or reviewing draw.io diagrams, load and follow:

```text
.github/skills/draw-io/SKILL.md
```

## Guardrails

- Prefer editing `.drawio` source files when available.
- Treat `.drawio.svg` and `.drawio.png` as exported or embedded formats unless the task explicitly requires editing them.
- Do not assume exported SVG/PNG diagram files are safe to edit as plain XML.
- Do not regenerate or rewrite diagrams unless the task requires it.
- Avoid metadata-only churn, including timestamp-only changes.
- If the draw.io skill, templates, scripts, validator, or render tools are unavailable, say so clearly and do not claim validation succeeded.
