# Boundary: brainstorming

## Skill purpose

Design skill. Turns an idea into a fully formed design and spec through
collaborative dialogue. Classifies each request as Spike / Bounded /
Architectural, explores project context, proposes approaches, presents a
design, and — on the architectural path — writes a spec document to disk and
hands off to `writing-plans`. Hard-gated: no code until the user approves.

## Distinguished from think-tank

**Boundary type:** precedence-aware

| Primary goal | Use |
|---|---|
| Design or specify a feature, capability, or fix | **this skill** |
| Propose 2-3 approaches and pick one before coding | **this skill** |
| Feasibility probe ("can we…?") | **this skill** (Spike path) |
| Decide WHICH competing approach to take when multiple expert perspectives would sharpen the choice | `think-tank` |
| Structured trade-off analysis of technology choices (X vs Y) with named expert personas | `think-tank` |
| Multi-round debate before committing to an architectural direction | `think-tank` |

For high-stakes architectural decisions where the approach is genuinely
contested, `think-tank` runs first to produce a structured analysis, then
`brainstorming` designs the chosen approach:

```
think-tank → decision → brainstorming → writing-plans
```

For routine decisions, `brainstorming` handles approach comparison as one
step in its own flow (propose 2-3 approaches) without needing `think-tank`.

## Validation cases

| Request | Correct skill |
|---------|--------------|
| "Let's design the new account creation flow" | brainstorming |
| "I want to add a caching layer — let's figure out how" | brainstorming |
| "Can we use feature flags here? Quick spike." | brainstorming (Spike) |
| "Should we use Auth0 or build our own auth?" | think-tank |
| "Debate the pros/cons of microservices vs monolith" | think-tank |
| "Run a think tank on the database choice" | think-tank |
| "We decided on Auth0 — now design the integration" | brainstorming |

## see: BOUNDARY.md

[think-tank](../../.claude/skills/think-tank/BOUNDARY.md)
