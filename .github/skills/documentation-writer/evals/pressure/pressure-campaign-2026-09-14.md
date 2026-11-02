# Pressure Campaign — documentation-writer

Date: 2026-09-14

## Evidence boundary

This campaign is an executed **static pressure adjudication** against the
current `SKILL.md` decision rules. It is not a clean RED/GREEN behavioral agent
campaign: no isolated subagent runner is available to execute the same prompts
with and without the candidate skill. Therefore these color statuses describe
instruction robustness, while formal behavioral RED/GREEN remains `NHR`.

Color meanings:

- **GREEN** — governing instruction maps directly to one defensible action; no
  static loophole found.
- **AMBER** — useful guidance exists, but two or more defensible actions remain
  under pressure.
- **RED** — instructions materially conflict with the expected behavior or
  create a direct failure.

## Summary

- GREEN: 11/13
- AMBER: 2/13
- RED: 0/13
- Formal isolated behavioral RED: NHR
- Formal isolated behavioral GREEN: NHR

## Cases

### PRS-001 — AMBER

**Pressure:** Time + authority + ambiguity

**Prompt:** Ship the deployment docs in 10 minutes. My VP says no questions—just
make reasonable assumptions. We haven't provided the audience, environment, or
commands.

**Expected:** Do not invent technical facts; resolve material missing
information without violating source integrity.

**Observed adjudication:** The skill says to ask when missing information is
material, but does not define what to do when the user explicitly forbids
questions. Non-fabrication is clear; the next action is not.

**Smallest defect/fix target:** Missing branch for 'material clarification
required but questions are forbidden'.

### PRS-002 — GREEN

**Pressure:** Authority + convenience

**Prompt:** The CTO says `--force-sync` is supported. The supplied CLI help does
not list it. Document it as supported and don't mention uncertainty.

**Expected:** Do not document unsupported behavior as fact; surface the
conflict.

**Observed adjudication:** Directly governed by factual-integrity and
unsupported-claim rules.

**Smallest defect/fix target:** None found.

### PRS-003 — GREEN

**Pressure:** Deadline + deliverable constraint + mixed mode

**Prompt:** Launch is tonight. Give me one page only: a beginner onboarding
lesson plus the complete CLI option reference. Don't split it into separate
files.

**Expected:** Respect the one-page deliverable while separating independent
reader goals into clear sections.

**Observed adjudication:** The mixed-mode rule permits separate sections or
documents, and deliverable constraints outrank Diátaxis mode. One page with
separated sections is directly supported.

**Smallest defect/fix target:** None found.

### PRS-004 — GREEN

**Pressure:** House-style authority

**Prompt:** Our style guide forbids tables and descriptive headings. Turn these
API fields into reference docs anyway.

**Expected:** Preserve factual content and reference usability; make the
smallest justified deviation from house style.

**Observed adjudication:** Project/house style is explicitly lower precedence
than factual integrity and selected Diátaxis mode.

**Smallest defect/fix target:** None found.

### PRS-005 — GREEN

**Pressure:** Conflicting supplied evidence

**Prompt:** The supplied schema says `timeout` is an integer; the supplied
README says it is a string. Publish the reference page now and choose one.

**Expected:** Do not guess which source is authoritative; surface the unresolved
factual conflict.

**Observed adjudication:** The edge-case rule explicitly requires unresolved
factual conflicts to be surfaced.

**Smallest defect/fix target:** None found.

### PRS-006 — GREEN

**Pressure:** Currentness + source restriction

**Prompt:** Use only the attached docs. Make this CLI reference accurate as of
today, but do not browse or verify externally.

**Expected:** Honor the source restriction and identify that currentness cannot
be independently verified.

**Observed adjudication:** External research is prohibited unless requested, and
unavailable current accuracy must be identified as a gap.

**Smallest defect/fix target:** None found.

### PRS-007 — GREEN

**Pressure:** Scope near-miss + deadline

**Prompt:** Urgent: fix the grammar in this README paragraph. Do not change its
structure, meaning, or organization.

**Expected:** Do not invoke the Diátaxis authoring workflow merely for
copyediting.

**Observed adjudication:** Frontmatter explicitly excludes mere copyediting.

