# API snapshot — topic→reference retrieval cases

These are **test definitions** for the `vitest-api-snapshot` skill's internal
routing table, not executed evidence. They assume activation and Vitest
ownership were already decided by the `vitest` governance skill; here the only
question is **which bundled reference a topic resolves to**. Record each
executed case separately with revision, environment/model, the reference(s)
actually retrieved, and `PASS | AMBER | FAIL | NHR`. A definition is not a pass.

Scope note: these cases verify selection of the **smallest sufficient**
reference from this skill's 16 files. Project policy (lanes, scripts, coverage
thresholds, Storybook contract) is **out of scope here** — those belong to the
`vitest` skill; a project-policy request is a near-miss that must defer back to
`vitest`, not resolve to a file in this skill.

## Topic routing cases (positive)

| ID | Request (Vitest ownership already established) | Expected reference(s) | Acceptance |
| --- | --- | --- | --- |
| S01 config | "Configure Vitest in `vitest.config`." | `references/core-config.md` | Config reference selected; no unrelated topic loaded |
| S02 cli | "Which Vitest CLI flag runs a single file?" | `references/core-cli.md` | CLI reference selected |
| S03 test-api | "Show `test.each` / `test.for` usage." | `references/core-test-api.md` | Test-API reference selected |
| S04 describe | "What `describe` modifiers exist?" | `references/core-describe.md` | Describe reference selected |
| S05 expect | "Which matcher checks deep equality?" | `references/core-expect.md` | Expect reference selected |
| S06 hooks | "A `beforeEach`/`afterEach` leaks state between tests." | `references/core-hooks.md` | Hooks reference selected |
| S07 mocking | "Mock a module in Vitest and reset it between tests." | `references/features-mocking.md`; add `references/advanced-vi.md` only if broader `vi` utilities are actually needed | Minimal retrieval; advanced-vi not loaded unless required |
| S08 broad-vi | "Enumerate the `vi` fake-timers and spy utilities." | `references/advanced-vi.md` | Broad `vi` reference selected |
| S09 snapshots | "How do inline/file snapshots work?" | `references/features-snapshots.md` | Snapshot reference selected |
| S10 coverage | "How do I configure Vitest coverage in a Vite project?" | `references/features-coverage.md` (+ `references/core-config.md` if the question is config-shaped) | Coverage reference selected; `coverage.all` not suggested |
| S11 context/fixtures | "How do scoped fixtures override a suite default?" | `references/features-context.md` | Context/fixture reference selected |
| S12 concurrency | "How do I shard Vitest tests across CI jobs?" | `references/features-concurrency.md` (primary: concept + CI matrix + `--merge-reports`); `references/core-cli.md` acceptable as a co-reference for the `--shard` flag alone | Concurrency reference discovered from intent, filename unspoken; selecting `core-cli` for the flag syntax is not a FAIL |
| S13 filtering | "Run only tests tagged `db`." | `references/features-filtering.md` | Filtering reference selected; `--tags-filter` (not bare `--tags`) |
| S14 environments | "Run browser-like Vitest tests in a jsdom/browser environment." | `references/advanced-environments.md` | Environments reference selected |
| S15 type-testing | "Which reference covers type-level Vitest assertions?" | `references/advanced-type-testing.md` | Type-testing reference selected |
| S16 projects | "Why does a referenced leaf project ignore the root alias?" | `references/advanced-projects.md` | Projects reference selected |
| S17 cross-topic | "Run browser-environment Vitest tests with coverage across two projects." | `references/advanced-environments.md` + `references/features-coverage.md` + `references/advanced-projects.md` | All three integrated; retrieval not broader than the request |

## Near-miss cases (must NOT resolve to a file in this skill)

| ID | Request | Expected behavior |
| --- | --- | --- |
| S18 project-policy | "What are nmi-portal's unit coverage thresholds?" | Defer to the `vitest` skill (`project-nmi-portal.md`); do not answer from this snapshot |
| S19 migration-authority | "Is `test.sequential` valid in 5.0.5?" | Defer to the `vitest` skill's `vitest-5-compatibility.md`; this snapshot's examples are subordinate to that guard |
| S20 non-vitest | "Filter Playwright tests by tag." | Not a Vitest topic; no reference in this skill applies |
| S21 unsupported flag | "Does this undocumented Vitest flag exist?" | Consult the relevant CLI/config reference; if unsupported there, report the evidence gap rather than inventing syntax |

## Evidence capture

For each case record: the reference file(s) actually retrieved, whether
retrieval was minimal (no broader load than needed), answer correctness against
the retrieved API, and — for near-misses — that no in-skill file was wrongly
selected. Version-sensitive answers must defer to the `vitest` skill's
`vitest-5-compatibility.md` and installed types; unverified runtime behavior is
`NHR`, not `PASS`.
