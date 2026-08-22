---
description: 'Rules and guidelines for creating and editing agent skill files (`SKILL.md`) in the repository. These instructions cover supported locations, frontmatter requirements, discovery quality, scope and design principles, and validation steps to ensure that agent skills are effective, discoverable, and maintainable. Follow these rules when working with `SKILL.md` files to maintain consistency and alignment with project goals.'
applyTo: '**/skills/**/SKILL.md'
---

# Agent Skills rules

Apply these rules when creating or editing `SKILL.md` files.

## Supported locations

Use supported skill locations only:

- Project skills: `.github/skills/`, `.claude/skills/`, or `.agents/skills/`
- Personal skills: `~/.copilot/skills/` or `~/.agents/skills/`

Each skill must live in its own folder and include a `SKILL.md` file.

## Frontmatter rules

Use valid YAML frontmatter.

Required fields:

- `name`
- `description`

Rules:

- `name` must be lowercase, use hyphens, and match the parent directory name
- `description` must clearly say what the skill does and when to use it
- Add extra fields only when they are clearly needed and officially supported

## Discovery quality

Copilot uses the skill metadata for discovery.

Make `name` and `description` precise:

- say what the skill does
- say when to use it
- include likely trigger words or scenarios
- avoid vague labels like “helpers” or “tools”

## Scope and design

- Keep skills small, focused, and task-specific
- Prefer concise operational guidance over long tutorials
- Do not duplicate general documentation or product handbooks inside the skill
- Split large reference material into bundled files only when genuinely needed
- Only bundle extra references, scripts, templates, or assets when they are genuinely needed for the skill to work.

## Avoid stale or invented rules

- Do not invent unsupported locations, frontmatter fields, or platform behavior
- Do not copy long product-specific compatibility notes into the skill
- Link to official documentation instead of duplicating it

## Validation

Before finishing:

- confirm the file is named `SKILL.md`
- confirm the parent folder name matches the `name` field
- confirm frontmatter is valid
- confirm the description is specific enough for discovery
- confirm the skill stays narrow and task-focused

## Reference

For current platform details, follow the official GitHub Copilot Agent Skills documentation instead of extending this file with handbook content.
