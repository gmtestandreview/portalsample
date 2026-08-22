# Supported and Unsupported Files

Use this reference when target classification is uncertain or the target may be unsupported.

## Supported by Default

Direct inline comments are usually appropriate for source code and comment-capable configuration files when syntax is known and validation is possible:

- Python
- JavaScript and TypeScript
- Shell scripts
- Go
- Rust
- Java
- Kotlin
- C, C++, C#
- Ruby
- PHP
- Swift
- SQL
- YAML
- Dockerfiles
- Makefiles
- TOML/INI only when comments are valid for the specific dialect

## Conditional Targets

Proceed with extra caution or confirmation for:

- Migration files, database schema files, and infrastructure files
- Configuration files where ordering or indentation may be semantic
- Notebooks, where Markdown cells or sidecar notes are often safer
- Files with generated headers
- Very large files over 1,000 lines
- Files with unknown project-specific formatters or generators

## Unsupported for Direct Inline Comments

Do not directly insert comments into:

- JSON files, including `package.json`, `tsconfig.json`, and API payload examples, unless a specific comment-supporting dialect is confirmed and validation is available
- Lockfiles such as `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Gemfile.lock`, `poetry.lock`, and `Cargo.lock`
- Binary files, images, archives, fonts, PDFs, compiled artifacts, model files, and media files
- Minified or bundled files such as `*.min.js`, generated bundles, sourcemaps, or compressed assets
- Vendored dependencies and generated output directories such as `node_modules`, `.venv`, `vendor`, `dist`, and `build`
- Generated files unless explicitly authorized
- Secret-bearing files such as `.env`, private keys, credentials, token stores, certificates, and production config containing secrets
- Exact-format files where comments invalidate syntax or semantics

Use sidecar notes for unsupported targets.
