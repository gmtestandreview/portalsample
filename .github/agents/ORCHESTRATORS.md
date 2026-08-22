# Orchestrators

This file lists workflow orchestrators and the sub-agents they coordinate.

## Primary Orchestrators

1. `workflows/react18/react18-commander.agent.md`

- Coordinates: `workflows/react18/react18-auditor.agent.md`, `workflows/react18/react18-dep-surgeon.agent.md`, `workflows/react18/react18-class-surgeon.agent.md`, `workflows/react18/react18-batching-fixer.agent.md`, `workflows/react18/react18-test-guardian.agent.md`

1. `workflows/react19/react19-commander.agent.md`

- Coordinates: `workflows/react19/react19-auditor.agent.md`, `workflows/react19/react19-dep-surgeon.agent.md`, `workflows/react19/react19-migrator.agent.md`, `workflows/react19/react19-test-guardian.agent.md`

1. `workflows/polyglot-test/polyglot-test-generator.agent.md`

- Coordinates: `workflows/polyglot-test/polyglot-test-researcher.agent.md`, `workflows/polyglot-test/polyglot-test-planner.agent.md`, `workflows/polyglot-test/polyglot-test-implementer.agent.md`, `workflows/polyglot-test/polyglot-test-builder.agent.md`, `workflows/polyglot-test/polyglot-test-tester.agent.md`, `workflows/polyglot-test/polyglot-test-linter.agent.md`, `workflows/polyglot-test/polyglot-test-fixer.agent.md`

1. `quality-playbook.agent.md`

- Coordinates internal quality phases

1. `workflows/rug/rug-orchestrator.agent.md`

- Coordinates: `workflows/rug/swe-subagent.agent.md`, `workflows/rug/qa-subagent.agent.md`

1. `workflows/ai-team/ai-team-producer.agent.md`

- Coordinates: `workflows/ai-team/ai-team-dev.agent.md`, `workflows/ai-team/ai-team-qa.agent.md`

1. `workflows/tdd/tdd-red.agent.md`

- Coordinates sequence: `workflows/tdd/tdd-green.agent.md`, `workflows/tdd/tdd-refactor.agent.md`

## Workflow Integrity Rule

Preserve orchestrator-to-sub-agent relationships as documented above and validate invocation behavior after structural changes.
