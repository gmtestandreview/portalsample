# Standard Implementation Plan Template

Load this reference when producing the normal human/agent-readable implementation plan. Do not use it when the user explicitly requires the deterministic identifier-based template in `deterministic-plan-template.md`.

Replace every bracketed placeholder before finalizing.

````markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence describing what this builds.]

**Architecture:** [2-3 sentences explaining the approach.]

**Tech Stack:** [Actual technologies, frameworks, and test tools.]

## Source Inputs

- Spec/source: `exact/path/or/source`
- Relevant files inspected:
  - `path/to/file`: [why it matters]

## Assumptions and Unknowns

- Assumption: [safe assumption]
- Blocking ambiguity: [only when implementation cannot safely proceed]

## Requirement Traceability

| Requirement | Task(s) | Notes |
|---|---|---|

## Framework Fit

[State which additional planning frameworks are used or not needed, with a short rationale.]

## Files and Responsibilities

| Path | Action | Responsibility |
|---|---|---|

## Tasks

### Task N: [Specific component or behavior]

**Files**
- Create: `exact/path`
- Modify: `exact/path`
- Test: `exact/path`

- [ ] **Step 1: Write the failing test or acceptance test**

[Actual test code or exact acceptance-test instructions.]

- [ ] **Step 2: Verify the test fails**

Run: `exact command`  
Expected: `exact failure`

- [ ] **Step 3: Implement the minimal change**

[Concrete code, exact edits, or repository-grounded patch guidance.]

- [ ] **Step 4: Verify the test passes**

Run: `exact command`  
Expected: `exact pass result`

- [ ] **Step 5: Run relevant regression checks**

Run: `exact command`  
Expected: `exact result`

- [ ] **Step 6: Commit when the repository workflow uses commits**

If commits are part of the repository workflow, stage only the files for this task and create the targeted commit:

```bash
git add exact/path exact/path
git commit -m "type: concise specific change"
```

If the repository workflow does not use commits, omit this step rather than inventing a commit requirement.

## Safety, Rollback, and Verification

- Risk:
- Verification:
- Rollback:

## Final Validation

- Requirement coverage: PASS/FAIL
- Exact paths: PASS/FAIL
- Tests before implementation: PASS/FAIL
- Exact commands and expected outputs: PASS/FAIL
- No placeholders or undefined references: PASS/FAIL
- Safety and rollback covered where needed: PASS/FAIL
- Score: NN/100
- Critical failures: None/Present

## Execution Handoff

- Plan path:
- Blocking unknowns:
- Supported execution mode:
````

If Superpowers skills are explicitly available in the target environment, the handoff may reference `superpowers:subagent-driven-development` or `superpowers:executing-plans`. Otherwise keep the handoff standalone.
