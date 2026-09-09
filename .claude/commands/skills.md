# /skills

Index of all 25 A Team skills — short trigger, the command that invokes each, and the agent that typically runs it.

To run one, invoke `Skill(<name>)` — all 25 resolve to the A Team version.

| Skill | Trigger (short) | Command entry | Executing agent(s) |
| --- | --- | --- | --- |
| adr | Recording or revisiting a consequential, hard-to-reverse decision | `/adr` | architect |
| api-contract-first | Before implementing or changing an externally consumed service boundary | — | main session |
| architecture-audit | Before major work on an unfamiliar or inherited codebase | — | architect |
| architecture-design | Producing an architecture or technical design from requirements | — | architect |
| architecture-review | Assessing a proposed design, RFC, or structural change before build | `/architecture-review` | architect |
| brainstorming | Before any creative work — explore intent and design first | `/feature` | main session |
| dispatching-parallel-agents | Two or more independent tasks with no shared state | — | main session |
| executing-plans | You have a written implementation plan to execute now | — | main session |
| finishing-a-development-branch | Branch ready for pre-merge verification, cleanup, and PR prep | — | main session |
| five-whys | A bug or failure recurs despite surface fixes | — | main session |
| incident-response | Production is degraded or down — use immediately | `/incident-response` | main session |
| managing-github-actions | Reviewing or changing GitHub Actions workflows or CI/CD behaviour | — | main session |
| performance-audit | Performance regression suspected, or as a pre-release gate | — | main session |
| receiving-code-review | Receiving code review feedback before implementing suggestions | `/code-review`, `/quality-gate` | main session |
| scalability-review | Will this system or design handle projected growth | — | architect |
| skill-duplication-audit | Two or more skills appear to overlap in scope | — | main session |
| smart-init | INIT.md missing; conversational project onboarding needed | `/orchestrate` | main session |
| subagent-driven-development | Executing a plan's independent tasks, fresh subagent per task | `/feature` | main session |
| systematic-debugging | Any bug, failing test, regression, or crash without known cause | `/debug` | debugger |
| test-driven-development | Implementing or changing observable behavior; RED before GREEN | — | tdd-guide |
| using-a-team | Meta-skill: which skills and agents are mandatory when | — | main session |
| using-git-worktrees | Before a change needing isolation from the current workspace | — | main session |
| verification-before-completion | Before claiming objectively verifiable work succeeded — evidence first | — | main session |
| writing-plans | Turn an approved direction into a repository-grounded implementation plan | `/plan` | planner |
| writing-skills | Creating, editing, testing, or deploying a SKILL.md | — | main session |

Full cross-reference: [.claude/docs/traceability.md](../docs/traceability.md).
