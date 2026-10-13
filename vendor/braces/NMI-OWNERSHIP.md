# NMI braces fork

This package is a repository-owned fork of `micromatch/braces` commit
`d44b9b1ee12e7804d4232d5a47a4a0c61d2fbefe`, the depth-guard fix proposed in
upstream pull request #87.

The fork is temporary. Remove it and the `braces` npm override when an upstream
release containing the depth guard is available and has passed the repository
dependency validation gates.

The fork keeps the upstream package API and adds a hard maximum nesting depth of
100 to the parser and recursive AST walkers. Patterns beyond that limit are
rejected with the upstream fix's `SyntaxError`/`RangeError` guards.
