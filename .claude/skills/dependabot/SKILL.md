---
name: dependabot
description: >-
  Use when creating, reviewing, troubleshooting, or optimizing GitHub Dependabot configuration
  and workflows, including .github/dependabot.yml, version or security updates, dependency
  grouping, monorepos, multi-ecosystem groups, private registries, schedules, ignore/allow rules,
  Dependabot pull-request commands, and reviewing or merging open Dependabot pull requests.
---

# Dependabot Configuration & Management

Use this skill to turn repository dependency layout and update policy into a valid, maintainable
Dependabot setup. Prefer repository evidence over assumptions.

## Workflow

1. Inspect dependency manifests, lockfiles, workspace configuration, Dockerfiles, Actions workflows,
   and existing `.github/dependabot.yml`.
2. Map each detected ecosystem to every directory that must be covered. Do not assume the repository
   root is sufficient for a monorepo.
3. Preserve intentional existing policy unless the user asks to change it: schedules, target branch,
   grouping, labels, assignees, registries, ignore/allow rules, cooldowns, and PR limits.
4. Create or revise the single `.github/dependabot.yml` using `version: 2`. Use one or more `updates`
   entries for the required ecosystems/directories.
5. Reduce PR noise only when it matches the user's policy: use same-ecosystem `groups`,
   cross-directory grouping, or multi-ecosystem groups as appropriate.
6. Check interactions and gotchas below before presenting or applying the configuration. For GitHub Actions
   automation, dependency-review gating, or self-hosted Dependabot runners, load the official-practices reference.
7. Validate the final YAML structurally and compare coverage against the manifests found. If repository
   access or a validator is unavailable, state what remains unverified rather than claiming validation.

## Core Rules

- GitHub uses one `.github/dependabot.yml` on the default branch; represent multiple ecosystems and
  locations with multiple `updates` entries.
- `directory` is for one location. Use `directories` when multiple locations or supported glob
  patterns are required.
- For npm, pnpm, and yarn, use `package-ecosystem: "npm"`.
- For GitHub Actions, use `directory: "/"`; Dependabot searches `.github/workflows/`.
- If a standalone package has its own lockfile and is outside a workspace, give it explicit coverage.
- If `allow` and `ignore` both match a dependency, `ignore` wins.
- `open-pull-requests-limit: 0` disables version-update PRs; do not describe it as disabling
  Dependabot alerts or security updates.
- `target-branch` changes version-update targeting; security updates still target the default branch.
- Never place registry credentials directly in generated configuration. Use repository/org secrets
  and preserve secret references without exposing their values.
- Treat `insecure-external-code-execution: "allow"` as an explicit security-sensitive choice. Do not
  add it unless required by the user's ecosystem/configuration and the user accepts that behavior.

## Choosing Grouping

Use the narrowest grouping mechanism that solves the stated problem:

- **Same ecosystem, related dependencies:** use `groups` with dependency type or name patterns.
- **Same dependency across multiple directories:** use cross-directory grouping when the ecosystem
  and constraints support it.
- **Related updates across different ecosystems:** use `multi-ecosystem-groups`.
- Keep major-version updates separate when the user wants independent review of breaking changes.

Dependencies matching multiple same-ecosystem groups go to the first matching group, so order groups
intentionally.


## Reviewing Open Dependabot PRs

Treat review and merge as separate authorization levels.

1. Discover open Dependabot PRs with repository evidence (for GitHub CLI, filter author
   `dependabot[bot]`). If none are open, report that and stop.
2. Classify each update from the PR metadata. Distinguish patch, minor, major, GitHub Actions,
   security-related, and updates whose version/risk cannot be determined reliably.
3. For a review/check/show request, **do not merge**. Report the classification and available CI
   state only.
4. Before any merge, require explicit user authorization to merge the identified PR(s) or an
   unambiguous bounded class such as "merge the Actions PRs." Never infer merge authorization from
   "review", "check", "show", or "update dependencies".
