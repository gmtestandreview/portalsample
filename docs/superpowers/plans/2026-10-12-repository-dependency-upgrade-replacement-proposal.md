# Repository dependency upgrade: smaller replacement proposal

**Date:** 2026-10-12 (Australia/Sydney)
**Status:** Proposed; security-graph feasibility must be resolved before
implementation clearance.
**Baseline:** `aa05cdae`, with current user changes preserved.
**Companion evidence:**
[Revalidation review](2026-10-12-repository-dependency-upgrade-revalidation.md)

This proposal replaces the September plan's single coordinated programme with
three independently releasable stages. It preserves the overall requested
outcome: exact React/React DOM 18.3.1 and TypeScript 5.9.3, tested Node 24.21.0,
reviewed direct dependencies, zero audit findings, no deprecated lock metadata,
and eventual removal of all overrides.

A stage can finish without the whole programme being complete. MSAL and
telemetry still require real integration evidence. No package, policy or
deployment change has been performed or authorized by creating this proposal.

## Decisions already made in this review

- Make patch-tool remediation a prerequisite; preserve the zero-vulnerability
  goal.
- Verify the bridge before activating MSAL 5 and its new runtime configuration.
- Separate lifecycle inventory, approval and execution checks.
- Require auth recovery coverage as well as successful renewal.
- Produce this smaller proposal; preserve unrelated workspace changes.

## What gets smaller

Use one refreshed inventory and the existing dependency/workflow policy suites.
Do not build a permanent outdated-report CLI merely to document this migration.
Keep a reviewed table of exact targets and justified holds with the release
evidence; add automation only if an ongoing CI requirement is agreed.

Keep one dependency writer because every cohort changes
package.json/package-lock.json. Separate auth's external release coordination
from tooling and runtime upgrades. Reuse existing production, unit, Storybook
and BDD gates; write new tests for new behavior rather than adding multiple
suites that only recognize implementation strings.

## Stage 0: Rebase the evidence and prove feasibility

This is inspection and planning, not an install in the current working tree.

- [ ] Preserve the current manifest/lock, dirty-file inventory and required
      supporting files in an isolated worktree when implementation begins. Never
      reset, stash or normalize user-owned changes.
- [ ] Use the repository-pinned npm 11.19.1 and provision Node 24.21.0 in that
      worktree. The review's local diagnostic tool versions were different and
      are not acceptance evidence.
- [ ] Record current manifest declarations and lock resolutions separately from
      installed node_modules. The current installed lint cohort is behind the
      matching manifest/lock.
- [ ] Recapture every direct package's current, proposed and latest versions,
      engines, peers, advisory state, and intended upgrade/hold/remove
      disposition. Include Slate, MSW, Qdrant and user-owned react-hook-form.
      Reject accidental downgrades.
- [ ] Record the present nine high affected audit entries as a failing baseline
      to fix. Do not require the unchanged vulnerable baseline to pass before
      remediation may begin.
