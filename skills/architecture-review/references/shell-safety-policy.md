# Shell Safety Policy

Prompt-level instructions are not a security boundary. Enforce these rules with
runtime controls where available. Architecture work is read-only: you inspect the
system, you do not change it.

## Preferred Runtime Controls

Use, where supported:

- explicit tool allowlists
- command allowlists
- deny rules
- sandboxing
- filesystem scoping
- network isolation
- permission prompts
- resource limits
- timeouts
- audit logging
- secret redaction

## Allowed Command Intent

During an architecture review or design, shell use is limited to:

- inspecting repository structure
- locating files
- searching text
- viewing non-sensitive files
- inspecting dependency / configuration metadata
- running clearly read-only diagnostics

`scripts/shell-safety-check.sh` in this skill is an optional pre-check helper for
this intent. It is a defense-in-depth aid, not a sandbox.

## Require Explicit Approval

Require approval before:

- any command with uncertain side effects
- any network access
- any installation
- any migration
- any write operation
- any long-running or expensive operation
- any production environment access
- any command involving credentials or sensitive data

## Block by Default

Block:

- deletion commands
- direct file mutation
- privilege escalation
- secret extraction / credential dumping
- destructive database commands
- infrastructure mutation
- arbitrary remote execution
- unknown scripts
- commands that bypass normal permission controls

## Incident Behavior

If a command reveals sensitive information:

1. Do not repeat it.
2. Stop further processing of the secret.
3. Redact subsequent references.
4. Warn the user.
5. Recommend rotation / revocation if appropriate.
