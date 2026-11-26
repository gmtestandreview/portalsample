# Synthetic incomplete-package fixtures

All files are maintenance-only synthetic fixtures. The caller selects exact
layouts per FC-026–FC-033; neighboring directories are not dependencies. Each
selected directory is its own bounded implementation; for `external/` only the
chosen A.ts or B.ts is its side. `./types` in `type-missing/`, `runtime-types/`
and `side-effect/` and `./submission` in `implementation-missing/` and
`historical-partial/` are intentionally absent; `@fixture/rfq-contract` is a
nonexistent external package for the test. Do not supply implicit stubs or
substitute other layouts. `restored/` represents the authoritative type supply
in FC-032; the index bytes are identical to `type-missing/index.ts`.

Requirements for submit layouts: the entry point exports
`submit(request, send)`; invoke `send` with the record ID; propagate a rejected
send to the caller. The authoritative definition in `restored/types.ts` is
available only in cases selecting that layout. In FC-027, its definition is
unavailable; do not inspect that file or infer its contents from candidate
types. For external layouts the public `label(request)` returns the record ID;
the external contract is outside implementation ownership, not a missing local
member. Runtime-types and side-effect layouts are negative scope fixtures, not
comparable complete implementations. Historical-partial has no verified
functional coverage. No real API, external package, or project integration is
provided.

Expected CLI: strict no-emit compilation with `--noUncheckedSideEffectImports`
passes for restored and candidate layouts separately; missing-import layouts
return TS2307, demonstrating that syntax inspection cannot establish type-check
success. These expected diagnostics are fixture oracles only. For FC-032 compare
hashes and re-evaluate the supplied verified type, not a reconstructed copy of
B's type.
