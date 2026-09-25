# Manifest validator requirements

This resource defines validator behavior; it is not evidence that a validator implementation passed.

A conforming validator must:

1. parse the manifest and schema successfully;
2. emit an explicit validator status independent of findings;
3. validate JSON Schema shape;
4. validate cross-action invariants from `execution-contract.md`;
5. fail on non-contiguous/out-of-order sequence values;
6. fail when a MOVE/RENAME parent differs from the declared destination directory;
7. fail when a dependent directory is not created/available before its move;
8. fail when `HOLD_FOR_REVIEW` appears in executable actions;
9. fail when declared counts disagree with actual arrays;
10. never map command/tool failure or empty/unparsed output to PASS.

Required regression fixture: singular/plural destination mismatch must FAIL.
Required regression fixture: validator process failure with no findings output must FAIL/NHR, never PASS.

## Reference implementation

Shipped validator: `scripts/validate_manifest_v6.py`
Reference version: `v6-ref-1`
SHA-256 at package build: `4B7AF7BE90D91A2846C428E11E54E39E526304DC60977C2F28D3388FB45DCCAF`

Official validation evidence records validator path/version/hash, manifest input digest,
process exit status, structured output, and findings. Exit 0 is valid only with
`validator_status=PASS` and zero blocking findings. Missing dependencies or inability
to run RFC 8785 canonicalization is `NHR`, not PASS.
