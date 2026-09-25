---

name: breakdown-feature-technical
description: 'Use when converting an approved Feature PRD and parent Epic architecture into a feature-level technical breakdown covering architecture impacts, components, data and API changes, dependencies, non-functional requirements, risks, and implementation workstreams before detailed implementation planning.'
---

# Feature Technical Breakdown

## Goal

Act as a Senior Software Architect and Technical Lead.

Convert an approved Feature PRD and its parent Epic Architecture into a feature-level technical breakdown that defines **what must change technically and why**.

The technical breakdown bridges product requirements and detailed implementation planning.

Do not produce file-by-file implementation instructions or implementation code. Those belong in `breakdown-feature-implementation`.

## Required Inputs

Before starting, verify that the following files have been provided and belong to the same Epic and Feature:

1. **Feature PRD**
   `/docs/ways-of-work/plan/{epic-name}/{feature-name}/prd.md`

2. **Epic Architecture**
   `/docs/ways-of-work/plan/{epic-name}/arch.md`

Use the parent Epic PRD when supplied or when additional business context is required:

`/docs/ways-of-work/plan/{epic-name}/epic.md`

### Input Gate

Classify every required input as:

* `Provided`
* `Missing`
* `Ambiguous`
* `Inconsistent`

Do not invent missing requirements, architecture decisions, services, APIs, schemas, dependencies, or project conventions.

If a mandatory input is `Missing`, `Ambiguous`, or materially `Inconsistent`, identify the exact issue before producing the technical breakdown.

If the Feature PRD conflicts with the Epic Architecture, record the conflict under **Open Decisions**. Do not silently override either source.

## Architecture Constraints

Use the parent Epic Architecture as the governing technical context.

Preserve documented project conventions, including when applicable:

* domain-driven architecture
* self-hosted and SaaS deployment
* Docker containerization
* TypeScript and Next.js with App Router
* Turborepo monorepo structure
* tRPC APIs
* Stack Auth authentication
* PostgreSQL, Qdrant, Redis, n8n, or other services explicitly required by the parent architecture

Do not introduce a new technology merely because it is commonly used.

If a new technology, service, library, or infrastructure component is genuinely required by the feature, identify it as a **Proposed Architecture Change** and provide its rationale and impact.

## Scope Boundary

This skill owns the **feature-level technical decomposition**.

It does not own:

* Epic product requirements
* Epic architecture creation
* Feature product requirements
* detailed file-by-file implementation planning
* source-code generation
* GitHub issue creation
* sprint planning
* test strategy creation
* QA execution

Do not duplicate those downstream or upstream responsibilities.

## Output

Create:

`/docs/ways-of-work/plan/{epic-name}/{feature-name}/technical-breakdown.md`

The document must use the following structure.

# Technical Breakdown: {Feature Name}

## 1. Technical Summary

Summarize:

* the feature's technical objective
* the major system areas affected
* the overall technical approach
* the most significant architectural implications

Keep this section implementation-neutral enough that detailed implementation planning can follow separately.

## 2. Source Alignment

Identify the source requirements that drive the technical design.

Include:

* relevant Feature PRD requirements
* relevant acceptance criteria
* applicable Epic Architecture constraints
* relevant non-functional requirements

Create a concise traceability table:

| Requirement / Constraint | Technical Impact | Planned Area |
| ------------------------ | ---------------- | ------------ |

Do not create requirements that are absent from the source documents.

## 3. Architecture Impact

Describe how the feature fits into the existing Epic Architecture.

For each affected architectural area identify:

* existing component or boundary
* required change
* reason for the change
* whether the change is additive, modifying, or removing behavior

Separate:

### Existing Architecture Reused

Components and patterns used without architectural change.

### Feature-Specific Architecture Changes

Changes required specifically for this feature.

### Proposed Architecture Changes

Changes not already established by the Epic Architecture that require approval.

Do not silently treat proposed changes as approved architecture.

## 4. Component and Service Breakdown

Identify the logical components required by the feature.

Use a table:

| Component / Service | Responsibility | Change Type | Dependencies |
| ------------------- | -------------- | ----------- | ------------ |

Change types:

* Existing
* Modify
* New
* Remove
* Proposed

Describe responsibilities and boundaries rather than implementation files.

Where domain-driven architecture applies, identify the affected domain or bounded context.

## 5. Data Impact

Identify required changes to persistent or transient data.

Cover only applicable areas:

* entities or aggregates
* existing tables or collections affected
* new data concepts
* relationships
* persistence requirements
* caching requirements
* vector data requirements
* migration implications
* retention, privacy, or lifecycle constraints

Do not invent field-level schemas when the source material does not support them.

Detailed schema definitions belong in the implementation plan.

## 6. API and Integration Impact

Identify:

* existing APIs affected
* new API capabilities required
* tRPC routers or equivalent boundaries affected
* external integrations
* events, jobs, workflows, or asynchronous processing
* authentication and authorization boundaries
* compatibility concerns

Use a table when useful:

| Interface | Consumer | Provider | Change | Contract Impact |
| --------- | -------- | -------- | ------ | --------------- |

Describe contracts at capability level.

Detailed request and response types belong in the implementation plan unless required to resolve an architectural decision.

