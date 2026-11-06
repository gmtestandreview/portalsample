# Behavioral eval run — 2026-11-06

Executed-evidence record (not a case definition). Case definitions live in
[activation-cases.md](activation-cases.md),
[project-governance-cases.md](project-governance-cases.md), and
[../../vitest-api-snapshot/evals/retrieval-cases.md](../../vitest-api-snapshot/evals/retrieval-cases.md).

## Scope and environment

- **Candidate:** `skills/vitest` (governance) + `skills/vitest-api-snapshot`
  (supplemental), at the committed consolidation revision plus the two REFINE
  edits applied this run (see "Refinements applied" below).
- **Model/env:** default subagent model; offline source-map snapshot, no
  installed `node_modules`. Behavioral/agent evals only — no runtime execution.
- **Method:** RED (no skill) vs GREEN (skill injected) for governance;
  activation-precision suite; snapshot topic→reference routing; targeted re-run
  of refined cases.

## Activation precision

PASS. 6/6 near-misses → NEITHER (Jest-only, Node runner, bare matcher name,
Playwright tags/fixtures, Vite-build-without-runner); 8/8 positives activate
(mocking, config+coverage, Jest→Vitest migration, hook-leak application,
cross-topic, unsupported-version, resource-discovery sharding, type-testing
scope). **1 AMBER:** activation case 12 — version-validity initially
over-attributed to the snapshot (addressed by REFINE, re-run below = PASS).

## Governance — RED vs GREEN

| Case | RED (no skill) | GREEN (skill) | Verdict |
| --- | --- | --- | --- |
| P01 unit mock/reset | passes, no coverage note | hoisted `vi.mock`, preserves 100% thresholds | PASS |
| P02 Storybook play() | passes | adds "Browser-Mode provider != standalone Playwright" guard | PASS |
| P04 unit coverage | `coverage.all` + 80% (removed API + policy drift) | explicit `include`, keeps 100% + LCOV, flags exclusion drift | PASS (RED FAIL fixed) |
| P05 Storybook JSON | generic exclude | cites runtime-plugin `ClientApp/src/**/*.json` rule; does not copy unit thresholds | PASS (RED partial fixed) |
| P06 sequential | `{ sequential: true }` (removed) | `{ concurrent: false }` | PASS (RED FAIL fixed) |
| P08 browser provider | string `'playwright'` (removed) | `playwright({})` + `instances` from `@vitest/browser-playwright` | PASS (RED FAIL fixed) |
| P09 addon timeout | roughly ok | preserves `VITEST_STORYBOOK==='true'` direct-leaf branch; keeps historical measurements | PASS |
| P12 new project | correct intent but `coverage.all` | no nmi-portal policy export; explicit include/exclude; no removed API | PASS (improved) |
| P15 policy-weakening pressure | refuses | refuses + cites script shape, thresholds, VITEST_STORYBOOK branch | PASS |

GREEN materially improves P04/P05/P06/P08/P12 and regresses nothing — the
comparative-improvement criterion is met. Governance deployment-blocking set:
**9/9 PASS**.

## Snapshot routing (S01-S21)

19 PASS. Originally: S12 FAIL (sharding -> `core-cli` vs expected
`features-concurrency`), S21 AMBER (bare "no file applies" vs check-then-report).
Both addressed by REFINE and re-run below.

## Refinements applied this run

1. **`vitest-api-snapshot/SKILL.md`** — added **Routing notes**: sharding ->
   `features-concurrency` (primary: concept + CI matrix + `--merge-reports`),
   `core-cli` acceptable as `--shard` flag co-reference; undocumented flag ->
   `core-cli` then `core-config` then report the gap; version-validity -> defer
   to the `vitest` skill's `vitest-5-compatibility.md` (a snapshot page is not
   proof of installed-version support).
2. **`vitest-api-snapshot/evals/retrieval-cases.md`** — S12 acceptance widened
   so selecting `core-cli` for `--shard` syntax is not a FAIL (sharding is
   documented in both files; the single-file expectation was too strict).

## Refined-case re-run (skill injected, revised content)

| Case | Retrieved file(s) | Verdict |
| --- | --- | --- |
| S12 shard across CI | `features-concurrency.md` primary; `core-cli.md` co-ref | PASS |
| S21 undocumented flag | `core-cli.md` -> `core-config.md` -> evidence gap | PASS |
| ACT-12 version-validity | `vitest/references/vitest-5-compatibility.md` | PASS |

File existence confirmed for all referenced paths; no invented files or flags.

## Result

- **Activation:** PASS (case-12 AMBER resolved on re-run).
- **Governance (P01,P02,P04,P05,P06,P08,P09,P12,P15):** 9/9 PASS.
- **Snapshot routing:** 21/21 PASS after REFINE (was 19 PASS / 1 FAIL / 1 AMBER).

### NHR (blocks a full runtime `deploy` claim)

Runtime-execution evals are **not** executed here and remain NHR until online
mode: actual `vitest run` (5.0.5), `npm run type-check`, Storybook Test-panel,
and `npm run test:ci`. Governance cases not in the deployment-blocking subset
(P03, P07, P10, P11, P13, P14, P16-P22) and the activation comparative baseline /
R01-R04 were not executed this run -> NHR.

### Recommendation

Behaviorally validated (activation + governance + snapshot routing all PASS).
Final `deploy` for runtime correctness stays gated on the NHR runtime-execution
evals.
