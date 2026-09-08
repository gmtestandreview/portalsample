# Skill Classification

Use this reference during **Step 2: Qualify** of the SKILLS.md Doctor workflow.

Its purpose is to classify a candidate Agent Skill as a **Discipline**, **Technique**, **Pattern**, **Reference**, or justified **Hybrid**, then select the appropriate testing emphasis.

Do not classify from the skill name alone. Classify from its **primary reusable value, execution model, scope, and expected agent behavior**.

---

## Classification Procedure

1. Read the candidate `SKILL.md` and relevant supporting files.
2. Identify its primary purpose.
3. Identify what the agent is expected to do after activation.
4. Determine whether the value is mainly:
   - governing a broad practice;
   - performing a bounded method;
   - applying a reusable decision structure;
   - supplying authoritative knowledge; or
   - combining two or more of these inseparably.
5. Apply the definitions below.
6. Select the **narrowest classification that explains the skill's primary value**.
7. Use **Hybrid** only when no single category adequately describes the skill without losing material execution value.
8. Record the classification, evidence, uncertainty, and applicable test emphasis.

If evidence is insufficient, classify as `Needs Human Review` rather than guessing.

---

# 1. Discipline

## Definition

A **Discipline** skill governs a broad, repeatable area of professional practice containing multiple related decisions, procedures, quality gates, and failure modes.

It usually coordinates several techniques or patterns under one coherent operational objective.

## Typical characteristics

- Covers a substantial end-to-end workflow.
- Contains multiple decision points or phases.
- Applies quality, safety, review, or governance rules across the workflow.
- May invoke several tools, references, or sub-procedures.
- Requires judgment rather than one fixed method.
- Often includes escalation, validation, rollback, or completion criteria.

## Examples

- API contract design and review.
- Security review.
- Data-quality investigation.
- SKILL.md lifecycle management.
- Incident response.
- Accessibility audit.

## Positive test

> "Audit this skill library, identify structural and activation problems, score the skills, and recommend remediation."

Expected: activates a lifecycle/audit Discipline skill.

## Near-miss

> "Rewrite this one description so it is shorter."

Expected: a narrow editing technique is sufficient; the full Discipline workflow should not activate unless broader review is requested.

## Test emphasis

Use **pressure tests**:

- conflicting requirements;
- incomplete evidence;
- ambiguous scope;
- edge and failure cases;
- safety or destructive actions;
- cross-file consistency;
- escalation and human-review boundaries;
- rollback and recovery;
- long multi-step tasks where instructions may conflict or be skipped.

A Discipline skill should remain coherent under combinations of problems, not only isolated happy-path prompts.

---

# 2. Technique

## Definition

A **Technique** skill teaches a bounded method for performing a specific task or transformation.

Its value is primarily **how to execute one class of operation well**.

## Typical characteristics

- Narrower than a Discipline.
- Has a recognizable start and finish.
- Uses a repeatable procedure.
- Usually solves one type of problem.
- May have a preferred tool or algorithm.
- Often produces a predictable output.

## Examples

- Optimize a skill description.
- Convert CSV to JSON.
- Generate a migration diff.
- Extract text from PDFs.
- Normalize API error responses.

## Positive test

> "Improve this skill description so it triggers for relevant prompts without false positives."

Expected: activates the description-optimization Technique.

## Near-miss

> "Audit the entire skill for specification compliance, safety, scripts, and activation."

Expected: requires a broader Discipline, not only the description Technique.

## Test emphasis

Test:

- correct inputs;
- incorrect or malformed inputs;
- method sequencing;
- expected output;
- tool/default selection;
- edge cases;
- reproducibility;
- failure messages;
- validation of the produced result.

A Technique should not silently expand into unrelated lifecycle work.

---

# 3. Pattern

## Definition

A **Pattern** skill provides a reusable decision, architecture, interaction, or workflow structure that can be applied across multiple domains.

Its value is primarily **the shape of the solution**, not domain-specific subject matter.

## Typical characteristics

- Encodes a reusable arrangement or decision rule.
- Applies across multiple task instances or domains.
- Often contains "when X, use Y" branching.
- May provide templates, sequences, or structural conventions.
- Usually requires contextual adaptation.

## Examples

- Plan → validate → execute.
- Retry with bounded exponential backoff.
- Adapter/facade selection guidance.
- Evidence → finding → recommendation reporting.
- Progressive-disclosure structuring.

## Positive test

> "Design a safe workflow where changes are planned, checked against source data, then executed."

Expected: activates a plan-validate-execute Pattern.

## Near-miss

> "Run this project's database migration command."

Expected: execution may use the pattern, but the request itself is a concrete Technique or project procedure.

## Test emphasis

Test:

- correct pattern selection;
- applicability boundaries;
- near-miss patterns;
- adaptation without breaking invariants;
- conflicting patterns;
- over-application;
- cases where the pattern should not be used.

