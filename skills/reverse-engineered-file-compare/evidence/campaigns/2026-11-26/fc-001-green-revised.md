## A — Executive decision

**File B is not ready for acceptance. Decision: BLOCKED.** It charges 5 for
standard and 15 for express shipping when the subtotal is 100 or more;
[requirements.md](C:/Users/gregm/AppData/Local/Temp/file-compare-skill-eval-20261126-01/requirements.md:5)
requires zero for both. A targeted run confirmed the mismatch at subtotals 100
and 150.

Confirmed functional parity is **3 of 5 atoms (60%)**, or **9 of 19 weighted
points (47.4%)**. The two missing atoms are the free-shipping outcomes. On the
applicable engineering rubric, File A’s verified quality range is
**72.1–100/100** and File B’s is **37.7–65.6/100**. The ranges reflect checks
that could not be verified; they are not final quality scores.

## B — Scope, evidence, and frozen atomic baseline

| File                                                                                                                     | Role and inspected content                                     | SHA-256                                                            |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| [latest-original.ts](C:/Users/gregm/AppData/Local/Temp/file-compare-skill-eval-20261126-01/latest-original.ts:1)         | A; exported type and function, threshold branch, fee selection | `5574AA1DC930876BAC5BA044549C20874891B5E95CF17D0A4F633A804C066AED` |
| [reverse-engineered.ts](C:/Users/gregm/AppData/Local/Temp/file-compare-skill-eval-20261126-01/reverse-engineered.ts:1)   | B; exported type and function, fee map, unused subtotal        | `580D2A7C80D415FBDFD5911FEDC1AC0A39745AE8E470750CFA4D1590BD0092A7` |
| [historical-original.ts](C:/Users/gregm/AppData/Local/Temp/file-compare-skill-eval-20261126-01/historical-original.ts:1) | C; historical fixed-fee behavior                               | `EC1B15A6D21420CF74CE633BC5AF5B20FD45A8E5F1FABB1C2CEB0E9940B87F70` |
| [requirements.md](C:/Users/gregm/AppData/Local/Temp/file-compare-skill-eval-20261126-01/requirements.md:1)               | Supplied authoritative R1 and R2                               | `7B9D1906E5023C64E29F03F502A5C44997E2CE623A86FD73B7ADBA6564095705` |

The fixture establishes that R2 was added after C. No commit history
independently establishes the files’ ancestry. No package configuration, test
suite, TypeScript compiler, lint command, consumer, or performance target was
supplied. The folder has no TokenSave index. No Sonar scan was run.

| Evidence | Observation                                                                                                                                                   | Level; confidence        | Limit                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------- |
| EVD-01   | R1 specifies fees below 100; R2 specifies zero at or above 100 and identifies its historical timing.                                                          | E1; high                 | Supplied fixture authority                  |
| EVD-02   | A checks `subtotal >= 100` before selecting a fee.                                                                                                            | E1; high                 | Source alone does not verify integration    |
| EVD-03   | B indexes `FEES[delivery]` and never uses `_subtotal`.                                                                                                        | E1; high                 | Compiler compatibility untested             |
| EVD-04   | C selects a fixed fee and ignores `_subtotal`.                                                                                                                | E1; high                 | Git ancestry unavailable                    |
| EVD-05   | Node 24.21.0 loaded all three files and compared both methods at 0, 99.99, 100, and 150; command exited 0. B differed from A at 100 and 150 for both methods. | E3; high for those cases | Targeted run, not a project suite           |
| EVD-06   | File identities above were hashed.                                                                                                                            | E1; high                 | Snapshot identity only                      |
| EVD-07   | `tsc` was unavailable; no project configuration or tests were found in the supplied folder.                                                                   | E1; high                 | Type, lint, and consumer checks remain open |

The following **five-atom baseline is frozen**. Each atom assumes a `Delivery`
value within the exported union and a numeric subtotal. The function has no
external dependency or side effect. No error behavior for out-of-contract inputs
is specified.

