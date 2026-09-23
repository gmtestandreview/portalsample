---
name: 'Updated Quality User Story Checklist'

Description:
  'This Quality User Story Checklist is an evidence-based tool designed to
  support the creation, evaluation, and continuous refinement of high-quality
  user stories within agile environments. It synthesises insights from academic
  frameworks such as QUS (Lucassen et al.), INVEST (Cohn/Wake), Agile
  Requirements Verification Framework (ARVF), AmbiTRUS, and industry standards
  including BABOK v3, IEEE 29148, and SAFe’s agile delivery principles. It
  covers three core dimensions of quality syntactic (form and structure),
  semantic (meaning and logic), and pragmatic (usefulness in practice), while
  addressing non-functional concerns, traceability, and user experience. It is
  especially relevant in regulated or enterprise-scale agile contexts.'
---

# Updated Quality User Story Checklist

## Syntactic Quality

- **Well-formed:** The user story is a complete sentence using the “As a [role],
  I want [goal], so that [benefit]” structure. Minor adaptations are allowed if
  all three elements are explicit and meaningful.
- **Atomic & Minimal but Sufficient:** The story represents one discrete feature
  or goal with no unrelated requirements, yet includes sufficient context and
  domain-specific assumptions to ensure clarity.
- **Localization Grammar & Style Manual Compliance:** Follows Australian grammar
  and the Australian Government Style Manual for clarity and professionalism.
- **Flexible Template Usage:** Template use is encouraged (e.g., Connextra
  form), but minor deviations are permitted if the story remains structured and
  readable.
- **Uniformity Across Stories:** All stories follow a consistent style,
  structure, and level of detail across the backlog.
- **Humanised Language:** The user story is written in a natural, conversational
  tone to improve clarity and human resonance. Avoids overly mechanical or
  generic phrasing that may suggest it was AI-generated. Stories should sound
  like they were written by and for real people, supporting authenticity and
  empathy. For example: Poor: "System should allow content ingestion from
  heterogeneous input channels." Better: "As a content manager, I want to upload
  stories from different sources, so I can keep the news feed fresh."

## Semantic Quality

- **Conceptually Sound:** The means (functionality) is logically justified by an
  appropriate ends (benefit), avoiding irrational or missing rationales.
- **Problem-oriented:** The story defines a user need or problem, not the
  technical implementation or UI layout.
- **Unambiguous Language:
  - Avoids vague quantifiers (e.g., “some,” “many,” “often”).
  - Uses specific, measurable conditions (e.g., “5 out of 10 users”).
  - Uses clear, action-oriented verbs (e.g., “view,” “submit,” “download”).
  - Avoids subjective descriptors (“easy,” “fast”) without clarification.
  - No ambiguous pronouns or references (e.g., “this,” “it,” “that”) unless
    their antecedents are clear.
- **Conflict-Free and Consistent:** The story does not duplicate or contradict
  existing stories. It integrates logically within the overall requirements set.
- **Shared Understanding Promoted:** Explicitly documents or references
  assumptions to reduce reliance on tacit knowledge and cognitive bias.
- **Reviewed via Goal-Oriented Modelling (e.g., iStar):** Ensures alignment with
  higher-level goals and reveals semantic gaps or redundancies.

## Pragmatic Quality

- **Effort Estimatable & Small:** The story is small enough to complete within a
  sprint and can be relatively estimated by the team.
- **Negotiability:** The story is a placeholder for conversation and remains
  open to refinement, not a rigid specification.
- **Unique:** Each story expresses a distinct requirement with no redundancy
  across the backlog.
- **Uniform:** Each story expresses a distinct requirement with no redundancy
  across the backlog.
- **Independent:** The story can be implemented and delivered independently of
  other stories where feasible.
- **Complete:** Collectively, the user stories form a complete, feature-ready
  application without missing steps or redundancies.
- **Acceptance Criteria Defined:** Clear acceptance criteria or concrete
  examples (e.g., Given-When-Then) are provided to enable testability and shared
  understanding.