- [ ] Resolve the retained `patch-package -> micromatch -> braces` path. The
      [current advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
      lists no patched braces release; neither WDS nor Remark removal fixes the
      patch-tool path.
- [ ] Resolve Qdrant's exact undici 7.29.0 dependency before removing the 7.30.0
      override; the repository floor is 7.29.1. Do not silently delete the
      integration.
- [ ] Select a supported, tested root-owner remedy. If it requires replacing
      patch-package/postinstall, record that specific policy change and prove
      existing patch application from a clean install. The user selected
      remediation as a prerequisite, not a particular replacement tool.
- [ ] If no acceptable root-owner solution exists, mark the graph stage blocked
      with the exact owner/version. Do not weaken audit, restore an override as
      the final outcome, fabricate a patched version, or claim readiness.

**Exit:** A reviewed, concrete path to zero audit findings and natural
resolution, exact package targets, owner dispositions and focused verification
commands. Stage 0 is not passed by this review.

## Stage A: Security, tooling and the natural dependency graph

**Primary files:** package.json, package-lock.json, patches/,
tests/unit/config/dependencySecurity.test.ts,
tests/unit/config/workflowPolicy.test.ts, .node-version, .github/workflows/,
webpack.config.js, MDX script/fixtures, tracked lsmcp files and affected
documentation.

- [ ] Explicitly set the manifest/devEngines floor, .node-version, lower-bound
      CI and Chromatic provisioning to 24.21.0 or the recorded compatible Node
      24 version. Run the unit suite on exact 24.21.0; retain the full existing
      CI gate.
- [ ] Implement the approved patch-tool/owner remedies from Stage 0. Audit all
      eight current override rules by actual parent chain.
- [ ] Replace remark-cli only if owner resolution still requires it. Preserve
      remark.config.mjs, .remarkignore, frail warnings, deterministic
      diagnostics and empty-pattern failure with behavior fixtures.
- [ ] Retire tracked lsmcp only after its explicit owner decision is recorded;
      document external launcher consumers. Do not infer no consumers from
      repository grep.
- [ ] Upgrade the WDS/CLI/Sass cohort using refreshed exact targets. Review
      actual v6 integration surfaces and start the real app and Storybook
      servers. Retain WDS's existing CommonJS config where the upstream dual
      exports support it; change only incompatible usage.
- [ ] Reassess jsdom/undici, Storybook/valibot and other owner chains together.
      Remove overrides only when their natural versions meet
      security/deprecation/peer policy.
- [ ] Keep checkout credentials out of install worktrees and step-level secrets
      away from dependency installation. Treat npm-query output as metadata
      inventory. Verify pinned npm approval semantics with
      allowed/denied/unreviewed fixture cases and separately verify required
      builds/patches executed successfully.
- [ ] Observe RED locally; commit tests only with their passing implementation.
      If multiple owner changes are needed to eliminate the current
      vulnerability, keep them in one atomic green remediation cohort.
- [ ] Run strict clean install, applicable lifecycle checks, dependency/workflow
      policy tests, npm audit at low threshold, npm ls --all, build, Storybook
      and both BDD suites. Inspect direct and transitive lockfile movement
      before accepting the graph.

**Exit:** Zero audit findings, valid strict peers/tree, no deprecated lock
metadata, no overrides, patches/builds working, correct Node surfaces, all
affected tests green. This exit is conditional on Stage 0 feasibility; it is not
promised by package bumps alone.

## Stage B: Reviewed compatible runtime and test-platform updates

**Primary files:** package.json/package-lock.json, existing dependency policy
suite, actual affected runtime components and their current tests. Telemetry
changes remain a separate commit with separate rollback.

- [ ] Preserve exact React/React DOM 18.3.1, React 18 types and TypeScript
      5.9.3. Preserve the user-owned react-hook-form range unless separately
      authorized.
- [ ] Upgrade compatible direct dependencies from the refreshed matrix. Group
      date-fns/react-datepicker together. Include the actual current Slate/MSW
      updates or record specific compatibility holds.
- [ ] Reassess Vitest 5 as one exact peer cohort.
      [Storybook 10.6.1 supports its peer range](https://github.com/storybookjs/storybook/blob/v10.6.1/code/addons/vitest/package.json);
      remaining configuration, browser and coverage-remapper risks need tests
      rather than the old blanket incompatibility claim.
- [ ] Check date/timezone behavior, navigation, error recovery and analytics
      with the existing focused suites and real builds/browser interactions
      where mocks hide integration.
- [ ] Upgrade Application Insights separately using refreshed compatible
      SDK/React-plugin peers. Construct the real modules, verify actual app
      initialization and observe one uniquely correlated synthetic page view
      plus handled exception in a non-production resource/transport. Keep
      bounded polling, redacted evidence and no production credentials in PR CI.
- [ ] Capture an explicit final direct-dependency disposition for every outdated
      package. A temporary sequencing hold is recorded as incomplete programme
      work with an owner/review trigger; it is not relabelled as a compatibility
      hold.
- [ ] Run each cohort's focused gate and audit/tree checks; then run the
      complete canonical gate before release.

**Exit:** Compatible runtime and telemetry upgrades verified; any remaining
compatibility holds are evidence-backed. MSAL work belongs to Stage C, so Stage
B alone cannot satisfy the overall “all compatible outdated dependencies
upgraded” outcome.

## Stage C: Dedicated MSAL application and external release

**Primary files:** auth bootstrap/config/provider/logout, Webpack entry and HTML
output, isolated bridge, focused auth/build tests, a bridge verifier, opt-in
staging config/spec and operational runbook. Retain a temporary staging harness
only when needed to force the real renewal path; do not ship test APIs or
credentials in the app.

- [ ] Name Entra, hosting, staging and rollback owners. Record actual URIs,
      immutable old artifact, runtime-config snapshot, supported activation
      mechanism and exact rollback operations.
- [ ] Accept the auth ADR, including the global iframe-navigation behavior. Do
      not infer acceptance from this proposal.
- [ ] Recapture the MSAL Browser/React pair and both v3-to-v4/v4-to-v5 migration
      contracts. Candidate latest at review time is Browser 5.25.0 / React
      5.7.2; the latter requires Browser ^5.24.0. Pin only after review.
- [ ] Migrate removed APIs/options/request fields, test real-package startup,
      remove obsolete patches, and build entry-aware main and bridge output with
      isolated same-origin assets.
- [ ] Deploy the inert bridge and route headers independently, or deploy to an
      inactive slot that cannot receive ordinary application traffic. Keep the
      old application/config active.
- [ ] Register the new Entra URI additively and verify the actual bridge's
      direct 200, no redirection, no-store, absent COOP, restrictive CSP and
      isolated script. The
      [upstream bridge guidance](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/msal-browser-v5.23.0/lib/msal-browser/docs/redirect-bridge.md)
      remains relevant.
- [ ] Activate MSAL 5 and the matching runtime redirect configuration together
      only after bridge verification.
- [ ] Verify real login/return-to-route, forced hidden-iframe renewal, protected
      API and logout. Also test blocked third-party cookies and expired IdP
      session: supported interaction recovery or an explicit recoverable error,
      no loop/spinner, and no auth-material disclosure.
- [ ] Use a supported browser matrix. The
      [Skip policy](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/msal-browser-v5.23.0/lib/msal-browser/docs/token-lifetimes.md)
      is valid for renewal-path testing but requires an appropriate
      cookie/session environment.
- [ ] Keep real credentials out of PR CI. Disable sensitive
      traces/video/screenshots and sanitize diagnostics. Run the required
      successful staging observations in fresh contexts, plus the failure-path
      cases.
- [ ] Canary with defined metrics/sample size and a named release authority. On
      failure, restore old artifact and runtime config and verify old
      login/token/API/logout behavior. Retain both redirect URIs through the
      rollback window.

**Exit:** Real auth and rollback evidence approved by the external owners. No
production deployment is authorized by this proposal.

## Verification map

```text
Stage 0: current manifest/lock + registry + advisories
    |
    v
Feasible owner remedy? -- no --> BLOCKED with exact owner/version
    |
   yes
    v
Stage A: strict install -> scripts/patches -> graph/security -> real servers
    |
    v
Stage B: focused runtime + test-platform + independent telemetry integration
    |
    v
Stage C: inert bridge -> deployed verifier -> atomic auth/config activation
    |
    +--> real login/renew/API/logout
    +--> blocked-cookie/expired-session recovery
    +--> canary failure -> restore old artifact/config -> restoration smoke
    |
    v
Final programme acceptance: full canonical gate + exact constraints + zero audit
```

Baseline commands remain the existing root scripts. Implementation must also
verify the actual proposed scripts only after they exist. Do not run September
commands referencing absent staging/verifier commands and treat that as a test
failure in implemented code.

At each release boundary require type-check, lint, MDX lint, test:ci, both BDD
suites, production build and Storybook documentation verification in canonical
order. Add strict install/audit/tree checks and the focused integration evidence
relevant to that stage. Re-run the relevant gate after any corrective change.

## Rollback and parallel work

Application and manifest/lock changes are sequential under one writer. Keep
every accepted cohort green; revert its complete test/config/package change as a
unit. Stages B and C must preserve Stage A's security result.

External owner discovery and URI/header/rollback planning may proceed alongside
Stage A without touching its manifest/lock. Auth implementation waits for an
accepted ADR and a stable dependency baseline. Independent telemetry and auth
releases have distinct rollback decisions; no parallel package-lock edits.

## NOT in scope

- React 19, a TypeScript major upgrade, Formik conversion, or unrequested
  feature redesign.
- Automatically choosing or installing a patch-tool replacement.
- Silently removing Qdrant, treating lsmcp as unused, or widening lifecycle
  approvals.
- Building a new dependency-management platform, reusable staging framework, or
  permanent app test-control endpoint.
- Production access, Entra/hosting mutations, actual deployment, and old-URI
  cleanup.
- Waiving zero vulnerabilities or declaring completion with remaining overrides.

## Open implementation decisions

Stage 0 must identify the actual patch-tool and Qdrant owner remedies. Exact
refreshed dependency targets, any justified holds, accepted auth ADR, external
owners, supported browser behavior, activation mechanism and rollback operations
still require evidence. The user approved the review's directions, not
unselected packages or operational changes.

The proposal is smaller in release coupling and custom automation. The total
eventual goal remains broad and must not be represented as a tiny eight-file
migration.

## GSTACK REVIEW REPORT

| Review                   | Trigger                | Runs | Status       | Findings                                                              |
| ------------------------ | ---------------------- | ---: | ------------ | --------------------------------------------------------------------- |
| Engineering revalidation | plan-eng-review        |    1 | ISSUES OPEN  | Seven findings in the September plan; feasibility gates remain        |
| Independent Codex review | adversarial plan check |    1 | ISSUES FOUND | Bridge sequencing and inventory-evidence gaps confirmed               |
| Replacement proposal     | User scope selection   |    1 | PROPOSED     | Three stages plus a feasibility preflight; not implementation-cleared |

**UNRESOLVED:** Concrete upstream/patch-owner remedies and operational inputs
listed above.
**VERDICT:** Planning review complete; implementation clearance withheld until
feasibility and refreshed targets are evidenced.
