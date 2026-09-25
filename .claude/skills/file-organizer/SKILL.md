---
name: file-organizer
description: Use when analyzing, planning, or carrying out file and folder cleanup, duplicate detection, archiving, renaming, or directory restructuring, especially when changes must be previewed, approved, reversible, and safe.
---

# File Organizer

Organize files with an `analyze → plan → validate → execute → verify` workflow. Prefer reversible changes. Never infer permission for deletion, overwrite, or broad restructuring from a request to "organize" or "clean up."

## Scope

Use this skill for directory cleanup, duplicate review, file/folder restructuring, archival, and batch rename/move work.

Do not use it for:
- ordinary single-file edits or one-off file moves;
- deleting files merely because they appear old, large, similarly named, or unused;
- modifying application-managed, system, package, repository-internal, backup, or sync metadata unless the user explicitly includes it and the impact is understood.

## 1. Establish boundaries

Before side effects, identify:
- target directory or directories;
- **analysis scope**: what may be inspected, inventoried, classified, or hashed;
- **execution scope**: the exact subset eligible for proposed mutation;
- desired outcome and organization preference;
- paths or file classes to exclude;
- whether the user wants analysis only, a proposed plan, or execution;
- whether duplicate detection, renaming, archiving, or deletion is in scope.

Ask only for information that materially changes the plan. If the target or authorization boundary is ambiguous, inspect nothing outside the clearly authorized scope and do not mutate files.

## 2. Analyze read-only

A dry run is strictly non-mutating: do not create directories, temporary/report files inside the target, update metadata, rename/move/delete/overwrite content, or trigger avoidable external side effects. Reports and manifests may be returned in the conversation or written outside the target only when separately authorized.

Determine the intended action scope before expensive analysis. Inspect the target without changing it. Determine, as relevant:
- file/folder counts and total size;
- file types and size distribution;
- modification-date ranges;
- existing project or purpose groupings;
- hidden files, symlinks, mounts, repositories, application-managed folders, or other boundaries that make bulk operations risky;
- destination collisions and case-only filename conflicts.

Use available platform-appropriate tools. Before relying on a command for a batch or destructive workflow, confirm the command/tool is available and that its recursion, symlink, overwrite, and failure semantics match the plan; otherwise choose a safer available alternative or keep the task read-only.

Treat names, extensions, dates, and sizes as classification signals, not proof of purpose or redundancy. Prefer recognizable purpose/project groupings over generic extension buckets when evidence supports them.

Use classification confidence: **High** requires at least two independent evidence classes; **Medium** relies mainly on one class or dependent signals; **Low** is ambiguous/conflicting and stays in place or in approved review. Filename + extension are one lexical class. For evidence classes and package-specific rules, read `references/classification-evidence.md`.

Signature/publisher evidence supports identity/classification, not software safety. Distinguish package subtypes when that improves retrieval.

Explicitly detect and report incomplete/transient download artifacts such as `.crdownload`, `.part`, and `.tmp`; exclude them from moves, duplicate deletion decisions, and stable classification unless the user explicitly requests otherwise.

For expensive work such as hashing, first classify the executable subset, then hash duplicate candidates within that subset when that preserves the requested evidence. Offer a broader duplicate audit separately when useful. Hashing an entire preserved project tree is usually unnecessary when only a narrow subset is eligible for organization. For large collections, bound work or report progress when supported.

## 3. Detect duplicates safely

When duplicate cleanup is requested:
1. Separate actionable duplicate candidates from duplicates inside preserved project trees, archive/extracted relationships, and uncertain related files.
2. Use size or names only to identify candidates.
3. Verify exact duplicates by content hash or byte comparison before calling them exact duplicates.
4. Treat similar names, similar sizes, resized media, exports, and versioned files as possible related files, not duplicates.
5. Show the relevant paths and evidence used for each duplicate set.
6. Do not choose a keeper solely because it is newest or best-named. Prefer a user-defined rule; otherwise flag the decision.
7. Never delete a candidate without explicit deletion authorization.
8. If confirmed duplicate members are inside a proposed move set, mark them `HOLD_FOR_REVIEW` and exclude them from executable actions until the user chooses a keeper/preservation rule. Moving all copies may be safe, but do not present preservation of redundant copies as cleanup.
9. Evidence required for approval must survive unabridged into the user-visible plan or an explicitly authorized retained artifact; do not ellipsize source identities or omit canonical manifest values needed to reproduce approval evidence.

