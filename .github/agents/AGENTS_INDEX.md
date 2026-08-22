# Agents Index

This index provides logical grouping for agent discovery with workflow families organized under `workflows/`.

Use this file for agent discovery. The separate [`index.md`](index.md) file is Learning Hub content and is not the agent catalog.

## Orchestrator Workflows

1. React 18 Migration

- Orchestrator: `workflows/react18/react18-commander.agent.md`
- Sub-agents: `workflows/react18/react18-auditor.agent.md`, `workflows/react18/react18-dep-surgeon.agent.md`, `workflows/react18/react18-class-surgeon.agent.md`, `workflows/react18/react18-batching-fixer.agent.md`, `workflows/react18/react18-test-guardian.agent.md`

1. React 19 Migration

- Orchestrator: `workflows/react19/react19-commander.agent.md`
- Sub-agents: `workflows/react19/react19-auditor.agent.md`, `workflows/react19/react19-dep-surgeon.agent.md`, `workflows/react19/react19-migrator.agent.md`, `workflows/react19/react19-test-guardian.agent.md`

1. Polyglot Test Pipeline

- Orchestrator: `workflows/polyglot-test/polyglot-test-generator.agent.md`
- Sub-agents: `workflows/polyglot-test/polyglot-test-researcher.agent.md`, `workflows/polyglot-test/polyglot-test-planner.agent.md`, `workflows/polyglot-test/polyglot-test-implementer.agent.md`, `workflows/polyglot-test/polyglot-test-builder.agent.md`, `workflows/polyglot-test/polyglot-test-tester.agent.md`, `workflows/polyglot-test/polyglot-test-linter.agent.md`, `workflows/polyglot-test/polyglot-test-fixer.agent.md`

1. Quality Playbook

- Orchestrator: `quality-playbook.agent.md`
- Internal phase orchestration documented in the agent file

1. RUG Orchestration

- Orchestrator: `workflows/rug/rug-orchestrator.agent.md`
- Sub-agents: `workflows/rug/swe-subagent.agent.md`, `workflows/rug/qa-subagent.agent.md`

1. AI Team

- Coordinator: `workflows/ai-team/ai-team-producer.agent.md`
- Team members: `workflows/ai-team/ai-team-dev.agent.md`, `workflows/ai-team/ai-team-qa.agent.md`

1. TDD Loop

- Coordinator: `workflows/tdd/tdd-red.agent.md`
- Sequence agents: `workflows/tdd/tdd-green.agent.md`, `workflows/tdd/tdd-refactor.agent.md`

## Category Docs

- Orchestrators: `ORCHESTRATORS.md`
- Frameworks: `FRAMEWORKS.md`
- Domains: `DOMAINS.md`
- Roles: `ROLES.md`
- Registry: `AGENT_REGISTRY.json`

## Standalone Specialists

- Educational Commenting: `educational-code-commenting-agent/educational-code-commenting.agent.md`

## Notes

- Supporting references are kept under `docs/`.
- Workflow agent families are grouped under `workflows/`.
- Non-workflow agents remain at the top level of this folder.
- Nested path changes beyond the current `workflows/` layout remain deferred until agent resolution is validated.
