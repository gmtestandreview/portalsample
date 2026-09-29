# Official GitHub Practices for Dependabot Workflows

Load this reference only for GitHub Actions automation around Dependabot PRs, dependency-review merge gates,
or self-hosted Dependabot runners. The linked GitHub documentation is authoritative for these time-sensitive workflows; verify it before execution or before copying version-pinned commands. If a linked page conflicts with this summary, follow the current official page and report the discrepancy.

## Dependabot and GitHub Actions

- Dependabot PR workflows can fetch dependency metadata and use it for labels, approvals, and bounded auto-merge policy.
- Prefer metadata such as dependency name/type and update type over parsing PR titles when building automation.
- Use least-privilege workflow permissions. Dependabot-triggered workflows have special secret and token behavior;
  keep Dependabot secrets distinct from ordinary Actions secrets where GitHub requires it.
- If status checks are part of the merge policy, make the required checks enforceable through repository branch/ruleset policy.
- For merge queues, the built-in `GITHUB_TOKEN` cannot add a PR to the queue. Use an appropriately permissioned PAT
  or GitHub App token only when repository policy authorizes that automation.
- Agentic analysis may assist with summaries/recommendations, but keep security enforcement and merge gating deterministic.

Official source:
https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/automate-dependabot-with-actions

## Dependency Review Action

Dependency review is separate from Dependabot configuration. It examines dependency changes in pull requests and can
be made a required merge check. Common policy controls include vulnerability severity, denied licenses, and scopes.

Do not assume a repository has dependency review merely because Dependabot is enabled. Confirm the workflow and
required-check/ruleset configuration before treating it as a gate.

Official source:
https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/customize-dependency-review-action

## Self-hosted Dependabot with ARC

Dependabot can run on self-hosted GitHub Actions runners managed by Actions Runner Controller (ARC). Treat this as an
environment-specific deployment workflow, not a normal `dependabot.yml` option.

For the documented ARC setup:
- Kubernetes and Helm are prerequisites.
- The Dependabot runner scale-set installation name must be `dependabot`.
- The documented runner uses `containerMode.type="dind"`.
- Dependabot on self-hosted runners must be enabled in repository Advanced Security settings.
- PAT scopes/permissions depend on whether runners are repository-, organization-, or enterprise-scoped.

Do not generate or expose PAT values. Verify current ARC installation commands and versions from GitHub before execution.

Official source:
https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/setting-dependabot-to-run-on-self-hosted-runners-using-arc

## Configuration and PR Optimization

Current GitHub guidance emphasizes:
- schedule controls for update timing;
- a default 3-day cooldown for version updates, not security updates;
- `groups` to reduce PR volume;
- custom labels, assignees, commit-message prefixes, milestones, branch naming, and `target-branch` when they match team policy;
- security updates always target the default branch; an entry using `target-branch` applies its configuration to version updates only.

Official sources:
https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/optimizing-pr-creation-version-updates
https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/customizing-dependabot-prs
https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/dependabot-quickstart
