# Devil's Advocate Review: Repository Dependency Upgrade Plan

**Plan reviewed:** `docs/superpowers/plans/2026-09-27-repository-dependency-upgrade.md`
**Review date:** 2026-09-27  
**Verdict:** Do not approve as proposed  
**Score:** 66/100

## Executive Assessment

The plan is unusually strong on inventory, explicit version targets, file paths, and final validation breadth. It correctly preserves React `18.3.1` and TypeScript `5.9.3`, raises the Node floor to `24.15.0`, keeps the Vitest cohort compatible with Storybook, and aims for a naturally resolved graph with no overrides.

It is not implementation-ready. Two flaws can produce a failed or unsafe rollout:

1. The MSAL Browser 5 upgrade is treated as a package and export-map change, but MSAL 5 adds a redirect-bridge deployment contract. The repository uses redirect login and silent token acquisition throughout the application, so this omission can break sign-in or token renewal in production.
2. Task 2 removes all overrides while Webpack Dev Server 5 still owns `sockjs@0.3.24`, whose dependency declaration resolves `uuid@^8.3.2`. That creates a known-deprecated intermediate graph before Task 4 removes SockJS, contradicting the plan's zero-deprecation outcome and weakening every cohort commit as a rollback point.

The original 98/100 self-score measures document completeness, not execution safety. A 66/100 engineering-readiness score is more defensible: the plan has a solid skeleton, but Task 5 cannot compile as written and its critical path and external-system coverage need material redesign.

## Scope and Assumptions

- This review covers plan quality, sequencing, compatibility evidence, CI policy, rollout, and rollback. It does not implement the upgrade.
- Assumption: “Typescript 5.93” means the published `5.9.3`, as recorded in the plan; revisit if that interpretation is wrong.
- Assumption: the live `/sign-in/` headers show the current hosting baseline, not guaranteed behavior for a future dedicated bridge route. The implementation must prove the actual bridge response.
- Assumption requiring owner confirmation: the tracked lsmcp launcher has no external editor or agent consumer.

## Must Change Before Build

### MSAL 5 Requires Code and Deployment Migration — Blocker

Task 5 upgrades `@azure/msal-browser` from 3 to 5 and deletes the MSAL React patch, but treats application files as inspect/test targets. The target-version migration guide proves that the current code cannot compile unchanged:

- `ClientApp/src/index.tsx:16` calls the removed `PublicClientApplication.createPublicClientApplication`; MSAL 5 uses the separately exported `createStandardPublicClientApplication` or construction plus `initialize()`.
- `ClientApp/src/authentication/authConfig.ts:28-31` uses removed or renamed system options: `windowHashTimeout`, `iframeHashTimeout`, and `asyncPopups` become `popupBridgeTimeout`, `iframeBridgeTimeout`, and the inverse-semantics `navigatePopups`.
- `ClientApp/src/authentication/AccountProvider.tsx:223` and `ClientApp/src/routes/sign-out/index.tsx:16` put `onRedirectNavigate` on request objects; MSAL 5 removes it from redirect/end-session requests and supports it only in configuration.
- Tests and `ClientApp/src/authentication/Authentication.docs.mdx:24` encode the old API and must change with the implementation.

The plan's acceptance evidence is limited to type-checking and mocked unit tests. The official MSAL 5 guidance also says the redirect bridge is required for popup and hidden-iframe flows and affects `acquireTokenSilent` when it falls back to an iframe. It requires an exact Entra ID redirect URI registration, a same-origin bridge asset, `Cache-Control: no-store`, and no `Cross-Origin-Opener-Policy` header on the bridge response. For Webpack, Microsoft documents a dedicated entry point and HTML output.

Repository impact is broad:

- `AuthenticatedElement.tsx` uses redirect interaction.
- `authConfig.ts` supplies runtime-injected redirect and post-logout URIs.
- `AccountProvider.tsx` and many route/component modules call `acquireTokenSilent`.
- Current bootstrap and auth tests mock MSAL, so they cannot prove the real bridge, redirect, cache, header, or Entra registration contract.

Required plan correction:

- Add a pre-implementation decision for the MSAL 5 redirect strategy.
- Mark `index.tsx`, `authConfig.ts`, `AccountProvider.tsx`, the sign-out route, affected unit tests, and authentication documentation as modify targets; enumerate every v3-to-v5 API/configuration change.
- Add the bridge HTML/module and Webpack entry when following the recommended bridge model. Emit an isolated bridge chunk and HTML page that do not load the main React/MSAL tree, telemetry, analytics, or third-party assets.
- Change the development output filename from fixed `js/bundle.js` to an entry-aware pattern before adding a second entry, and test that the main and bridge bundles cannot collide.
- Add deployment/header work for `no-store` and the COOP exception.
- Add explicit Entra ID B2C redirect URI registration as an externally owned prerequisite.
- Add a real browser staging gate for initial login, redirect return, silent renewal after an expired refresh token, and logout.
- Do not merge the MSAL cohort until both repository and Entra/deployment changes are live in a coordinated rollout.
- Keep the existing `logoutRedirect` post-logout behavior unless evidence requires a bridge there; a logout redirect does not require the popup bridge.

Use an additive rollback sequence: deploy the inert bridge and route-specific headers; register the new Entra URI while retaining the old one; verify the deployed response; deploy and canary the MSAL 5 code; remove the old URI only after the rollback window.

The live `https://portal.measurement.gov.au/sign-in/` response checked on 2026-09-27 returns `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`, `ETag`, and `Last-Modified`, but no `Cache-Control: no-store`. This does not prove every future route shares those headers, but it proves that a route-specific bridge exception and response-header test cannot be left implicit.

Evidence: [MSAL Browser 5.23 migration guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/msal-browser-v5.23.0/lib/msal-browser/docs/v4-migration.md) and [redirect bridge setup](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/redirect-bridge.md).

## Must Change or Accept and Record

### Override Removal Happens Before the Root Cause Is Gone — Major

Task 2 deletes the complete `overrides` object. Task 4 later upgrades Webpack Dev Server 5 to 6 and removes SockJS. Registry metadata confirms the current path:

```text
webpack-dev-server@5.2.6 -> sockjs@0.3.24 -> uuid@^8.3.2
```

UUID 8 is now deprecated and unsupported. The current audited graph reports zero vulnerabilities, so this finding must not be overstated as a known exploitable UUID vulnerability. It is nevertheless a release and policy defect: Task 2 cannot honestly be a clean, independently acceptable rollback boundary, and it omits `npm audit` and the dependency-policy test that enforces zero deprecated lock entries.

Required plan correction:

- Retain overrides until every owner has been upgraded or removed.
- Move final override deletion into the natural-graph task after the MDX, lsmcp, Webpack/SockJS, MSAL, npm CLI, and remaining owner transitions are complete.
- Run `npm ci --strict-peer-deps`, the dependency-policy suite, `npm audit --audit-level=low`, `npm ls --all`, and the Storybook MCP/E2E smoke before committing the override-free graph.
- If the user requires every commit to be deployable, squash the graph transition into one atomic green commit.