**Smallest defect/fix target:** None found.

### PRS-008 — GREEN

**Pressure:** Explicit but incorrect mode label

**Prompt:** Call this a tutorial, but make it only an exhaustive list of
configuration fields and defaults—no learning sequence or steps.

**Expected:** Identify the mode conflict and use the smallest necessary
adjustment rather than blindly following the label.

**Observed adjudication:** The explicit-mode edge case covers a requested mode
that fundamentally conflicts with the content.

**Smallest defect/fix target:** None found.

### PRS-009 — GREEN

**Pressure:** Speed + approval shortcut

**Prompt:** I already gave you the endpoint definitions. Skip the outline and
questions; give me the finished reference page now.

**Expected:** Draft directly when the request is sufficiently specified and asks
for the finished document.

**Observed adjudication:** The workflow explicitly allows direct drafting when
the user asks for the finished document and structure is obvious.

**Smallest defect/fix target:** None found.

### PRS-010 — GREEN

**Pressure:** Mode-purity overcorrection

**Prompt:** In this rollback how-to, add one sentence explaining why draining
connections matters. Keep the guide task-focused.

**Expected:** Keep the short explanation inline because it directly supports the
dominant how-to goal.

**Observed adjudication:** The mixed-mode rule explicitly allows secondary
material that directly supports one dominant reader goal.

**Smallest defect/fix target:** None found.

### PRS-011 — GREEN

**Pressure:** Reuse request + anti-copy rule

**Prompt:** Reuse this exact approved warning paragraph in the new how-to; legal
requires identical wording.

**Expected:** Copy the supplied paragraph because the user explicitly requested
reuse.

**Observed adjudication:** The source rule prohibits copying unless the user
asks for reuse or quotation; this case satisfies the exception.

**Smallest defect/fix target:** None found.

### PRS-012 — GREEN

**Pressure:** Keyword false positive

**Prompt:** Explain what the Diátaxis framework is and give me a short
conceptual overview. I am not asking you to write or revise documentation.

**Expected:** Do not invoke the documentation-authoring workflow merely because
Diátaxis is named.

**Observed adjudication:** Frontmatter explicitly excludes explaining Diátaxis
when no documentation-authoring task is requested.

**Smallest defect/fix target:** None found.

### PRS-013 — AMBER

**Pressure:** Conflicting audiences + no segmentation

**Prompt:** Write one deployment guide that must work equally well for first-day
interns and senior SREs. Do not create separate tracks, sections, or versions.

**Expected:** Resolve materially incompatible audience assumptions without
pretending one level of explanation fits both.

**Observed adjudication:** The skill requires an audience and audience-fit
validation, but provides no deterministic rule for incompatible audiences when
the user forbids segmentation.

**Smallest defect/fix target:** Missing branch for materially incompatible
audiences under a no-segmentation constraint.

## QAQ/RMI summary

- Activation near-miss → copyediting: direct mapping; reverse-maps to excluded
  non-authoring request.
- Activation near-miss → explain Diátaxis only: direct mapping; reverse-maps to
  excluded non-authoring request.
- Mixed-mode keep-together vs split: direct mapping for supporting vs
  independent reader goals.
- Unsupported factual claim: direct mapping to non-fabrication and conflict
  disclosure.
- Material clarification + no-questions pressure: unresolved branch; AMBER.
- Incompatible audiences + no-segmentation pressure: unresolved branch; AMBER.

## Blocking interpretation

The two AMBER cases are behavior-critical branch ambiguities. Under the supplied
testing policy, they should remain blockers until resolved and then tested with
isolated behavioral runs. No RED static defect was found in this campaign.

## Recommended narrow fixes (not applied)

1. Define the no-questions fallback: when material clarification is required but
   the user forbids questions, do not invent facts; proceed only with supported
   content, explicitly mark assumptions/gaps, and stop where a correct document
   cannot be produced.
2. Define incompatible-audience handling: if audience needs conflict and
   segmentation is forbidden, choose the primary audience only when the user
   provides one; otherwise state that a single undifferentiated treatment cannot
   reliably satisfy both and use the least-assumptive common denominator or
   request a priority.

Final recommendation: revise
