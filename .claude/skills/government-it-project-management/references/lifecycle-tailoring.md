# Lifecycle Tailoring

Load when lifecycle selection is material, contested, or likely to be hybrid.

The objective is not to label the project “agile” or “waterfall”. Select the
control and delivery model that best manages uncertainty, feedback,
dependencies, assurance, procurement, and operational risk.

## Diagnostic

Assess each factor before recommending a model.

| Factor                            | Predictive pressure                                                   | Adaptive pressure                                       | Hybrid signal                                                       |
| --------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| Requirements/solution uncertainty | Low and bounded                                                       | High; learning changes solution/priorities              | Stable outcomes with uncertain implementation                       |
| Feedback access                   | Infrequent or expensive                                               | Frequent, representative, actionable                    | Feedback possible within fixed gates                                |
| Release/demonstration feasibility | Increments have limited independent value or cannot be safely exposed | Valuable increments can be demonstrated/released safely | Internal increments under controlled release/approval               |
| Dependencies/integration          | Highly coupled, long-lead, sequence-critical                          | Loosely coupled or sliceable                            | Fixed integration events with iterative component delivery          |
| Governance/assurance              | Baseline/stage approvals dominate                                     | Delegated decisions and frequent inspection are viable  | Fixed investment/assurance gates with adaptive delivery inside them |
| Procurement/contract              | Fixed deliverables/acceptance dominate                                | Outcome/capability-based arrangement supports iteration | Contract has fixed boundaries but iterative backlog/scope control   |
| Operational/security risk         | Change windows/authorisation constrain release                        | Small safe changes reduce risk                          | Iterative build with formal operational authorisation               |
| Cost of late change               | Very high and preventable through early definition                    | Learning is more valuable than early precision          | Some elements need early lock-down; others should stay flexible     |

## Selection procedure

1. State the project outcome and the main uncertainty to be managed.
2. Identify the non-negotiable control points: investment, funding, procurement,
   architecture, security, legal, assurance, release, or operational.
3. Identify where feedback can change the solution before major cost is sunk.
4. Identify work that can be decomposed into independently testable or
   demonstrable increments.
5. Identify long-lead dependencies and decisions that must be made early.
6. Select predictive, adaptive, or hybrid and explain **which risks the choice
   reduces**.
7. Define the cadence for planning, review, approval, integration, and release.
8. Define the reassessment trigger.

## Hybrid design pattern

Avoid a vague “hybrid” label. Specify the boundary, for example:

- predictive investment/business-case and funding gates;
- governed procurement and architecture/security approvals;
- adaptive discovery/design/build inside approved tolerances;
- incremental demonstrations and evidence collection;
- formal release/operational-readiness decision;
- benefits/service monitoring after transition.

## Counterexamples

Do **not** recommend adaptive delivery merely because:

- the team uses Scrum or Kanban;
- requirements are poorly documented;
- leadership wants faster delivery;
- the word “digital” appears in the initiative.

Do **not** recommend predictive delivery merely because:

- governance requires a business case;
- funding is annual;
- a fixed final date exists;
- senior executives want certainty.

Do **not** call the model hybrid merely because different teams use different
ceremonies. Hybrid must describe a meaningful control/delivery boundary.

## Reassessment triggers

Revisit the model when:

- policy, funding, procurement, security, or assurance constraints change;
- user access/feedback becomes unavailable or newly available;
- integration/dependency assumptions materially change;
- increments prove unsafe or not independently valuable;
- forecast uncertainty increases beyond approved tolerance;
- delivery evidence shows the chosen cadence is creating queues, rework, or late
  discovery.
