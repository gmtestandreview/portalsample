---
agent: 'agent'
description: 'Use this prompt to perform a SonarQube MCP-supported code quality review or issue remediation for specific files, issues, branches, pull requests, or quality concerns. Follow repository policy and SonarQube best practices to identify and explain code-quality issues, provide evidence-based findings, recommend practical fixes, and validate results with available MCP tools and repo commands.'
model: 'Claude Sonnet 4.5'
tools:
  [
    execute,
    read,
    agent,
    edit,
    search,
    web,
    sonarsource.sonarlint-vscode/sonarqube_getPotentialSecurityIssues,
    sonarsource.sonarlint-vscode/sonarqube_excludeFiles,
    sonarsource.sonarlint-vscode/sonarqube_setUpConnectedMode,
    sonarsource.sonarlint-vscode/sonarqube_analyzeFile,
    todo,
  ]
argument-hint: 'SonarQube issue, file, branch, pull request, or quality concern to review or remediate'
---

# SonarQube MCP Code Quality Review

Use this prompt only when the user explicitly asks for SonarQube, SonarCloud, SonarQube MCP, code-quality issue review, or Sonar issue remediation.

The SonarQube request is: **$input**

## Goal

Use the configured SonarQube MCP tools to support code-quality review or issue remediation while preserving normal repository validation and avoiding unnecessary tool side effects.

## Repository rules

- Follow `AGENTS.md` as the canonical repository policy.
- Use SonarQube MCP as additional evidence, not as a replacement for repo validation.
- Keep changes limited to the requested files, issues, or quality concern.
- Do not change linting, formatting, CI, package scripts, package policy, or repository architecture unless explicitly requested.
- Use `pnpm` and existing repo scripts for local validation.

## Tool guardrails

- Use only SonarQube MCP tools that are available in the current environment.
- If a required SonarQube MCP tool is unavailable, say so clearly and continue with the safest repo-local fallback.
- Do not claim SonarQube analysis ran unless the MCP tool actually ran.
- Do not guess project keys. If a project key is needed, use the available project-search tool first.
- If a branch or pull request context is provided, include it in supported SonarQube MCP operations.
- If analyzing snippets or partial files, state that this does not replace full project analysis.

## Automatic analysis

When the available SonarQube MCP tools support automatic analysis control:

1. At task start, disable automatic analysis if the task will modify code and the tool is available.
2. Perform the requested review or remediation.
3. At task end, analyze the created or modified files with `analyze_file_list` if available.
4. Re-enable automatic analysis if it was disabled earlier.

If any of these tools are unavailable, report the limitation and do not pretend the step completed.

## Issue review workflow

When reviewing SonarQube issues:

1. Identify the project key using project search if needed.
2. Retrieve the relevant issues, files, branch, or pull request context.
3. Classify each issue:
   - confirmed
   - likely
   - false positive
   - needs investigation
4. For confirmed or likely issues, recommend the smallest safe fix.
5. Preserve existing repo conventions.
6. Do not introduce broad refactors to satisfy a narrow issue.

## Remediation workflow

When fixing issues:

1. Inspect the affected source file and surrounding context.
2. Fix source files, not generated build artifacts.
3. Keep edits minimal and focused.
4. Run or recommend relevant repo validation:
   - `pnpm lint`
   - `pnpm test`
   - `pnpm build`
   - `pnpm build-storybook` when Storybook-facing behavior is affected
5. Run `analyze_file_list` on modified files if available.
6. Do not verify local fixes by immediately searching server issues unless a fresh SonarQube project analysis has run.

## Output format

Return:

1. Summary
   - requested SonarQube scope
   - project key and branch/PR context if used
   - files or issues reviewed
   - whether changes were made

2. Findings
   For each issue include:
   - SonarQube rule or issue reference when available
   - affected file
   - status: confirmed / likely / false positive / needs investigation
   - evidence
   - recommended fix

3. Changes
   - files changed
   - why each change was made
   - any intentionally deferred issue

4. Validation
   - SonarQube MCP tools run
   - repo commands run
   - results
   - unavailable tools or unverified steps

5. Residual risks
   - assumptions
   - missing project analysis
   - branch/PR limitations
   - follow-up checks
