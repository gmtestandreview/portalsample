# Daily Log: 2026-09-02

## 1. Morning Intent

Operator ran `/orchestrate morning` immediately after `/orchestrate init`. No task list was dictated,
so intent is derived from the governed backlog per `ROUTING.md` §0.1 (there is no `TASKS.md`; the
backlog is `docs/change-record/OPEN-ITEMS-BACKLOG.md`).

**State derived this invocation (statelessness contract):**

| Source | Reading |
| --- | --- |
| `.agent-sync/DAILY.md` | absent — created by this run |
| `.agent-sync/results/*.json` | none (0 receipts; directory not yet created) |
| Backlog | 2 items OPEN: `COVERAGE-GATE-001` (P1), `TYPE-APPROVAL-E2E-001` (P2). Items 16–22 are STRUCTURAL, awaiting human sign-off. All three `BATCH-E-PREREQ-*` are COMPLETE. |
| `git log -10` | `29f2579` docs fix (A Team refs) → `c6391fb` init artefacts → `95dc32e` a-team removal → `d45bdaf` … Branch `fix/dependency-vulnerability-remediation`, tree clean apart from this run's edits. |
| Roster | 18 agents / 19 skills active (`TEAM.md`) |
| MCP gate | **SATISFIED** — Storybook, SonarQube, React Aria, Playwright all connected |
| File Claims | 4 files held by `external-session (coverage)` — a second AI session driving `COVERAGE-GATE-001` |

---

## 2. Master Execution Plan

- [x] **TASK-001**: Record the unrecorded coverage-scope change as a backlog item <!-- COMPLETE 01:4x — COVERAGE-SCOPE-001 opened; CRD-042 -->
- [x] **TASK-002**: Annotate the STRUCTURAL business rules with CI grep markers <!-- COMPLETE 01:4x — 3 of 4 applied (16/17/21); item 18 BLOCKED; type-check + lint clean; CRD-042 -->
- [x] **AMB-001**: `TYPE-APPROVAL-E2E-001` <!-- RESOLVED — operator chose Option B (accept residual gap); CRD-042 -->
- [x] **DEC-001**: `infra-reviewer` kept, CI/CD-scoped <!-- APPROVED by operator -->
- [ ] **TASK-003**: `COVERAGE-GATE-001` — close the unit coverage gate <!-- BLOCKED (depends_on: external-coverage) — NOT dispatchable -->
- [x] **TASK-004**: P2 item 18 — RULE-042 annotation <!-- COMPLETE — operator supplied analysis/BUSINESS_RULES.md; RULE-042 annotated; RULE-035 register defect found and corrected; CRD-043 -->
- [x] **TASK-005**: `.gitignore` — ignore A Team runtime output <!-- COMPLETE — .agent-sync/logs/ + scripts/__pycache__/; verified via git check-ignore -->
- [x] **TASK-006**: Verification pass over all 53 business rules <!-- COMPLETE — DEC-002 approved; 18/21 citations miscited, 6 rules undefined, RULE-022 dead code, RULE-042 double-implemented; RULES-REGISTER-001 opened; CRD-044 -->
- [x] **TASK-007**: CI gate for business-rule citations <!-- COMPLETE - scripts/verify-rule-citations.mjs, npm run lint:rules, wired into pr.yml static-quality-node24; negative-tested; CRD-045 -->
- [x] **TASK-008**: Write RULE-051 (unblock Legal) <!-- COMPLETE - detail section authored; suburb discrepancy found between production and Storybook fixture; CRD-045 -->

### TASK-006 — Business rules register verification (operator-requested, DEC-002)

**Outcome: the register cannot support a signature in its current state.** Report at
`docs/change-record/2026-09-02-business-rules-verification.md`; remediation tracked as
`RULES-REGISTER-001`, which now **blocks BA/Legal sign-off on P2 items 16, 17, 18 and 21**.