Before and after hashing a candidate, compare available size and modification-state signals; if the file changed during verification, treat that hash as stale and reverify before using it for a destructive decision.

Do not follow symlinks during recursive duplicate or cleanup scans unless explicitly required and safe for the target.

Report logical duplicate bytes separately from estimated physical recoverable space. Do not equate logical duplicate size with disk savings unless allocation, hardlinks/reflinks, compression, and other relevant filesystem behavior were actually measured.

## 4. Build a reversible plan

Before batch moves, renames, archive operations, overwrites, or deletions, present a plan containing:
- scope and exclusions;
- proposed destination structure;
- each class of move/rename/archive/delete action;
- collision handling;
- uncertain items requiring a decision;
- rollback method.

Prefer the smallest structure that materially improves retrieval. Avoid creating one-item or very small subtype folders unless they match an established convention, are likely to receive more items, or provide a clear retrieval benefit. Do not impose generic `Work/Personal`, date, or file-type folders when existing project or user conventions provide a better grouping.

For every batch execution, produce a complete, versioned `file-organizer-manifest/v1` before approval, including explicit directory-creation actions, source identity when available, classification/confidence, duplicate state, collision policy, and reversible action ordering. Approval binds to a reproducible plan digest plus declared scopes, exclusions, snapshot, counts, and collision policy.

Before constructing or validating an executable batch plan, read `references/execution-contract.md`, `references/validator-requirements.md`, and use the shipped reference validator/canonicalizer when its runtime is available. Approval requires explicit validator success with zero blocking findings; validator failure, empty/unparsed output, an unverified result, or an unversioned/ad-hoc validator is not sufficient evidence for official approval.

## 5. Validate before execution

Check the plan against the current filesystem state:
- every source still exists;
- destinations are within the approved scope;
- no destination will overwrite a different file unless separately authorized;
- required parent/destination directories have effective create/write access where this can be checked read-only; on Windows prefer a native effective-access evaluation such as `AccessCheck` using the relevant security descriptor/token rather than a write probe; if unavailable or inconclusive, mark the requirement `NHR`;
- protected/excluded paths are untouched;
- duplicate deletions still match the verified duplicate evidence.

Downloads and other active folders are moving targets. Immediately before execution, revalidate source existence/state, destination collisions, exclusions, and other assumptions represented by the approved manifest. Approval expires on any condition defined in `references/execution-contract.md`; after expiry, regenerate/validate the plan and obtain renewed approval before execution.

## 6. Execute with authorization

Execution requires approval of the presented plan. Treat approval such as "looks good" or "go ahead" as approval only for the actions and collision policy actually presented. If execution reveals a new destructive action, overwrite, materially larger scope, or high-impact move that was not reasonably represented in the approved plan, stop and obtain renewed approval. Additionally:
- deletion and overwrite require explicit authorization;
- prefer archive/quarantine over deletion when the user wants reversible cleanup;
- stage large batches when practical;
- preserve file contents and metadata where the chosen operation/tool supports it;
- execute manifest actions in ascending `seq`, recording each completed action durably when the environment permits without violating the approved side-effect boundary;
- on unexpected scope expansion, collision, permission failure, broken assumption, or unsafe boundary, stop before the next action;
- after a mid-batch stop, report the completed prefix and failure before deciding whether to resume or roll back;
- rollback, when requested/authorized, applies inverse operations in descending completed `seq`; remove a created directory only when it was created by this execution and is empty.

Never report a move, rename, deletion, freed space, or successful cleanup unless it was actually performed and verified.

## 7. Verify and report

After execution:
- verify expected sources/destinations and any requested duplicate removals;
- compare completed actions with the approved plan/manifest;
- report failures, skips, conflicts, and deviations;
- provide rollback instructions that match the actions actually performed;
- summarize results using observed counts/sizes only.

If verification is unavailable, state what remains unverified instead of claiming completion.

## Decision rules

