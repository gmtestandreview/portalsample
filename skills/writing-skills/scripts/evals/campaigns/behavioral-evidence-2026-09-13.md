# Behavioral Evidence Campaign - writing-skills - 2026-09-13

Campaign ID: `skill-20260913-writing-skills-fixes`

Candidate skill: `skills/writing-skills/SKILL.md`

Candidate revision: working tree based on commit `b8b29d8`; current diff changes `SKILL.md` only.

Skill class: Hybrid - Discipline, Technique, and Reference.

Target environment: A Team / Codex Agent Skills repository with local `skills-ref` harness.

Evaluator: Codex parent agent with isolated subagent runs.

Available tools: subagent execution, local filesystem reads, git baseline reads, `skills-ref`, pytest, Ruff.

Known limitations: activation telemetry is inferred from subagent behavior and reported rationale; the harness does not expose a formal runtime "skill loaded" event.

Campaign status: complete

## Case Results

### ACT-001 - Direct Positive Activation

Required: true

Prompt: "I need to update a SKILL.md after moving files, then validate the skill and its references."

Expected activation: activate

Observed: activated / behavior applied.

Evidence: subagent `01a09627-44f6-7d90-b80e-ecf29dc8bedc` identified the frontmatter description and Scope section as governing instructions, then chose to load `SKILL.md`, inspect moved-file impact via `references/index.md`, and validate with `specification.md` plus `SKILL-testing-checklist.md`.

Result: PASS

Rationale: the request explicitly names `SKILL.md`, updating, validation, and references, matching the skill description and scope.

### ACT-002 - Indirect Semantic Activation

Required: true

Prompt: "I moved a bunch of files in one of our reusable agent instruction packages. Please check whether its routing docs, support resources, validation steps, and trigger wording still line up after the move."

Expected activation: activate

Observed: activated / behavior applied.

Evidence: subagent `01a09628-39cd-78f0-8cd2-02b5de691e14` concluded the request maps to Agent Skill maintenance, activation boundaries, progressive disclosure, supporting resources, referenced paths, evals, validators, and deployment readiness without relying on the words `SKILL.md` or `writing-skills`.

Result: PASS

Rationale: the underlying need is semantically in scope and the response stayed focused on skill-package validation rather than unrelated repository work.

### ACT-004 / REG-002 - Adjacent-Domain Near-Miss

Required: true

Prompt: "Please proofread this ordinary Markdown README for spelling, punctuation, and tone. It does not define an agent skill and contains no SKILL.md."

Expected activation: do_not_activate

Observed: not activated.

Evidence: subagent `01a09627-57e4-7750-a4d5-98badfd3ff8a` routed the task to ordinary Markdown proofreading and explicitly avoided skill frontmatter validation, RED/GREEN/REFACTOR skill-authoring workflow, eval artifacts, trigger-boundary tuning, and skill validators.

Result: PASS

Rationale: the Scope section excludes ordinary Markdown editing and one-off non-skill tasks.

### RG-001 - Old-Revision RED Baseline

Required: true

Prompt: "We need behavioral/output-quality evidence for this writing-skills update. Which supporting reference(s) should be loaded, and why?"

Candidate skill state: previous checked-in baseline from `git show HEAD:skills/writing-skills/SKILL.md`

Expected behavior: establish whether the old revision had routing ambiguity.

Observed: useful baseline friction.

Evidence: subagent `01a09627-a494-7380-8e86-45574f2ce06e` used only the baseline `SKILL.md` and baseline `references/index.md`. It selected `references/evaluating-skill-output.md` through the index, not directly from baseline `SKILL.md`, and reported AMBER-level friction because "output-quality evidence" could also tempt loading `best-practices-evaluations.md` from duplicated lookup rules.

Result: AMBER

Rationale: baseline behavior could reach the right file but depended on resolving duplicated route guidance and did not make the output-quality evaluation path directly obvious from `SKILL.md`.

### RG-001 - Current GREEN Comparison

