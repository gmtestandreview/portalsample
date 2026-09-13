---
name: code-reviewer
description: Use when reviewing code changes or pull requests, establishing code-review practice, or applying repository-aware review/edit discipline. Supports comprehensive review, explicit GitHub review posting when authorized, progressive loading of bundled language and cross-cutting guides, and minimum-change repository editing when implementation is explicitly requested.
---

# Code Review

Use the narrowest applicable mode. Do not mix review-only behavior with code editing unless the user explicitly requests both.

## Route the request

- **Review mode:** review supplied code, diffs, files, or pull requests for correctness, security, performance, architecture, maintainability, tests, and applicable project conventions.
- **Review-practice mode:** create or improve review standards, checklists, mentoring guidance, or review process.
- **Repository-edit mode:** when the user asks to implement fixes or change code, follow repository-local instructions and make the minimum necessary change.
- **Claude/GitHub PR mode:** when the user explicitly requests posting or GitHub PR interaction, use the available environment-specific GitHub tools only after authorization.
- If a request is ambiguous and the available artifact/context does not establish a review target or implementation target, identify the missing context instead of inventing it.

External side effects are not implied by review access. Post a GitHub comment only when the user explicitly requests posting or the invoked Claude PR workflow explicitly includes posting and that action is authorized.

## Review workflow

1. Establish the review scope, requirements, changed files, relevant repository instructions, test/CI evidence, and primary risks.
2. Scale depth to the change. For large diffs, use `scripts/pr-analyzer.py` when available and useful. If the change is too large for reliable review, narrow or split the scope rather than pretending exhaustive coverage.
3. Review architecture/design, correctness and edge cases, security, performance, error/resource handling, tests, maintainability, documentation, compatibility, and project conventions where relevant.
4. Load only the language/framework and cross-cutting references relevant to the code or risk being reviewed.
5. Report findings by severity with concrete location/evidence where available, risk, and actionable remediation.
6. Do not block for formatting or personal style preferences. Use repository automation for mechanical formatting/lint concerns when applicable.
7. Never claim tests, builds, scanners, CI, or validations passed unless they were run or directly evidenced.

## Severity

- **Blocking:** exploitable security problems, correctness/data-loss defects, unsafe breaking changes, or other issues that must be resolved before merge.
- **Important:** significant maintainability, testing, performance, architecture, or reliability concerns that should be addressed or explicitly discussed.
- **Nit / suggestion:** non-blocking readability, style, or optional improvement.
- Praise and educational notes are allowed when useful.

## Progressive reference loading

Load the minimum relevant files.

### Language/framework
- React: `references/react.md`
- TypeScript/JavaScript: `references/typescript.md`
- Python: `references/python.md`
- C#/.NET: `references/csharp.md`
- CSS/Less/Sass: `references/css-less-sass.md`

### Cross-cutting
- Architecture: `references/architecture-review-guide.md`
- Performance: `references/performance-review-guide.md`
- Security: `references/security-review-guide.md`
- Universal quality: `references/code-quality-universal.md`
- Common bugs: `references/common-bugs-checklist.md`
- SQL injection: `cross-cutting/sql-injection-prevention.md`
- XSS: `cross-cutting/xss-prevention.md`
- N+1 queries: `cross-cutting/n-plus-one-queries.md`
- Error handling: `cross-cutting/error-handling-principles.md`
- Review practice: `references/code-review-best-practices.md`

Use specialist references only when the reviewed code or identified risk makes them relevant.
References may mention other upstream language/framework guides that are not bundled for this repro; do not require or attempt to load those out-of-scope guides.

## Assets and scripts

- `assets/review-checklist.md`: lightweight review checklist.
- `assets/pr-review-template.md`: full review-report template.
- `scripts/pr-analyzer.py`: substantive PR diff analyzer for size, complexity, risks, and review suggestions.
- `scripts/test_pr_analyzer.py`: deterministic analyzer tests.
- `resources/implementation-playbook.md`: detailed review patterns and examples.

The scaffold helper scripts `scripts/code_quality_checker.py` and `scripts/review_report_generator.py` are not authoritative analysis engines. Do not claim they perform deep analysis, scanning, automated fixes, or production-grade reporting unless their implementation is changed and separately validated.

## Repository editing

When implementation is explicitly requested:
- preserve repository structure and patterns;
- avoid unrelated cleanup or speculative dependencies/architecture;
- honor repository-local package-manager and validation commands;
- do not weaken CI or suppress warnings to make validation pass;
- report failed or unavailable validation exactly.

## GitHub PR interaction

When GitHub PR interaction applies:
- verify the PR target, permissions, and intended external side effect before posting;
- inspect repository guidance and changed files before drafting comments;
- keep findings evidence-based and scoped to reviewed changes;
- recheck authorization immediately before posting comments or reviews.

Treat named-model/subagent behavior as environment-specific. If the required orchestration is unavailable, say so rather than inventing equivalent runs.

## Output

For normal reviews, provide:
- concise review summary;
- findings ordered by severity;
- risk and concrete remediation for each substantive finding;
- test/validation evidence status;
- merge recommendation when the evidence supports one.

Use `assets/pr-review-template.md` when a full structured report is useful. Use the shorter checklist for lightweight reviews.

Stop when the requested review or edit is complete, required evidence limits are stated, and no authorized follow-up action remains.
