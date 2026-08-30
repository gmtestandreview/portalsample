# Storybook Diagnostic Remediation — Audit & Re-Remediation

**Date:** 2026-08-30
**Branch:** `fix/dependency-vulnerability-remediation`
**Plan:** `docs/superpowers/plans/2026-08-30-storybook-diagnostic-remediation-audit.md`
**Audited commit:** `23f0a2f` — *feat: Refactor Storybook integration and coverage configuration*

This record audits the previous remediation attempt, re-establishes evidence for
the three Storybook diagnostic groups, and states plainly which claims are
measured and which are not.

---

## Dependency isolation

**Finding (F6): a dependency governing the issue under investigation moved in the
same commit as the fix, without being declared.**

### The lockfile delta

```text
$ git show --stat 23f0a2f -- package-lock.json
 package-lock.json | 78 ++++++++++++++++++++++++++++++++++++++++++++++++++-----
 1 file changed, 72 insertions(+), 6 deletions(-)

$ git show 23f0a2f -- package-lock.json | grep -E "^[+-]\s+\"version\"" | sort | uniq -c
      1 +      "version": "0.5.4",
      1 +      "version": "1.0.5",
      1 +      "version": "2.1.4",
      1 +      "version": "4.2.0",
      1 -      "version": "0.5.3",
      1 -      "version": "1.0.4",
      1 -      "version": "2.1.3",
      1 -      "version": "4.1.0",
```

| Package | Old | New | Relevance |
| --- | --- | --- | --- |
| `ast-v8-to-istanbul` | 1.0.4 | 1.0.5 | **This is the V8-to-Istanbul remapper** — the exact component blamed for the `terms-config.json?import` parse failure |
| `magicast` | 0.5.3 | 0.5.4 | transitive of `@vitest/coverage-v8` |
| `obug` | 2.1.3 | 2.1.4 | transitive of `@vitest/coverage-v8`, `vitest` |
| `std-env` | 4.1.0 | 4.2.0 | transitive of `@vitest/coverage-v8`, `vitest` |

The commit also added `resolved` fields to 33 lockfile entries:

```text
$ git show 23f0a2f -- package-lock.json | grep -cE '^\+\s+"resolved"'
33
```

That is consistent with the known, deferred lockfile-corruption defect on this
branch (1272 packages missing `resolved`) partially self-healing during an
incidental re-resolution.

### The bump was incidental, not declared

```text
$ git diff 23f0a2f~1 23f0a2f -- package.json | wc -l
0
```

`package.json` is **unchanged** by `23f0a2f`. The lockfile therefore moved with no
declared dependency change — an incidental `npm install` re-resolution rather
than an intentional upgrade. This violates the spec's *No unrelated files or
dependencies changed* criterion.

### Installed tree

```text
$ npm ls ast-v8-to-istanbul magicast obug std-env
nmi-portal@0.1.0
+-- @vitest/coverage-v8@4.1.11
| +-- ast-v8-to-istanbul@1.0.5
| +-- magicast@0.5.4
| +-- obug@2.1.4
| `-- std-env@4.2.0
`-- vitest@4.1.11
  +-- obug@2.1.4 deduped
  `-- std-env@4.2.0 deduped
```

All four are transitive dependencies of `@vitest/coverage-v8@4.1.11` and each
deduplicates to a single version. No blocking condition triggered.

### Action taken

The lockfile was **not** reverted. `package.json` declares no change, `npm ci` is
reproducible against the current file, and reverting would reintroduce the 33
missing `resolved` entries. The causally-relevant package is instead pinned by a
guard so the next incidental re-resolution is loud rather than silent:

`tests/unit/config/dependencySecurity.test.ts` → `describe("coverage remapping cohort")`

```ts
it("resolves the V8-to-Istanbul remapper at exactly one reviewed version", () => {
  expect(installedVersions("ast-v8-to-istanbul")).toEqual(["1.0.5"]);
});

it("keeps the coverage provider aligned with the Vitest cohort", () => {
  expect(installedVersions("@vitest/coverage-v8")).toEqual(["4.1.11"]);
});
```

Result: `Test Files 1 passed (1) / Tests 36 passed (36)` (34 before).

### NOT PROVEN — the confound is documented, not cleared

Plan Task 2 Step 5 called for reproducing the JSON remap failure at
`ast-v8-to-istanbul@1.0.4` — checking out the prior lockfile, running `npm ci`,
capturing a full Storybook coverage run, then `npm ci` again to restore. **That
step was not run**, by explicit decision: it requires two full dependency
reinstalls (including Playwright browser re-provisioning) and an estimated
45–90 minutes.

Therefore:

* It is **recorded** that `ast-v8-to-istanbul` moved 1.0.4 → 1.0.5 in the same
  commit as the remap fix.
* It is **not established** whether the configuration change or the dependency
  bump is what stopped the `terms-config.json?import` parse failure.
* Any later claim that the config was the cause must cite this gap. The
  attribution in `23f0a2f` remains confounded.

The guard above ensures the version cannot drift further without a failing test,
which bounds the confound even though it does not resolve it.

**Follow-up:** run the Task 2 Step 5 isolation when a full reinstall is
affordable — e.g. alongside the next planned `npm ci` cycle.
