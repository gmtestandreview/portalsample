# Outstanding TODOs — Chat History Review

Reviewed range: 2026-08-25 to 2026-09-25 (Part 1). Generated 2026-09-25.

## Uncommitted work / branch hygiene

- [ ] `biome_fixes` branch has a large uncommitted diff (matches the 107-file
  pile noted Sep 22, #143) — review and commit or discard before doing more
  work on it.
- [ ] Verify whether PR #4 (`feat/a-team-skills-canonical`) and PR #5
  (`feat/a-team-agents-commands-docs`) are still open — last confirmed status
  was "both OPEN" on 2026-09-09.
- [ ] `tokensave` isn't tracking `biome_fixes` — it's still serving symbol
  data from `main` (#165, Sep 23). Register the branch or restart the
  tokensave MCP server.

## Security / config

- [ ] **PAT rotation — due 2026-12-01**, owned by @gregm, for the
  `claude.yml` fine-grained token (#59, Sep 10). Not yet due but the only
  dated commitment found — worth a calendar reminder.
- [ ] "Temporary token files in .cmd scripts not deleted on interrupt" (#53,
  Sep 10) — flagged medium-severity, no later observation shows it was
  fixed.
- [ ] Investigate `ClientApp/src/external/` — an untracked directory
  containing only `desktop.ini` and a `raw.githubusercontent.com/`
  subfolder (#153, Sep 22). Looks like a stray download/cache artifact;
  confirm it isn't something that shouldn't be there and .gitignore or
  delete it.
- [ ] `.markdownlint-cli2.jsonc` was found overwritten with deliberately
  invalid JSON on Sep 23 (#162) — confirm it's since been restored to valid
  config (it disables MD040).

## Markdown lint remediation (in progress)

- [ ] MD013 (line-length) is the largest remaining bucket — 493 of ~987
  total violations, not yet batched (only MD031/MD022/MD032/MD029/MD004/
  MD026/MD034/MD038/MD060/MD056 "Batch A" and MD040 fence-language are done
  as of Sep 25 morning).
- [ ] MD060 (table-column-style, 104 occurrences) — check whether this was
  actually covered by "Batch A" or still needs its own pass.

## Skill-creator (writing-skills)

- [ ] Activation eval iteration 2 still had persistent false positives on
  near-miss vocab (e.g. "optimize activation conditions for browser
  extension") and one holdout timeout (#137, Sep 21 10:18pm) — no
  iteration-3 result found; looks unresolved/deployment-blocking.
- [ ] Regression suite `test_generate_review.py` was hanging past a 180s
  timeout with no output (#111, Sep 20) — status after that not confirmed.

## Repo relocation plan (paused?)

Plan exists at `docs/plans/2026-09-20-relocate-repo-to-portal-example.md`,
but the working tree is still at the original `source-map-capture` path —
relocation was **not executed**. If still wanted:

- [ ] `.claude/settings.local.json` has 10+ hardcoded absolute paths that
  would break (#97).
- [ ] `.worktrees/vscode-problems-remediation` uses bidirectional absolute
  path links that would break (#102).
- [ ] `.venv` and claude-mem state would also need to be recreated
  post-move.

## Loose ends, lower confidence

- [ ] `test_writing_skills_metadata.py` had 2 failing tests around
  `called_writing_skills_alias` coverage (#91, Sep 20) — not seen fixed in
  later observations.
- [ ] claude-mem `worker-service.cjs` was failing its health check, blocking
  VS Code memory completions (#93, Sep 20) — no later fix observed (though
  it's clearly working now, so this may already be resolved).

---

Everything else scanned from this range (auth bypass removal, SEC-010 IDOR,
Node 24 migration, React Aria reorg, dashboard-ta infinite loop, Vitest/
Biome LSP issues, worktree branch tracking) shows an explicit completion
marker in memory and was left off this list.

## Part 2 — 2026-08-01 to 2026-08-25

**No recorded activity for Aug 1–22.** Both the claude-mem observation index
and the REMEMBER daily/archive logs are empty for that span — the archive
jumps directly from "Week of Jul 7–13" to "Week of Aug 18–24", and the raw
`.remember/logs` archives jump from Jul 12 to Aug 23. No sessions appear to
have run against this project in that window.

Activity resumes Aug 23–25 on `fix/dependency-vulnerability-remediation`:

- [ ] **`datePickerWrapper` timezone bug — deferred Aug 23**, never seen
  resurfaced or fixed in any later observation through Sep 25. Likely still
  open.
- [ ] Two other infra bugs were "deferred" alongside the above on Aug 23
  (unnamed in the log) — identity unconfirmed; worth checking PR #1 / the
  npm-deprecation plan doc for what they were.
- [x] ~~G0B gate (npm deprecation remediation, lane B) awaiting user
  lane-auth decision (Aug 24)~~ — authorization was evidently granted: D1
  executed Aug 25 (Node ≥24.0.0 raised, ESLint 8 deps removed, 13 ESLint 10
  findings fixed). D2 (3 `glob@10.5.0` overrides under remark-cli) was
  scoped but blocked by session rate limit at end-of-day Aug 25; the
  Sep 1–7 archive entry ("dependency remediation phases 1-3 complete") 
  indicates this was finished shortly after — not currently outstanding,
  included for completeness of the search window.