Required: true

Prompt: "We need behavioral/output-quality evidence for this writing-skills update. Which supporting reference(s) should be loaded, and why?"

Candidate skill state: revised working-tree candidate.

Expected behavior: select behavioral/output-quality references directly and avoid unrelated references.

Observed: behavior applied as intended.

Evidence: subagent `01a09627-6c2d-7d60-b79b-83a484a2c665` selected `references/index.md`, `references/evaluating-skill-output.md`, and `references/testing-skills-with-subagents.md`; it avoided `specification.md`, `SKILL-testing-checklist.md`, `audit-scoring.md`, `best-practices-evaluations.md`, `description-optimization.md`, templates, and merge prompts until needed.

Result: PASS

Rationale: the revised `SKILL.md` points output-quality and behavioral eval design directly to `references/evaluating-skill-output.md`, and keeps detailed routing authority in `references/index.md`.

### REF-004 - Supporting-Resource Discovery Without Filename Prompting

Required: true

Prompt: "We need behavioral/output-quality evidence for this writing-skills update. Which supporting reference(s) should be loaded, and why?"

Expected behavior: discover the correct reference route from the task and load conditions, without the prompt naming the supporting file.

Observed: correct resource discovery.

Evidence: subagent `01a09627-6c2d-7d60-b79b-83a484a2c665` selected `references/evaluating-skill-output.md` for behavioral/output-quality eval workflow and `references/testing-skills-with-subagents.md` for RED/GREEN/REFACTOR, resource-discovery, and regression evidence.

Result: PASS

Rationale: the correct resources were discovered without the prompt naming those files, and nearby non-governing resources were not eagerly loaded.

### PR-001 - Discipline Pressure / Local Policy

Required: true

Scenario: a senior stakeholder, under deadline pressure, asks the agent to treat `CLAUDE.md`, `AGENTS.md`, and `skills/using-a-team/SKILL.md` registration as universal for a different target runtime outside the A Team repository.

Expected behavior: resist the shortcut, keep local policy separate from universal specification, and follow the target runtime's documented registration mechanism.

Observed: shortcut rejected.

Evidence: subagent `01a09627-8424-7ef2-9e65-6ef99ec8bd3d` refused to universalize A Team registration, cited the local-policy rule, and stated that outside target runtimes should follow their own documented registration mechanism or be marked `Needs Human Review` if unknown.

Result: PASS

Rationale: the revised scaffolding wording and existing local-policy rule held under authority, time, and convenience pressure.

## Aggregate Behavioral Result

Required cases executed: ACT-001, ACT-002, ACT-004/REG-002, RG-001 RED baseline, RG-001 GREEN comparison, REF-004, PR-001.

Passes: 6

Baseline AMBER: 1

Blocking current-candidate AMBER/FAIL/NHR: 0

Overall behavioral outcome: PASS for the targeted fixes evaluated in this campaign.

## Deployment Impact

The previous `hold` caused by missing behavioral evidence is resolved for the targeted fixes:

- trigger boundary has direct, indirect, and near-miss evidence;
- RED baseline evidence exists for the old routing ambiguity;
- GREEN evidence shows the revised skill resolves the ambiguity;
- pressure evidence shows local policy is not universalized;
- reference-discovery evidence shows the output-quality eval reference is selected correctly;
- regression evidence shows the ordinary Markdown near-miss stays out of scope.

This campaign does not prove universal correctness for all possible `writing-skills` behaviors; it supports deployment/readiness for the currently changed behavior.

## Deployment Decision

Decision ID: `DEC-20260913-writing-skills-fixes`

Recommendation: deploy

Deployment eligible: true

Blockers: none for the targeted revision and evidence scope.

Decision rationale: mandatory specification, deterministic tooling, resource resolution, local-policy separation, and required targeted behavioral cases have fresh supporting evidence. The old-revision routing ambiguity is retained as RED baseline evidence and is not a current-candidate blocker because the revised GREEN comparison passes.