| Check | Result |
| --- | --- |
| Citations resolved mechanically | 58 across 47 detail blocks |
| Cited files that do not exist | 0 — every *path* is right |
| Citations examined in depth | 21 |
| **Confirmed miscited** | **18** (5 P0; 3 point past end of file) |
| Rules listed but never defined | **6** — incl. RULE-051, a P1 Legal sign-off item |
| Specifications verified | 3 of 53 |

Verified against `git show HEAD:<file>`, not the working tree, so the same day's annotation
line-shifts could not confound the result.

**Beyond bad line numbers — two substantive defects and one omission:**

- **RULE-022 (P0) is correct but inert.** The ATO checksum is implemented exactly as specified
  (verified by execution on four inputs), but `isValidAbn` has **zero callers**. The rule asserts ABNs
  "are validated"; on the client, nothing validates them. Needs a Backend Team answer — the API is in
  another repository.
- **RULE-035 (P0)** was factually wrong — already corrected under CRD-043.
- **RULE-042 is implemented twice**, in the submit schema (required) and the save/draft schema
  (nullable), each with the same 1-100 bounds. The register documented one. Both now annotated; a
  bounds change applied to one schema alone would silently diverge submit from draft.

**Corrected in the register:** verification banner; citations for RULE-042 (both sites), RULE-050 and
RULE-051 — the only ones whose true location is unambiguous. **The other 16 were deliberately not
patched**: several have multiple candidate locations, and guessing would reintroduce the exact defect
being reported. They are listed with evidence for mechanical re-derivation.

**Execution note.** TASK-001 and TASK-002 were executed **in-session, not by sub-agent dispatch** —
this session's operating instructions require an explicit request before spawning agents, and both
tasks were small (one backlog entry, three comment-only annotations). The dispatch path was offered
and remains available. No File Claims were taken, because no claimed file was touched.

### TASK-001 — Backlog intake for the unrecorded coverage-scope change

**Agent:** `doc-updater` · **Backlog:** new item, cross-linked to `COVERAGE-GATE-001` · **depends_on:** none

Commit `c6391fb` ("feat: add systematic debugging and test-driven development skills") also changed
`vitest.unit.config.ts`, adding `ClientApp/src/**/setupTests.ts` and
`ClientApp/src/**/*.stories copy.tsx` to the coverage `exclude` list. That raises the reported
percentage by shrinking the measured surface rather than by adding a test. `ROUTING.md` §0.2 requires
an explicit reviewed scope decision for exactly this; the commit message does not mention coverage,
so the change is not findable from the log. The §0.1 intake rule requires a backlog item immediately.

Two riders to capture in the item:

- `sonar.exclusions` was **not** updated to match, so SonarCloud and local coverage now measure
  different sets. `INIT.md` states the two are meant to agree.
- A stray `*.stories copy.tsx` is a file that should be **deleted**, not excluded. Excluding it
  normalises an accident into policy.

**Files touched:** `docs/change-record/OPEN-ITEMS-BACKLOG.md`,
`docs/change-record/MASTER-CHANGE-RECORD.md`. Docs only — **no File Claims conflict**, and
deliberately **not** `sonar-project.properties`: correcting the exclusion sets while the external
session is still moving the Vitest list would race. That correction becomes a follow-up once
TASK-003 unblocks.

### TASK-002 — Annotate STRUCTURAL rules with CI grep markers

**Agent:** `typescript-reviewer` · **Backlog:** P2 items 16, 17, 18, 21 · **depends_on:** none

Four P2 items carry a 2026-06-04 architectural recommendation whose *agent-executable* half is a
source annotation, with only the sign-off left to a human. **Verified this morning: there are zero
`RULE-` markers anywhere in `ClientApp/src` (0 hits)** — so none of this has been done, and there is
currently no way for CI or a reviewer to find the code awaiting sign-off.