A Pattern fails when it becomes a universal rule for situations outside its intended boundary.

---

# 4. Reference

## Definition

A **Reference** skill primarily supplies authoritative, domain-specific, or project-specific facts, constraints, schemas, conventions, mappings, or lookup material.

Its value is mainly **what the agent must know**, rather than a multi-step execution procedure.

## Typical characteristics

- Fact- or rule-dense.
- Low procedural content.
- Often consulted by another skill.
- May define schemas, enums, terminology, mappings, standards, or constraints.
- Frequently suitable for on-demand loading.

## Examples

- API schema conventions.
- Organization-specific terminology.
- Error-code catalogue.
- Design-token reference.
- Regulatory checklist.
- Test-data field definitions.

## Positive test

> "What statuses are permitted by this project's workflow policy?"

Expected: load the relevant Reference and answer from it.

## Near-miss

> "Redesign the workflow and implement the changes."

Expected: the Reference may support the work but should not govern the whole implementation workflow.

## Test emphasis

Test:

- factual accuracy;
- completeness for the declared scope;
- internal consistency;
- stale or conflicting entries;
- lookup precision;
- broken references;
- correct load conditions;
- whether procedural material should be moved elsewhere.

A Reference should not masquerade as an executable workflow when it mainly contains knowledge.

---

# 5. Hybrid

## Definition

A **Hybrid** combines two or more classifications when the combination is necessary to preserve the skill's core execution value.

Do not use Hybrid merely because a skill contains a few rules, examples, or references. Most good skills contain mixed content while still having one dominant classification.

## Hybrid threshold

Classify as Hybrid only when all are true:

1. At least two classifications provide substantial, load-bearing value.
2. Removing either would materially weaken the skill's primary purpose.
3. The parts normally activate together for the same user intent.
4. Splitting them would create duplicated context, fragile coordination, or unclear activation.
5. The combined scope remains coherent.

Otherwise choose the dominant type and move secondary material to references or separate skills.

## Common hybrids

- **Discipline + Reference**: a governed workflow inseparable from specialized rules.
- **Discipline + Technique**: an end-to-end practice with a central execution method.
- **Technique + Reference**: a bounded method requiring tightly coupled domain knowledge.
- **Pattern + Reference**: a reusable structure constrained by a fixed domain model.

Avoid hybrids that combine unrelated purposes.

## Test emphasis

Run the tests for each load-bearing classification plus:

- activation-coherence tests;
- split-vs-combine tests;
- instruction-conflict tests;
- context-bloat tests;
- duplication tests;
- progressive-disclosure tests.

---

# Decision Guide

Use the first statement that best describes the skill's **primary value**:

1. **"It governs a broad professional workflow with multiple decisions and quality gates."**
   → **Discipline**

2. **"It teaches how to perform one bounded task or transformation."**
   → **Technique**

3. **"It provides a reusable structural or decision model across tasks/domains."**
   → **Pattern**

4. **"It mainly supplies facts, constraints, schemas, mappings, or authoritative rules."**
   → **Reference**

5. **"Two or more of the above are inseparable and independently load-bearing."**
   → **Hybrid**

If more than one category appears plausible, prefer the narrowest dominant category and test whether splitting secondary content preserves execution quality.

---

# QAQ/RMI Classification Check

For the chosen classification:

1. Define a positive request that should invoke this type.
2. Define a near-miss better served by another type.
3. Map the positive request to the classification definition.
4. Verify the near-miss does not fit the same definition.
5. Reverse-map the expected behavior to the chosen type.
6. Check whether another classification explains the behavior more directly.
7. Fail if classification depends only on keywords, file names, or incidental content.
8. Pass only when purpose, execution model, scope, and test strategy align.

---

# Classification Output

Report:

```markdown
## Skill Classification

**Classification:** Discipline | Technique | Pattern | Reference | Hybrid
**Confidence:** High | Medium | Low

**Primary purpose:** <one sentence>

**Evidence:**
- <evidence from the skill>
- <evidence from supporting resources>

**Why this classification:** <short explanation>

**Rejected alternatives:**
- <type>: <why it is less accurate>

**Testing emphasis:**
- <applicable tests>

**Human review:** None | <unresolved classification issue>
```

---

# Anti-Patterns

Do not:

- classify by filename alone;
- call every large skill a Discipline;
- call every procedural skill a Technique;
- call every reusable rule a Pattern;
- call every documentation-heavy skill a Reference;
- use Hybrid to avoid making a classification decision;
- force unrelated purposes into one skill;
- treat supporting references as evidence that the parent skill is automatically a Reference;
- treat one embedded technique as evidence that a Discipline is a Hybrid.

The classification exists to improve **scope, activation, testing, progressive disclosure, and maintainability**. It is not a label for its own sake.
