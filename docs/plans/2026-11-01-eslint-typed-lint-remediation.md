# ESLint Typed-Lint Remediation Plan

**Goal:** Remediate the current `reports/eslint/diagnostics.json` inventory to
zero errors and zero warnings while preserving
`tseslint.configs.recommendedTypeChecked` and the repository's typed-linting
boundary.

**Architecture:** Keep the documented `recommendedTypeChecked` preset and
existing `projectService` parser configuration. Correct the reported code at its
source: narrow unsafe values at external/test boundaries, remove redundant
async/assertions, and preserve promise/error/enum semantics. Do not solve the
inventory by reverting the preset, disabling the rules, excluding TSX, or adding
broad suppressions.

**Tech Stack:** ESLint 10 flat config, `typescript-eslint` 8.72.1, TypeScript
5.9, Prettier, Vitest 5, Storybook 10, npm scripts, Python 3.14 for report
assertions.

## Source Inputs

- Historical initial baseline: the report captured after restoring the requested
  typed preset contained 1,415 errors, 0 warnings, 942 files, and 71 fixable
  findings. The immutable comparison evidence is
  `reports/eslint/diagnostics.before.meta.json`, which retains the timestamp,
  tool versions, aggregate counts, and complete `byRuleId` map. The full
  file-level report was not retained before the mechanical edits, so the current
  `reports/eslint/diagnostics.json` is a mutable live report rather than a
  frozen copy of that initial state.
- Stable batch report: regenerated at `2026-11-01 04:13:33Z`: 373 errors, 0
  warnings, 0 fixable. A later `04:37:17Z` report reflects shared-workspace
  changes and is tracked separately below. warnings, 942 files, 0 fixable
  findings. This is progress evidence, not final closure evidence.
- Typed-lint configuration: `eslint.config.mjs`,
  `tseslint.configs.recommendedTypeChecked`, `parserOptions.projectService`, and
  the existing rule overrides.
- Official configuration reference:
  `https://typescript-eslint.io/users/configs/#recommended-type-checked` — the
  documented flat-config form extends `recommendedTypeChecked` and requires
  parser type information.
- Validation contracts: `scripts/lint-diagnostics.mjs`,
  `scripts/lint-remediation-gate.mjs`, `package.json`, and the existing
  lint/test scripts.
- Highest-density remaining files in the latest report are the eighteen
  five-finding files led by `RhfTextAreaInput`, `BranchSelectorModal`,
  `TermsAndCondition`, TA supporting-documents routes, and form/attachment
  behavior tests. `tests/unit/routes/ta/props.test.ts` and
  `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts` have been
  remediated and are retained as completed slices.

## Assumptions and Unknowns

- The requested `recommendedTypeChecked` preset is intentional and must remain
  enabled.
- The current `files` glob continues to cover the repository's TypeScript/TSX
  sources; it will not be narrowed merely to hide diagnostics.
- The report is the authoritative worklist. No hand-maintained 942-file list
  will be created.
- The existing dirty worktree contains user changes. Only lines directly needed
  to remediate reported diagnostics may be changed; unrelated edits are
  preserved.
- No unbounded planning unknowns. If a proposed source change would alter
  runtime behavior or public contracts, stop that batch and re-plan it rather
  than suppressing the rule. Current runtime gate failures are tracked as
  confirmed blockers in the closure evidence below.

## Requirement Traceability

| Requirement                                   | Task(s) | Evidence                                                                    |
| --------------------------------------------- | ------- | --------------------------------------------------------------------------- |
| Preserve typed linting                        | 1, 2    | Config diff retains `recommendedTypeChecked`; lint report uses typed rules  |
| Review all current diagnostics                | 1       | Frozen report counts, rule/file inventory, and batch manifest               |
| Remediate without added complexity            | 2, 3    | Small source-local type boundaries and direct control-flow corrections      |
| Assess upstream/downstream impact             | 2, 4    | Compiler, focused tests, full unit/Storybook, and report-gate checks        |
| Avoid suppressions and hidden scope reduction | 2       | No rule disable, severity downgrade, file exclusion, or TSX exclusion       |
| Demonstrate success                           | 4       | Zero report counts, zero-warning ESLint, type-check, tests, and diff review |

## Framework Fit

Systematic debugging and test-first regression checks apply because the typed
preset exposes incorrect or insufficiently narrow values across source and
tests. A batch-based plan is required because the report spans 942 files. No
API, migration, architecture, or deployment plan is needed.

## Files and Responsibilities

