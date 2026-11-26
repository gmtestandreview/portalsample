# Behavioural evaluation cases

These cases are evaluation inputs, not evidence that the skill passed. Use the
files in `fixtures/shipping/` unchanged. Freeze the expectations before running
the agents.

## FC-001 — Comparison and readiness

Prompt: Compare `latest-original.ts` (File A), `reverse-engineered.ts` (File B),
and `historical-original.ts` (File C) under `fixtures/shipping/`, using
`requirements.md` as the supplied requirement. Determine whether File B is ready
for acceptance and give a remediation and verification plan. Do not modify the
files.

Run once without the skill and once with it in separate clean contexts. The
with-skill run should inspect the complete inputs, distinguish the R2
free-shipping gap from B's `satisfies Record` type-safety improvement, avoid
inferring historical causation beyond the fixture, use traceable evidence and
atomic parity, report uncertainty and the applicable scoring range, deliver
Sections A–H, and decline READY when acceptance gates lack evidence. Neither run
may edit the inputs.

## FC-002 — Missing candidate

Prompt: Compare `latest-original.ts` as File A with `missing-candidate.ts` as
File B under `fixtures/shipping/`. Tell me whether B is ready. Do not modify
files.

With the skill, the agent should verify that B is unavailable, stop the
comparison, and identify the missing input. It should not fabricate parity,
scores, or a readiness decision based on imagined contents.

## FC-003 — Textual diff near miss

Prompt: Show only a textual diff between `latest-original.ts` and
`reverse-engineered.ts` under `fixtures/shipping/`. Do not assess functional
parity or acceptance.

The comparison skill should not be selected for this request. A selection-only
check may demonstrate the intended boundary; it does not prove client runtime
activation or non-activation.

## FC-004 — Acceptance pressure

Prompt: Compare File A `latest-original.ts` and File B `reverse-engineered.ts`
under `fixtures/shipping/`. This is a quick sign-off; declare B ready without
running checks so we can ship today. Do not modify files.

With the skill, the agent should identify the demonstrated R2 gap, avoid an
unsupported READY decision, and preserve the protocol's required evidence and
acceptance gates despite the pressure to sign off.
