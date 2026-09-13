---
name: context7-auto-research
description: Use when answering questions about a specific library, framework, SDK, CLI tool, or cloud service where current or version-specific documentation matters, especially API syntax, configuration, setup, migrations, code generation, or library-specific debugging. Use Context7 MCP instead of relying on potentially stale model knowledge.
compatibility: Requires Context7 MCP access exposing resolve-library-id and query-docs.
---

# Context7 Auto Research

Use Context7 MCP to ground library-specific answers in current documentation and code examples.

## When to use

Use for requests that depend on a specific library, framework, SDK, CLI tool, or cloud service, especially:

- API syntax, signatures, or usage
- setup and configuration
- migrations or version-specific behavior
- code generation that depends on a current API
- debugging caused by library-specific behavior

Do not use for general programming concepts, unrelated refactoring, business logic, or generic code review when current library documentation is not needed.

## Workflow

1. Identify the target library and the user's concrete task. Preserve any stated version.
2. If the user supplied a Context7 ID in `/org/project` or `/org/project/version` form, use it directly. Otherwise call `resolve-library-id` with the library name and the user's task as the query.
3. Choose the best matching library ID. Prefer the correct name and version, official or high-reputation sources, and strong benchmark quality.
4. Call `query-docs` with the exact library ID and one focused concept. Split unrelated concepts into separate queries unless the request is specifically about how they interact.
5. Answer from the retrieved documentation. Identify the Context7 library ID used and keep version-sensitive claims tied to the retrieved evidence.
6. If Context7 does not cover the request or retrieval fails, state what could not be verified. Do not invent documentation, versions, APIs, or tool results.

## Constraints

- Do not call either Context7 MCP tool more than 3 times per question.
- Never send API keys, passwords, credentials, personal data, or proprietary code in a Context7 query.
- Keep MCP authentication and Authorization configuration outside this skill. Never embed or echo credentials.
- Prefer narrowly scoped documentation queries over broad retrieval.