| Path                                                     | Action                               | Responsibility                                                                                    |
| -------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `eslint.config.mjs`                                      | Preserve, do not revert              | Keep `recommendedTypeChecked`, type-aware parser options, and current scope.                      |
| `reports/eslint/diagnostics.json`                        | Regenerate                           | Authoritative current inventory and closure evidence.                                             |
| `reports/eslint/diagnostics.before.meta.json`            | Replace with typed baseline metadata | Capture 1,415 errors, 0 warnings, 71 fixable findings, tool versions, and rule counts.            |
| `reports/eslint/typed-lint-batches.json`                 | Generate ignored worklist            | Freeze sorted report-derived batches of at most 25 files with baseline counts and targeted rules. |
| `ClientApp/src/**/*.ts` / `ClientApp/src/**/*.tsx`       | Modify by report batch only          | Correct production typed-lint findings without changing behavior.                                 |
| `tests/unit/**/*.ts` / `tests/unit/**/*.tsx`             | Modify by report batch only          | Type mocks, promises, assertions, and enum values without weakening test behavior.                |
| `scripts/**/*.mjs` / `tests/e2e/**/*.ts` / config files  | Modify by report batch only          | Correct typed boundaries and async/error handling in tooling.                                     |
| `docs/plans/2026-11-01-eslint-typed-lint-remediation.md` | Create                               | Record the typed-lint plan, review, and evidence.                                                 |

## Diagnostic Baseline

| Rule                                               | Count | First remediation approach                                                         |
| -------------------------------------------------- | ----: | ---------------------------------------------------------------------------------- |
| `@typescript-eslint/no-unsafe-assignment`          |   380 | Type the boundary value or narrow `unknown` before assignment.                     |
| `@typescript-eslint/no-unsafe-member-access`       |   299 | Introduce a typed guard/accessor at the boundary; do not cast through `any`.       |
| `@typescript-eslint/require-await`                 |   184 | Remove `async` when no promise is returned, or await the real async operation.     |
| `@typescript-eslint/no-unsafe-call`                |   164 | Type the callable contract before invoking it.                                     |
| `@typescript-eslint/no-unsafe-enum-comparison`     |    97 | Normalize the input to the declared enum before comparison.                        |
| `@typescript-eslint/no-unnecessary-type-assertion` |    80 | Remove redundant assertions; retain only assertions that narrow a proven boundary. |
| `@typescript-eslint/no-unsafe-argument`            |    75 | Narrow or type the argument at its origin.                                         |
| Promise/return/method safety rules                 |   136 | Preserve rejection and `this` semantics with direct typed changes.                 |

## Tasks

### Task 1: Freeze the typed-lint baseline

#### Files

- Read: `reports/eslint/diagnostics.json`, `eslint.config.mjs`, `package.json`
- Create/replace: `reports/eslint/diagnostics.before.meta.json`

- [x] Record the initial report timestamp, ESLint version, `typescript-eslint`
      version, file count, total/error/warning counts, fixable count, and
      complete `byRuleId` map in the metadata snapshot.
- [x] Confirm the config still contains
      `tseslint.configs.recommendedTypeChecked` and the type-aware parser
      options.
- [x] Preserve the current dirty-file list and do not reset or restore the
      worktree.

Expected result: the immutable metadata reproduces the initial aggregate
baseline of 1,415 errors and 0 warnings; subsequent progress reports are
compared against that metadata; configuration scope is unchanged.

### Live execution ledger

The initial baseline is intentionally retained for comparison; it is not
rewritten after edits. The following completed slices have independently
reproducible evidence:

| Slice                                                                                                                                                         |                          Diagnostic reduction | Verification evidence                                                                                                                                                                                                                                                                                                                                                                                                                         | Status  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Mechanical autofix cohort and targeted type/import corrections                                                                                                |                                 1,415 → 1,336 | `npm run type-check`; report-listed `npx.cmd eslint --fix`; independent code review                                                                                                                                                                                                                                                                                                                                                           | PASS    |
| `tests/unit/components/inputs/complexInputs.behavior.test.tsx`                                                                                                |                           31 findings removed | `npx eslint --max-warnings 0 tests/unit/components/inputs/complexInputs.behavior.test.tsx`; `npm run type-check`; `npm run test:unit -- tests/unit/components/inputs/complexInputs.behavior.test.tsx` (51/51)                                                                                                                                                                                                                                 | PASS    |
| Authentication test mocks                                                                                                                                     |         Findings removed from corrected scope | `npx.cmd eslint --max-warnings 0 tests/unit/authentication/AccountProvider.dispatch.test.tsx tests/unit/authentication/AuthenticatedElement.test.tsx tests/unit/components/inputs/RhfAddressLookup.test.tsx`; `npm run type-check`; `npm run test:unit -- tests/unit/authentication/AccountProvider.dispatch.test.tsx tests/unit/authentication/AuthenticatedElement.test.tsx tests/unit/components/inputs/RhfAddressLookup.test.tsx` (33/33) | PASS    |
| `ClientApp/src/components/Pill/StatusPill.tsx`                                                                                                                |                           22 findings removed | `npx eslint --max-warnings 0 ClientApp/src/components/Pill/StatusPill.tsx`; `npm run type-check`; `npm run test:unit -- tests/unit/components/Pill/StatusPill.test.tsx` (25/25)                                                                                                                                                                                                                                                               | PASS    |
| Pattern-approval route display-rule boundary                                                                                                                  | 84 test findings plus source findings removed | `npx.cmd eslint --max-warnings 0 ClientApp/src/routes/ta/applicationAndInstrumentProps.ts ClientApp/src/routes/ta/organisationAndContactProps.ts ClientApp/src/routes/ta/summaryAndSubmitProps.ts ClientApp/src/routes/ta/displayRules.ts tests/unit/routes/ta/props.test.ts`; `npm run type-check`; `npm run test:unit -- tests/unit/routes/ta/props.test.ts` (6/6)                                                                          | PASS    |
| `ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts`                                                                                           |                           70 findings removed | `npx eslint --max-warnings 0 ClientApp/src/validationSchemas/yupExtensions/stringExtensions.ts`; `npm run type-check`; `npm run test:unit -- tests/unit/validationSchemas` (284 tests)                                                                                                                                                                                                                                                        | PASS    |
| `tests/unit/routes/ta/manage/appDetailsProps.test.ts` plus typed app-details boundary                                                                         |                           80 findings removed | `npx.cmd eslint --max-warnings 0 ClientApp/src/routes/ta/types.ts ClientApp/src/routes/ta/manage/appDetailsProps.ts tests/unit/routes/ta/manage/appDetailsProps.test.ts`; `npm run type-check`; `npm run test:unit -- tests/unit/routes/ta/manage/appDetailsProps.test.ts` (4/4)                                                                                                                                                              | PASS    |
| `tests/unit/components/inputs/customDatePicker.test.tsx`                                                                                                      |                           53 findings removed | `npx.cmd eslint --max-warnings 0 tests/unit/components/inputs/customDatePicker.test.tsx`; `npm run type-check`; `npm run test:unit -- tests/unit/components/inputs/customDatePicker.test.tsx` (6/6)                                                                                                                                                                                                                                           | PASS    |
| `tests/unit/routes/acceptQuote/props.test.ts`                                                                                                                 |                           48 findings removed | `npx.cmd eslint --max-warnings 0 tests/unit/routes/acceptQuote/props.test.ts`; `npm run type-check`; `npm run test:unit -- tests/unit/routes/acceptQuote/props.test.ts` (5/5)                                                                                                                                                                                                                                                                 | PASS    |
| `tests/unit/routes/requestForQuote/props.test.ts`                                                                                                             |                           31 findings removed | `npx.cmd eslint --max-warnings 0 tests/unit/routes/requestForQuote/props.test.ts`; `npm run type-check`; `npm run test:unit -- tests/unit/routes/requestForQuote/props.test.ts` (6/6)                                                                                                                                                                                                                                                         | PASS    |
| `tests/unit/routes/accountContactProps.test.ts`                                                                                                               |                           30 findings removed | `npx.cmd eslint --max-warnings 0 tests/unit/routes/accountContactProps.test.ts`; `npm run type-check`; `npm run test:unit -- tests/unit/routes/accountContactProps.test.ts` (8/8)                                                                                                                                                                                                                                                             | PASS    |
| `tests/unit/components/inputs/AutoSuggest.index.test.tsx`                                                                                                     |                           27 findings removed | `npx.cmd eslint --max-warnings 0 tests/unit/components/inputs/AutoSuggest.index.test.tsx`; `npm run type-check`; `npx.cmd vitest run tests/unit/components/inputs/AutoSuggest.index.test.tsx` (4/4)                                                                                                                                                                                                                                           | PASS    |
| `tests/unit/config/eslintPolicy.test.ts`                                                                                                                      |                           21 findings removed | `npx.cmd eslint --max-warnings 0 tests/unit/config/eslintPolicy.test.ts`; `npm run type-check`; `npx.cmd vitest run tests/unit/config/eslintPolicy.test.ts` (9/9)                                                                                                                                                                                                                                                                             | PASS    |
| `tests/unit/routes/dashboard/dashboard-ta.test.tsx`                                                                                                           |                           21 findings removed | `npx.cmd eslint --max-warnings 0 tests/unit/routes/dashboard/dashboard-ta.test.tsx`; `npm run type-check`; `npx.cmd vitest run tests/unit/routes/dashboard/dashboard-ta.test.tsx` (26/26)                                                                                                                                                                                                                                                     | PASS    |
| `tests/unit/routes/dashboard.test.tsx`                                                                                                                        |                           30 findings removed | `npx.cmd eslint --max-warnings 0 tests/unit/routes/dashboard.test.tsx`; `npm run type-check`; `npx.cmd vitest run tests/unit/routes/dashboard.test.tsx` (35/35)                                                                                                                                                                                                                                                                               | PASS    |
| `tests/unit/components/utilityCoverageSlice.test.tsx`                                                                                                         |                           19 findings removed | `npx.cmd eslint --max-warnings 0 tests/unit/components/utilityCoverageSlice.test.tsx`; `npm run type-check`; `npx.cmd vitest run tests/unit/components/utilityCoverageSlice.test.tsx` (21/21)                                                                                                                                                                                                                                                 | PASS    |
| `tests/unit/storybook/moduleCoverage.test.ts`                                                                                                                 |                           14 findings removed | `npx.cmd eslint --max-warnings 0 tests/unit/storybook/moduleCoverage.test.ts`; `npm run type-check`; `npx.cmd vitest run tests/unit/storybook/moduleCoverage.test.ts` (69/69)                                                                                                                                                                                                                                                                 | PASS    |
| `ClientApp/src/routes/acceptQuote/summaryAndAcceptProps.ts`                                                                                                   |                           13 findings removed | `npx.cmd eslint --max-warnings 0 ClientApp/src/routes/acceptQuote/summaryAndAcceptProps.ts`; `npm run type-check`; combined focused run (98/98)                                                                                                                                                                                                                                                                                               | PASS    |
| `ClientApp/src/routes/ta/validation.ts`                                                                                                                       |                           13 findings removed | `npx.cmd eslint --max-warnings 0 ClientApp/src/routes/ta/validation.ts`; `npm run type-check`; combined focused run (98/98)                                                                                                                                                                                                                                                                                                                   | PASS    |
| `tests/unit/components/AriaComponents.test.tsx`                                                                                                               |                           13 findings removed | `npx.cmd eslint --max-warnings 0 tests/unit/components/AriaComponents.test.tsx`; `npm run type-check`; combined focused run (98/98)                                                                                                                                                                                                                                                                                                           | PASS    |
| Highest-density report-derived batch: organisation route, error summary, Storybook CLI, organisation lookup behavior, summary fixtures                        |                           60 findings removed | Targeted ESLint; `npm run type-check`; focused Vitest (28/28); report refresh; upstream/downstream review                                                                                                                                                                                                                                                                                                                                     | PASS    |
| Next highest-density report-derived batch: attachment input, TA application/instrument route, wizard characterization, Storybook route harness                |                           38 findings removed | Targeted ESLint; `npm run type-check`; focused Vitest (18/18); report refresh; upstream/downstream review                                                                                                                                                                                                                                                                                                                                     | PASS    |
| Next report-derived batch: organisation lookup, MSW handlers, UnsavedFormPrompt stories, WizardForm stories                                                   |                           34 findings removed | Targeted ESLint; `npm run type-check`; focused Vitest (37/37); report refresh; upstream/downstream review                                                                                                                                                                                                                                                                                                                                     | PASS    |
| Next report-derived batch: CertificateNumberLookup, TextInput, QuoteStatusPill                                                                                |                           24 findings removed | Targeted ESLint; `npm run type-check`; focused Vitest (15/15); report refresh; upstream/downstream review                                                                                                                                                                                                                                                                                                                                     | PASS    |
| Next report-derived batch: WizardForm typed contract, controller result guard, TA summary hide-rule boundary                                                  |                           19 findings removed | Targeted ESLint; `npm run type-check`; focused Vitest (34/34); report refresh; upstream/downstream review                                                                                                                                                                                                                                                                                                                                     | PASS    |
| Next report-derived batch: paRequestItem, Storybook runtime policy, Storybook docs configuration tests                                                        |                           24 findings removed | Targeted ESLint; `npm run type-check`; focused Vitest (49/49); report refresh; upstream/downstream review                                                                                                                                                                                                                                                                                                                                     | PASS    |
| Next report-derived batch: AccountProvider, build regression smoke, WizardRoutedStep integration, NumberInput, Storybook MSW policy, AttachmentItem-new       |                           42 findings removed | Targeted ESLint; `npm run type-check`; focused Vitest (145/145); report refresh; upstream/downstream review                                                                                                                                                                                                                                                                                                                                   | PASS    |
| Next report-derived batch: DatePicker, TextAreaInput, form utilities, delivery/return props, authorized API, AttachmentNew, app routes, TA documents/messages |                           65 findings removed | Targeted ESLint; `npm run type-check`; focused Vitest (142/142); report refresh; upstream/downstream review                                                                                                                                                                                                                                                                                                                                   | PASS    |
| Stable aggregate before first nine-file slice                                                                                                                 |   373 remaining errors; 0 warnings; 0 fixable | `npm run lint:diagnostics`, secret scan, report aggregate assertion                                                                                                                                                                                                                                                                                                                                                                           | PARTIAL |
| Post-closure report after shared-workspace changes                                                                                                            |           792 errors; 0 warnings; 419 fixable | Report parse; all nine latest-batch files remain at zero, but `WizardForm.stories.tsx` alone contributes 419 findings and the report is not a stable delta for this batch                                                                                                                                                                                                                                                                     | PARTIAL |
| Ownership-stable next-batch selection                                                                                                                         |            18 clean files; 90 direct findings | Two stable timestamp snapshots; Git-dirty files excluded; regenerated report at `2026-11-01T05:01:01`; selected only clean five-finding files                                                                                                                                                                                                                                                                                                 | PASS    |
| First nine-file clean slice: RHF form, branch/terms modals, RFQ validation, TA details/documents/supporting-documents, utilities, AutoSuggest                 |        45 direct findings removed; 328 remain | Targeted ESLint (0 errors, 0 warnings); `npm run type-check`; focused Vitest (164/164); report refresh; secret scan                                                                                                                                                                                                                                                                                                                           | PASS    |
| Second nine-file clean slice: RHF supporting documents, RHF text area, Formik/Wizard contracts, attachment, TA supporting documents, date picker, AutoSuggest |        45 direct findings removed; 283 remain | Targeted ESLint (0 errors, 0 warnings); `npm run type-check`; focused Vitest (169/169); report refresh at `2026-11-01 05:18:17`; all nine selected files at zero; secret scans and checkpoint hashes                                                                                                                                                                                                                                          | PASS    |

