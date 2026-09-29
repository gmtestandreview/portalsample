# CodeQL troubleshooting

Load when a CodeQL workflow, database, analysis, upload, or alert presentation does not behave as expected.

## Diagnose by stage

### 1. Workflow did not start

Check event, branch/path filters, workflow location, Actions policy, schedule/default-branch requirements, and merge-queue configuration. Do not change CodeQL extraction settings for a trigger failure.

### 2. Init/database creation failed

Check language identifier, installed bundle/action version, source root, permissions, disk, and build-mode support for the chosen interface.

### 3. Build/extraction failed

Capture the first relevant extractor/build error. Confirm the build actually compiles the intended target. For Kotlin, require a build. If autobuild fails, move to manual only when you know the correct trusted build commands.

“No source code was seen” is evidence of an extraction/build/source-root problem, not evidence that the repository is clean.

### 4. Analysis failed or is slow

Check database completeness, query/pack resolution, memory/disk, thread settings, and whether custom queries are pathological. Prefer narrowing the diagnosed cause over globally reducing security coverage.

### 5. SARIF upload failed

Classify the exact GitHub error before changing configuration. Route to `sarif-output.md` and distinguish:

- missing/insufficient token;
- invalid SARIF;
- soft or hard object/result limit;
- compressed file over 10 MB;
- GitHub Code Security disabled/policy blocked;
- CodeQL default setup blocking a competing CodeQL-generated SARIF upload;
- repository/ref/commit/category identity failures.

Do not treat these as interchangeable. Eligibility or default-setup errors are not repaired by editing SARIF; invalid SARIF is not repaired by broadening permissions; size/limit errors require evidence-led output reduction.

### 6. Alerts look missing or inconsistent

Confirm language/component coverage, analysis category, setup origin, branch/PR context, path configuration, and tool-status/extraction evidence. Successful workflow completion does not prove every intended file was analyzed.

## Coverage verification

When available, use CodeQL/code-scanning status and logs to compare intended languages/components with extracted/analyzed coverage. Record uncertainty when coverage cannot be established.

## Resource failures

For memory, disk, or timeout failures, use current GitHub hardware guidance and actual codebase size/log evidence. Avoid hard-coding resource recommendations as universal requirements; they are guidance and may change.

## Permission failures

Apply least privilege and account for event/fork restrictions. Do not respond to `Resource not accessible` by granting broad repository write permissions.

## Debugging discipline

Make one causally justified change at a time where practical, rerun the affected stage, and preserve the failing evidence. If the fix depends on a release-sensitive behavior, verify it against current GitHub documentation or installed CLI `--help`.
