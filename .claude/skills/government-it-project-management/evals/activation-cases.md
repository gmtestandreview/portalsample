# Activation Cases

These cases define the intended activation boundary. They are **test designs, not execution evidence**.

## Required should-trigger cases

1. "Recommend whether this Australian Government digital service should use predictive, agile, or hybrid delivery, and explain the governance implications."
2. "Review this project status report for an SES audience and tell me what is missing."
3. "Tighten these user stories and acceptance criteria for a government portal."
4. "We have a fixed funding gate but uncertain solution design. How should we structure delivery?"
5. "Assess this change request's impact on cost, timeline, risks, benefits and approvals."
6. "We are a Commonwealth entity preparing an ICT sourcing activity. What project controls and evidence should we confirm before committing?"
7. "Our digital project is nearing go-live. What governance, operational-readiness, security, residual-risk and benefits handover decisions should be made?"
8. "How should this Commonwealth digital investment align its project governance with DTA investment oversight without duplicating delivery ceremonies?"
9. "Our project board wants to accept a cyber exception. What should the project manager do before that decision is made?"
10. "This agency service has user-experience and accessibility issues. How should we reflect the relevant government digital-service obligations in delivery and acceptance evidence?"

## Required should-not-trigger cases

1. "Rewrite this paragraph in Australian English."
2. "Explain Scrum roles in general."
3. "What does this Python error mean?"
4. "Summarise this regulation."
5. "Make this Gantt chart blue."
6. "What is the current Commonwealth procurement threshold?" 
   - Expected: authoritative procurement lookup/research task; this skill may support project implications after the current rule is verified, but must not answer from memory.
7. "Write a privacy policy for my website."
8. "Design a cloud network topology."
9. "Explain the PGPA Act in plain English."
10. "Create a generic personal Kanban board for my household tasks."

## Ambiguous / near-miss cases

1. "Can you improve this risk register?"
   - Trigger only when project/program/governance context indicates professional project-risk review; otherwise ask/handle narrowly.
2. "Help me plan a government website."
   - Trigger when this means project/delivery/governance planning; do not activate solely for page/content design.
3. "We need to buy a SaaS product quickly."
   - Trigger when the request concerns public-sector project/sourcing governance; otherwise ordinary product-selection/procurement guidance may be sufficient.
4. "Does this meet the Digital Service Standard?"
   - Trigger when evaluating project/service delivery evidence; current standard applicability/content still requires authoritative verification.

## QAQ/RMI map

| Request class | Positive mapping | Expected branch | Near-miss guard |
| --- | --- | --- | --- |
| Lifecycle/governance | Cases 1,4,8 | core workflow + lifecycle reference | generic Scrum explanation |
| Artefact review | Cases 2,5 | project-artefact reference | generic editing |
| Requirements | Case 3 | user-story + acceptance-criteria references | unrelated writing |
| Commonwealth policy/project context | Cases 6,8,9,10 | Australian Government context gate | direct legal/policy lookup |
| High-impact decision | Cases 7,9 | Plan -> Validate -> Authority -> Execute -> Verify/Recover | advice must not become approval |

Execution-dependent trigger rates, repeated-run stability, observability, and holdout performance remain `NHR` until tested in the target Agent Skills runtime.
