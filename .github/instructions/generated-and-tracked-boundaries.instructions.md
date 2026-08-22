---
description: 'Prevent accidental edits to generated output, tracking artifacts, and other tool-owned files that should not be treated as handwritten source. Follow these instructions when working near generated or tool-owned files to ensure that source integrity is maintained and that changes are made through the appropriate generators or scripts.'
applyTo: 'storybook-static/**,__generated__/**,.copilot-tracking/**,coverage/**,playwright-report/**,test-results/**'
---

# Generated And Tracked Artifact Rules

Apply these rules when working near generated or tool-owned files.

- Do not edit generated output, build artifacts, or tracking artifacts unless the task explicitly requires it.
- Prefer changing the source files or generators that produce these artifacts.
- If a task explicitly requires regenerating output, update the source first and then use the repository script or tool that owns the output.
- Do not widen lint or format scope to these areas unless the task explicitly requires it.
- Treat `.copilot-tracking/**` as workflow evidence, not application source.
- If direct artifact updates are explicitly required, explain why the source or generator change was insufficient and identify the owning generator or script.
