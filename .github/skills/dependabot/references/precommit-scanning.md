# Pre-Commit Dependency Scanning via GitHub MCP/Copilot

Load this reference only when the user specifically asks to scan dependency additions for known
vulnerabilities before committing through GitHub MCP Server or GitHub Copilot tooling.

The source skill states that the GitHub MCP Server's `dependabot` toolset can check dependency
additions against the GitHub Advisory Database and return affected packages, severity, and fixed
versions. It also describes a more thorough post-commit Dependabot CLI dependency-graph diff.

## GitHub Copilot CLI

Enable the Dependabot MCP toolset:

```bash
copilot --add-github-mcp-toolset dependabot
```

Inside `copilot`, install the Advanced Security plugin:

```text
/plugin install advanced-security@copilot-plugins
```

The source skill identifies `/dependency-scanning` as the plugin skill for this workflow.

## Visual Studio Code

The source skill says to enable the Dependabot GitHub MCP toolset (including through the
`X-MCP-Toolsets` header or toolset selector), install the `advanced-security` plugin, then use
`/dependency-scanning` in Copilot Chat.

## Verification Before Use

Before recommending or executing this workflow, verify in current GitHub documentation that the requested client supports the Dependabot MCP toolset and that the named plugin/command is still available. If that evidence is unavailable, report the workflow as unverified and fall back to ordinary Dependabot alerts/security updates or another user-approved dependency-scanning mechanism; do not invent replacement commands.

Do not expose tokens, credentials, repository secrets, or private dependency data while configuring MCP/plugin access.

## Boundary

This guidance is environment-specific and was sourced from a public-preview workflow announced in
May 2026. Do not assume the plugin, commands, headers, or preview behavior are available in another
client or environment. Verify current GitHub documentation before claiming availability or executing
setup steps.
