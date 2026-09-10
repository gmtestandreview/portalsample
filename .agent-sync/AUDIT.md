# Pipeline Audit Report — 2026-09-10

**Branch:** `feat/a-team-agents-commands-docs` (51 commits ahead of origin/main)
**Audit date:** 2026-09-10
**Auditor:** harness-optimizer (Tier 3)

---

## Executive Summary

**AUDIT CLEAN — No rule violations detected**

The branch introduces A Team skills, agents, commands, and documentation changes, plus MCP server wiring and new npm dependencies. All policy-sensitive changes are properly scoped, have ADR support, or comply with governed rules. No gate weakening, no rule evasion, and no injection risk detected.

---

## Scope of Changes

**Branch composition (51 commits, ~450 files changed):**

- 99% **Markdown and documentation**: ADRs, skills, agents, commands, design docs, change records, Qdrant semantic-memory documentation
- **Non-Markdown changes** (scanned for policy violations):
  - `package.json` / `package-lock.json` — 3 new deps added
  - `.github/workflows/claude.yml` — NEW CI workflow (GitHub MCP trigger)
  - `.claude/settings.json` — tracked per ADR 2026-09-09
  - `.mcp.json`, `.vscode/mcp.json`, `.codex/config.toml`, `.lsmcp/config.json` — MCP server wiring
  - `scripts/github-mcp-server.cmd`, `scripts/lsmcp-typescript-mcp.cmd` — launcher scripts
  - **NO changes to ClientApp/src** (no React/TypeScript logic changes)

---

## Critical Findings

### 1. Dependency Pinning Policy (ROUTING.md §3.8)

**Rule:** Lint / Vitest / Storybook dependency versions are pinned exactly. Do not let syncpack rewrite them to `^` ranges.

**Evidence:**
```
package.json diff (origin/main → HEAD):
+ "@qdrant/js-client-rest": "^1.19.0"     (NEW dep, caret is normal)
+ "@mizchi/lsmcp": "^0.10.0"               (NEW devDep, caret is normal)
+ "typescript-language-server": "^6.0.0"  (NEW devDep, caret is normal)

No existing exact pins loosened. No syncpack rewrite detected.
```

**Verdict:** ✓ **PASS** — New dependencies added with caret ranges (normal for new additions). No policy violation.

---

### 2. GitHub Actions Workflow Safety

**File:** `.github/workflows/claude.yml` (NEW)

**Security checks:**

| Check | Result | Finding |
|-------|--------|---------|
| **Guard condition** | `contains(github.event.comment.body, '@claude')` | ✓ Safe — no variable interpolation in conditional |
| **Action pinning** | `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1` (SHA v7) | ✓ SHA-pinned to commit hash |
| **Action pinning** | `anthropics/claude-code-action@5ccc3a35a6367cdb8e6fbd0728287467540ecfe2` (SHA v1.0.219) | ✓ SHA-pinned to commit hash |
| **Permissions block** | contents, pull-requests, issues, actions | ✓ Reasonable scope for use case |
| **Secret references** | `${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}`, `${{ secrets.GH_PERSONAL_ACCESS_TOKEN }}` | ✓ No inline secrets exposed |
| **Timeout** | 30 minutes | ✓ Reasonable for agent runs |

**Verdict:** ✓ **PASS** — Workflow is properly scoped, SHA-pinned, and has no injection risk.

---

### 3. Policy-Sensitive File: `.claude/settings.json`

**File:** `.claude/settings.json` (308 lines, tracked after being git-ignored)

**Policy decision:** ADR `2026-09-09-track-claude-settings-json.md` — *Accepted*

**Key points:**
- Supersedes the `settings.json` half of 2026-08-27 audit finding B5
- `.claude/settings.local.json` remains ignored (per-machine personal grants)
- Tracked file carries: 50 `Skill()` allow-list entries (A Team pre-approvals), security-gate hook, session-start hook, post-tool-use hook, deny list
- Acceptance criteria: permission changes are reviewed like code; the file reflects shared project policy
- **No over-broad grants detected** in tracked permissions

**Verdict:** ✓ **PASS** — Policy-sensitive file has an accepted ADR backing it. Change is properly documented and reviewable.

---

### 4. MCP Configuration Wiring

**Files:**
- `.mcp.json` (GitHub MCP server entry added)
- `.vscode/mcp.json` (GitHub MCP server entry added)
- `.codex/config.toml` (NEW, MCP registration)
- `.lsmcp/config.json` (NEW, TypeScript Language Server config)

**Token/Secret Exposure Checks:**