| Item | Annotation | Confirmed location |
| --- | --- | --- |
| 16 — RULE-035 ASIC business-name charset | `// RULE-035: BA sign-off required` | `validationSchemas/yupExtensions/stringExtensions.ts:76` (`businessName`) |
| 17 — RULE-050 NMI ABN / registered address | `// RULE-050: Legal confirmation pending` | `routes/acceptQuote/summaryAndAccept.tsx`, `storybook/storybookFixtures.ts` |
| 18 — RULE-035/042 P0 rule SME review | CI grep marker on the affected schemas | `validationSchemas/**` |
| 21 — RULE-015 recalibration while `ReportInProgress` | `// RULE-015: BA confirmation pending` | `components/Pill/{QuoteStatusPill,StatusPill}.tsx`, `components/RequestList/instrumentItem.tsx`, `routes/common/enums.ts` |

**Comment-only change — no behaviour, no logic, no reformatting.** The recommendations explicitly say
*do not change the regex during migration*; this task adds markers so the pending sign-offs are
greppable, nothing more.

> **Scope guard:** `ReportInProgress` also appears in `ClientApp/src/api/web-api-client.ts`. That file
> is generated, is on the never-routed list, and is now in `permissions.deny`. **It must not be
> touched** — the annotation goes only in the four handwritten files above.

**Also dispatch:** `security-reviewer` (validation schemas are shared with the Node backend — see
Special Constraint 3.1) and `code-reviewer` after the edit.

### TASK-003 — COVERAGE-GATE-001 (BLOCKED, not dispatched)

**Would route to:** `tdd-guide` · **depends_on:** `external-coverage`

The only open P1. **A second AI session is already driving it** and holds `in-progress` File Claims on
`ClientApp/src/utils/index.ts`, `tests/unit/utils/index.test.ts`,
`tests/unit/coverage/coverageConfig.test.ts` and `vitest.unit.config.ts`. Per the File Lock Protocol
this task is added to PENDING with a `depends_on` rather than dispatched. Dispatching `tdd-guide` at
the same coverage surface would produce exactly the logical collision the protocol exists to prevent.