## 7. Frontend Impact

When the feature has a user interface, identify:

* routes or product areas affected
* major UI capabilities
* major state or data-flow changes
* server/client boundaries
* authentication or authorization effects
* accessibility implications
* dependencies on backend capabilities

Do not produce a detailed component hierarchy unless it is needed to resolve a technical boundary.

Detailed component design belongs in `breakdown-feature-implementation`.

If the feature has no frontend impact, state that explicitly.

## 8. Security, Privacy, and Authorization

Identify feature-specific impacts to:

* authentication
* authorization
* tenant or account isolation
* input validation
* sensitive data
* secrets or credentials
* privacy
* auditability
* external integrations
* abuse or misuse controls

Distinguish requirements already established by the parent architecture from new requirements introduced by the feature.

Do not claim that security controls have been implemented or validated.

## 9. Non-Functional Requirements

Map applicable Feature PRD non-functional requirements to technical implications.

Consider only source-supported or clearly applicable categories such as:

* performance
* scalability
* reliability
* availability
* accessibility
* security
* privacy
* maintainability
* portability
* self-hosted deployment
* SaaS deployment
* observability

Use:

| NFR | Technical Implication | Validation Consideration |
| --- | --------------------- | ------------------------ |

Do not invent numerical thresholds that are absent from the source material.

## 10. Infrastructure and Deployment Impact

Identify changes affecting:

* Docker containers
* deployed applications or services
* environment configuration
* databases
* caches
* background workers
* workflow services
* networking
* external services
* self-hosted deployment
* SaaS deployment

State `No infrastructure change identified` when appropriate.

Do not create deployment scripts or infrastructure code.

## 11. Dependencies and Technical Enablers

Identify technical prerequisites for implementation.

For each dependency or enabler provide:

| Dependency / Enabler | Why Required | Blocks | Status |
| -------------------- | ------------ | ------ | ------ |

Status values:

* Existing
* Required
* Proposed
* Unknown

Include cross-feature or external dependencies only when supported by the supplied artifacts.

## 12. Implementation Workstreams

Decompose the feature into logical technical workstreams suitable for subsequent detailed implementation planning.

Examples of workstream categories may include:

* frontend
* API
* business logic
* data
* background processing
* integrations
* authentication/authorization
* infrastructure

Include only workstreams that apply.

For each workstream identify:

* objective
* major responsibility
* dependencies
* expected technical outcome

Do not break workstreams into source files, coding tasks, or GitHub issues.

## 13. Technical Risks

Record material technical risks using:

| Risk | Cause | Impact | Mitigation / Decision Needed |
| ---- | ----- | ------ | ---------------------------- |

Do not manufacture risks merely to populate the section.

Include uncertainties when they could materially change the implementation.

## 14. Assumptions

List technical assumptions required to complete the breakdown.

Every assumption must be identifiable as an assumption rather than a source requirement.

Do not turn assumptions into requirements silently.

## 15. Open Decisions

Record unresolved technical decisions, source contradictions, or missing information that could alter implementation.

Use:

| Decision | Why It Matters | Options / Constraint | Owner or Required Input |
| -------- | -------------- | -------------------- | ----------------------- |

Do not choose between materially different architectural options without sufficient evidence.

## 16. Implementation Handoff

Summarize what `breakdown-feature-implementation` should receive from this document:

* architecture changes
* affected components and services
* data impacts
* API and integration impacts
* frontend impacts
* security and authorization requirements
* non-functional requirements
* infrastructure impacts
* dependencies and enablers
* implementation workstreams
* risks
* unresolved decisions

Explicitly identify any unresolved item that blocks detailed implementation planning.

## Diagram Guidance

Include a Mermaid **feature architecture delta diagram** when the feature affects multiple components, services, integrations, or asynchronous flows.

Show only the feature-relevant portion of the architecture.

Do not reproduce the complete Epic Architecture diagram unless necessary to explain the change.

Distinguish existing components from new or modified feature components in labels.

## Missing Information Rules

Do not fill unsupported gaps with assumed project behavior.

When information is unavailable:

* state what is missing;
* identify the affected section;
* record whether it blocks downstream planning;
* use `Unknown`, `Assumption`, `Proposed`, or `Open Decision` as appropriate.

If missing information prevents a defensible technical decomposition, do not pretend the technical breakdown is complete.

## Quality Gate

Before completing the document, verify:

* every major technical decision traces to the Feature PRD, Epic Architecture, or an explicitly marked proposal;
* Feature PRD requirements are not silently changed;
* Epic Architecture constraints are preserved;
* proposed architecture changes are clearly identified;
* component responsibilities do not materially overlap without explanation;
* data, API, UI, security, NFR, infrastructure, and dependency impacts are addressed where applicable;
* assumptions and confirmed requirements are distinguishable;
* unresolved decisions are visible;
* no detailed implementation plan has been duplicated;
* the output path is exactly:

`/docs/ways-of-work/plan/{epic-name}/{feature-name}/technical-breakdown.md`

## Context Template

* **Feature PRD:** [content or path]
* **Epic Architecture:** [content or path]
* **Epic PRD:** [optional content or path]