| Atom; requirement; location            | Trigger and independently observable acceptance criterion     | Criticality; weight | Boundary or failure condition; evidence                                                        |
| -------------------------------------- | ------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------- |
| A-001; R1; A:3–8                       | `standard`, subtotal below 100 → return 5                     | High; 3             | Includes 0 and 99.99; EVD-01/02/05                                                             |
| A-002; R1; A:3–8                       | `express`, subtotal below 100 → return 15                     | High; 3             | Includes 0 and 99.99; EVD-01/02/05                                                             |
| A-003; R2; A:3–5                       | `standard`, subtotal at least 100 → return 0                  | Critical; 5         | Exact threshold and above; incorrect charge affects fee integrity; EVD-01/02/05                |
| A-004; R2; A:3–5                       | `express`, subtotal at least 100 → return 0                   | Critical; 5         | Exact threshold and above; incorrect charge affects fee integrity; EVD-01/02/05                |
| A-005; baseline public contract; A:1–3 | Export `Delivery` and `shippingFee(Delivery, number): number` | High; 3             | Both declarations are present in B; compiled compatibility remains a separate check; EVD-02/03 |

## C — Functional parity and evolutionary gaps

| Atom  | B mapping and observed result                                                                            | Status; risk          | Confidence; test                           |
| ----- | -------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------ |
| A-001 | `FEES.standard` returns 5 below 100                                                                      | EQUIVALENT            | High; T-01                                 |
| A-002 | `FEES.express` returns 15 below 100                                                                      | EQUIVALENT            | High; T-01                                 |
| A-003 | No threshold branch; B returns 5 at 100 and 150                                                          | MISSING; REGRESSION   | High; T-02/T-03                            |
| A-004 | No threshold branch; B returns 15 at 100 and 150                                                         | MISSING; REGRESSION   | High; T-02/T-03                            |
| A-005 | Same exported type and function signature; parameter name differs without changing the declared contract | IDENTICAL declaration | High for declaration; T-04 for compilation |

**B → A:** B adds an explicit `FEES` map constrained with
`satisfies Record<Delivery, number>` (B-001, ADDITIONAL). This is a useful
structural way to make the fee entries explicit, subject to verification with
the project’s TypeScript version. For an invalid delivery value passed around
the declared type, B could return `undefined` while A falls back to 5; that
behavior is outside the supplied contract and requires consumer evidence before
it becomes a remediation requirement. No divergence has been approved.

| Delta             | C behavior                        | A behavior          | B behavior                        | Classification; cause                                                                                                                                                    |
| ----------------- | --------------------------------- | ------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DEL-01; EVD-01–05 | Fixed fees regardless of subtotal | Free at 100 or more | Fixed fees regardless of subtotal | **Confirmed historical enhancement** in the supplied fixture and current B gap. Why B lacks it is unknown; similarity to C does not establish causation. Incorporate R2. |

Counts reconcile to the five frozen atoms: EQUIVALENT 2, IDENTICAL 1, MISSING 2,
all other statuses 0. **Confirmed parity: 3/5 = 60%; weighted parity:
(3+3+3)/19 = 47.4%.** All five statuses are conclusively classified for the
scoped input domain, so atomic classification completeness is 5/5; that does not
imply integration assurance.

## D — Comparative SWOT and opportunities

| ID   | Atom(s); category                                        | Finding, evidence, severity, confidence                                                                                                              | Action                     |
| ---- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| F-01 | A-003/004; weakness and threat; O2 primary, O1 secondary | B omits R2 and can overcharge both methods at and above 100. EVD-01–05; Critical; high                                                               | Incorporate threshold rule |
| F-02 | B-001; strength; O3                                      | Explicit fee map is a candidate structure worth preserving. Its compiler benefit is unverified without the project toolchain. EVD-03/07; Low; medium | Retain map while adding R2 |
| F-03 | A-005/B-001; threat and evidence gap                     | TypeScript, lint, and consumer compatibility cannot be established from this fixture. EVD-03/07; Medium; high confidence in the gap                  | Investigate and verify     |

