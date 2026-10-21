# Boundary: think-tank

## Skill purpose

Pre-planning debate skill. Simulates a moderated multi-persona panel (4-6
named experts including a Moderator, Domain voices, and a Wildcard outside
thinker) to surface trade-offs, blind spots, and competing perspectives before
committing to a plan. The user is a participant, not a spectator. Produces an
8-section Think Tank Summary (Panel, Key Debate Highlights, User-Revealed
Context, Consensus Points, Core Trade-offs, Conditional Recommendations, Risks
& Blind Spots, Open Questions). The output is NOT a design or plan — it is
structured analysis that feeds a better decision.

## Distinguished from brainstorming

**Boundary type:** precedence-aware

| Primary goal | Use |
|---|---|
| Decide WHICH competing approach to take when multiple expert perspectives would sharpen the choice | **this skill** |
| Structured trade-off analysis of technology choices (X vs Y) with named expert personas | **this skill** |
| Multi-round debate with user participation before committing to an architectural direction | **this skill** |
| Design or specify a feature, capability, or fix | `brainstorming` |
| Propose 2-3 approaches and pick one before coding | `brainstorming` |
| Feasibility probe ("can we…?") | `brainstorming` (Spike path) |

For high-stakes architectural decisions where the approach is genuinely
contested, run this skill first to produce a structured analysis, then
`brainstorming` designs the chosen approach:

```
think-tank → decision → brainstorming → writing-plans
```

For routine decisions, `brainstorming` handles approach comparison as one
step in its own flow (propose 2-3 approaches) without needing `think-tank`.

## Validation cases

| Request | Correct skill |
|---------|--------------|
| "Should we use Auth0 or build our own auth?" | think-tank |
| "Debate the pros/cons of microservices vs monolith" | think-tank |
| "Run a think tank on the database choice" | think-tank |
| "Perspectives on caching strategies before we plan" | think-tank |
| "Let's design the new account creation flow" | brainstorming |
| "I want to add a caching layer — let's figure out how" | brainstorming |
| "We decided on Auth0 — now design the integration" | brainstorming |

## see: BOUNDARY.md

[brainstorming](../brainstorming/BOUNDARY.md)
