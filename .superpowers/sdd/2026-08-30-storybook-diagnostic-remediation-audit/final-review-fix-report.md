# Final whole-plan review fix wave

## Scope and constraints

This is the single consolidated final-review fix wave requested after the
97/100 whole-plan review. Base was `eee6457a0e92c29189200d4a71652db171c1af8f`.
The post-review Copilot commits `e2660f7` and `eee6457` are preserved. Their
files (`scripts/clean-storybook-output.mjs`, `scripts/coverage-gap-queue.mjs`,
`scripts/verify-storybook-docs.mjs`, and `.storybook/preview.ts`) are not
modified.

## Root-cause investigation

1. `auditLog()` considers a `Test Files` line sufficient for `completed`, and
   its verdict chooses `clean` whenever there are no target hits. A fatal marker
   after that summary is collected but not consulted by verdict selection.
2. The MSW lookup fixture map is a normal object. Indexing it using the untrusted
   URL value returns inherited `Object.prototype` members for `__proto__`,
   `constructor`, and `toString`, so the `undefined`-only fail-closed check is
   bypassed.
3. The Vitest topology guard only rejects coverage commands that omit
   `--config`; a command explicitly selecting `vitest.config.ts` therefore
   escapes it despite root-project coverage being inert.
4. The coverage auditor counts every executable-looking JSON key. It does not
   establish that a key belongs to editable application source, so generated,
   test/story, Storybook-support, or unrelated entries can inflate its minimum.

## RED mutation declarations

Before test bodies were written, the following mutations were named:

1. Adding `FATAL ERROR` after a valid `Test Files` summary must turn a
   zero-hit audit invalid, rather than clean.
2. Replacing an own-fixture lookup with an inherited normal-object member for
   each of `__proto__`, `constructor`, and `toString` must still return HTTP
   501.
3. Adding `vitest run --coverage --config vitest.config.ts` to `package.json`
   must fail the topology invariant; the file is restored unchanged afterwards.
4. Adding literal outside-repository, generated/vendor, test/story, or
   Storybook-support executable-looking keys must not raise the anti-gutting
   executable count.
5. Removing `storybookVitestRuntimePlugin` from `vitest.storybook.config.ts`
   must fail the runtime-config wiring contract; the config is restored
   unchanged afterwards.
6. Replacing an in-repository coverage key with an otherwise identical
   `ClientApp/src` key rooted in another repository must not raise the
   anti-gutting executable count.

## RED/GREEN results

### RED

The tests were added before the implementation edits. The following focused
command was then run against the unmodified production implementations:

```powershell
npm run test:unit -- --reporter=default tests/unit/quality/storybookLogAudit.test.ts tests/unit/storybook/mswHandlers.test.ts tests/unit/quality/coverageReportAudit.test.ts tests/unit/config/vitestTopology.test.ts tests/unit/config/storybookVitestContract.test.ts
```

It exited `1` with the expected six assertion failures:

- summary followed by OOM was reported `clean`, expected `invalid`;
- all three inherited lookup names returned `200`, expected `501`;
- six executable-looking untrusted coverage entries raised the count from 3 to
  9; and
- the initially tightened topology regex was itself RED because it had escaped
  the whitespace matcher. That test correction was made before treating the
  coverage guard as green; it was test code, not a production change.

The topology guard's exact unsafe form was then proved by temporarily adding
the following script to `package.json` using `apply_patch`:

```text
vitest run --coverage --config vitest.config.ts
```

`npm run test:unit -- --reporter=default tests/unit/config/vitestTopology.test.ts`
exited `1`: its received unsafe-script array contained that exact command. The
temporary script was immediately removed with `apply_patch`; `package.json`
has no final delta.

Final self-review added the sixth literal-path case above. Its focused RED run
exited `1` because `C:/another-repository/ClientApp/src/unrelated.ts` raised
the eligible count from 3 to 4. The auditor was then changed to anchor eligible
source under its repository-root argument (defaulting to the CLI working
directory), and the focused GREEN run passed all 4 coverage-auditor tests.

