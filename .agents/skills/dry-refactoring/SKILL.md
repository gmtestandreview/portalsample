---
name: dry-refactoring
description:
  Use when finding or eliminating copy-paste duplication with jscpd, including
  exact, renamed, near-miss, or cross-format clones. Prioritize high-impact
  hotspots, preserve behavior, reject false-positive abstractions, and verify
  each refactor with the same detection settings and relevant tests.
---

# dry-refactoring

Use jscpd findings to remove real duplication without creating worse
abstractions.

## Inputs and boundaries

Accept either:

- an existing jscpd clone report; or
- a code path the user wants scanned for duplication.

Do not treat every similar-looking block as a defect. Generated code,
intentional boilerplate, unrelated semantics, short idioms, and test fixtures
may be valid duplication.

## Detect and prioritize

Use jscpd v5 so the documented flags remain stable:

```bash
npx -y jscpd@5 --reporters ai <path>
```

For larger codebases, add `--summary` and start with files that combine high
duplicated-token volume with high `dup%`.

If related formats should be compared together, add a cross-format group such
as:

```bash
npx -y jscpd@5 --reporters ai --cross-formats js-ts <path>
```

Work in this order:

1. **Exact clones** — default scan. Treat these as the strongest refactoring
   candidates.
2. **Renamed clones** — only after exact clones are reviewed:
   ```bash
   npx -y jscpd@5 --reporters ai --ignore-identifiers --min-tokens 70 <path>
   ```
3. **Near-miss clones** — only after exact/renamed review:
   ```bash
   npx -y jscpd@5 --reporters ai --max-gap-lines 1 --similarity <path>
   ```

Normalized and similarity scans are intentionally noisier. Use them to find
candidates, not to prove a defect.

### Reading the `ai` report

Each clone line puts the two fragments on either side of `~`; a trailing suffix
names the clone kind and feeds the classification in step 2 below:

- no suffix — exact clone;
- `(renamed)` — differs only in identifiers, literals, or annotations;
- `[~N gap]` — two exact clones merged across up to `--max-gap-lines` unmatched
  lines, where `N` is the matched-token share;
- `[~N ast]` — a function pair whose normalized syntax trees share at least the
  `--similarity` ratio.

## Refactor workflow

For each clone family:

1. Read both reported fragments and enough surrounding code to understand
   behavior and call sites.
2. Classify the finding as exact, renamed, gap-similar, or AST-similar.
3. For renamed/similar findings, list the actual semantic differences before
   proposing an abstraction.
4. Skip the candidate when:
   - the blocks have different semantics despite similar shape;
   - duplication is generated or intentional boilerplate;
   - a shared abstraction would need a vague name;
   - the useful shared body is roughly under 10 lines;
   - removing duplication would increase coupling or branching more than it
     reduces code.
5. Choose the smallest precise abstraction that removes the duplication.
6. Before editing, inspect repository status and existing tests. Preserve
   unrelated user changes.
7. Apply the refactor across all affected call sites, not only the two reported
   locations.
8. Run the relevant tests or validation for the changed behavior.
9. Re-run jscpd with the **same flags and scope that found the clone**. Confirm
   the clone is gone and the touched hotspot does not regress.
10. Repeat by impact: exact first, then renamed, then near-miss. Report skipped
    candidates separately with reasons.

Read [references/clone-strategies.md](references/clone-strategies.md) when
choosing how to abstract a renamed, gap-similar, AST-similar, cross-format, or
test-only clone.

## Safety and stopping rules

- Never delete or merge code solely because jscpd reports a clone; read the code
  first.
- Do not overwrite unrelated working-tree changes.
- Keep refactors behavior-preserving unless the user explicitly requests a
  behavior change.
- If tests are absent, failing before the refactor, or insufficient to protect
  the behavior, state that limitation and use the strongest available validation
  instead of claiming success.
- Do not gate CI on renamed or near-miss scans until the team has reviewed their
  false-positive rate on the codebase. Exact-clone gating is the safer default.
- Keep separate baselines for materially different detection settings because
  clone fingerprints differ across normalized/similarity runs.
- Stop and report rather than forcing an abstraction when the duplicate is
  intentional or the shared concept cannot be named precisely.

## Completion criteria

A refactor is complete only when:

- the targeted clone family is removed or explicitly retained with a reason;
- all affected call sites are updated;
- relevant tests/validation pass or limitations are reported;
- the confirming jscpd run uses the same detection settings and scope;
- unrelated behavior and user changes are preserved;
- the final report distinguishes refactored, retained, and unverified findings.
