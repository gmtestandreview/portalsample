# Lockfile Integrity — `resolved` and `integrity` are missing for 1272 of 1398 entries

Investigated 2026-08-29 at commit `7e22586` on `fix/dependency-vulnerability-remediation`.

Found while resolving npm 11.17's `allow-scripts` warning: `npm approve-scripts` could not
write a pinned approval for any package, and the reason turned out to be a much larger
problem than the warning itself.

## What is wrong

| Measure | Count |
| --- | ---: |
| Entries in `package-lock.json` | 1398 |
| Carrying `resolved` | 126 |
| Carrying `integrity` | 126 |
| Carrying neither | **1272** |

`integrity` is the tarball hash npm verifies on install. Without it npm has nothing to check
a downloaded package against, so for 1272 of this project's dependencies the lockfile
provides no supply-chain guarantee at all — it pins a version number and nothing more.

## Root cause

The split is not random. It correlates almost perfectly with whether the package exists in
`node_modules` on this machine:

| | present on disk | absent from disk |
| --- | ---: | ---: |
| has `resolved` | 8 | 118 |
| no `resolved` | **1272** | 0 |

The 118 entries that kept their metadata are the optional platform-specific packages for
*other* operating systems — `@esbuild/android-arm64`, `@emnapi/*`, and so on — which were
never installed here.

That is the signature of a lockfile reconstructed from an existing `node_modules` tree
rather than from the registry. For a package already on disk, npm can read its name and
version out of the installed `package.json`, but it has no registry URL and no tarball hash
to record. For a package *not* on disk it had to ask the registry, and so kept both.

This is consistent with what this workspace is: an offline source-map capture snapshot whose
dependency tree was assembled outside npm's normal registry flow.

`omit-lockfile-registry-resolved` is `false` in the current config, so this is historical,
not an active setting.

## Consequences beyond the missing hashes

npm 11.17's install-script policy identifies a package from its `resolved` URL. Where that is
absent, arborist falls back to the name from the incoming edges and reports the version as
`null`. `npm approve-scripts` only writes pinned `pkg@version` keys, and a pinned key can
never match a null version — which is why it reported "Nothing to approve" while
`--allow-scripts-pending` kept listing the same three packages. The approvals in
`package.json` are therefore name-only, and cannot be narrowed to a reviewed version until
this is fixed.

## The remedy is tested and safe

Deleting the lockfile and regenerating restores everything:

```bash
rm package-lock.json
npm install --package-lock-only
```

Run against a scratch copy of `package.json` + `package-lock.json`:

| Measure | Result |
| --- | ---: |
| Entries with `resolved` | **1290 of 1290** |
| Entries with `integrity` | **1290 of 1290** |
| Packages marked deprecated by their publisher | **0** |

Note that `npm install --package-lock-only` on its own is **not** enough — npm reports "up to
date" and changes nothing, because the lockfile is internally consistent. The file has to be
removed first.

### Blast radius

193 packages move version, all forward within their existing ranges. Every floor that
`tests/unit/config/dependencySecurity.test.ts` asserts holds:

| Package | Before | After |
| --- | --- | --- |
| glob | 13.0.6 | unchanged |
| eslint | 10.9.0 | unchanged |
| vitest, @vitest/browser, @vitest/coverage-v8, @vitest/browser-playwright | 4.1.11 | unchanged |
| dompurify | 3.4.14 | unchanged |
| brace-expansion | 1.1.18, 2.1.4, 5.0.9 | unchanged |
| nanoid, postcss, fast-uri, js-yaml, valibot, undici, body-parser | — | unchanged |
| storybook | 10.5.10 | unchanged |
| react-router | 7.18.2 | **7.18.3** |
| esbuild | 0.28.1 | **0.28.2** |
| msw | 2.14.6 | **2.15.0** |
| @parcel/watcher | 2.5.6 | **2.6.0** |

Tree shape: 4 packages drop out (`@parcel/watcher-win32-ia32`,
`@rolldown/binding-wasm32-wasi`, `acorn-import-phases`, `loader-runner`), 1 is added
(`@rolldown/binding-android-arm-eabi`).

The four that move are all patch or minor bumps. `react-router` is the only one guarded by a
floor test, and 7.18.3 satisfies it.

## Recommendation

Repair it, as its own change rather than folded into a test-stabilisation task:

1. `rm package-lock.json && npm install` (a real install, not `--package-lock-only`, so
   `node_modules` matches).
2. Run the full gate: `npm run test:ci`.
3. Re-pin the `allowScripts` entries to `pkg@version` now that identity can be resolved, and
   tighten the assertion in `dependencySecurity.test.ts` back to pinned keys.
4. Re-check `msw`: its postinstall maintains the tracked
   `ClientApp/public/mockServiceWorker.js`, so a 2.14.6 → 2.15.0 bump may produce a diff in
   that file which should be committed deliberately.
