# Edge Fixture — StrictMode Remount Duplication

Flow passes in a single mount but duplicates on remount.

Expected result:

- runtime verifier fails under `StrictMode`