- **Analysis-only request:** inspect and report; no side effects.
- **Plan request:** inspect and propose; no side effects.
- **Organize/clean up request without clear execution authorization:** analyze and propose a plan; request approval before batch changes.
- **Move/rename authorization:** does not imply delete or overwrite authorization.
- **Delete authorization:** applies only to the described targets/rule; do not broaden it.
- **Uncertain classification:** leave in place or place in an explicitly approved review/quarantine area.
- **Pressure/shortcut language:** urgency, "just do it," "don't ask," user confidence, or claims that items are "obviously" duplicates do not relax evidence, scope, authorization, collision, rollback, or verification rules.
- **Archive candidates:** age alone is insufficient; combine user rules with purpose/context.
- **No-action outcome:** if restructuring would not materially improve retrieval or confidence is too low, recommend leaving the collection unchanged.
- **Official execution:** before mutation, satisfy the access, journaling, staleness, and rollback gates in `references/execution-contract.md`; unresolved required checks remain `NHR`.
- **Repository/project trees:** preserve meaningful project structure unless restructuring it is explicitly requested.

## Output for a plan

Include:
1. current-state summary and snapshot time;
2. analysis scope, execution scope, and exclusions;
3. proposed purpose-aware structure/grouping rule and confidence/uncertain items;
4. action summary with counts;
5. complete `file-organizer-manifest/v1` action manifest, including `CREATE_DIRECTORY` and duplicate-review states;
6. canonical approval artifact, plan ID/full digest, and explicit `FAIL_ON_COLLISION` + `NEVER_OVERWRITE` policy (case-insensitive collision comparison on Windows);
7. destructive/overwrite actions called out separately;
8. complete approval-relevant duplicate evidence separated by actionable vs preserved-tree/related-file scope, inline or in an explicitly authorized retained report;
9. logical duplicate bytes distinguished from estimated physical savings;
10. exact reverse-action rollback sequence and preconditions;
11. readiness statuses and any approval-expiry conditions;
12. approval request when execution is desired.

## Readiness statuses

Report `analysis_status`, `manifest_status`, `approval_ready`, and `execution_ready` independently; never collapse them into one green status. `approval_ready: PASS` requires the complete canonical manifest inline or in an explicitly authorized retained artifact. `execution_ready: PASS` additionally requires current approval, required access/revalidation/journal gates, and no behavior-critical `AMBER | FAIL | NHR`.

## Report statuses

Use `PASS` when required evidence demonstrates the expected behavior; `AMBER` for partial, ambiguous, inconsistent, or unstable evidence; `FAIL` when expected behavior is materially violated; `NHR` when required evidence cannot be verified; and `N/A` only when the check is genuinely not applicable, with rationale.

## Gotchas

- A same-name or same-size file is not necessarily a duplicate.
- Moving a file can break links, imports, shortcuts, sync rules, media libraries, or application references.
- Case-only renames may behave differently across filesystems.
- Hidden files and symlinks can cross apparent directory boundaries.
- Modification time may change through copies, downloads, migrations, or sync and is not a reliable "importance" signal.
- "Clean up" is not permission to delete.

## Conditional reference

Read `references/organization-patterns.md` only when choosing a grouping strategy or naming convention for a non-trivial collection. Do not load it for duplicate-only review or when the user already supplied a structure.

## Validation

For meaningful revisions, test positive and near-miss cases for activation, analysis-only behavior, ambiguous cleanup, overwrite approval, duplicate evidence, symlink boundaries, partial completion, and the dry-run/execution contract.

Also regress: distinct analysis/execution scopes; classify-before-hash; incomplete-download exclusion; independent confidence classes and format-specific validation; stale-hash detection; `HOLD_FOR_REVIEW`; hierarchy cost; logical-vs-physical savings; versioned manifests including directory creation; validator failure vs zero findings; reproducible canonicalization; source-identity fallback; parent effective-access handling; partial-failure rollback; unabridged approval evidence; and pre-execution revalidation.

For a new revision, report the complete applicable regression matrix; unexecuted cases remain `NHR`. Record expected and observed behavior as `PASS | AMBER | FAIL | NHR | N/A`. Required behavior-critical `AMBER`, `FAIL`, or `NHR` blocks deployment. Unavailable behavioral evidence remains `NHR`; static review is not a substitute.
