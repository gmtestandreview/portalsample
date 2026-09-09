# Traceability matrix

Command to skill to agent to rule mapping for the A Team wiring — which command invokes which skill, which agent runs it, and which `.claude/rules/` file governs it. `—` means none.

## Skills

Source: `.claude/commands/skills.md`. 25 rows, alphabetical. Invoke any row with `Skill(<name>)`.

| Skill | Invoke | Trigger | Command entry point(s) | Executing agent(s) | Governing rule(s) |
| --- | --- | --- | --- | --- | --- |
| adr | `Skill(adr)` | Recording or revisiting a consequential, hard-to-reverse decision | `/adr` | architect | — |
| api-contract-first | `Skill(api-contract-first)` | Before implementing or changing an externally consumed service boundary | — | main session | — |
| architecture-audit | `Skill(architecture-audit)` | Before major work on an unfamiliar or inherited codebase | — | architect | — |
| architecture-design | `Skill(architecture-design)` | Producing an architecture or technical design from requirements | — | architect | — |
| architecture-review | `Skill(architecture-review)` | Assessing a proposed design, RFC, or structural change before build | `/architecture-review` | architect | — |
| brainstorming | `Skill(brainstorming)` | Before any creative work — explore intent and design first | `/feature` | main session | — |
| dispatching-parallel-agents | `Skill(dispatching-parallel-agents)` | Two or more independent tasks with no shared state | — | main session | — |
| executing-plans | `Skill(executing-plans)` | You have a written implementation plan to execute now | — | main session | — |
| finishing-a-development-branch | `Skill(finishing-a-development-branch)` | Branch ready for pre-merge verification, cleanup, and PR prep | `/feature` | main session | `.claude/rules/git-workflow.md` |
| five-whys | `Skill(five-whys)` | A bug or failure recurs despite surface fixes | — | main session | — |
| incident-response | `Skill(incident-response)` | Production is degraded or down — use immediately | `/incident-response` | main session | — |
| managing-github-actions | `Skill(managing-github-actions)` | Reviewing or changing GitHub Actions workflows or CI/CD behaviour | — | main session | — |
| performance-audit | `Skill(performance-audit)` | Performance regression suspected, or as a pre-release gate | — | performance-profiler | — |
| receiving-code-review | `Skill(receiving-code-review)` | Receiving code review feedback before implementing suggestions | `/code-review`, `/quality-gate` | main session | — |
| scalability-review | `Skill(scalability-review)` | Will this system or design handle projected growth | — | architect | — |
| skill-duplication-audit | `Skill(skill-duplication-audit)` | Two or more skills appear to overlap in scope | — | main session | — |
| smart-init | `Skill(smart-init)` | INIT.md missing; conversational project onboarding needed | `/orchestrate` | orchestrator | — |
| subagent-driven-development | `Skill(subagent-driven-development)` | Executing a plan's independent tasks, fresh subagent per task | `/feature` | main session | — |
| systematic-debugging | `Skill(systematic-debugging)` | Any bug, failing test, regression, or crash without known cause | `/debug` | debugger | — |
| test-driven-development | `Skill(test-driven-development)` | Implementing or changing observable behavior; RED before GREEN | — | tdd-guide | `.claude/rules/testing.md` |
| using-a-team | `Skill(using-a-team)` | Meta-skill: which skills and agents are mandatory when | — | main session | — |
| using-git-worktrees | `Skill(using-git-worktrees)` | Before a change needing isolation from the current workspace | — | main session | — |
| verification-before-completion | `Skill(verification-before-completion)` | Before claiming objectively verifiable work succeeded — evidence first | — | main session | `.claude/rules/testing.md` |
| writing-plans | `Skill(writing-plans)` | Turn an approved direction into a repository-grounded implementation plan | `/plan` | planner | — |
| writing-skills | `Skill(writing-skills)` | Creating, editing, testing, or deploying a SKILL.md | — | main session | — |

## Agents

Source: `.claude/agents/*.md` frontmatter. 17 rows. Last column is the Task 5.2 tier audit against `.claude/rules/performance.md` — all match.

> This matrix and `.claude/docs/overview.md` are both reconciled to this repo's pruned roster (17 agents / 25 skills). `.claude/docs/overview.md` carries the visual diagrams; this file is the row-level source of truth.

| Agent | Model tier | Runs skill(s) | Dispatched by command(s) | Tier matches performance.md? |
| --- | --- | --- | --- | --- |
| architect | opus / Tier 1 | architecture-design, architecture-review, architecture-audit, scalability-review, adr | `/adr`, `/architecture-review` | ✅ |
| orchestrator | opus / Tier 1 | smart-init | `/orchestrate` | ✅ |
| doc-updater | haiku / Tier 3 | — | — | ✅ |
| harness-optimizer | haiku / Tier 3 | — | `/quality-gate` | ✅ |
| performance-profiler | haiku / Tier 3 | performance-audit | — | ✅ |
| build-error-resolver | sonnet / Tier 2 | — | `/build-fix` | ✅ |
| code-reviewer | sonnet / Tier 2 | receiving-code-review (reception) | `/code-review`, `/quality-gate` | ✅ |
| compliance-reviewer | sonnet / Tier 2 | — | — | ✅ |
| debugger | sonnet / Tier 2 | systematic-debugging | `/debug` | ✅ |
| e2e-runner | sonnet / Tier 2 | — | `/e2e` | ✅ |
| infra-reviewer | sonnet / Tier 2 | — | `/quality-gate` | ✅ |
| planner | sonnet / Tier 2 | writing-plans | `/plan`, `/feature` | ✅ |
| python-reviewer | sonnet / Tier 2 | — | `/quality-gate` | ✅ |
| refactor-cleaner | sonnet / Tier 2 | — | `/refactor` | ✅ |
| security-reviewer | sonnet / Tier 2 | — | `/security-review`, `/quality-gate` | ✅ |
| tdd-guide | sonnet / Tier 2 | test-driven-development | — | ✅ |
| typescript-reviewer | sonnet / Tier 2 | — | `/quality-gate` | ✅ |

## Commands

Source: `.claude/commands/*.md`. 14 rows.

| Command | Type | Skills composed | Agents dispatched |
| --- | --- | --- | --- |
| `/build-fix` | alias | — | build-error-resolver |
| `/code-review` | alias | receiving-code-review | code-reviewer |
| `/debug` | thin alias | systematic-debugging | debugger |
| `/e2e` | alias | — | e2e-runner |
| `/feature` | workflow | brainstorming, subagent-driven-development, finishing-a-development-branch | planner (+ `/quality-gate` agents) |
| `/orchestrate` | workflow | smart-init | orchestrator |
| `/plan` | alias | writing-plans | planner |
| `/quality-gate` | workflow | receiving-code-review | harness-optimizer, code-reviewer, security-reviewer, typescript-reviewer / python-reviewer / infra-reviewer |
| `/refactor` | alias | — | refactor-cleaner |
| `/security-review` | alias | — | security-reviewer |
| `/skills` | index | indexes all 25 skills | — |
| `/adr` | thin alias | adr | architect |
| `/incident-response` | thin alias | incident-response | — |
| `/architecture-review` | thin alias | architecture-review | architect |

## Codex surface

`.codex/config.toml` holds MCP server config only — two `[mcp_servers.*]` blocks (`my-storybook-mcp-server`, `react-aria`) and nothing else. Codex consumes `AGENTS.md`, whose skills table (Task 7.3) is the Codex-facing skill registration. No `.codex/` skills manifest exists or is expected, so there is nothing to reconcile on the Codex side.