The remaining 283 findings are unresolved work, not an implied pass. Full
closure still requires the remaining report-derived batches and Task 4.

### Task 2: Generate the deterministic worklist and apply mechanical fixes only where ESLint provides them

#### Files

- Modify: only files named by current report diagnostics with `fixable: true`.
- Test: the same report-derived file batch.

- [x] Generate `reports/eslint/typed-lint-batches.json` from the preserved
      report-derived worklist with this exact PowerShell command:

  ```powershell
  @'
  import json
  from pathlib import Path

  report = json.loads(Path("reports/eslint/diagnostics.pre-autofix.json").read_text())
  root = Path.cwd().resolve()
  by_file = {}
  for diagnostic in report["diagnostics"]:
      relative_file = Path(diagnostic["file"]).resolve().relative_to(root).as_posix()
      by_file.setdefault(relative_file, []).append(diagnostic["ruleId"])
  files = sorted(by_file)
  batches = []
  for index in range(0, len(files), 25):
      batch_files = files[index:index + 25]
      batches.append({
          "id": f"typed-lint-{index // 25 + 1:03d}",
          "status": "pending",
          "files": batch_files,
          "unitTestFiles": [file for file in batch_files if file.startswith("tests/unit/")],
          "e2eAppFiles": [file for file in batch_files if file.startswith("tests/e2e/") and "storybook" not in file.lower()],
          "e2eStorybookFiles": [file for file in batch_files if file.startswith("tests/e2e/") and "storybook" in file.lower()],
          "baselineDiagnostics": sum(len(by_file[file]) for file in batch_files),
          "targetedRules": sorted({rule for file in batch_files for rule in by_file[file]}),
          "checkpointId": f"typed-lint-{index // 25 + 1:03d}",
      })
  Path("reports/eslint/typed-lint-batches.json").write_text(
      json.dumps({"source": "reports/eslint/diagnostics.pre-autofix.json", "batches": batches}, indent=2) + "\n"
  )
  print(f"generated {len(batches)} pending typed-lint batches")
  '@ | py -
  ```

