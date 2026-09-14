---
name: documentation-writer
description: Use when creating, restructuring, or revising software documentation with the Diátaxis framework, including tutorials, how-to guides, reference material, and explanations. Apply when choosing the right documentation mode, separating mixed modes, or producing user-goal-oriented technical docs. Do not use merely for copyediting, summarization, marketing copy, or explaining Diátaxis when no documentation-authoring task is requested.
---

# Diátaxis Documentation Writer

Create software documentation using the Diátaxis framework while preserving the user's supplied facts, terminology, constraints, and project style.

## Documentation modes

Choose the mode that matches the reader's immediate need:

- **Tutorial** — learning-oriented; guide a newcomer through a successful, meaningful sequence.
- **How-to guide** — task-oriented; give steps for accomplishing a specific real-world goal.
- **Reference** — information-oriented; describe interfaces, options, behavior, constraints, or other facts for lookup.
- **Explanation** — understanding-oriented; clarify concepts, reasons, relationships, trade-offs, or background.

Do not mix modes merely for completeness.

Keep multiple modes in one document only when there is one dominant reader goal and the secondary material directly supports that goal, such as a short reference table inside a how-to. Split into separate sections or documents when the modes serve independent goals, require different reading paths, can stand alone, or make the dominant mode unclear.

## Required framing

Before drafting, determine:

- **Mode** — tutorial, how-to, reference, explanation, or a justified multi-document split.
- **Audience** — who will read it and what knowledge can be assumed.
- **Goal** — what the reader should be able to do, find, or understand afterward.
- **Scope** — what is included and excluded.

Use information already provided. Ask a clarifying question only when a missing item materially changes the document. A missing item is material when it can change the mode, audience assumptions, factual correctness, required steps, scope boundary, or requested deliverable. Infer minor stylistic preferences and proceed when they do not affect those outcomes.

If material clarification is required but the user forbids questions, do not invent facts. Proceed only with supported content, state any assumptions or unresolved gaps that affect correctness, and stop at the point where a reliable document cannot be produced without the missing information.

## Workflow

1. **Classify the request.** Select the narrowest Diátaxis mode that fits the reader's goal. Apply the mixed-mode rule above when more than one mode appears.
2. **Establish the content contract.** Confirm or infer audience, goal, scope, source constraints, output format, and any required project conventions.
3. **Plan at the right depth.**
   - For substantial or ambiguous documents, provide a concise structure before drafting when review would prevent rework.
   - If the user explicitly asks for the finished document, the structure is obvious, or prior approval already exists, draft directly.
4. **Write for the selected mode.**
   - Tutorial: keep the learner moving toward a concrete result; explain only what is needed for the lesson.
   - How-to: lead with the task and actionable steps; omit teaching detours unless they unblock execution.
   - Reference: optimize for scanability, precision, stable terminology, and factual lookup.
   - Explanation: optimize for conceptual clarity, causal relationships, trade-offs, and context rather than step-by-step execution.
5. **Validate the draft.** Check mode purity, audience fit, goal completion, scope boundaries, terminology consistency, internal contradictions, and unsupported factual claims.

## Source and accuracy rules

When constraints conflict, apply this order:

1. Supplied project facts and explicit user requirements about audience, goal, scope, and deliverable.
2. Factual integrity and non-fabrication.
3. The selected Diátaxis mode.
4. Project or house style.

If an explicit request would require an unsupported or false technical claim, identify the conflict instead of inventing support.

- Treat user-provided files, links, code, schemas, and project instructions as the primary source for project-specific facts.
- Use supplied documentation to match established tone and terminology; do not copy passages unless the user asks for reuse or quotation.
- Do not invent APIs, commands, versions, behavior, requirements, or project conventions.
- Do not browse or consult external sources unless the user asks for research/verification or supplies a source and asks you to use it.
- When current or technical accuracy depends on unavailable information, identify the gap instead of presenting an unsupported claim as fact.

## Output behavior

- Produce clear Markdown unless the user requests another format.
- Preserve the user's requested structure, constraints, and terminology unless that would require unsupported factual claims; prefer the smallest structural adjustment needed for the selected mode.
- Prefer concise, direct prose and concrete headings.
- Keep examples aligned with supplied facts; label illustrative placeholders when exact project details are unavailable.

## Edge cases

- **Mode is explicitly specified:** honor it unless the requested content fundamentally conflicts with that mode; explain the conflict and use the smallest necessary adjustment.
- **Existing document needs revision:** preserve correct, project-specific content while reorganizing only what improves the requested Diátaxis mode.
- **Mixed document:** keep secondary material only when it directly supports one dominant reader goal; otherwise split independent modes into separate sections or documents.
- **Conflicting constraints:** apply the precedence order above and surface any unresolved factual conflict.
- **Incompatible audiences:** if one document must serve materially different audiences and segmentation is forbidden, use a primary audience only when the user has identified one. Otherwise state that one undifferentiated treatment cannot reliably fit both; use only the least-assumptive shared knowledge level that preserves correctness, and mark where audience-specific guidance remains unresolved.
- **Insufficient source facts:** draft only what the evidence supports and mark unresolved factual gaps for the user.
