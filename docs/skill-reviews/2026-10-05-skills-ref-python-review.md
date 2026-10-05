# Skills reference Python review

## Result

Combined assessment: **85/100 before remediation; 96/100 afterward**. All four
requested files received focused changes. The threshold is interpreted as at
least 95/100; the final assessment also exceeds 95.

Pressure status: **AMBER**. No demonstrated material defect remains in the
reviewed scope. Runtime, compatibility, typing, lint, and formatter checks pass.
Full Sonar analysis was unavailable, and independent post-change review attempts
stopped at an account usage limit. The numerical score is an engineering
assessment, not a production-readiness certification. The package README
describes this library as demonstration software.

## Artifact and scope

Reviewed the current working copies, including pre-existing local edits, on
`refactor/formik-removal-steps-1-2` at HEAD
`ef53dd8f9700bfd6064b956a098a345ae1d8154c`. No specific issue identifiers,
analyzer output, or rule profile were supplied with the request.

Paths below are relative to `skills/writing-skills/scripts/`:

- `skills_ref/parser.py`
- `tests/test_cli.py`
- `tests/test_prompt.py`
- `tests/test_render_graphs.py`

Changes were developed in `.worktrees/skills-python-review-20261005`. Baseline
copies are retained under its `.review-baseline/` directory. Original target
hashes were checked before applying the four fixes back to the workspace. Final
validation ran against those workspace files. The
`.claude/skills/writing-skills` path is a symlink to the same skill; it is not
an independent copy requiring a second patch.

## Architecture, purpose, goal, and expected outcome

| File                          | Architecture and purpose                                                                                      | Goal and expected outcome                                                                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skills_ref/parser.py`        | Synchronous filesystem and StrictYAML boundary; translates external text into metadata and `SkillProperties`. | Read exact-cased UTF-8 `SKILL.md`, extract frontmatter/body, reject unsafe text, narrow required and optional values, and report controlled domain errors. Full specification validation remains in `validator.py`. |
| `tests/test_cli.py`           | Click `CliRunner` integration tests over real package commands and temporary files.                           | Verify directory/file handling, JSON/XML success output, exit codes, and controlled diagnostics from all three commands. Invalid content produces no success payload.                                               |
| `tests/test_prompt.py`        | Public prompt API tests, with ElementTree as an independent XML consumer.                                     | Verify names, descriptions, locations, escaping, forbidden Unicode, and preservation of parsed CR/LF text. Missing XML fields fail clearly.                                                                         |
| `tests/test_render_graphs.py` | Black-box subprocess tests of the separate Node renderer and real Graphviz, followed by SVG parsing.          | Verify visible labels, independent combined graphs, portable filenames, fence handling, failure diagnostics, and output containment. UTF-8 diagnostics survive Windows locale differences.                          |

Primary data flow:

```text
SKILL.md bytes -> UTF-8 text -> StrictYAML metadata
  -> validated field types -> SkillProperties -> JSON CLI / XML prompt
  -> metadata + Markdown body -> full validator -> validation CLI

DOT fences -> Node renderer -> Graphviz -> SVG documents
  -> Python subprocess/SVG assertions
