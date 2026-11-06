# Vitest Agent Skill — optimization assessment

## Scope and evidence

- Input: complete six-file skill archive, 12 supplied config/package snapshots, and official Vitest guide/migration/Browser Mode documentation consulted 2026-11-05.
- Artifact: revised complete skill directory in this archive. Original archive remains the untouched backup.
- Classification: Hybrid (project governance Discipline + Vitest API Reference).
- Iterations: **1 remediation iteration**; stop on static score >96. No project files modified.
- Scoring: custom user-supplied 100-point rubric, **static/document quality only**; not behavioral proof.

## Rubric

| Criterion | Weight | Score | Evidence/limitation |
| --- | ---: | ---: | --- |
| Purpose clarity | 15 | 15 | Distinguishes repository governance from generic Vitest |
| Objective specificity | 15 | 15 | Concrete request-level goal and ownership |
| Goal / completion state | 15 | 15 | Minimal, correct, 5.0.5, repository-consistent |
| Expected outcome / acceptance | 15 | 15 | Explicit observable outcomes and NHR |
| Activation / scope | 10 | 10 | Vitest positives, Playwright-only and generic near-misses |
| Project context | 10 | 9 | Snapshots captured; unavailable repo support files need confirmation |
| Version correctness / resilience | 8 | 7 | Removed known legacy samples; version-sensitive edges need live package checks |
| Progressive disclosure | 5 | 5 | 55-line main skill, clear reference routing |
| Failure boundaries | 4 | 4 | Runner distinctions, policy preservation, no fabricated passes |
| Validation / evidence | 3 | 2 | Static checks executed; no behavioral/runtime run |
| **Total** | **100** | **97** | **Static-quality score, not deployment authorization** |

## Changes

1. Replaced generic quick-start skill with purpose, objective, completion state, activation boundaries, acceptance criteria, and explicit reference loading.
2. Added `references/project-contract.md`: supplied npm scripts, runner ownership, unit config and coverage contract.
3. Added `references/storybook-browser.md`: plugin, Chromium provider, addon child fast path, runtime bridge and scoped error filtering.
4. Added `references/version-and-configuration.md`: Vitest 5 migration guards and safe verification fallback.
5. Corrected outdated examples in `references/config.md`, `references/advanced.md`, `references/utilities.md`; retained other reusable APIs with installed-version verification notice.
6. Added `evals/activation-cases.json` with 10 positive, near-miss, mixed, and ambiguous prompts.

## Checks performed (iteration 1, rerun)

- PASS: parse YAML and required name/description metadata (PyYAML).
- PASS: description under 1,024 characters; skill body 55 lines.
- PASS: all local reference links resolve; original six files retained.
- PASS: static grep of generic cookbook executable snippets for `coverage.all`, legacy string Browser provider, and `poolOptions` examples.
- PASS: compare new governance text against supplied scripts, version, API port, coverage threshold and Storybook addon switch.
- PASS: 10 eval *case definitions* parse as JSON.
- NHR: no invocation of Vitest 5.0.5, Node tests, TS compiler, browser/Storybook addon startup, CI/coverage, or real skill activation / agent comparisons. Eval definitions do not constitute executed behavior.

## Blockers (independent of score)

1. **NHR, behavior-critical**: activation, near-miss and mixed-runner QAQ/RMI cases need representative agent runs with and without skill.
2. **NHR, behavior-critical**: actual Vitest 5.0.5 project runtime and Storybook Test-panel compatibility require complete repository and installed dependencies; supplied snapshots alone cannot prove them.
3. **NHR, contextual**: `runtime-env-fixtures`, `.storybook`, quality config, tests, workflow, and upstream addon implementation not supplied.
4. **AMBER, source mismatch**: Storybook runtime comment cites 10.5.10 while package manifest pins 10.6.5; retained workaround pending live validation.

## QAQ / RMI static mapping

- Vitest unit test -> unit lane; Playwright API test near-miss -> excluded.
- Storybook `play()` -> Vitest Browser Mode; Storybook BDD scenario near-miss -> Playwright Test.
- Addon Test-panel failure -> project runtime bridge; generic framework-free testing -> excluded.
- Cross-runner request -> split by runner; unspecified Storybook UI tests -> inspect requested artifact before choosing.
- These maps are direct in text but **behavioral outcome: NHR**, not PASS.

## Final recommendation

**hold** — static quality is 97/100, but mandatory behavioral/runtime evidence remains unverified; score cannot override deployment blockers.