| File | Potential exposure | Finding |
|------|-------------------|---------|
| `.mcp.json` | GitHub token reference | `"codeUrl": "env:GH_PERSONAL_ACCESS_TOKEN"` — env var reference, not inline ✓ |
| `.vscode/mcp.json` | GitHub token reference | Same as above ✓ |
| `.codex/config.toml` | Qdrant API key reference | Checked in branch history (commit 152dcab): `QDRANT_API_KEY` secret deleted from GH after use; `.gitignore` blocks `.qdrant/` directory ✓ |
| `.lsmcp/config.json` | TypeScript LS config | Contains file patterns, schema reference, ignore patterns — no secrets ✓ |
| `scripts/github-mcp-server.cmd` | GitHub token reference | `docker run -e` passes `GH_PERSONAL_ACCESS_TOKEN` as env var (from shell environment), not inline ✓ |

**Verdict:** ✓ **PASS** — All token references use environment variables, not inline secrets. No exposure risk.

---

### 5. File Claims Hygiene (ROUTING.md §File Claims)

**Table state (lines 276–308):**
- All four claims from `COVERAGE-GATE-001` are marked `done`
- No active `in-progress` rows
- No stale claims blocking new work

**Verdict:** ✓ **PASS** — File Claims properly managed, no collision risk.

---

## Verification Evidence Assessment

**Expected evidence for a code-only branch:** `npm run type-check`, `npm run lint`, or `npm run test:ci` in bash history or `.agent-sync/results/*.json` files

**Evidence found:**
- **Bash command log:** Extensive work (2026-09-09 to 2026-09-10) including tokensave init, mcp2cli setup, Qdrant skills, ADRs, git status checks
- **Test/build runs in log:** NONE — no `npm run type-check`, `npm run lint`, `npm run test:ci`, or `npm run migration-check` commands

**Calibration for this branch type:**
- Branch is **99% Markdown** — skills, agents, commands, docs, ADRs, specs
- **3 new npm deps** added (parse-safe to check, but not a logic change)
- **No ClientApp/src changes** — no React/TypeScript verification strictly needed
- **No task claims completion** in `.agent-sync/DAILY.md` — DAILY.md is dated 2026-09-02 (prior session, stale)

**Verdict:** ⚠ **ADVISORY** — No verification runs recorded in this session. However, **no task has claimed completion that would require verification**. The branch is staged for **review-agent dispatch** (code-reviewer, security-reviewer for settings.json, infra-reviewer for workflow), not claiming verification-before-completion yet. Advisory: if a task is marked complete in DAILY.md future, run the verification suite before merge.

---

## Dependency Security Policy Check

**Rule:** (ROUTING.md §3.8) Exact pins for lint/vitest/storybook prevent silent version-compatibility risk.

**Package.json analysis:**
```json
{
  "dependencies": {
    "@qdrant/js-client-rest": "^1.19.0"  // NEW — caret range (normal for new dep)
  },
  "devDependencies": {
    "@mizchi/lsmcp": "^0.10.0",           // NEW — caret range (normal for new dep)
    "typescript-language-server": "^6.0.0" // NEW — caret range (normal for new dep)
  }
}
```

**Lint/Vitest/Storybook existing pins:** No changes detected. All remain exactly pinned.

**Verdict:** ✓ **PASS** — Policy maintained. New deps use caret ranges (expected). No loosening of governed pins.

---

## Summary Table

| Category | Status | Finding |
|----------|--------|---------|
| **Dependency Pinning Policy** | ✓ PASS | No loosening of exact pins; 3 new deps with caret ranges (normal) |
| **CI Workflow Injection Risk** | ✓ PASS | SHA-pinned actions, safe guard, no inline secrets |
| **GitHub Workflow Permissions** | ✓ PASS | Reasonable scope for `@claude` mention-triggered agent |
| **Settings.json Tracking** | ✓ PASS | ADR 2026-09-09 accepts the decision; proper governance |
| **MCP Server Configuration** | ✓ PASS | No inline tokens; env-var references only; secrets cleaned |
| **File Claims Hygiene** | ✓ PASS | No active claims; COVERAGE-GATE-001 claims released |
| **Verification Evidence** | ⚠ ADVISORY | No verification runs in this session; no task claims completion |
| **Gate Weakening** | ✓ PASS | No thresholds lowered, no policy relaxed |

---

## Verdict: AUDIT CLEAN

**This branch is eligible for merge preparation.** No rule violations, no gate weakening, and no injection risk detected. The branch is stage-appropriate for review-agent dispatch and the `/quality-gate` workflow.

**Prerequisites for merge:**
1. Code review agents (`code-reviewer`, `security-reviewer`, `infra-reviewer`) complete their reviews
2. If any task is marked complete in `.agent-sync/DAILY.md` during review, run verification suite before merge
3. SonarCloud quality gate must pass (already in place)

---

**Audit Sign-off:** harness-optimizer · 2026-09-10 · 2026-09-10T10:25:00Z
