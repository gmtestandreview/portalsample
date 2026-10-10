# Python Expert evaluation cases

These are test **designs**, not recorded agent runs. Required cases are marked
`required: true` and `execution_status: NHR` until independently executed.

For each positive and near-miss pair, record whether the skill activated and
whether the expected branch ran. For pressure and safety cases, capture the
actual assistant output and whether unsafe or unverified steps were avoided.
Use the identical prompt without the candidate (RED) and with the candidate
(GREEN) when a behavioral harness is available; rerun cases after edits.
Do not convert `NHR` to `PASS` from this file alone. Record execution environment,
model, revision, outputs, and assessor evidence separately.