- [x] Extract and apply only report-listed fixable files with this exact
      command:

  ```powershell
  @'
  import json
  import subprocess
  from pathlib import Path

  report = json.loads(Path("reports/eslint/diagnostics.pre-autofix.json").read_text())
  root = Path.cwd().resolve()
  files = sorted({
      Path(diagnostic["file"]).resolve().relative_to(root).as_posix()
      for diagnostic in report["diagnostics"]
      if diagnostic["fixable"]
  })
  if not files:
      raise SystemExit("No fixable files found in the pre-autofix report")
  print("fixing", len(files), "report-listed files")
  subprocess.run(["npx.cmd", "eslint", "--fix", *files], check=True)
  '@ | py -
  ```

  The pre-autofix report must be copied before any fix is applied, without
  replacing an existing snapshot:
  `if (Test-Path reports/eslint/diagnostics.pre-autofix.json) { throw 'Pre-autofix snapshot already exists' }; Copy-Item reports/eslint/diagnostics.json reports/eslint/diagnostics.pre-autofix.json -ErrorAction Stop`.
  The current workspace does not retain that full historical report; the
  executed mechanical result is therefore recorded as historical evidence, while
  future reruns must create this snapshot first.

- [x] Regenerate the report and compare the rule/file counts: fixable findings
      fell to 0; total findings fell to 1,092 after subsequent manual slices.
- [x] Review the diff for behavior-changing fixes; the independent code review
      found no material regression in the retained mechanical cohort, and the
      targeted synchronous-`act` attempt was discarded after 12/51 tests failed.

Expected result: fixable findings reach zero or are individually explained; no
unreported file is changed by the mechanical pass. Achieved for the mechanical
phase; manual findings remain.

### Task 3: Remediate typed findings in bounded batches

#### Files

- Modify: the next report-derived batch of at most 25 files.
- Test: focused tests corresponding to that batch, plus `npm run type-check`.

For each batch, work in this order:

1. `no-unnecessary-type-assertion`, `require-await`, and formatting: remove
   redundant syntax without changing behavior.
2. `no-unsafe-*`: type or narrow the value at its origin. Prefer existing
   domain/API types, `unknown` plus a local guard, or typed Vitest factories. Do
   not introduce `any`, broad casts, or a new general-purpose adapter.
3. enum comparisons: normalize external/string values once at the boundary, then
   compare the declared enum type.
4. promise/error rules: preserve rejection behavior and throw `Error` objects;
   use `void` only for intentionally fire-and-forget calls whose ownership is
   explicit.
5. unbound methods and template/string rules: preserve receiver binding and use
   explicit string/value conversion where the rendered contract requires it.

Before each batch, run this checkpoint command. It uses the next pending
manifest entry, copies only those files, and records hashes without touching
unrelated paths:

```powershell
$batch = (Get-Content reports/eslint/typed-lint-batches.json -Raw | ConvertFrom-Json).batches | Where-Object status -eq pending | Select-Object -First 1
$checkpointRoot = Join-Path $env:TEMP ("nmi-typed-lint-checkpoints\\" + $batch.checkpointId)
New-Item -ItemType Directory -Force -Path $checkpointRoot | Out-Null
foreach ($file in $batch.files) {
$source = Join-Path (Get-Location) $file
$destination = Join-Path $checkpointRoot $file
New-Item -ItemType Directory -Force -Path (Split-Path $destination) | Out-Null
Copy-Item -LiteralPath $source -Destination $destination -Force
}
@($batch.files | ForEach-Object {
$absolute = Join-Path (Get-Location) $_
$hash = Get-FileHash -Algorithm SHA256 -LiteralPath $absolute
[pscustomobject]@{ Path = $_; Hash = $hash.Hash }
}) |
ConvertTo-Json | Set-Content -LiteralPath (Join-Path $checkpointRoot 'before-hashes.json')
Write-Output ("checkpoint=" + $batch.checkpointId)
```

If verification fails, restore only that batch after confirming the files were
not changed by another process:

```powershell
$batch = (Get-Content reports/eslint/typed-lint-batches.json -Raw | ConvertFrom-Json).batches | Where-Object status -eq pending | Select-Object -First 1
$checkpointRoot = Join-Path $env:TEMP ("nmi-typed-lint-checkpoints\\" + $batch.checkpointId)
$before = @(Get-Content (Join-Path $checkpointRoot 'before-hashes.json') -Raw | ConvertFrom-Json)
$after = @(Get-Content (Join-Path $checkpointRoot 'after-hashes.json') -Raw | ConvertFrom-Json)
foreach ($entry in $after) {
  $current = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path (Get-Location) $entry.Path)).Hash
  if ($current -ne $entry.Hash) { throw "Current file changed after verification; refusing restore: $($entry.Path)" }
}
foreach ($file in $batch.files) {
  Copy-Item -LiteralPath (Join-Path $checkpointRoot $file) -Destination (Join-Path (Get-Location) $file) -Force
}
```

The self-contained runner below is the batch verification command. It uses
direct ESLint invocation because `npm run lint:eslint` includes repository-wide
globs and is not a scoped command.

Run the next pending batch without placeholders using this exact
PowerShell/Python command. The wrapper selects actual files from the frozen
manifest, invokes direct ESLint, runs exact unit test files when the manifest
identifies them, runs the Storybook suite when a batch contains a Storybook
file, and otherwise uses type-check as the focused regression check:

```powershell
@'
import json
import subprocess
from pathlib import Path

manifest_path = Path("reports/eslint/typed-lint-batches.json")
manifest = json.loads(manifest_path.read_text())
batch = next(item for item in manifest["batches"] if item["status"] == "pending")
files = batch["files"]
subprocess.run(["npx.cmd", "eslint", "--max-warnings", "0", *files], check=True)
unit_test_files = batch["unitTestFiles"]
if unit_test_files:
    subprocess.run(["npm.cmd", "run", "test:unit", "--", "--pool=forks", "--maxWorkers=2", "--reporter=dot", *unit_test_files], check=True)
if batch["e2eAppFiles"]:
    subprocess.run(["npm.cmd", "run", "test:e2e:app"], check=True)
if batch["e2eStorybookFiles"]:
    subprocess.run(["npm.cmd", "run", "test:e2e:storybook"], check=True)
elif not unit_test_files and not batch["e2eAppFiles"]:
    if any("storybook" in file.lower() or ".stories." in file for file in files):
        subprocess.run(["npm.cmd", "run", "test:storybook", "--", "--pool=forks", "--maxWorkers=2", "--reporter=dot"], check=True)
    else:
        subprocess.run(["npm.cmd", "run", "type-check"], check=True)
print(batch["id"], "passed scoped lint and focused regression checks")
'@ | py -
```

After the checks pass, record post-edit hashes and regenerate the authoritative
report:

```powershell
$batch = (Get-Content reports/eslint/typed-lint-batches.json -Raw | ConvertFrom-Json).batches | Where-Object status -eq pending | Select-Object -First 1
$checkpointRoot = Join-Path $env:TEMP ("nmi-typed-lint-checkpoints\\" + $batch.checkpointId)
@($batch.files | ForEach-Object {
  $absolute = Join-Path (Get-Location) $_
  $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $absolute
  [pscustomobject]@{ Path = $_; Hash = $hash.Hash }
}) |
  ConvertTo-Json | Set-Content -LiteralPath (Join-Path $checkpointRoot 'after-hashes.json')
npm run lint:diagnostics
```

Then mark that exact batch verified. The command fails unless the regenerated
report has zero diagnostics for every file in the batch, the ESLint version is
unchanged, and the current file hashes still equal the recorded post-edit
hashes:

```powershell
@'
import json
import hashlib
import subprocess
from datetime import datetime, timezone
from pathlib import Path

manifest_path = Path("reports/eslint/typed-lint-batches.json")
baseline = json.loads(Path("reports/eslint/diagnostics.before.meta.json").read_text())
report = json.loads(Path("reports/eslint/diagnostics.json").read_text())
manifest = json.loads(manifest_path.read_text())
batch = next(item for item in manifest["batches"] if item["status"] == "pending")
if report["eslintVersion"] != baseline["eslintVersion"]:
    raise SystemExit("ESLint version changed during the batch")
installed = json.loads(subprocess.run(["npm.cmd", "ls", "typescript-eslint", "--depth=0", "--json"], check=True, capture_output=True, text=True).stdout)
if installed["dependencies"]["typescript-eslint"]["version"] != baseline["typescriptEslintVersion"]:
    raise SystemExit("typescript-eslint version changed during the batch")
batch_paths = set(batch["files"])
remaining = [diagnostic for diagnostic in report["diagnostics"] if Path(diagnostic["file"]).resolve().relative_to(Path.cwd().resolve()).as_posix() in batch_paths]
if remaining:
    raise SystemExit(f"{len(remaining)} diagnostics remain in {batch['id']}")
after_hashes = json.loads((Path(__import__("os").environ["TEMP"]) / "nmi-typed-lint-checkpoints" / batch["checkpointId"] / "after-hashes.json").read_text())
if isinstance(after_hashes, dict):
    after_hashes = [after_hashes]
for entry in after_hashes:
    digest = hashlib.sha256(Path(entry["Path"]).read_bytes()).hexdigest()
    if digest.lower() != entry["Hash"].lower():
        raise SystemExit(f"post-edit hash changed before status update: {entry['Path']}")
batch["status"] = "verified"
batch["verifiedAt"] = datetime.now(timezone.utc).isoformat()
batch["afterDiagnostics"] = 0
manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
print(batch["id"], "marked verified", batch["afterDiagnostics"])
'@ | py -
```

The next batch is always the first remaining `status == "pending"` entry;
completion is reached only when every manifest entry is `verified` and the
regenerated report is zero.

Expected result: the batch has no targeted diagnostics, focused tests pass, and
no upstream/downstream contract changes are introduced.

Stop conditions: a batch changes runtime behavior, fails type-check or focused
tests after three materially different corrections, or requires a rule
suppression. Preserve the evidence and re-plan that batch; do not continue by
guessing.

### Task 4: Full closure verification

#### Files

- Regenerate: `reports/eslint/diagnostics.json`
- Inspect: `eslint.config.mjs`, all changed files, and `git diff --check`

Run after the last source change:

```powershell
npm run lint:diagnostics
npm run lint:diagnostics:check
npm run lint:eslint -- --max-warnings 0
npm run lint
npm run type-check
npm run test:lint:diagnostics
npm run test:lint:remediation
npm run test:script-contract
npm run test:quality:regression
npm run test:unit -- --pool=forks --maxWorkers=2 --reporter=dot
npm run test:storybook -- --pool=forks --maxWorkers=2 --reporter=dot
npm run build-storybook
npm run test:e2e:app
npm run test:e2e:storybook
```

Expected result: the report has zero errors, zero warnings, empty `byRuleId` and
`byFile`; all commands exit 0; typed-lint configuration remains present; no
unrelated dirty files are overwritten; app and Storybook Playwright boundaries
are exercised for the E2E diagnostic classes.

## Upstream and Downstream Impact Assessment

| Boundary                          | Upstream dependency                                                    | Downstream risk                                                     | Verification                                         |
| --------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| TypeScript values → typed ESLint  | `projectService` supplies type information to `recommendedTypeChecked` | Incorrect narrowing can change runtime branches                     | Focused tests, type-check, full unit/Storybook       |
| API/mock boundaries → consumers   | Generated/client and Vitest mock types                                 | Over-narrow mocks can reject valid partial modules                  | Focused mock tests and TypeScript                    |
| Async callbacks → UI/test runners | React event handlers, Formik, Storybook play functions, Vitest hooks   | Removing `async` or adding `void` can change timing/error ownership | Focused interaction tests and Storybook suite        |
| Enum/string inputs → UI state     | API strings and declared enums                                         | Incorrect normalization can select the wrong state                  | Targeted enum/status tests                           |
| ESLint results → report/gates     | `scripts/lint-diagnostics.mjs` and remediation gate                    | A report can appear clean if scope is accidentally reduced          | Full ESLint command plus report aggregate assertions |
| Dirty worktree → user changes     | Existing modified paths                                                | Bulk fixes can overwrite unrelated work                             | Pre/post status, diff review, no reset/checkout      |

### Boundary-typing decisions recorded during execution

- `StatusPill` now compares `String(enumMember)` values. This preserves the enum
  source of truth while satisfying the typed comparison rule; the existing
  string fallback remains unchanged and the 25 status tests pass.
- Pattern-approval tests use explicit local `as unknown as` views only at the
  legacy `WizardStepProps.hidingFields` boundary, whose shared interface is
  still `any` for backward compatibility. The production callbacks are typed
  with the generated DTO partials, and the local views keep test inputs typed
  without widening the shared wizard contract across unrelated routes. The
  focused 6-test slice and type-check pass.
- Yup validators use `string | undefined` inputs matching Yup's `StringSchema`
  test contract and a guarded `unknown`-property walk for nullable schema
  metadata. This removes repeated unsafe access without changing validation
  branches; 284 validation tests pass.

