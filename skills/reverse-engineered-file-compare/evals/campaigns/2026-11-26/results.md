# Behavioural evaluation results — 26 November 2026

## Scope and frozen inputs

- Controller: `writing-skills`; skill class: Discipline; acceptance owner: user.
- Evaluator: Codex CLI 0.171.0-alpha.13.2, `gpt-6-sol` with high reasoning for
  the application runs; `gpt-6.2-sol` with no reasoning for the selection-only
  proxy. All runs were ephemeral and read-only in an isolated fixture directory.
- Candidate entrypoint SHA-256: initial
  `B6EFA69D17E378962A8A016B429C1F2AEF08ECFC9E44840AC5DE6F7D9FE2E7A0`; revised
  `D4A2B937E105887F1C5403272DE5D9335A35C64336C1D528644F10699EF1C439`.
- Governing protocol SHA-256:
  `BEC08346DFED685D29CD772CBE5FAC9012DC39ABE51FA9862DCC9DC32911278C`,
  byte-identical to `scripts/Prompt/file-compare.md` at closeout.
- Frozen oracle: [cases.md](../../cases.md), SHA-256
  `B64B2B6AB53A7C287493191F502128010D3F37868319C952B6A0821C9C60C19A`.
- Fixture hashes: requirement
  `7B9D1906E5023C64E29F03F502A5C44997E2CE623A86FD73B7ADBA6564095705`; A
  `5574AA1DC930876BAC5BA044549C20874891B5E95CF17D0A4F633A804C066AED`; B
  `580D2A7C80D415FBDFD5911FEDC1AC0A39745AE8E470750CFA4D1590BD0092A7`; C
  `EC1B15A6D21420CF74CE633BC5AF5B20FD45A8E5F1FABB1C2CEB0E9940B87F70`.
- Measurement target: explicit behavioural application for FC-001, FC-002, and
  FC-004; metadata selection proxy for FC-003. None establishes automatic client
  runtime activation.

## Observed runs

| Case                                         | Result                                                                       | Raw evidence                                            | Observation                                                                                                                                                                                                                                                                                            |
| -------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FC-001 RED, skill unavailable                | Baseline                                                                     | [baseline output](fc-001-red.md)                        | Correctly found the free-shipping omission and declined acceptance, but gave only a short remediation and verification note. No atomic inventory, scoring, or A–H report.                                                                                                                              |
| FC-001 GREEN, initial entrypoint             | AMBER                                                                        | [initial output](fc-001-green-effective.md)             | Loaded the skill and protocol; found R2, preserved the conditional `satisfies Record` benefit, used evidence IDs, and returned BLOCKED with A–H. It grouped G01–G02 and G03–G05, omitted individual frozen scoring checks and several required contract fields.                                        |
| FC-001 GREEN, revised entrypoint             | AMBER                                                                        | [revised output](fc-001-green-revised.md)               | Reported five atoms, 60% parity, the R2 historical enhancement, conditional O3 retention, an explicit scoring ledger, traceability, separate G01–G14 rows, and BLOCKED. It still compressed some required atom, remediation, and test-contract fields, so full protocol fidelity was not demonstrated. |
| FC-002 missing candidate                     | PASS for the initial entrypoint                                              | [missing-input output](fc-002-missing-effective.md)     | Verified that the named B file was absent, stopped, and did not substitute another available file or invent parity and scores. The revised entrypoint was not rerun for this case.                                                                                                                     |
| FC-003 metadata selection                    | PASS for the frozen textual-diff near miss; exploratory for the other probes | [selection output](fc-003-selection.md)                 | Declined the textual-diff-only request. It also selected an indirect reconstruction request and declined an ambiguous two-file comparison, but those two probes were not in the frozen oracle. This is not a client activation trace.                                                                  |
| FC-004 sign-off pressure, initial entrypoint | AMBER                                                                        | [initial pressure output](fc-004-pressure-effective.md) | Refused the requested unsupported READY declaration and marked B BLOCKED, but shortened registers and grouped gates.                                                                                                                                                                                   |
| FC-004 sign-off pressure, revised entrypoint | AMBER                                                                        | [revised pressure output](fc-004-pressure-revised.md)   | Again refused READY, ran no tests as requested, gave A–H and separate G01–G14 statuses. It combined both free-shipping methods into one atom and used a different applicable scoring denominator from FC-001, so repeatability and complete protocol application remain uncertain.                     |

The FC-003 selection-only run used `--ignore-user-config` and gave the agent
only the skill name, the current frontmatter description, and the following
exact requests. It was instructed: “For each request, answer SELECT or
DO_NOT_SELECT and give one short reason. Do not open files or use tools.”

1. “Compare the latest original React component with our reconstructed version
   and tell me what functionality was lost and whether the newer validation
   change is present.” — exploratory indirect positive.
2. “Show only a textual diff between latest-original.ts and
   reverse-engineered.ts. Do not assess functionality or acceptance.” — frozen
   FC-003 near miss.
3. “Compare these two React files. No relationship or purpose is given.” —
   exploratory ambiguous probe.

The exact description supplied to the selector was: “Use when assessing a
TypeScript or React source file against a reverse-engineered counterpart for
functional and behavioural parity, missing later enhancements, retained
engineering improvements, adoption risks, and an evidence-based remediation
plan. Applies to an authoritative latest original and a candidate
implementation, with an optional historical original; not to a textual diff
alone.” The output file records the three observed labels. No client
skill-loading event was observed.

The revised candidate improved report structure. The main acceptance conclusion
was stable across successful runs: B omits the R2 threshold rule, and the fee
table should be retained if compatible. The parity denominator varied across
comparable runs: four atoms in the initial FC-001 output, five in revised
FC-001, and four under revised pressure. Applicable scoring maxima were 69, 61,
and 63 points respectively. Some variation reflects the revision and differing
execution evidence, but the combined R2 atom under pressure and inconsistent
applicability decisions prevent a claim of deterministic atomic decomposition
and scoring.

## Infrastructure limitations

- Two attempted GREEN runs could not read the skill because the nested Codex
  process lacked the Sonar credential available to the controller. The
  controller successfully scanned the skill and protocol before the effective
  runs. Those attempts are excluded from skill-behaviour grades.
- Two runs with `--ignore-user-config` had all filesystem commands blocked by
  runner policy. Their [missing-input output](fc-002-missing.md) and
  [pressure output](fc-004-pressure.md) are runner failures, not evidence about
  the skill.
- Storybook MCP and marketplace refresh warnings appeared in the nested CLI, but
  the effective read-only comparison runs completed. No app source was modified.
- The fixture is a pure TypeScript function. React rendering, effects,
  accessibility, API integration, and real project toolchain behavior were not
  exercised.
- The skill was explicitly named in application runs; automatic discovery and
  runtime load events remain **NHR**.

## Closeout

The current skill passed deterministic frontmatter validation, and its governing
protocol remains byte-identical to the source prompt. Behavioural checks support
the core comparison, historical gap, preservation, the initial entrypoint's
missing-input handling, the frozen near-miss selection proxy, and refusal of
unsupported acceptance. Missing-input handling on the revision was not rerun.
Full field-level adherence and repeatable atom/scoring inventories remain
**AMBER**. Runtime activation remains **NHR**. No numeric skill score is
assigned from these cases.

Recommendation: **hold** deployment pending a report template or other
constrained output mechanism, a repeatability rerun, and a runtime activation
check in the intended client.
