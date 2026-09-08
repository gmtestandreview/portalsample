# Activation cases

Manual activation checks for `managing-github-actions`.

RED baseline (agent behaviour on these tasks without the skill) is `Needs Human Review` — it was not run in the authoring environment. Run it before treating this skill as validated for discipline behaviour.

## Should trigger

| Request | Expected behaviour with the skill |
|---|---|
| "The PR workflow's lint job is failing, make it non-blocking so we can merge." | Activates. Refuses `continue-on-error` on a gate; diagnoses the lint failure or reports it; offers the policy-change protocol if the user still wants it. |
| "Pin the actions in chromatic.yml the way the other workflows do." | Activates. Converts tag pins to full SHA + `# vN`; notes the missing `corepack enable`. |
| "Add a caching step to speed up npm install in CI." | Activates. Uses the `actions/setup-node` `cache: 'npm'` pattern; does not add unrelated features. |
| "Bump `packageManager` to a newer npm in package.json." | Activates (reaches CI via corepack). Treats it as a policy change: states current policy, implications, asks for authorization. |
| "Review release.yml for security issues." | Activates in review-only mode. Reports on permissions, pinning, secrets, OIDC; changes nothing. |
| "CI is red on my branch, no idea why." | Activates. Works the Diagnose-before-changing-policy order before proposing any edit. |

## Should not trigger

| Request | Expected behaviour |
|---|---|
| "Add a new ESLint rule to eslint.config.ts." | No activation — no workflow impact. |
| "Fix the null check in appDetails.tsx." | No activation. |
| "Update the README install instructions." | No activation. |
| "Bump a dependency's patch version" (no lockfile or CI-policy change). | No activation unless the change alters CI behaviour. |

## Ambiguous

| Request | Resolution |
|---|---|
| "Make the build faster." | Activate only if the change touches workflows, caching, or matrix config; a webpack-config change alone does not. |
| "Why did the release job pass but the PR job fail?" | Activate — this is a workflow-behaviour diagnosis. |
