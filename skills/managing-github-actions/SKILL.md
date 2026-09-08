---
name: managing-github-actions
description: Use when reviewing, diagnosing, securing, or changing GitHub Actions workflows or CI/CD behaviour in this repository — triggers, permissions, action pinning, quality gates, CI failures, caching, releases, or deployment automation. Not for application code, docs, tests, or package.json work unless a workflow also changes.
---

# Managing GitHub Actions

## Goal

Review or change GitHub Actions with the smallest safe, repository-aligned change. Preserve the existing CI/CD architecture, security boundaries, runtime and package policy, and quality gates unless the task explicitly requires a policy change.

This is a repository-specific policy skill. Where it names concrete values (npm version, Node floor, allowed scripts, script names), the live `package.json` and `.github/workflows/` files are the source of truth. If this skill and the repository disagree, follow the repository and report the drift.

## Task map

| Task | Start at these sections |
|---|---|
| Review a workflow (report only, no edit) | **Workflow** steps 1–5, then **Security boundaries** and **Protect quality gates** |
| A CI job is failing or flaky | **Diagnose before changing policy** |
| Edit a workflow (triggers, steps, permissions, pinning) | **Workflow**, then **Security boundaries** + **Protect quality gates** |
| Change `packageManager` / `engines` / `devEngines` / `allowScripts` / root `postinstall` | **Repository runtime and package policy** + **Changing repository policy** |
| Weaken, reorder, or skip a required check | **Protect quality gates** + **Changing repository policy** |
| Add caching / matrix / artifacts / OIDC / a new action | **Scope advanced features to the task** + `references/repository-ci-catalog.md` |
| Add or change a deployment path | **Deployment changes** |
| Before claiming any of it passes | **Validation** + **Verification limits** |

## When to use

Use when the task touches `.github/workflows/`, `.github/actions/`, or CI/CD behaviour:

- reviewing or authoring a workflow;
- a failing or flaky CI job;
- workflow triggers, `permissions`, `concurrency`, or `if` conditions;
- `uses:` action references and pinning;
- quality-gate composition, ordering, or blocking behaviour;
- dependency install or lifecycle-script behaviour in CI;
- caching, artifacts, matrix builds;
- release or deployment automation, OIDC, environments.

## When not to use

- Application code, styles, docs, or tests with no workflow impact.
- `package.json` edits that do not change CI behaviour. A change to `packageManager`, `engines`, `devEngines`, `allowScripts`, or `postinstall` **does** reach CI — use this skill for those.
- Generic CI/CD best-practice advice with no change to this repository.

## Workflow

1. Read `AGENTS.md` and `CLAUDE.md` for repository instructions.
2. Read `package.json` and the affected files under `.github/workflows/` and `.github/actions/`.
3. Classify the task: review, diagnosis, implementation, security, performance, release, or deployment.
4. Inspect the existing conventions for package manager, runtime, install command, action pinning, triggers, permissions, validation, and deployment. Match them.
5. For review-only requests, report findings and change nothing.
6. For diagnosis, find the narrowest likely cause and the smallest safe fix before editing (see **Diagnose before changing policy**).
7. Keep unrelated workflows and repository policy unchanged.
8. Distinguish a workflow fix from a repository-policy change (see **Changing repository policy**). Do not make a policy change incidentally.

For the full script list, the exact `test:ci` composition, the advanced-feature decision detail, and the current workflow inventory, load `references/repository-ci-catalog.md`.

## Repository runtime and package policy

CI provisions npm through `corepack enable`, which resolves the version from the `packageManager` field in `package.json`. Every workflow job then installs with `npm ci`.

- Use npm in workflows. Do not introduce pnpm or yarn into CI. `AGENTS.md` permits pnpm and yarn for *local* validation only; the workflows use npm exclusively and depend on `package-lock.json`.
- Preserve `npm ci`. Do not replace it with `npm install` to work around an install failure.
- Preserve the `corepack enable` step and the `COREPACK_ENABLE_DOWNLOAD_PROMPT: '0'` environment value that stops corepack blocking on its download prompt.
- Do not downgrade Node below the floor declared in `engines.node` / `devEngines.runtime`.
- Preserve `packageManager`, the lockfile, and the install policy unless the task explicitly requires changing them.

### Dependency lifecycle scripts

