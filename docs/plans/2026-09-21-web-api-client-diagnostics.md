# API client diagnostic alignment

## Goal and scope

Align Biome and connected SonarQube analysis with the existing generated-file
boundary, as selected by the user. Preserve
`ClientApp/src/api/web-api-client.ts` byte-for-byte and add representative
runtime regression coverage.

## Impact

- Upstream: NSwag 14.5 generated the client. No OpenAPI document or NSwag
  configuration was found in this snapshot. Regeneration requires the backend
  contract and must preserve the handwritten `AuthorizedApiBase`.
- Downstream: 15 endpoint client classes share the auth base; 173 source, test
  and Storybook files reference the client. Positional method signatures, DTO
  optionality, problem-detail errors, file downloads and captured organisation
  context must remain compatible.
- Analysis: ESLint, SonarScanner and standalone Sonar IDE settings already
  exclude this exact file. Biome does not. Connected Sonar IDE analysis takes
  exclusions from server settings, not local exclusions.

## Implementation sequence

1. Add `tests/unit/api/webApiClient.regression.test.ts` using the real generated
   clients and a fake HTTP transport. Cover GREEN success, RED rejected requests
   and AMBER boundary behavior. These are characterization tests and should pass
   before any tooling change.
2. Add `tests/unit/config/generatedApiTooling.test.ts` that invokes the
   installed Biome CLI, proving that this generated client is excluded while
   handwritten API files remain linted. Observe its generated-file assertion
   fail before the fix.
3. Add only `!!ClientApp/src/api/web-api-client.ts` to `biome.json` file
   includes; retain all existing rules and includes.
4. Inspect the SonarCloud project's source exclusions. Preserve all existing
   patterns and add `ClientApp/src/api/web-api-client.ts` if absent. Verify the
   saved setting. If authentication or permissions prevent access, report the
   precise remaining action.
5. Run
   `npm run test:unit -- tests/unit/api tests/unit/config/generatedApiTooling.test.ts`,
   `npm run type-check`, `npm run lint`, and `npm run test:quality:regression`.
   Review the diff and copy only task files from the isolated worktree to the
   user workspace, then rerun focused checks there.

## Safety and verification

The generated file and API contract remain unchanged. No blanket rule disabling
or folder exclusions are introduced. No production API is contacted by
regression tests. Rollback consists of reverting the added Biome pattern and the
new SonarCloud pattern; tests can remain.

The runtime tests cover representative request/response paths, not every
endpoint or live backend compatibility. RED in test names means rejection/error
scenarios; the separate tooling test provides the failing-before/passing-after
evidence.

## Verified results

- Biome baseline: 1,168 diagnostics (90 errors, 818 warnings, 260 informational
  findings).
- Runtime baseline: 18 passing tests, including the existing two auth tests.
- Biome regression before the fix: the generated-file test failed as expected;
  the handwritten error and warning checks passed. After the exact file
  exclusion: all 21 runtime and tooling tests passed. The installed CLI
  processes zero files when explicitly given the excluded generated client.
- SonarCloud project `gmtestandreview_portalsample`: `sonar.exclusions` had no
  saved values. Added only `ClientApp/src/api/web-api-client.ts` and verified
  the persisted value with an authenticated API readback. Connected IDEs must
  synchronize their binding to pick it up. The live editor Problems panel was
  not inspected.
- Type-check: passed.
- Quality regression: 8 passed.
- Final user-workspace verification: 25 focused API/tooling/Sonar configuration
  tests passed, plus the 8 quality regression tests. Type-check and Biome checks
  on all three changed JSON/TypeScript files passed.
  `git diff --exit-code HEAD -- ClientApp/src/api/web-api-client.ts` confirms
  the generated client is unchanged.
- Repository lint: four existing failures in `CertificateNumberLookup/index.tsx`
  and `Utilities/mailingLabel.tsx`; neither file is changed by this task.

## References

- [SonarQube IDE file exclusions](https://docs.sonarsource.com/sonarqube-for-vs-code/using/file-exclusions)
  explains why standalone settings do not apply in connected mode.
- [SonarCloud analysis scope](https://docs.sonarsource.com/sonarqube-cloud/managing-your-projects/project-analysis/setting-analysis-scope/excluding-files-based-on-patterns)
  distinguishes server settings from scanner overrides.
- [Biome configuration](https://biomejs.dev/reference/configuration/) documents
  the precise force-ignore pattern used here.
