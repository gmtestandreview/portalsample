---
description: 'Guidance for routing SonarQube code-quality review in this repository. Clarifies the role of SonarQube (supplementary analysis) vs. ESLint (primary quality gate), documents known false positives, and provides best practices for SonarQube MCP workflows.'
applyTo: '**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts,json,yml,yaml}'
---

# SonarQube MCP routing

Use this instruction when the user explicitly asks for SonarQube review, SonarCloud analysis, Sonar issue remediation, code-quality deep-dive, or performance/security audit. See **Guardrails: When to run SonarQube analysis** for detailed decision logic.

For substantial SonarQube MCP work, use:

```text
.github/prompts/sonarqube-code-quality.prompt.md
```

## Quality-gate hierarchy

Understand the role of each tool in this repository:

| Tool           | Role                      | Authority                 |
| -------------- | ------------------------- | ------------------------- |
| **ESLint**     | Primary code-quality gate | Canonical (AGENTS.md)     |
| **Prettier**   | Formatting enforcement    | Canonical (AGENTS.md)     |
| **TypeScript** | Type checking             | Canonical (AGENTS.md)     |
| **SonarQube**  | Supplementary analysis    | Opt-in review (AGENTS.md) |

**Always trust ESLint first.** If ESLint passes (`pnpm lint`), the code is validated by the primary gate. SonarQube findings are secondary and may include false positives.

## Known SonarQube false positives in this project

**Rule: typescript:S6766** ("JSX special characters should be escaped")

- **Status**: False positive in `.tsx` files
- **Example**: Flags `<Column columnSpan={{ xs: 12 }}>` as needing HTML entity escaping
- **Context**: Rule designed for HTML files; incorrectly applies to JSX syntax
- **Fix**: Ignore S6766 violations in `.tsx` files. Verify with ESLint instead.
- **Details**: See `/memories/repo/sonarqube-s6766-jsx-false-positives.md`

## Guardrails

### 1. Policy foundation

- Follow AGENTS.md as canonical policy: ESLint is the primary code-quality authority.
- Use SonarQube MCP as **additional evidence only**, never as a replacement for repo validation commands (`pnpm lint`, `pnpm test`, `pnpm build`).

### 2. When to run SonarQube analysis

**Priority rule**: User explicit requests always take priority.

**Decision flowchart**:

| Scenario                                        | Action                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| User explicitly requests SonarQube              | Run SonarQube analysis                                               |
| User does NOT mention SonarQube                 | Use `pnpm lint` (ESLint) only                                        |
| Request is unclear or ambiguous about SonarQube | Ask user for clarification before proceeding                         |
| User requests it + MCP tools unavailable        | Inform user, suggest alternatives, wait for guidance (see Section 3) |

**Detailed guidance**:

1. **User explicitly requests SonarQube analysis**: Run SonarQube analysis, even if the task appears routine.
   - "Explicitly requests" includes:
     - Direct requests: "run SonarQube", "use SonarQube review", "perform SonarQube analysis"
     - Context-inferred requests that explicitly mention SonarQube without ambiguity: "review this with SonarQube", "check code quality via SonarQube"
   - Explicitly does NOT include:
     - Generic quality requests without mentioning SonarQube ("check code quality", "review for issues")
     - Performance or testing requests (unless SonarQube is explicitly named)

2. **User does NOT request SonarQube analysis**: Use `pnpm lint` (ESLint) for routine code changes; do not run SonarQube MCP workflows.

3. **If user's request is unclear or ambiguous**: Ask for clarification before proceeding.
   - Example ambiguous request: "check this for issues" (unclear if user wants ESLint only or SonarQube analysis)
   - Example clarification: "Are you asking for a SonarQube analysis, or just the standard ESLint quality check?"

### 3. Tool availability and error handling

**MCP tools scope**: Project-search tool, analysis runner, issue-fetch tool, and any remote SonarQube API integrations.

1. **SonarQube MCP tools unavailable; user explicitly requested SonarQube**:
   - Inform the user: "SonarQube MCP tools are unavailable at this time."
   - Suggest alternatives: "I can run ESLint (`pnpm lint`), tests, and build validation instead."
   - Wait for user guidance before proceeding.

2. **Both SonarQube MCP tools AND ESLint tools unavailable**:
   - Inform the user: "Code-quality analysis tools are currently unavailable."
   - Offer alternatives:
     - Manual code review guidance based on repository patterns
     - TypeScript type checking (`pnpm build` to verify compile errors)
     - Deferred analysis after tools become available
   - Escalate to project maintainer if immediate analysis is critical.

3. Do not claim any analysis ran if the relevant tools are unavailable. Do not toggle automatic SonarQube analysis unless the user explicitly requests it and MCP tools are confirmed available.

### 4. Project and issue management

1. Do not guess project keys; use the available SonarQube MCP project-search tool.
2. Do not edit SonarQube issues directly in the SonarQube UI; use the MCP workflow for remediation when requested, or report the issue to the SonarQube project maintainer.
3. After local fixes, do not rely on remote SonarQube server search as proof of resolution until a fresh project analysis has completed.

### 5. Tool conflict resolution

**When SonarQube findings conflict with ESLint**:

1. **If ESLint is clearly correct** (e.g., known SonarQube false positive like S6766):
   - Trust ESLint.
   - Report the conflict to SonarQube maintainers.

2. **If neither tool provides a clear resolution**:
   - Escalate to the project maintainer for clarification and guidance.

3. **General principle**:
   - Do not suppress either tool's findings without documented justification (e.g., "false positive per SonarQube rule SXXXX", "excluded per project maintainer guidance").
   - Always ask for guidance if uncertain.

**When SonarQube findings conflict with Prettier**:

1. **Prettier always takes precedence** for formatting issues. SonarQube formatting suggestions are superseded by Prettier's canonical formatting rules.
   - If SonarQube flags a formatting issue that Prettier permits, trust Prettier.
   - Document this as a known difference if it recurs.

2. **Report to SonarQube maintainer** if SonarQube's formatting rules conflict with repo-wide Prettier config. Include evidence: Prettier config, SonarQube rule version, and example conflict.