`package.json` declares a top-level `allowScripts` allow-list and a root `postinstall` that runs `patch-package`. Treat both as deliberate repository policy. `allowScripts` is not a field npm reads natively — confirm which tool consumes it before relying on it as an enforced control, but do not broaden it in the meantime.

Do not:

- broadly enable dependency scripts;
- add `--ignore-scripts` or disable a permitted script to get CI green — that also disables `patch-package` and the permitted native builds;
- suppress the root `postinstall` without treating that as an explicit policy change;
- add a package to `allowScripts` without evidence its lifecycle script is required.

An install failure alone is not evidence to add a package to `allowScripts`. Before changing it: identify the dependency and the exact script, determine what it does, establish why CI needs it, assess the trust implications, make the smallest change, then rerun install and the affected validation. If the evidence does not establish need, report the blocked install instead.

## Protect quality gates

The canonical CI gate is, in order:

```text
npm run type-check
npm run lint
npm run lint:mdx
npm run test:ci        # composite: type-check + unit + storybook + quality partitions
npm run test:e2e
npm run build
npm run storybook:verify:docs
```

`references/repository-ci-catalog.md` has the exact partition commands and how `test:ci` decomposes. Run `build-storybook` / `storybook:verify:docs` only where Storybook output is relevant. `migration-check` is a separate pre-migration gate, not part of the PR gate.

Do not weaken a required gate. Specifically do not:

- add `continue-on-error` to a required step;
- add a conditional skip that creates an alternate success path;
- add a duplicate workflow that bypasses the gate;
- replace a check with a narrower or weaker command;
- add path or test exclusions that hide real failures.

Preserve gate ordering unless the task requires a change. If ordering changes, verify every required check still runs and still blocks on every success path. If a check fails, fix the cause or report it — do not make CI green by weakening the gate unless the user explicitly asks for that policy change.

## Security boundaries

For every affected workflow, check:

- `GITHUB_TOKEN` permissions are least-privilege — the repository default is `permissions: contents: read`; keep it there unless a job needs more;
- no secrets, tokens, or private data are hardcoded or printed;
- sensitive values come from GitHub Secrets or environment secrets;
- pull-request workflows handle forks and untrusted input safely;
- `uses:` references follow the repository pinning convention — first- and third-party actions are pinned to a full commit SHA with a `# vN` comment; local `./.github/actions/*` composite actions are referenced by path;
- write permissions exist only where a job needs them;
- `id-token: write` is present only where OIDC is actually used;
- deployment cannot be reached through an unintended CI path.

### Trust-boundary gotchas

- Treat event payloads and user-controlled values (PR titles, bodies, branch names, issue text) as untrusted. Do not interpolate them directly into `run:` shell; pass them through `env:` and quote.
- Treat `pull_request_target` as privileged. Do not check out and execute untrusted PR code in a job that has secrets or write permissions.
- Do not trust artifacts, caches, or generated files from an untrusted job as executable input without validation.
- Do not introduce mutable or unpinned third-party action references for convenience. If a workflow already pins by tag, treat that as drift to correct, not a pattern to copy (`references/repository-ci-catalog.md` lists the current known instances).

## Scope advanced features to the task

Add matrix builds, caching, artifacts, reusable workflows, deployment environments, OIDC, CodeQL/SAST/SCA, release automation, staging/production deploys, canary/blue-green/rollback, or self-hosted runners **only** when the user request or existing architecture justifies it. Do not add a feature because it is a general best practice.

`references/repository-ci-catalog.md` lists the constraints that apply when one of these is justified.

## Diagnose before changing policy

Check the narrowest likely causes first, in this order:

1. workflow syntax;
2. triggers, branch/path filters, `if` conditions;
3. a failing repository script (reproduce it locally);
4. npm or lockfile mismatch;
5. Node version mismatch with `engines` / `devEngines`;
6. dependency install or lifecycle-script policy;
7. cache key/path configuration;
8. token permissions;
9. missing secrets or environment approvals;
10. flaky test or CI/local environment difference;
11. action version or pinning;
12. concurrency or environment blocking.

Also check event context, expression evaluation, and shell quoting when behaviour depends on workflow inputs or external data. Do not resolve a failure by skipping the failing check.

## Changing repository policy

