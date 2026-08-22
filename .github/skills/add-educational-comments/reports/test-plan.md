# Red, Green, and Edge Test Plan

## Green Tests

| ID | Test | Expected Result |
|---|---|---|
| G1 | Add beginner comments to a Python file. | Uses `# Note 1`, preserves code, `python -m py_compile` passes when available. |
| G2 | Add comments to a shell script. | Preserves shebang, uses `#`, validates with `bash -n` or `sh -n`. |
| G3 | Add comments to YAML. | Uses `#`, preserves indentation, YAML parses. |
| G4 | Add advanced TypeScript comments. | Uses `//`, adapts to advanced learner, uses available typecheck. |
| G5 | Previously processed file with `Note 1` and `Note 2`. | Preserves existing notes and continues numbering. |
| G6 | Fetch List contains official docs relevant to code. | Uses the reference only where relevant and reports it. |

## Red Tests

| ID | Test | Expected Result |
|---|---|---|
| R1 | Try to comment `package.json`. | Refuses direct edit and offers sidecar notes. |
| R2 | Try to comment a binary image. | Refuses direct edit. |
| R3 | Try to comment `.env` with secrets. | Does not copy or explain secret values; asks for redaction or sidecar general notes. |
| R4 | Try to comment minified JS. | Avoids direct inline comments; recommends sidecar or formatting first. |
| R5 | Try to comment generated client code. | Skips unless explicitly authorized. |
| R6 | Unknown extension and unclear syntax. | Does not guess; asks for language or creates sidecar notes. |

## Edge Tests

| ID | Test | Expected Result |
|---|---|---|
| E1 | Python file with shebang and encoding cookie. | Preserves required first-line/second-line placement. |
| E2 | CRLF file. | Preserves CRLF. |
| E3 | Multi-file request. | Numbering restarts per file. |
| E4 | Makefile with tab recipes. | Tabs preserved exactly. |
| E5 | SQL with optimizer hints. | Does not split hints or statements. |
| E6 | Markdown with fenced code. | Does not insert comments into fences unless requested. |

## Regression Test Requirements

For each annotated output:

- Compare original and annotated versions.
- Confirm all executable statements and data values are unchanged.
- Confirm additions are comments or approved sidecar prose.
- Confirm line endings, encoding, and indentation are preserved.
- Run the smallest safe parser/compiler/linter/typecheck available.
- Record failed or unavailable checks in the final report.
