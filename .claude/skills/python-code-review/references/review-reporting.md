# Python review reporting

Load this reference when the user wants a formal review report, pressure-campaign assessment, score, or material regression planning.

## Optional review rubric

If the user asks for a score or iterative optimization, freeze the rubric **before** remediation so the target cannot move after results are seen. A lessons-derived default is:

| Criterion | Weight |
| --- | ---: |
| Runtime/semantic correctness | 25 |
| Type architecture | 20 |
| Boundary validation/error handling | 15 |
| Ruff/Sonar/static-analysis quality | 15 |
| Maintainability/complexity | 10 |
| Determinism/performance | 5 |
| Compatibility/API/CLI preservation | 5 |
| Verification evidence | 5 |

Do not let style/analyzer points compensate for a material P0/P1 behavioral defect. Score last, after pressure and fresh verification; if material RED remains, state that the numeric score is not a readiness signal.

## Minimum regression and pressure matrix

Adapt only relevant cases.

### Inputs and hostile boundaries

- empty input;
- expected and legacy layouts;
- malformed names;
- missing/unreadable files;
- invalid JSON and wrong root type;
- missing/wrong/extra fields where contract matters;
- `None`, zero, empty string, and empty collection distinguished;
- `NaN`/infinity and out-of-range numbers;
- control characters/newlines/quotes/colon/`---`/very long values where serialized;
- path traversal, absolute-like paths, alternate separators, symlink/containment cases;
- shell/log/HTML/config/YAML/JSON sink-specific escaping where relevant.

### Metadata, ordering, and identity

- independent field fallback (one metadata field from source A, another from source B);
- `1`, `2`, `10`;
- unordered discovery;
- concurrency completion order;
- no/one/multiple configurations;
- ambiguous comparison pairs;
- incomplete combinations;
- equal/unequal run counts;
- duplicate/similar generated names and deterministic collision resolution;
- `a-b` versus `a/b` or equivalent normalization collisions.

### Rendering/report output

- no/positive/negative delta;
- missing optional data;
- variable run count;
- strict field names, units, ordering, and absent/null behavior where contractual.

### CLI/filesystem

- `--help`;
- missing/wrong/empty path;
- file-versus-directory mismatch;
- unreadable input and unwritable output;
- invalid/negative numeric arguments;
- port-like values `0`, negative, and above `65535` where relevant;
- successful end-to-end run and expected exit code;
- requested port `0` reports/uses the actual bound port if server semantics require it.

### HTTP/server

When applicable:

- loopback versus external bind;
- supported/unsupported HTTP methods;
- correct `Content-Type`;
- response JSON structure/member types;
- request-size boundary;
- malformed JSON -> controlled 4xx;
- disconnected and slow clients;
- thread/concurrency shutdown;
- CSRF/origin/token assumptions under the stated threat model.

### Async/subprocess

When applicable:

- EOF;
- malformed child output;
- child error exit;
- timeout;
- early success/failure trigger;
- process exits before reader;
- reader thread/process cleanup;
- optional `stdout`/`stderr` narrowed before cross-thread callbacks;
- process tree termination and bounded joins.

### Compatibility differential

For behavior-preserving changes, compare original and candidate on the same fixture:

- return structures;
- JSON/YAML/TOML/HTML/text;
- field presence and ordering;
- CLI stdout/stderr/exit code;
- filesystem/network/other side effects.

## Findings format

For each material finding report:

- **ID**
- **Priority:** P0 / P1 / P2
- **Classification:** Verified defect / Statically confirmed defect / Conditional analyzer finding / Recommendation
- **Artifact/location**
- **Problem**
- **Impact**
- **Root cause**
- **Recommended change**
- **Compatibility impact**
- **Regression test**
- **Verification method**

Group diagnostics sharing one root cause instead of counting downstream messages as separate defects.

## Provenance and verification summary

A formal completion summary should identify:

- exact source/final artifact or revision verified;
- whether the final file is original or a derived copy;
- supported/local/CI Python versions when material;
- compile result;
- tests and count when available;
- Ruff/formatter/Pyright/mypy/Sonar results and relevant versions/configuration/profile;
- representative CLI/end-to-end/runtime results;
- compatibility differential result;
- pressure-campaign result;
- unavailable required checks and residual risks.

Example:

```text
Verified artifact: derived-copy/review_target.py (original preserved read-only)
Python floor/local: 3.10 / 3.12
compileall: PASS
pytest: PASS — 18/18
Ruff: PASS — 0 diagnostics (project config)
Pyright: NOT AVAILABLE
Sonar: supplied pre-fix findings only; no fresh final run
CLI smoke: PASS
Compatibility differential: PASS for stated fixtures
Pressure campaign: AMBER — required Sonar/Pyright final evidence unavailable
```

Do not collapse “supplied pre-fix findings” into “final analyzer clean.”

## Pressure status

Use the code-review pressure status consistently:

- **RED** — any unresolved material behavioral/security/compatibility defect remains.
- **AMBER** — zero known material RED, but required verification is unavailable/incomplete.
- **GREEN** — required behavioral, analyzer, runtime, compatibility, and pressure evidence passes for the stated scope.

Counts do not dilute a material RED. After each fix, rerun original RED cases first.

## Final assessment

A numeric score, if requested, follows evidence and cannot override the pressure status.

- **Red** — not ready due to demonstrated material blockers.
- **Amber** — no known material blocker remains, but required evidence is incomplete/unavailable.
- **Green** — production-ready only for the stated scope when required checks and representative pressure behavior are freshly evidenced.

Do not award Green from source inspection, tool proxies, a clean linter/type checker alone, or stale/supplied diagnostics alone.