A policy change is distinct from a workflow fix. Policy changes include: replacing npm; lowering the required Node version; changing `allowScripts`; changing the root `postinstall`; weakening or redefining a required gate; broadly changing action-pinning policy; widening token permissions; changing production approval or deployment boundaries.

Do not introduce these incidentally while fixing another issue. If a policy change is genuinely required:

1. state the existing policy;
2. explain why it blocks the requested outcome;
3. identify the smallest change;
4. describe the security and regression implications;
5. get explicit authorization when the change is high-impact;
6. validate the affected behaviour after implementing it.

## Deployment changes

Treat a new or materially changed deployment path as high impact. Before modifying one:

1. identify the target environment, trigger, credentials, permissions, approvals, trust boundary, and rollback path;
2. establish a recoverable baseline from existing version control — do not create commits, branches, tags, or releases as recovery artifacts unless authorized;
3. preserve the separation between CI and deployment unless a redesign is explicitly requested;
4. prefer an existing or feasible OIDC path over new long-lived cloud credentials;
5. require explicit authorization before adding a production deployment path or broadening deployment permissions;
6. validate rollback assumptions;
7. mark anything not verifiable in this environment `Needs Human Review`.

## Rationalization table

| Rationalization | Reality |
|---|---|
| "The failing step is flaky, I'll add `continue-on-error`." | That removes the gate for everyone. Diagnose the flake, or quarantine the specific test with a tracking issue — the job must still fail on real breakage. |
| "`npm install` fixes the install, `npm ci` is too strict." | `npm ci` enforces the lockfile. Switching hides a lockfile-drift bug. Fix the lockfile. |
| "This dependency needs its postinstall — I'll add it to `allowScripts`." | Not until you have identified the script and shown CI needs it. An install error is not that evidence. |
| "A lighter test command will make CI green faster." | A weaker command is a weaker gate. Ordering and coverage are the gate's contract. |
| "`--ignore-scripts` just for CI." | That silently disables `patch-package` and the permitted native builds. It is a policy change, not a CI tweak. |
| "I'll pin this action to a tag, SHA pinning is overkill." | The repository pins to a full SHA with a version comment. Match it. Tags are mutable. |
| "The workflow needs `write` so I'll set it at file level." | Scope permissions to the job that needs them. The file default stays `contents: read`. |
| "It's a snapshot repo, CI correctness barely matters." | The gate is what keeps the snapshot buildable and reviewable. Treat it as production. |
| "Bumping Node or npm is unrelated to my workflow fix." | `packageManager`, `engines`, and `devEngines` all reach CI through corepack. That is a policy change. |

## Red flags — stop

- You are adding `continue-on-error`, `if: always()`, or a skip condition to a required step.
- You are replacing a gate command with a narrower one.
- You changed `npm ci` to `npm install`, or added `--ignore-scripts`.
- You are editing `allowScripts`, the root `postinstall`, `packageManager`, `engines`, or `devEngines` while fixing something else.
- You are pinning an action by tag or branch, or bumping a pin without checking the SHA.
- You added `id-token: write` or `contents: write` without a specific need.
- You are checking out PR code in a `pull_request_target` job.
- You are about to claim a workflow, deployment, or security control passes without having run it.

Any of these means: stop, re-read the relevant section, and either narrow the change or report it as a policy decision for the user.

## Validation

Run only what this environment supports.

- Start from the canonical gate in **Protect quality gates**.
- Scope it **down** to the narrowest checks the change actually affects.
- Scope it **up** to the full gate for shared-infrastructure or policy-sensitive changes.
- Validate workflow YAML with the repository's linter or validator when one exists.
- If a check fails, fix it and rerun before claiming success.

### Verification limits

Local or static validation does not prove: GitHub-hosted runner behaviour, repository or environment secret availability, environment approvals, OIDC token exchange, fork behaviour, or production deployment behaviour. Report these as unverified unless they were actually exercised. Never claim a command, workflow, deployment, or security control passed unless it was verified.

## Output

Report:

1. **Summary** — what was reviewed or changed and why GitHub Actions work was needed.
2. **Files** — workflows and policy-sensitive files reviewed or changed.
3. **Findings / changes** — quality-gate, security, runtime, trigger, package-policy, and behaviour impact.
4. **Validation** — exact commands or checks run, and their results.
5. **Residual risks** — assumptions, unavailable verification, rollback concerns, and `Needs Human Review` items.