The runtime-plugin contract was similarly proved by temporarily removing only
`storybookVitestRuntimePlugin` from the config plugin list. Its focused test
exited `1` with `expected [ Promise{…} ] to include { …(2) }`. The entry was
immediately restored with `apply_patch`; `vitest.storybook.config.ts` has no
final delta.

### GREEN

The minimal production changes were:

1. make any detected truncation marker invalidate a zero-hit Storybook log;
2. require the lookup fixture map to own the requested key;
3. count only eligible editable application-source coverage entries and expose
   rejected executable entries in CLI output, anchored to the repository root;
   and
4. allow coverage script configs only when they are the reviewed unit or
   Storybook leaf configs, while asserting runtime-plugin wiring from the
   resolved config object.

After the changes and both controlled restorations, the same five-file focused
suite was run twice. The final required combined command was:

```powershell
npm run test:unit -- --reporter=default tests/unit/config/vitestTopology.test.ts tests/unit/config/storybookVitestContract.test.ts tests/unit/quality/storybookLogAudit.test.ts tests/unit/quality/coverageReportAudit.test.ts tests/unit/storybook/mswHandlers.test.ts
```

It exited `0`: **5 test files, 43 tests passed**. The same run emits an existing
`@chromatic-com/storybook` preset-load unhandled-rejection diagnostic while
these config tests import the resolved Storybook config (`http://localhost:3000/preset.js` is not an absolute filename). Vitest still reports the suite as
passed and exits zero; this final-review wave neither changes nor suppresses
that unrelated environment diagnostic.

## Evidence-artifact verification

The retained acceptance logs were read from
`C:\Users\gregm\AppData\Local\Temp\storybook-diagnostic-remediation-acceptance-20260830-211500`.
Fresh auditor commands returned:

```text
CLEAN  05-storybook-coverage-attempt1.log
CLEAN  11-storybook-no-coverage-full-attempt2.log
CLEAN  reports/coverage/storybook/coverage-final.json
  executable entries: 276
```

All three commands exited zero. The count remains the accepted 276 intended
executable entries with no invalid entries; no coverage policy, source-map
policy, retry, or timeout changed.

`npm run type-check` and `npm run lint` each exited `0` after the fix wave.
`git diff --check` produced no whitespace errors.

## Files changed

- `scripts/audit-storybook-log.ts`
- `scripts/audit-coverage-report.ts`
- `.storybook/msw-handlers.ts`
- `tests/unit/quality/storybookLogAudit.test.ts`
- `tests/unit/quality/coverageReportAudit.test.ts`
- `tests/unit/storybook/mswHandlers.test.ts`
- `tests/unit/config/vitestTopology.test.ts`
- `tests/unit/config/storybookVitestContract.test.ts`
- `docs/change-record/2026-08-30-storybook-remediation-audit.md`
- `docs/change-record/storybook_remediation_atomic_status.md`
- this report

## Documentation and self-review

The final acceptance record now corrects the telemetry ownership list,
including `previewEnvStubs.test.ts` exactly once, records the successful full
Storybook MCP test gate and the focused resolution of the prior
`SubmittedSuccess`/`ErrorSummary` timeouts, and limits the manager-memory claim
to its observed OOM, plausible installed-source attribution, and unmeasured
manager peak/worker comparison. The atomic status document now labels itself a
historical checkpoint and links to the final audit.

Self-review confirmed the three protected Copilot script files and
`.storybook/preview.ts` are absent from the final diff, as are `package.json`,
`package-lock.json`, `vitest.storybook.config.ts`, generated/vendor files, UI
components, and stories. No dependency, retry, timeout, coverage-scope, or
source-map-policy change was made.

## Residual concerns

- Criterion 14's original dependency-isolation experiment remains deliberately
  unperformed and therefore limited exactly as the accepted 97/100 review
  recorded.
- The manager/Test-panel path remains an unmeasured operational risk; this wave
  corrects the wording but does not claim to fix it.
- The pre-existing Chromatic preset-load diagnostic described above remains
  visible during config-test imports despite their zero exit status.