- **Automated Quality Analysis:** NLP tools (e.g., AQUSA) are used to scan
  stories for linguistic and semantic issues, supplemented by team review.
  Automation supports, but does not replace, human judgment.

## Extended Quality Characteristics (from BABOK v3, IEEE 29148, and ARVF)

- **Feasibility:** Story is technically feasible and deliverable within
  constraints (e.g., time, skillset, architecture).
- **Scalability & Architecture Fit:** The feature aligns with the system’s
  architectural vision and does not compromise scalability.
- **Security & Compliance:** The story acknowledges applicable security,
  privacy, and compliance requirements (e.g., ISM, ISO 27001).
- **Non-Functional Requirements (NFRs) Considered:** Story addresses or is
  accompanied by checks for usability, performance, maintainability,
  reliability, etc.
- **Correctness:** Accurately reflects the stakeholder's need, validated through
  review, interviews, or prototypes.
- **Traceability:** The story is traceable to a business objective, epic, or
  requirement. Lightweight trace links (e.g., tagging or reference ID) are
  encouraged.
- **Ranked for Importance (Prioritised):** The story is prioritised relative to
  other stories, aligning with business value or delivery goals (e.g., MoSCoW,
  Critical/High/Medium/Low) for effective planning.
- **Testability:** Includes clear and measurable acceptance criteria enabling
  verification.
- **Modifiability:** Written to be easily updated if understanding evolves.
  Change history or rationale is optionally tracked.
- **Completeness of Set:** The collection of stories (feature set) should be
  complete—delivering full user capability when implemented.
- **User Experience Flow (UX Coherence):** Story does not disrupt the overall UX
  when delivered in isolation. Teams are encouraged to assess whether UX
  coherence is maintained.
- **Example-based Clarification:** Each major criterion includes practical
  examples illustrating good vs. poor practices for clarity and education.

## Callouts

- The review if user story found deficent should call out clarifications
  requiredm from the different stakeholders.

## Usage Notes

- Examples per Criterion: Each major checklist item is accompanied by a good vs.
  poor practice example (available in the full appendix or inline via hyperlinks
  in digital formats).
- Minimal but Sufficient Reminder: Stories should be concise, yet include all
  essential background context to avoid ambiguity or reliance on tribal
  knowledge.
- Emphasize minimal documentation, ensuring that modifiability and traceability
  remain agile-friendly and do not compromise agility.

**Sources:**

1. Lucassen, G., et al. (2016). _Quality user story framework (QUS) – 13
   criteria for well-written user stories (syntax, semantics, pragmatics)_.
2. Lucassen, G., et al. (2016). _Example criteria from QUS (Well-Formed, Atomic)
   and effect of violations_.
3. Kuhail, M.A., & Lauesen, S. (2022). _User Story Quality in Practice – Case
   study findings on missing needs and NFRs_.
4. Kuhail, M.A., & Lauesen, S. (2022). _Practitioners agree on templates
   (INVEST) improving quality_.
5. Heck, P., & Zaidman, A. (2015). _Agile Requirements Verification Framework –
   high-level criteria (completeness, consistency, correctness)_.
6. Wang, T., et al. (2022). _Multi-dimensional user story quality assessment –
   use of NLP and iStar modeling to detect defects_.
7. AmbiTRUS (Ananjeva et al., 2025). _Ambiguity analysis framework – criteria
   for various ambiguity types in user stories_.
8. Cohn, M. / Wake, B. (Referenced in Lucassen 2016). _INVEST mnemonic for user
   story quality (I, N, V, E, S, T)_.
9. Santos, R. et al. (2025). _“User Stories: Does ChatGPT Do It Better?” – AI vs
   human story quality using QUS_.
10. IEEE 29148-2018 (Referenced in Kuhail 2022). _Software requirements quality
    criteria (correct, verifiable, traceable, etc.), applied to user stories_.