There is **no justified O4 net-new change**: the demonstrated problem is fully
addressed by R2 adoption, and no measured performance problem or additional
requirement supports broader redesign.

## E — Impact and comparative scoring

| Impact | Finding   | Consumer or dependency; contract                                  | Classification; consequence                                                        | Verification                                       |
| ------ | --------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| I-01   | F-01      | Any caller using returned shipping fees                           | Potential consumer impact; confirmed wrong function output for R2 inputs; Critical | Differential and integration tests, T-02/T-03/T-05 |
| I-02   | F-02/F-03 | TypeScript compiler and module consumers; `satisfies` and exports | Unresolved compatibility; Medium                                                   | Project type and lint checks, T-04                 |
| I-03   | F-03      | Callers that bypass `Delivery` typing                             | Potential out-of-contract difference; Low pending boundary evidence                | Inspect consumers; conditional T-06                |

The scoring checks below were fixed for both files. **P** means verified pass,
**F** demonstrated fail, **U** unverified. Fractions allocate a subcriterion’s
points to distinct delivery cases.

| Frozen checks; points                                   | A     | B     |
| ------------------------------------------------------- | ----- | ----- |
| FC1 standard and express below 100; 4+4                 | P+P   | P+P   |
| FC2 free standard and express at/above 100; 2.5+2.5     | P+P   | F+F   |
| FC4 exact-threshold capability for each method; 1.5+1.5 | P+P   | F+F   |
| BC1 below-threshold outcomes for each method; 2.5+2.5   | P+P   | P+P   |
| BC2 free-shipping conditional outcomes; 2.5+2.5         | P+P   | F+F   |
| BC3 exact-threshold outcomes; 2+2                       | P+P   | F+F   |
| TS1 project type check; 3                               | U     | U     |
| TS2 no unsafe assertions or escapes in these files; 2   | P     | P     |
| TS4 compiled public type compatibility; 2               | U     | U     |
| IN1 consumer contract; 3                                | U     | U     |
| IN3 module/compiler compatibility; 2                    | U     | U     |
| IN4 integrated backward compatibility; 2                | U     | U     |
| SE3 fee data integrity against R2; 2                    | P     | F     |
| CQ1 cohesion, CQ2 duplication, CQ3 complexity; 2 each   | P/P/P | P/P/P |
| CQ4 project coding/lint standards; 2                    | U     | U     |
| TE1 independently testable behavior; 2                  | P     | P     |
| TE2 positive and threshold cases in targeted run; 2     | P     | F     |
| TE3 project regression verification; 2                  | U     | U     |
| PE1 measured material computation overhead; 1           | U     | U     |

Excluded equally for both files, **39 points**: FC3 4 (no distinct alternative
or failure workflow), BC4 4 (no asynchronous behavior), BC5 2 (would score the
same R2 divergence twice), TS3 2 and TS5 1 (no nullable input or runtime
validation contract), React 10, IN2 3 (no downstream dependency), SE1/SE2/SE4 6
(no applicable authentication, security boundary, or error contract),
accessibility 5, PE2/PE3 2 (no resources or approved performance target). The
applicable maximum is **61**.

| File |   P |   F |   U | Verified floor–potential ceiling | Scoring evidence completeness |
| ---- | --: | --: | --: | -------------------------------: | ----------------------------: |
| A    |  44 |   0 |  17 |                        72.1–100% |                 44/61 = 72.1% |
| B    |  23 |  21 |  17 |                       37.7–65.6% |                 44/61 = 72.1% |

Each row satisfies **M = P + F + U = 61**. File B cannot reach the required
verified quality threshold of 96 even if every unresolved check passes. A
projected score after remediation would be speculative until the revised code
and checks exist.

## F — Devil’s Advocate review

