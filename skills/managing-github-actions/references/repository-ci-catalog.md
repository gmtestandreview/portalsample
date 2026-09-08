# Repository CI catalog

Load this when you need the full npm script list, the exact `test:ci` composition, the advanced-feature constraints, or the current workflow inventory.

The live `package.json` and `.github/workflows/` files override anything here if they have diverged. Report the drift when they do.

## npm scripts relevant to CI

```text
npm run build                     webpack production build
npm run type-check                tsc --noEmit
npm run lint                      ESLint over app / story / test / root-config sources
npm run lint:mdx                  remark over .storybook and ClientApp MDX (--frail)
npm run lint:rules                node scripts/verify-rule-citations.mjs
npm run test:unit                 Vitest unit config
npm run test:unit:coverage        Vitest unit config with coverage
npm run test:storybook            Vitest storybook config
npm run test:all                  every Vitest suite
npm run test:quality:regression   Vitest quality / regression config
npm run test:ci                   composite gate — see below
npm run test:e2e                  Playwright app BDD + storybook BDD
npm run migration-check           pre-migration gate — see below
npm run build-storybook           clean + storybook build -o storybook-static
npm run storybook:verify:docs     storybook build --docs + verify-storybook-docs.mjs
```

Prefer these scripts over copying the underlying Vitest, tsc, Storybook, Playwright, or webpack command into workflow YAML.

## test:ci composition

```text
npm run test:ci
  -> npm run type-check
  -> npm run test:ci:unit        Vitest unit  + coverage + junit
  -> npm run test:ci:storybook   Vitest story + junit
  -> npm run test:ci:quality     Vitest quality / regression + junit
```

Do not replace `npm run test:ci` with a subset unless a workflow intentionally has narrower scope and repository policy supports the distinction.

## migration-check composition

```text
npm run migration-check
  -> tsc --noEmit
  -> every Vitest suite
  -> clean:storybook-output
  -> storybook build -o storybook-static
```

Pre-migration validation only. Not part of the PR or release gate.

## Additional gates (run when the change touches their area)

```text
npm run lint:mdx               MDX docs changed
npm run lint:rules             rule-citation metadata changed
npm run test:e2e               app or Storybook behaviour changed
npm run storybook:verify:docs  Storybook docs / autodocs changed
npm run migration-check        pre-migration validation
```

## Current workflow inventory

```text
.github/workflows/pr.yml        PR gate — partitioned type-check / lint / lint:mdx / test:ci:* / e2e / build /
                                storybook:verify:docs, SonarCloud scan, lower-bound Node job
.github/workflows/release.yml   push to main — same partitioned commands as pr.yml, plus build and
                                storybook:verify:docs, so a release cannot pass a coarser gate than its PR
.github/workflows/chromatic.yml Chromatic visual review
.github/actions/verify-rolldown-binding
                                local composite action, run after npm ci in every job (npm/cli#4828 workaround)
```

Conventions in `pr.yml` / `release.yml`:

- `permissions: contents: read` at file level.
- `actions/checkout`, `actions/setup-node`, `actions/upload-artifact`, `actions/download-artifact`, and
  `SonarSource/sonarqube-scan-action` pinned to a full commit SHA with a `# vN` comment.
- `corepack enable` before `npm ci` in every job.
- `COREPACK_ENABLE_DOWNLOAD_PROMPT: '0'` in workflow `env`.
- Node pinned per job (`'24'`, with `'24.0.0'` in the lower-bound job).

Known drift to correct rather than copy:

- `chromatic.yml` pins `actions/checkout` and `actions/setup-node` by tag, not SHA, and runs `npm ci`
  without a preceding `corepack enable`.

Re-derive this list from `.github/workflows/` if it looks stale.

## Advanced features — constraints when justified

Add only when the request or existing architecture requires it:

```text
matrix builds        keep Node values consistent with engines and the lower-bound job
caching              key and path must match npm + the lockfile layout; actions/setup-node cache: 'npm'
                     is the existing pattern
artifacts            set retention intentionally
reusable workflows   only for genuinely shared logic
environments         protect production with the repository's approval model
OIDC                 prefer over new long-lived cloud credentials; add id-token: write only on the job
                     that needs it
CodeQL / SAST / SCA  SonarCloud is already wired into pr.yml
release automation   do not create tags or releases as recovery artifacts without authorization
self-hosted runners  separate security boundary — require explicit authorization
```
