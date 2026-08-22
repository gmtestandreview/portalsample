---
description: 'Guidelines for maintaining and enforcing repository quality through GitHub Actions workflows. These rules cover best practices for editing workflow files, ensuring that CI checks remain effective, and preserving the integrity of the repository. Follow these instructions when creating or modifying workflows in the `.github/workflows/` directory to ensure that quality gates are not weakened and that the repository continues to meet its standards for code quality, testing, and build integrity.'
applyTo: '.github/workflows/*.yml,.github/workflows/*.yaml'
---

# Quality Workflow Rules

Apply these rules when editing GitHub Actions workflows.

- `.github/workflows/test.yml` is the hard backstop for repository quality.
- Keep CI enforcing `pnpm lint`, `pnpm test -- --passWithNoTests`, and `pnpm build` unless the task explicitly changes repository policy.
- Prefer existing repository scripts over ad hoc shell commands.
- Use `pnpm` and Node `22` unless the task explicitly requires a change.
- Do not bypass or downgrade lint, format, test, or build jobs to silence failures.
- If a workflow change touches quality enforcement, validate the impacted scripts locally when possible.
- Do not create alternate workflows, success paths, or conditional skips that effectively weaken the repository quality gate unless the task explicitly requires a policy change.
- If local validation cannot be run, say so clearly and note the likely risk area instead of implying validation happened.