| Challenge | Counterexample or concern; evidence                             | Resolution and effect                                                                                                                                                                             |
| --------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DA-01     | Could A’s free shipping be a defect? EVD-01/02                  | **Rejected.** R2 explicitly requires it; F-01 remains.                                                                                                                                            |
| DA-02     | Is B’s `satisfies` map a proven compiler improvement? EVD-03/07 | **Partially upheld.** Preserve its clear mapping, but leave compiler compatibility unverified; no type-safety score awarded.                                                                      |
| DA-03     | Could scoring count the same omission repeatedly? EVD-01/05     | **Upheld in part.** BC5 was excluded as duplicative. FC, BC, and SE checks remain because they assess capability, observable behavior, and fee integrity separately. Totals above are reconciled. |
| DA-04     | Should an invalid delivery be a required atom? EVD-02/03        | **Unresolved pending consumer evidence.** It is outside the declared union and supplied requirements; it does not alter the five-atom denominator.                                                |

No evidence contradiction was found for the tested cases. Toolchain and consumer
questions remain evidence gaps, not demonstrated defects.

## G — Remediation and verification plan

| Task                                    | Trace; priority/action                                              | Implementation, preservation, alternative, effort, risk, acceptance                                                                                                                                                                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RM-01 — Add R2                          | A-003/004, F-01, I-01, EVD-01–05; **P0, INCORPORATE**, Critical, O2 | Check `subtotal >= 100` first and return 0; otherwise keep `FEES[delivery]`. Preserve R1, the exported API, and B’s fee map. Replacing the map with A’s ternary is unnecessary. Small change; effort is low but integration uncertainty remains. Risk: threshold or method regression. Accept when T-01–T-05 pass and parity is 5/5. |
| RM-02 — Establish project compatibility | A-005/B-001, F-03, I-02, EVD-07; **P1, INVESTIGATE**, Medium        | Identify the actual TypeScript version, compiler/lint configuration, and consumers; run their existing checks. No-change alternative applies if compatible. Effort unknown until the project is supplied. Preserve the public contract. Accept when T-04/T-05 pass and remaining mandatory evidence gaps close.                      |
| RM-03 — Protect fee-map structure       | B-001, F-02, I-02, EVD-03; **P2, RETAIN**, Low, O3                  | Keep the explicit map during RM-01 unless verified toolchain constraints require a reviewed equivalent. No additional behavior requested. Acceptance: R1/R2 pass and the map remains type compatible.                                                                                                                                |
| RM-04 — Check external input boundary   | F-03, I-03, EVD-02/03; **P3, INVESTIGATE**, Low                     | Only if consumers supply untyped delivery values, establish the intended invalid-input contract and test it. No change is the current alternative. Do not add runtime validation without a verified requirement.                                                                                                                     |

**Verification contracts.** T-01–T-03 were executed as an inline Node 24.21.0
differential check using TypeScript stripping; exit status was 0 and the
observed values are in EVD-05. No existing project tests were identified.

| Test; purpose and trace                                  | Given / when / then, including expected-result authority                                                                                                                                                                                          | Environment; level; location; status                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| T-01; differential/regression; R1, A-001/002, RM-01      | Given either delivery and subtotal 0 or 99.99, when called, then return 5 or 15 respectively; R1.                                                                                                                                                 | Node targeted command; E3; inline check. **PASS for A and B.**                                                             |
| T-02; specification/negative; R2, A-003/004, F-01, RM-01 | Given either delivery and subtotal exactly 100, when called, then return 0; R2.                                                                                                                                                                   | Node targeted command; E3; inline check. **PASS A, FAIL B** (5/15).                                                        |
| T-03; specification/regression; R2, A-003/004, RM-01     | Given either delivery and subtotal 150, when called, then return 0; R2.                                                                                                                                                                           | Node targeted command; E3; inline check. **PASS A, FAIL B** (5/15).                                                        |
| T-04; contract/static; A-005/B-001, RM-02/03             | Given the project’s compiler and lint settings, when both public declarations and the `satisfies` map are checked, then compilation and required linting pass; approved project configuration. Include incompatible compiler failure if relevant. | Project toolchain; E2; proposed project check. **BLOCKED**: configuration and `tsc` unavailable.                           |
| T-05; integration/contract; A-001–005, RM-01/02          | Given a real consumer, when it calls both methods below, at, and above 100, then fees and exported types match R1/R2 and the approved consumer contract. Include failing integration paths.                                                       | Project integration environment; E4; proposed project test. **PROPOSED**; consumer unavailable.                            |
| T-06; conditional boundary; A-005, RM-04                 | If an untyped input boundary exists, given an invalid delivery, when called, then follow an approved error/default contract.                                                                                                                      | Consumer environment; E3/E4; proposed location. **PROPOSED only if applicable**; expected result is currently unspecified. |