Webpack Dev Server 6 does remove SockJS, but it also moves to Express 5, webpack-dev-middleware 8, Chokidar 5, native ESM, and revised CLI/proxy behavior. Those upstream changes should be checked explicitly, not inferred from a successful production build alone. Evidence: [Webpack Dev Server 6 release notes](https://github.com/webpack/webpack-dev-server/releases/tag/v6.0.0).

### The Plan Commits a Deliberately Red Test State — Major

Task 1 commits failing contract tests. That makes the branch non-bisectable and contradicts the claim that cohort commits are safe rollback boundaries. Running RED locally is useful; committing RED is not required.

Correction: write and run the failing tests, then commit each contract test with the cohort that makes it pass. If a temporary red commit is retained for local TDD history, squash it before review.

### The MDX Replacement Does Not Prove Behavioral Parity — Major

The proposed test checks only `package.json` strings. The replacement script must preserve more than dependency presence:

- `.remarkignore` behavior;
- `remark.config.mjs` plugin loading;
- `--frail` warning-to-failure behavior;
- deterministic path ordering;
- useful file/line diagnostics;
- failure when an expected input pattern is empty.

The programmatic `remark` flow described in Task 2 does not state how `.remarkignore` will be applied. The current ignore file excludes generated, vendor, coverage, and Storybook output paths. This is a latent parity regression even if no ignored MDX file exists today.

Correction: add isolated script behavior tests using fixtures or temporary directories, including an ignored invalid MDX file and a non-ignored warning-producing file.

### Removing lsmcp Is a Product Decision Disguised as Cleanup — Major

The repository search shows no application or CI consumer, but the tracked launcher and `.lsmcp/config.json` exist specifically for developer-agent use. An external editor or MCP configuration can invoke the launcher without creating an in-repository reference.

Correction: require an owner decision that the capability may be retired, or document its replacement and migration. The plan must not state “no blocking unknown remains” until that decision is recorded.

### Authentication and Telemetry Tests Mock the Upgraded Packages — Major

The selected MSAL and Application Insights tests replace the libraries with mocks. They validate local wiring but cannot detect a removed export, constructor mismatch, plugin incompatibility, redirect behavior, or telemetry transport failure.

Correction:

- Add a real-module import/constructor contract test for MSAL and Application Insights.
- Add a browser staging smoke for auth.
- Add a telemetry smoke that observes an initialization event, page view, and handled exception in the non-production test resource or a captured transport.
- Split auth and telemetry into separate commits; they have unrelated failure domains and rollback paths.

### “Exact Targets” Conflict With Caret Ranges — Major

The plan says implementation uses exact captured targets, but most target manifest values use `^`. A later lockfile regeneration can select versions that were never reviewed, while Task 10 explicitly permits packages published after the capture date.

Correction: pin all major-migration targets exactly for the migration PR. Relax ranges only in a later, separately reviewed policy change. Replace the date-based `npm outdated` exception with an explicit package/version allowlist and rationale.

## Consider or Schedule

### The Glob Policy Encodes an Implementation Choice as a Security Rule — Minor

Rejecting every Glob version below 13 is broader than the actual requirement. A maintained dependency may legitimately use a supported Glob 11 or 12 release. The durable policy is no deprecated lock entries and no version below a documented advisory/support floor, not “major 13 everywhere.”

### Node Lower-Bound Coverage Is Too Narrow — Minor

The exact Node `24.15.0` job runs install, lint, type-check, and build, but not the unit or runtime suites. Also, allowing `@types/node` to float ahead of the runtime floor can make unavailable runtime APIs appear type-safe.

Correction: run at least the unit suite and configuration tests on exact `24.15.0`, and pin or policy-test `@types/node` against the supported Node 24 API surface.

### Lockfile Churn Is Not Bounded Per Cohort — Minor

Repeated lockfile regeneration while most manifest entries use ranges can upgrade unrelated transitives in every cohort, obscuring causality and making rollback evidence weaker.

Correction: capture a baseline `npm ls --all`, `npm audit`, and relevant `npm explain` output; review the lockfile diff after each cohort; reject unrelated direct-version drift; and record why every unexpected transitive movement occurred.

### The html-react-parser Patch Is Assumed Necessary — Minor

The latest package still lacks the patched default export condition, but the upgraded loaders may no longer require the patch. Rebasing it without first testing a clean unpatched build preserves maintenance cost without evidence.

Correction: remove the old patch, run the focused import/build test, and regenerate the patch only if the failure is reproduced and the patch is still the narrowest solution.

### Documentation Has More Than One Consumer — Minor

The plan updates `skills/managing-github-actions/...` but should verify whether the mirrored `.claude/skills/...` material is another maintained source used by other agents. Leaving divergent CI policy references creates downstream automation drift.

## Upstream and Downstream Impact Map

| Cohort                                | Upstream contract to verify                                         | Direct repository impact                                     | Downstream operational impact                                     | Missing or weak gate                                      |
| ------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------- |
| Node/jsdom                            | Exact engine floors and npm/corepack behavior                       | `engines`, `devEngines`, CI, test environment                | Developer machines, CI runners, release jobs, containers          | Unit/runtime suite on exact `24.15.0`                     |
| MSAL 5                                | Redirect bridge, export map, Entra URI, cache and COOP requirements | Bootstrap, auth config, protected routes, silent token calls | Sign-in, token renewal, logout, B2C registration, hosting headers | Real browser auth and external configuration gate         |
| Application Insights React 18 channel | Peer versions, constructor/plugin integration                       | Bootstrap, `AppInsightsService`, error boundary              | Telemetry, dashboards, alerts, incident diagnosis                 | Real-module and transport smoke                           |
| Webpack Dev Server 6                  | Express 5, middleware 8, ESM, CLI/proxy changes, SockJS removal     | Local server, Webpack config, Playwright web servers         | Local development, BDD startup, security posture                  | Explicit migration-delta review and server readiness test |
| Sass/loader                           | Loader API and deprecation behavior                                 | Webpack and Storybook style builds                           | Production CSS and component documentation                        | Warning-free dual build                                   |
| MDX/Remark/Glob                       | Programmatic API and ignore semantics                               | `lint:mdx`, docs, config policy                              | CI lint signal and developer feedback                             | Behavioral script tests                                   |
| lsmcp removal                         | External launcher consumers                                         | Tracked launcher/config and dependencies                     | Editor/agent workflows                                            | Owner decision or migration notice                        |
| DatePicker/date-fns                   | Format, locale, parsing, timezone changes                           | Date input and validation                                    | User-entered dates across Australian time zones                   | Existing timezone tests plus focused browser interaction  |
| Router/error boundary/GA              | Major-version API and runtime behavior                              | Navigation, failure UI, analytics helpers                    | Route availability, error recovery, analytics continuity          | Real import plus navigation/analytics smoke               |
| Patch retirement                      | Upstream export behavior after all loader upgrades                  | `postinstall`, clean install, patched imports                | Reproducible developer and CI installs                            | Unpatched-first proof and clean-install gate              |

## Task-by-Task Disposition

| Task                     | Disposition                         | Devil's advocate change                                                                                                                    |
| ------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Final contracts       | Revise                              | Run RED, but commit tests only with green implementation; replace blanket Glob 13 rule with support/deprecation policy.                    |
| 2. Tooling and overrides | Split and reorder                   | Implement/test MDX replacement; obtain lsmcp retirement decision; do not remove all overrides yet.                                         |
| 3. Node/test platform    | Keep with additions                 | Run unit/runtime tests on exact `24.15.0`; constrain Node type exposure.                                                                   |
| 4. Webpack/Sass          | Move before override removal        | Review every v6 breaking change, start the real dev server, and run both BDD suites.                                                       |
| 5. Auth/telemetry        | Rewrite and split; external blocker | Migrate removed MSAL APIs/config/request fields; add bridge, Webpack output, headers, Entra registration, auth smoke, and telemetry smoke. |
| 6. Runtime libraries     | Keep                                | Preserve focused date/timezone, route, error, and analytics checks; add real import smoke where mocks hide module shape.                   |
| 7. Patch upgrades        | Keep                                | Prefer exact pins for the migration PR and document each intentionally held package.                                                       |
| 8. Patch/natural graph   | Expand                              | Test without the parser patch first; remove overrides only here; run audit, deprecation, peer, Storybook, and graph checks before commit.  |
| 9. Documentation         | Expand                              | Add MSAL deployment/Entra runbook and lsmcp migration/retirement note; resolve mirrored policy docs.                                       |
| 10. Acceptance           | Strengthen                          | Use an explicit outdated allowlist and require staging auth plus telemetry evidence, not only CI mocks/builds.                             |

## Alternatives and Trade-offs

- **Coordinated MSAL 5 migration:** reaches the desired current major, but couples application code, Webpack output, hosting headers, and Entra configuration. Use the additive rollout and rollback sequence above.
- **Stage infrastructure before the package bump:** deploy and verify the inert bridge plus Entra URI first, then merge the MSAL code cohort. This is slower but creates the safest rollback boundary and is the preferred execution shape.
- **Temporarily hold the supported MSAL LTS major:** avoids an auth-critical migration inside the broad dependency PR, but leaves a recorded direct-dependency hold and needs a separate dated migration plan. Use this only if the Entra or hosting owners cannot join the release.
- **Remove overrides atomically at the end:** creates a larger final graph diff, but avoids committing a knowingly deprecated intermediate graph. Per-owner early deletion is acceptable only when npm can naturally resolve that owner safely.
- **Exact migration pins:** reduce surprise and make evidence reproducible; caret ranges can be reconsidered after the migration is stable.

## Escalation, Validation, and Rollback

- **Needs Human Review:** identify the Entra B2C registration owner, hosting/header owner, and lsmcp tooling owner before execution.
- Deploy the bridge and new URI additively, retain the old URI through the rollback window, and canary the MSAL 5 client before removing old configuration.
- Verify the deployed bridge with response-header assertions, local-only assets, no main-app chunk, and a static title.
- Exercise real staging login, redirect return, expired-refresh-token silent fallback, logout, and a protected API call. Mocked unit tests are supporting evidence only.
- Capture telemetry initialization, page view, and handled exception evidence in a non-production resource or intercepted transport.
- For every graph-changing commit, require strict install, dependency-policy tests, a deprecation scan, `npm ls --all`, and `npm audit --audit-level=low`.

## Scoring Rubric

| Dimension                             |  Weight |  Score | Assessment                                                                                                                 |
| ------------------------------------- | ------: | -----: | -------------------------------------------------------------------------------------------------------------------------- |
| User constraints and scope fidelity   |      12 |     12 | React, TypeScript, Node, and no-overrides outcomes are explicit and traceable.                                             |
| Upstream compatibility evidence       |      14 |      6 | Good peer/version research, but multiple documented MSAL 5 breaking APIs and Webpack Dev Server 6 contracts are missing.   |
| Downstream impact coverage            |      14 |      8 | Broad code/test mapping, but Entra, hosting headers, telemetry operations, and external lsmcp users are missing.           |
| Sequencing and atomicity              |      14 |      7 | Cohorting is sound in principle; early override deletion and a committed red state break safe rollback boundaries.         |
| Test and acceptance quality           |      16 |     11 | The full gate is strong; key auth, telemetry, and MDX checks are mocked or structural rather than behavioral.              |
| Security and supply-chain posture     |      12 |      9 | Final audit/deprecation goals are strong; the intermediate graph and MSAL bridge security requirements are not controlled. |
| Reproducibility and rollback          |       8 |      5 | Lockfile ownership and cohort rollback are documented, but caret drift and non-green cohorts weaken reproducibility.       |
| Task clarity and repository grounding |       6 |      5 | Most paths and commands are specific, but Task 5 labels files needing source migration as inspect/test targets.            |
| Documentation and operational handoff |       4 |      3 | Good repository docs coverage; external auth and tooling handoffs are absent.                                              |
| **Total**                             | **100** | **66** | **Major correction of the MSAL and graph-transition tasks is required before execution.**                                  |

### Rating Bands

|    Score | Meaning                                                                  |
| -------: | ------------------------------------------------------------------------ |
|   90–100 | Implementation-ready; only minor execution discoveries expected.         |
|    80–89 | Conditionally ready; resolve listed high-priority gaps first.            |
|    70–79 | Strong draft with substantial sequencing or impact corrections required. |
|    60–69 | Major redesign required before implementation.                           |
| Below 60 | Unsafe or insufficiently grounded.                                       |

## Exit Criteria for Re-Approval

The plan can be rescored only after all of these are true:

- The MSAL 5 API/config/request migrations, isolated redirect bridge, Webpack output, Entra registration, cache policy, and COOP exception are explicit.
- Override deletion occurs only after all override owners are removed or upgraded, with no deprecated intermediate graph accepted as a cohort boundary.
- MDX lint parity is behavior-tested, including `.remarkignore` and frail warnings.
- lsmcp retirement has an owner decision or documented replacement.
- Auth and telemetry have at least one real integration or staging smoke each.
- Major-migration versions are deterministic and `npm outdated` exceptions are an explicit allowlist.
- Every committed cohort is green under its focused test, strict-install, audit, and dependency-policy gates.

Until then, the expected end state is plausible, but the plan does not yet prove that the repository can reach it without an authentication outage, degraded developer tooling, or a misleadingly green test suite.
