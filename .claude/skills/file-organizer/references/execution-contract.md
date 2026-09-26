# Execution contract

Load before constructing or validating an executable batch plan.

## Manifest schema

Use `file-organizer-manifest/v1`. Required top-level fields:
`schema`, `analysis_scope`, `execution_scope`, `exclusions`, `snapshot_time`,
`collision_policy`, `overwrite_policy`, `actions`, `review_items`, `declared_counts`,
and `approval_expiry`.

For official Windows plans use `collision_policy: "FAIL_ON_COLLISION"` and
`overwrite_policy: "NEVER_OVERWRITE"` unless a separately authorized overwrite plan
explicitly replaces that policy. Collision comparison is case-insensitive on Windows.

Executable `actions` use contiguous unique integer `seq` values beginning at 1.
Allowed operations: `CREATE_DIRECTORY`, `MOVE`, `RENAME`, `DELETE`.

Each action records applicable source/destination absolute paths, full source identity,
size, modification state, classification, confidence, confidence evidence classes,
duplicate/review state, collision policy, and rollback preconditions.

`HOLD_FOR_REVIEW` is not executable and belongs in `review_items`, not `actions`.

## Source identity hierarchy

Prefer the strongest read-only identity available:

1. stable file identity plus volume GUID;
2. stable file identity plus volume serial;
3. full path + size + modification state + content hash when already justified;
4. full path + size + modification state, explicitly marked weaker.

Do not abbreviate identity values in an approval artifact.

## Semantic validator

Validation has two independent outcomes:

- `validator_status`: `PASS | FAIL | NHR`;
- `findings`: an array of structured findings.

Only `validator_status=PASS` **and** zero blocking findings is a validation pass.
Command failure, exception, timeout, empty/unparsed output, schema-load failure, or
unknown validator state must become `FAIL` or `NHR`; never reinterpret it as zero findings.

At minimum validate:

- schema/version and required fields;
- `seq` values are integers, unique, contiguous, and ordered;
- every operation is allowed and has its required fields;
- directory creation precedes dependent moves;
- every destination parent exactly matches a declared/available directory;
- declared counts equal actual action/review counts;
- executable destinations remain inside execution scope;
- exclusions are untouched;
- collision policy is present and consistent;
- `HOLD_FOR_REVIEW` items do not appear as executable moves/deletes;
- source-state/identity evidence is present at the required strength;
- rollback operation/preconditions exist for every executable action.

A schema validates shape; semantic validation must still check cross-action invariants.

## Canonicalization

Use RFC 8785 JSON Canonicalization Scheme (JCS) for the digestable plan object.
The implementation must conform to RFC 8785 semantics for JSON number serialization,
string escaping, member sorting, and UTF-8 output.

Before JCS:

1. omit digest/plan-ID fields;
2. normalize path values to `/` **for digest representation only**;
3. normalize timestamps to the plan's declared timestamp format;
4. sort `actions` by integer `seq`;
5. define ordering for every non-action array in the schema; arrays that are sets
   (such as exclusions) are lexicographically sorted by their canonical string form,
   while semantically ordered arrays retain their declared order.

Compute SHA-256 over the exact JCS UTF-8 bytes. Report uppercase hexadecimal.
`plan_id = "FO-" + first 16 uppercase digest characters`.

Approval output must contain the complete canonical manifest bytes or an explicitly
authorized retained artifact containing them, plus the digest and plan ID.

## Windows effective access

For a read-only Windows preflight, prefer native effective-access evaluation using
the target parent's security descriptor and the relevant access token, such as
`AccessCheck`. Do not create a probe file/directory merely to prove access during a
strict dry run. If effective access cannot be determined confidently, report `NHR`.

## Partial failure and rollback

Execute ascending `seq`. Record each successful action. Stop before the next action
on collision, permission failure, changed source, validator/precondition failure, or
unsafe boundary. Report the completed prefix and failed action.

Rollback requires authorization and applies inverse operations in descending
completed `seq`, rechecking identity and rollback preconditions. Remove a directory
only when it was created by this execution and is empty.

## Approval readiness

The canonical manifest is the approval artifact. `approval_ready=PASS` only when the
complete canonical bytes are shown inline or retained in an explicitly authorized,
retrievable artifact. A digest without those bytes is insufficient.

Approval expires when any bound source identity, size, timestamp, destination,
exclusion, collision result/policy, action/review count, canonical byte, digest, or
required permission result changes.

## Windows move preflight

For each executable move, record a preflight matrix covering:

- source object identity/state and relevant access;
- source parent rename/delete-child authority as applicable;
- destination parent create/write authority;
- expected inherited permissions for newly created directories;
- relevant file locks/in-use constraints where determinable read-only;
- path-length and tool path-handling constraints.

Unknown required results are `NHR` and block `execution_ready`.

## Execution journal

Official execution requires a durable journal whose location is approved and outside
mutation-sensitive target content. Record plan ID/digest, validator/canonicalizer
identity, start time, and each action's attempted/completed/failed state. Rollback
uses this journal and the manifest to invert only completed actions.