5. For every authorized PR, check current CI immediately before merging. Do not merge with failed or
   pending required checks, merge conflicts, or an unresolved major/security-sensitive review. If dependency
   review is configured as a required check, treat its result as a deterministic merge gate rather than replacing
   it with update-type heuristics.
6. Merge authorized PRs one at a time without force. If a merge fails, stop acting on that PR and
   report the failure rather than resolving conflicts implicitly.
7. After a merge, refresh the remaining Dependabot PR state because rebases, conflicts, or CI status
   may have changed. For more than 10 candidate PRs, work in batches of at most 5 and obtain
   confirmation before continuing beyond the first authorized batch.

Risk classification is triage, not proof of compatibility. Patch or GitHub Actions updates may be
lower review effort, but must not be called inherently safe or merged solely because of update type.
Major updates require explicit per-PR confirmation after presenting the available breaking-change
evidence. Security-related PRs must be surfaced to the user even when the version bump is small.

When GitHub CLI is available, these commands are suitable read/action primitives:

```bash
gh pr list --author "dependabot[bot]" --state open --json number,title,labels,createdAt,headRefName --limit 50
gh pr checks <number> --json name,state,bucket
gh pr merge <number> --merge --delete-branch
```

Run the merge command only after the authorization and CI gates above. Do not force-merge. If the target uses
GitHub's merge queue, do not assume a workflow's built-in `GITHUB_TOKEN` can enqueue the PR; verify an appropriate
PAT or GitHub App token and repository policy first. If CLI
access, repository permissions, or CI visibility is unavailable, report the limitation instead of
claiming review or merge completion.

## Load References Only When Needed

- Read `references/dependabot-yml-reference.md` when you need exact ecosystem values, option syntax,
  supported values, private-registry fields, scheduling, filtering, or advanced configuration.
- Read `references/example-configs.md` when the user asks for a concrete configuration or when a
  monorepo, security-only, registry, cooldown, cron, target-branch, or multi-ecosystem example would
  reduce ambiguity. Adapt examples to repository evidence; do not copy irrelevant options.
- Read `references/pr-commands.md` when managing an existing Dependabot PR, ignore/unignore state,
  rebasing/recreating a PR, or discussing removed comment commands. Native GitHub CLI/UI/API merge
  actions are distinct from Dependabot comment commands.
- Read `references/official-practices.md` when designing GitHub Actions automation for Dependabot PRs,
  dependency-review merge gates, or Dependabot on self-hosted ARC runners. Keep enforcement and merge gating
  deterministic; do not infer these repository controls from `dependabot.yml`.
- Read `references/precommit-scanning.md` only when the user specifically asks for pre-commit
  dependency-vulnerability scanning through GitHub MCP/Copilot tooling. This is adjacent,
  environment-specific guidance, not required for ordinary Dependabot configuration.

## Important Boundaries and Gotchas

- Do not invent ecosystems, directories, package names, registry names, secret names, teams, labels,
  branches, or schedules that are not supported by repository evidence or the user's request.
- Do not silently replace an existing update policy with a "best practice." Explain material policy
  changes such as schedule frequency, grouping, ignored versions, target branch, or PR limits.
- Security alerts/settings and YAML version-update configuration are related but not interchangeable.
  Repository settings may be required for alert/security-update behavior.
- Before using a PR comment command, check `references/pr-commands.md`; merge/close/reopen comment
  commands documented as removed must not be recommended.
- If a requested option or ecosystem is not covered by the supplied references, say that coverage is
  missing and verify against current GitHub documentation before asserting syntax or support.

## Output Expectations

For a configuration task, provide or apply the smallest complete YAML that covers the detected
ecosystems and requested policy. Summarize material choices and call out assumptions or unverified
items. For an audit, identify coverage gaps, conflicting rules, PR-noise risks, security-sensitive
settings, and concrete corrections without changing unrelated policy.
