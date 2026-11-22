# Source and licence notices

This single Agent Skill combines adapted ideas from:

## 1. **Anthropic Code Simplifier agent** —

<https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/agents/code-simplifier.md>
Source licence: Apache-2.0. The full source licence text is preserved in
`LICENSE`. Adaptations include bounded scope, behavior contracts, validation
gates, explicit failures, and Claude Code Agent Skill packaging.

## 2. **GitHub Awesome Copilot — refactor-method-complexity-reduce** —

<https://github.com/github/awesome-copilot> Source licence: MIT; original
copyright GitHub, Inc. The complete licence notice is preserved in
`LICENSE-MIT`. The method-level workflow, helper extraction techniques and
stringent failure/metric requirements are adapted and integrated into a
conditional mode.

The original source skills are not installed or invoked as separate skills by
this package. The `code-simplifier` skill name and directory are retained.
Licensing statements describe sources, not new legal advice or a guarantee of
all distribution permissions in every environment.