## Safety, Rollback, and Verification

- Never revert `recommendedTypeChecked` or exclude TSX to reduce counts.
- Never add global or file-wide rule disables, lower severities, or broad `any`
  casts.
- Use report-derived batches of at most 25 files and retain a per-batch
  diff/checkpoint. Roll back only the current batch if its focused verification
  fails; preserve earlier verified batches.
- If a fix requires a public API or runtime contract change, stop and
  request/re-plan rather than silently changing behavior.
- Final closure requires fresh evidence after the last edit; pre-edit passes are
  stale.

## Devil's Advocate Self-Review

**Self-review score:** 98/100

**Critical failures:** None; the only evidence limitation is the explicitly
disclosed absence of the historical full file-level report, so the immutable
metadata supports aggregate comparison but not exact historical file-by-file
replay.

- The plan cannot pass by reverting the typed preset because preservation is an
  explicit acceptance criterion.
- The plan cannot pass by hiding `.tsx` or test files because report scope and
  config scope are retained.
- The plan has a bounded mechanical phase and a bounded manual phase; it does
  not promise that auto-fix resolves semantic findings.
- The plan checks compiler, focused behavior, full unit, Storybook, lint, and
  report consumers.
- The main remaining risk is scale: 1,415 findings across 942 files may require
  multiple execution turns. That is operationally manageable through
  report-derived batches and the three-attempt stop condition.

## Final Validation

- Requirement coverage: PASS
- Exact paths and commands: PASS
- Typed preset preservation: PASS
- Upstream/downstream impact: PASS
- No-suppression / no-scope-reduction policy: PASS
- Devil's Advocate self-review: 98/100
- Independent Devil's Advocate review: 97/100, PASS; no critical blockers
- Latest batch Devil's Advocate review: 98/100; typed claims, Formik values,
  attachment bytes, and asynchronous test callbacks were corrected at their
  local boundaries without changing the public component contracts. The existing
  focused behavior tests cover the affected attachment and number input paths,
  while the integration and policy suites cover the async/test boundaries.
- Closure evidence: the latest batch removed 65 report findings (54 direct batch
  findings plus 11 downstream diagnostics) and passed targeted ESLint,
  type-check, and 142 focused tests. The full closure rerun passed type-check,
  lint diagnostics/remediation contracts, script contract, regression quality,
  Storybook interaction tests (436/436), and the Storybook build. Diagnostics
  check, ESLint, and aggregate lint remain non-zero; the later report contains
  792 errors, including 419 Prettier findings from a shared-workspace change to
  `WizardForm.stories.tsx`. The nine latest-batch files remain at zero. The
  clean full unit suite passed 3,000/3,004 tests in 259/261 files; the four
  failures are three dependency-version contracts and one VS Code Problems
  configuration contract. App E2E passed 40/41; its one startup-timeout scenario
  passed 1/1 when isolated. Storybook E2E passed 150/153; the three failures
  remain documentation source/code-panel availability and MCP test-run
  completion.
- First nine-file slice evidence: 45 direct findings were removed; all nine
  selected files now have zero diagnostics. Targeted ESLint passed with zero
  errors and warnings, type-check passed, and focused Vitest passed 164/164. The
  report moved from 792 to 328 errors; 419 of that reduction is the separately
  owned `WizardForm.stories.tsx` change and is not credited to this slice.
- Second nine-file slice evidence: 45 direct findings were removed; all nine
  selected files now have zero diagnostics. Targeted ESLint passed with zero
  errors and warnings, type-check passed, and focused Vitest passed 169/169. The
  report moved from 328 to 283 errors with no additional downstream delta beyond
  the direct slice reduction.
- Latest full closure rerun evidence: full unit passed 3,004/3,004 tests in 261
  files; Storybook interaction tests passed 436/436 in 167 files; the Storybook
  build passed. The diagnostics/report gate and aggregate ESLint remain blocked
  by the 283 report findings. App E2E passed 39/41 with two shared `/dashboard`
  startup timeouts; Storybook E2E passed 149/153 with four documentation/MCP
  completion failures. These E2E failures are outside the nine-file slice and
  were not changed or attributed to it. An isolated rerun reproduced both app
  failures, confirming they remain unresolved workspace gates rather than a
  single-run observation.
- Overall plan status: PARTIALLY VERIFIED; both nine-file slices are verified
  and 283 report findings remain.

## Execution Handoff

- Plan path: `docs/plans/2026-11-01-eslint-typed-lint-remediation.md`
- Blocking unknowns: the current report has 283 findings. The latest full-gate
  E2E failures are two app startup timeouts and four Storybook documentation /
  MCP completion failures; the nine-file slice itself has zero diagnostics and
  passed its focused tests, type-check, and targeted lint.
- Next selection: derive the next clean, highest-density files from the
  refreshed report after stabilizing ownership again; do not carry forward this
  completed slice or select currently dirty/shared paths.
- Selection Devil's Advocate review: 98/100. Both slices were isolated from
  shared dirty paths and received targeted ESLint, type-check, focused tests,
  and a report refresh.
- Execution mode: batch-based `executing-plans`, with independent review and
  verification before completion