Release condition: the operator confirms the external session is finished, or its claims are released.
The stale backlog figures (74.43% / 75.51% / 72.56% / 74.92%, measured 2026-06-28 against 114 test
files, versus today's 163 files / 1,734 tests) should be **re-measured** before any work is planned —
the recorded numbers are 2 months and 49 test files out of date.

---

## 3. Veto Buffer

> Decisions and ambiguities requiring the human. The orchestrator never resolves these.

- **AMB-001** (TYPE-APPROVAL-E2E-001) — ✅ **RESOLVED 2026-09-02: operator chose Option B**, explicit
  acceptance of the residual gap. Recorded in `OPEN-ITEMS-BACKLOG.md` (item ACCEPTED + full risk
  statement) and `MASTER-CHANGE-RECORD.md` CRD-042. Gate summary row moved to **CLEARED**.
  **Caveat carried forward:** the signature is recorded against the operator (`gregm`) as sole
  developer. If the migration-lead role is formally held by another person, their counter-signature
  is required before cutover. A compensating control is recommended but not gated: one manual
  authenticated pass over wizard submission and document upload before cutover.
  *Original ambiguity, retained for the record:*
  - **Ambiguity:** The backlog item itself offers two terminal states with very different cost,
    scope and risk: *"implement app-BDD fixtures for dashboard, wizard submission/uploads, success,
    and management tabs, **or** obtain explicit migration-lead acceptance of the residual gap."*
    One is a substantial engineering programme requiring deterministic authenticated fixtures
    against Azure AD B2C + myID/RAM; the other is a signature.
  - **Options:**
    - **A — Build the fixtures.** Highest assurance; the six Type Approval paths become real browser
      workflows. Needs a deterministic authenticated session, which is the hard part: B2C + myID +
      RAM provisioning is not trivially fixture-able, and the Backend Team is a named owner.
    - **B — Accept the residual gap.** A migration-lead sign-off recorded against the item. Cheap and
      immediate, but the six paths stay verified only as isolated Storybook states through cutover.
    - **C — Split.** Build fixtures for the paths that do not need a live B2C session (dashboard,
      management tabs) and formally accept the gap for wizard submission/uploads. Not currently an
      option in the backlog text — adopting it would itself be a scope decision.
  - **Waiting for:** your choice before any dispatch. This gates Type Approval route migration and
    cutover, so it should not sit unanswered.

- **DEC-001** (init) — **already actioned, recorded for your review**
  - **Context:** `INIT.md` listed `infra-reviewer` as pruned, citing no Terraform/Docker/K8s; the
    plugin rule keeps it for **CI/CD**, which this repo owns (3 workflows, 8 required statuses, a
    blocking SonarCloud gate) and which is the project's *only* reviewer.
  - **Choice:** kept, scoped to `.github/workflows/**` and gate config; `INIT.md` row corrected.
  - **Isolated on:** not branch-isolated — configuration only, reversible by deleting
    `.claude/agents/infra-reviewer.md`.
  - **Action:** ✅ **APPROVED by operator 2026-09-02 — left as is.** `infra-reviewer` stays active,
    scoped to `.github/workflows/**` and gate config. No further action.

- **BLK-001** (P2 item 18) — ✅ **RESOLVED 2026-09-02.** Operator supplied `analysis/BUSINESS_RULES.md`.
  RULE-042 = *Number of items range (1–100)*, annotated at `requestForQuote/validation.ts:87`.
  **The register turned out to contain a defect that this pass caught** — see DEC-002 below.
  *Original blocker, retained for the record:*

- **DEC-002** (RULE-035 register defect) — **actioned; flagged for your awareness, and it has a tail**
  - **Context:** `analysis/BUSINESS_RULES.md` stated the ASIC charset **excludes** `&` and that
    `"Smith & Sons Pty Ltd"` is INVALID. Executing the live regex from `stringExtensions.ts:735`
    proves both claims false — that name is **VALID**, and `&` sits plainly in the `!@#$%^&*` run of
    the charset the register itself prints one line above. Likely an HTML-escaping artefact
    (`&amp;` appears in the original line).
  - **Choice:** corrected the register in place (worked example, SME question, summary row, P0
    blocker note, confidence Medium → High) rather than leaving a known-false P0 premise in a
    governed artefact. Source untouched — no code change is warranted, because the code is right.
  - **Why it mattered:** RULE-035 is P0 and a declared migration blocker. The BA was being asked to
    rule on permitting `&` when it is already permitted. "Yes, allow `&`" would have triggered a
    change to a correct P0 validator — risk introduced to fix a non-existent defect.
  - **Tail — recommend a decision:** the register documents 50+ rules and at least one entry was
    demonstrably wrong about the code it cites. The other P0/P1 entries carrying SME questions have
    **not** been re-verified against source. A verification pass over the P0 rules before BA sign-off
    would be proportionate; a signature obtained against a wrong premise is worse than no signature.
  - **Action:** [Approve — schedule a P0 register verification pass] / [Accept as-is — sign off on the
    register unverified]
  - **Context:** Item 18 asks for a CI grep marker on "the affected schemas" for **RULE-035/042**. The
    RULE-035 half is done. RULE-042 returns **zero** references across source, tests and docs — the rule
    register that defines it is not in this repository.
  - **Needed:** either the rule register (likely in the target `React19DesignSystem` workspace or an
    external BA document), or the item restated against named schema files.
  - **Not a decision to make blind** — guessing which schemas RULE-042 covers would put a misleading
    sign-off marker on the wrong code, which is worse than no marker.

---

## 4. Evening Telemetry

*(compiled by `/orchestrate report`)*

- Tasks complete: —
- Commits: —
- Tests: —
- Veto items requiring review: 2 (AMB-001 open, DEC-001 informational)
- Proposed first task tomorrow: —