```

The parser depends on `errors.py`, `models.py`, and StrictYAML. Its direct
consumers are `read_properties`, the validator, and parser tests; model
consumers include the prompt and CLI. Renderer tests exercise an independent
JavaScript tool. None of these changes affect portal routes, authentication,
generated API code, or React components.

## Findings and impact assessment

### F1: Deep YAML leaked a parser exception

- Priority: P1; classification: verified defect.
- Location: `skills_ref/parser.py:99`, external parser call.
- Evidence: a 300-level nested mapping caused all three commands to return a
  captured `RecursionError` with empty output. The three new regression cases
  failed before repair for this exact exception.
- Upstream: StrictYAML's recursive composition/construction exceeds the
  interpreter stack on deeply nested external input.
- Downstream: `ParseError` handlers in the validator and CLI cannot handle that
  exception; an actual invocation can expose a traceback.
- Repair: catch `RecursionError` only at the third-party parser call and
  translate it to `ParseError`. No recursion-limit change or broad catch.
- Compatibility: invalid deep input now produces controlled stderr, exit 1, and
  no stdout payload. Valid-input structures are preserved.
- Regression: `test_deep_yaml_is_reported_as_a_controlled_cli_error`,
  parameterized across validate, read-properties, and to-prompt.
- Verification: all three cases observed RED, then GREEN; included in both final
  145-test runs.

### F2: Unicode overflow handling differed on Python 3.11

- Priority: P1; classification: verified defect.
- Location: `skills_ref/parser.py:102`, scanner exception translation.
- Evidence: Python 3.11.9 raised `OverflowError` for the YAML escape
  `\UFFFFFFFF`; five existing CLI/parser/validator regressions failed. Python
  3.14 instead raised the already-handled `ValueError`.
- Upstream: the scanner converts an escaped integer using `chr()`.
- Downstream: parser, validator, JSON CLI, and XML CLI lost their
  controlled-error contract on the supported minimum Python version.
- Repair: handle `(ValueError, OverflowError)` at that same narrow call.
- Compatibility: valid Unicode stays unchanged; malformed escapes now report the
  existing domain error consistently across tested versions.
- Regression: existing out-of-range Unicode cases protect the defect.
- Verification: ten focused out-of-range cases passed after repair on 3.11; full
  tests passed on both interpreters.

### F3: XML and SVG text were treated as always present

- Priority: P1; classification: confirmed analyzer findings.
- Locations: `tests/test_prompt.py:12` and `tests/test_render_graphs.py:41` in
  the final files.
- Evidence: Pyright 1.1.414 reported four optional-member errors on
  `findtext(...).strip()` and one incompatible `list[str | None]` return where
  the SVG helper promised `list[str]`.
- Upstream: ElementTree represents absent element text as `None`.
- Downstream: malformed output could cause an incidental attribute error or
  introduce non-string labels into assertions.
- Repair: assert text is present before using it. The SVG helper extracts text
  from the SVG namespace, including embedded documents. No coercion, cast,
  ignore, or empty-string fallback hides missing text.
- Compatibility: valid Graphviz and prompt fixtures retain their semantic
  assertions. Malformed artifacts fail more clearly.
- Verification: final Pyright has zero errors, warnings, or information
  diagnostics; both full test suites pass.

### F4: Renderer test output depended on the Windows locale

- Priority: P1; classification: verified portability defect in tests.
- Location: `tests/test_render_graphs.py:16`, `_run`.
- Evidence: with a simulated cp1252 locale, Node's UTF-8 output changed `cafe-é`
  to `cafe-Ã©`. The exact emitted-path regression failed before repair and
  passed after it.
- Upstream: Node writes UTF-8; `subprocess.run(text=True)` otherwise selects an
  interpreter/environment-dependent decoder.
- Downstream: real renderer diagnostics and paths could be corrupted, causing
  misleading assertions or decoding failures on some machines.
- Repair: specify `encoding="utf-8"` and retain the real subprocess, timeout,
  and capability-specific Node/Graphviz fixture.
- Compatibility: affects test decoding only; renderer CLI, graph format, and
  output naming are unchanged.
- Regression: `test_renderer_output_is_utf8_under_legacy_locale`.
- Verification: RED observed with mojibake; GREEN on both final versions.

### F5: Parsed metadata leaked unrestricted `Any`

- Priority: P2; classification: type-architecture recommendation.
- Location: `skills_ref/parser.py:69` and field construction.
- Upstream: YAML is heterogeneous external data. A dictionary alone does not
  prove required strings, optional strings, or metadata values.
- Downstream: `Any` prevented the type checker from enforcing the
  `SkillProperties` constructor and consumer contracts.
- Repair: return `dict[str, object]`, validate root keys, and narrow optional
  scalars and client metadata before model construction. The two mapping casts
  describe untrusted contents as `object`; actual string contracts are
  established by runtime checks.
- Compatibility: runtime dict/model shapes, field omission, ordering, and
  validation precedence are preserved. Static callers must narrow values rather
  than rely on `Any`; current consumers type-check.
- Verification: malformed optional-field regressions pass; 100 old/new API and
  CLI comparisons matched.

## Frozen 100-point rubric

Weights were established before remediation. A material unresolved behavioral
finding overrides any numeric readiness interpretation.

| Criterion                        | Maximum | Before |  After | Evidence or remaining deduction                                                                   |
| -------------------------------- | ------: | -----: | -----: | ------------------------------------------------------------------------------------------------- |
| Runtime and semantic correctness |      25 |     20 |     25 | YAML depth and supported-version overflow leaks repaired.                                         |
| Type architecture                |      20 |     17 |     19 | Checked metadata boundary and narrowed XML/SVG; legacy tests still contain unannotated functions. |
| Boundary validation and errors   |      15 |     13 |     15 | Controlled parser/CLI errors and explicit UTF-8 decoding.                                         |
| Static-analysis quality          |      15 |     12 |     14 | Ruff and Pyright clean; full Sonar unavailable.                                                   |
| Maintainability and complexity   |      10 |     10 |     10 | Small helpers express actual field/text responsibilities.                                         |
| Determinism and performance      |       5 |      4 |      4 | Existing output/collision tests pass; opener allocation remains a recommendation.                 |
| Compatibility                    |       5 |      5 |      5 | 100 representative differential comparisons matched.                                              |
| Verification evidence            |       5 |      4 |      4 | Two interpreter suites and pressure regressions pass; independent final review unavailable.       |
| **Combined assessment**          | **100** | **85** | **96** | Above the requested threshold, with explicit AMBER limits.                                        |

Per-file assessments use the same criteria applied to each file's role; the
combined score evaluates cross-file risks and is not their average.

| File                          | Before | After |
| ----------------------------- | -----: | ----: |
| `skills_ref/parser.py`        |     84 |    96 |
| `tests/test_cli.py`           |     94 |    97 |
| `tests/test_prompt.py`        |     91 |    97 |
| `tests/test_render_graphs.py` |     90 |    96 |

## Fresh verification

All final commands ran against the four original workspace files.

- Python 3.14.7: **145 passed**, 18.80 seconds.
- Python 3.11.9: **145 passed**, 19.06 seconds, using an isolated uv environment
  with the same dependency versions.
- Dependencies: pytest 9.0.2, Click 8.3.1, StrictYAML 1.7.3.
- Node 24.20.0 and Graphviz 16.1.0: real renderer integration tests included in
  both suites, with no skipped cases.
- `python -m compileall -q skills_ref tests`: passed.
- Ruff 0.16.7: check passed; four files already formatted.
- Pyright 1.1.414: zero errors, warnings, or information diagnostics.
- Repository Ruff config: `ruff.toml`, E/F/I/UP/B/SIM families; target-version
  remains py310, while package support starts at 3.11.
- Compatibility differential: **100 matches**, comparing baseline and final
  parser structures, models, validation, prompt XML, CLI stdout, stderr,
  exception class, exit codes, help, and file/path handling. Thirteen shared
  fixtures included valid/optional metadata, Unicode, CRLF, escaped line
  endings, duplicate keys, and malformed fields.
- `git diff --check` for the target files: passed.
- Deterministic Sonar secrets scan: no issues in the four final files.
- Full `sonar analyze --file ... --format json`: unavailable; server returned
  `403 Forbidden` for Vortex. All four files were skipped, so this does not
  establish Sonar code-quality or hotspot cleanliness.
- Independent baseline parser/security and renderer reviews found the reproduced
  boundary defects. Independent final review attempts failed at an account usage
  limit; final diff review was performed locally.

## Final artifact hashes

SHA-256 values, in the file order listed under scope:

```text
parser.py
6A76936BA6B63DEA435E613FDCCA3B40447E8055C6465901E64AAA6EE4C2F6C4
test_cli.py
054FFFD9A3391420D7A32140C308A13C65E86A4D8DAF0271889C9CCDE144CBE4
test_prompt.py
2DC71A1F2DF7830030B005EACCF1D5C0FEA273FC0CB5AF2B091DE864A8502288
test_render_graphs.py
AE7FBC69596254D039E4210483E4797D0DA0E5070BD8D522D9DC201017D4DE30
```

## Residual recommendations and cleanup

- `ensure_safe_unicode` assumes acyclic parser-produced containers. Current
  callers meet this assumption and StrictYAML forbids aliases. If promoted to an
  arbitrary-object public validator, add cycle handling.
- The opener check uses `splitlines()` across the full document. Bounded
  first-line extraction could reduce memory for very large Markdown; no
  supported document-size limit or current material failure was found.
- Linux/macOS execution and other dependency versions were not exercised.

All task-created pytest fixture directories, including their synthetic
`SKILL.md`, SVG, and DOT outputs, were removed from the repository and the named
external temporary directories. Remaining final runs used temporary directories
outside the repository, followed by cleanup. Real skill documents and
pre-existing files were preserved.

TokenSave reported approximately 18,000 tokens saved during graph/source
retrieval. Graph relationships were checked against current source; final tests
and analyzers establish evidence for the edited artifacts.

## Follow-up: Pylance unnecessary cast

The supplied Pylance `reportUnnecessaryCast` error at `parser.py:100` was
reproduced on the current working copy using Pyright 1.1.414 with that
diagnostic explicitly set to `error`. The earlier default Pyright run did not
establish cleanliness for this additional rule.

The repository stub `typings/strictyaml/__init__.pyi` declares `YAML.data` as
`object`. Replaced the redundant `cast(object, ...data)` with
`parsed_data: object = strictyaml.load(frontmatter_str).data`. This is a
typing-only change; parsing, validation, and error handling stay intact.

Fresh follow-up evidence:

- Pyright analyzed all four requested files with repository stubs, package
  import paths, Python target 3.11, basic mode, and
  `reportUnnecessaryCast: error`: zero diagnostics.
- The current full script suite: **160 passed** on Python 3.14.7, in 16.33
  seconds. This count reflects the current working-copy suite.
- Parser Ruff check, formatter check, compilation, and diff check passed.
- Test fixtures and the temporary checker configuration were created outside the
  repository and removed after verification.

The current parser SHA-256 supersedes its earlier artifact hash above:

```text
72026711667DCD831C6AF692446349AC8AF1E255A98B7F768F8409AD715D6DF4
```