| Requirement     | Atom  | A location | B mapping         | Finding / impact | Remediation    | Tests          | Evidence; status               |
| --------------- | ----- | ---------- | ----------------- | ---------------- | -------------- | -------------- | ------------------------------ |
| R1              | A-001 | 3–8        | `FEES.standard`   | —                | RM-01 preserve | T-01/T-05      | EVD-01–05; targeted pass       |
| R1              | A-002 | 3–8        | `FEES.express`    | —                | RM-01 preserve | T-01/T-05      | EVD-01–05; targeted pass       |
| R2              | A-003 | 3–5        | Missing threshold | F-01/I-01        | RM-01          | T-02/T-03/T-05 | EVD-01–05; targeted fail B     |
| R2              | A-004 | 3–5        | Missing threshold | F-01/I-01        | RM-01          | T-02/T-03/T-05 | EVD-01–05; targeted fail B     |
| Public baseline | A-005 | 1–3        | Same declarations | F-03/I-02        | RM-02          | T-04/T-05      | EVD-02/03/07; compilation open |

## H — Acceptance gates and recommendation

| Gate                                          | Status         | Reason                                                                                   |
| --------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| G01 Provenance                                | PASS           | Supplied roles and content hashes recorded; historical claim limited to fixture evidence |
| G02 Atomic inventory                          | PASS           | Five scoped atoms reconciled                                                             |
| G03 100% parity                               | **FAIL**       | 60% unweighted; 47.4% weighted                                                           |
| G04 No critical/high findings                 | **FAIL**       | F-01 remains                                                                             |
| G05 No unapproved material divergence         | **FAIL**       | R2 divergence                                                                            |
| G06 Behavioral verification                   | **FAIL**       | T-02/T-03 fail for B; integration pending                                                |
| G07 Type check and lint                       | UNVERIFIED     | Toolchain/configuration unavailable                                                      |
| G08 Mandatory security/accessibility/coverage | NOT_APPLICABLE | None supplied for this non-interactive utility; fee integrity assessed under R2          |
| G09 Preserve candidate improvements           | PASS           | RM-01/03 retain the explicit map; compiler benefit still requires T-04                   |
| G10 Verified quality ≥96                      | **FAIL**       | B’s potential ceiling is 65.6                                                            |
| G11 Minimum evidence and high confidence      | UNVERIFIED     | Type and integration claims lack required evidence                                       |
| G12 No material contradictions                | PASS           | None found in scoped evidence                                                            |
| G13 No unverified mandatory criteria          | **FAIL**       | Type, lint, and integration checks remain open                                           |
| G14 Reconciliation                            | PASS           | Five atoms, 19 weights, 61 scoring points, findings, tasks, and tests reconcile          |

**Recommended sequence:** implement RM-01 while retaining the fee map; run the
R1/R2 boundary checks; establish and run project type, lint, regression, and
consumer integration checks through RM-02; then reassess every gate and score.
RM-04 applies only if consumer inspection finds an untyped input boundary.

The twelve executive answers are: **(1)** B is incomplete; **(2)** it is not
behaviorally equivalent; **(3)** it is inferior overall on the applicable
evidence, with a map worth preserving; **(4–5)** R2 free shipping is the missing
historical enhancement; **(6)** retain the fee map; **(7)** no O4 change is
justified; **(8)** incorrect fees and unverified compatibility prevent adoption;
**(9)** callers and the TypeScript toolchain may be affected; **(10)** type,
lint, regression, and integration evidence remain; **(11)** follow the sequence
above; **(12)** **B is not ready for acceptance**. No files were modified.
