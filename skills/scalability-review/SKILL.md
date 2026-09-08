---
name: scalability-review
description: "Use when asked whether a system or design will scale, will handle projected growth, needs a capacity or headroom assessment, or when planning for a traffic/data milestone (more users, a new region, a launch spike). Produces an evidence-based capacity assessment: current load, the first bottleneck, behaviour at 10x/100x/1000x, and priority-ordered fixes with triggers. Not for diagnosing a live regression (use performance-audit) or auditing a whole codebase (use architecture-audit)."
---

# Scalability Review

## The Rule

```
NO SCALE CLAIM WITHOUT EVIDENCE OR A LABELED ASSUMPTION.
"It will scale" is not an assessment. "The single Postgres primary caps sustained
writes near 50x current load (single-writer, no partitioning) — evidence: one
db.r6g.large, 8 writes/s today, no partition strategy" is an assessment.
```

A **directional, assumption-labeled estimate with named thresholds** is required
and allowed — "holds to ~5–10x as-is; ~10–50x after the SPOF fixes; wall at ~Px
where the data model must change". Leadership asked a yes/no question; answer it
with that bounded shape, not with a refusal and not with an unqualified "yes".

## When to Use

- "Will this scale?" / "Can we handle 10x?" / "Will it survive the launch?"
- Before a growth milestone: more users, a new region, a marketing spike, a big customer
- Capacity / headroom / cost-at-scale questions on an existing or proposed design
- NOT a live performance regression → **performance-profiler** agent / **performance-audit** skill (measure the incident first)
- NOT a whole-system structural review → **architecture-audit** skill
- NOT greenfield design → **architecture-design** skill (then run this on the result)

## Inputs to Establish First

State these up front. Where a number is unknown, write "unknown — assumption:" and label it.

| Input | Example |
| --- | --- |
| Current load, measured | 500 writes/min, 50k reads/min, p99 40ms |
| Data size + growth rate | 40M rows, +260M/yr |
| Read : write ratio | ~100:1 |
| Topology | 3 stateless API, 1 Postgres primary, 1 Redis node |
| Growth horizon | 10x in 12 months, 100x in 3 years (or "unstated — assessing 10x/100x/1000x") |
| Latency / availability target | redirect p99 < 50ms, 99.9% |

Do not invent traffic figures, growth rates, or SLOs. Missing inputs are open questions in the output.

## Workflow

### 1. Current-state capacity

One row per dimension (requests, writes, storage, connections, cache, fan-out). For each: today's number, the known or estimated ceiling, and the resulting headroom multiple.

### 2. Find the first bottleneck, then order the rest

List what breaks **in the order it breaks** as load rises. For each: the trigger point (as a multiple of today, or an absolute number), the failure mode, and whether it degrades gracefully or falls over.

Single points of failure count as bottlenecks even at 1x — a single primary/cache/region is an availability limit, not just a throughput one.

### 3. Behaviour at 10x / 100x / 1000x

For each multiple (or product-specific milestones): what holds, what needs work, what needs re-architecture. Name the wall — the point where tuning stops working and the data model or topology must change.

### 4. Classify each fix

| Class | Meaning | Example |
| --- | --- | --- |
| Config | Managed-service setting or parameter | Enable Multi-AZ, add read replica, raise pool size |
| Project | A quarter of deliberate work | Partition the table, add a CDN tier, async pipeline |
| Re-architecture | Multi-quarter, changes the data model or topology | Shard by key, split KV store from relational, multi-region writes |

A fix that straddles two classes takes the higher one. Note ordering where it
matters — "connection pooler *before* scaling the API tier", "async the write
path *before* trusting any write-side load test" — as a `depends-on` note on the
fix, not a separate section.

### 5. Triggers

For each fix, state the observable condition that means "start now": a sustained traffic multiple, a data-size threshold, a utilisation percentage, or a dated forecast. Re-architecture triggers to *start designing* must fire well before the wall — an emergency migration under production load is the outcome to prevent.

Reference earlier findings by number rather than restating them — the bottleneck
list, the fix table, and the triggers describe the same items from three angles;
do not repeat the prose in each.

## Output Contract

```markdown
## Scalability Assessment — <system> — YYYY-MM-DD

**Bottom line:** <holds to ~Nx with config; ~Mx with a project; wall at ~Px = re-architecture>
**Biggest exposure:** <usually availability / SPOF, or a named unknown>

## Assumptions
- <labeled; every unstated input listed here>

## Current-state capacity
| Dimension | Today | Ceiling | Headroom |

## Where it breaks, in order
1. <trigger point> — <failure mode> — <graceful | falls over>

## 10x / 100x / 1000x
- 10x: ... / 100x: ... / 1000x: ...

## Fixes (priority-ordered)
| Fix | Class | Trigger to start |

## Open questions
- <missing inputs that materially change the assessment>
```

Choose a shorter form when the question is narrow — but Assumptions, the ordered bottleneck list, and Triggers are always present.

## Rationalization Traps

| Shortcut | Required response |
| --- | --- |
| "It's stateless, it scales." | Only the stateless tier. Name the shared datastore, cache, and connection ceilings. |
| "Just add read replicas." | State the replica-lag correctness impact on read-your-writes flows. |
| "We'll add caching." | Caching is a fix with a trigger and a stampede/HA failure mode, not a hand-wave. |
| "Assume 100x and design for it now." | Do not invent the target. Assess 10x/100x/1000x and label the horizon as unstated. |
| "The DB can handle it." | Which resource — write throughput, table size, connections, vacuum, index-in-RAM? Name it. |
| "It'll be fine for now." | "For now" is a trigger condition. State the multiple at which it stops being fine. |

## Integration with A Team

- Feed a **re-architecture**-class finding into the **writing-plans** skill and record the decision as an ADR via the **adr** skill.
- If the review is part of a larger structural pass, it is Step 3 of the **architecture-audit** workflow.
- Measured-load questions about a current incident belong to the **performance-profiler** agent first.
