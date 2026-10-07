# Authoring Craft

Read this before writing or restructuring a non-trivial skill. It covers the
design judgment that governs _what_ goes in a SKILL.md and _where_ everything
else lives.

## Contents

- [Concise is key](#concise-is-key)
- [Set appropriate degrees of freedom](#set-appropriate-degrees-of-freedom)
- [Anatomy of a skill](#anatomy-of-a-skill)
- [What to NOT include in a skill](#what-to-not-include-in-a-skill)
- [Progressive disclosure patterns](#progressive-disclosure-patterns)
- [Reference-file guidelines](#reference-file-guidelines)

---

## Concise is key

The context window is a public good. A skill shares it with the system prompt,
conversation history, other skills' metadata, and the actual user request.

**Default assumption: Claude is already very smart.** Only add context Claude
doesn't already have. Challenge each piece of information:

- "Does Claude really need this explanation?"
- "Does this paragraph justify its token cost?"

Prefer concise examples over verbose explanations. Explain the _why_ behind an
instruction rather than piling on emphasis — a model that understands the reason
generalizes; a model handed a bare `ALWAYS`/`NEVER` overfits.

---

## Set appropriate degrees of freedom

Match the specificity of guidance to the task's fragility and variability.

| Freedom    | Form                                | Use when                                                                                           |
| ---------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| **High**   | Text instructions, heuristics       | Multiple approaches are valid; decisions depend on context                                         |
| **Medium** | Pseudocode, scripts with parameters | A preferred pattern exists; some variation is acceptable; configuration affects behavior           |
| **Low**    | Specific scripts, few parameters    | Operations are fragile and error-prone; consistency is critical; a fixed sequence must be followed |

Think of Claude as exploring a path. A narrow bridge with cliffs on both sides
needs specific guardrails (low freedom). An open field allows many routes (high
freedom). Do not fence an open field.

---

## Anatomy of a skill

```text
skill-name/
├── SKILL.md              (required)
│   ├── YAML frontmatter  (required: name, description)
│   └── Markdown body     (loaded only after the skill triggers)
└── Bundled resources     (optional)
    ├── scripts/          Executable code (Python/Bash/…)
    ├── references/       Docs loaded into context as needed
    └── assets/           Files used in the output Claude produces
```

### SKILL.md

- **Frontmatter** — express automatic-discovery intent in `description` and use
  `name` for identity. Provider controls also affect invocation: Claude Code's
  `disable-model-invocation` and `user-invocable` govern different access paths.
  Do not infer activation solely from those two descriptive fields.
- **Body** — instructions loaded for application. Keep discovery intent in
  metadata; retain body boundaries when they help an explicitly invoked or
  preloaded skill select the right branch after loading.

Provider applicability reviewed 2026-10-05 against the
[Claude Code invocation controls](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill).
Recheck these controls when the target client changes; they are not universal
Agent Skills specification fields.

### scripts/

Executable code for tasks needing deterministic reliability or that would
otherwise be rewritten every invocation.

- **Include when**: the same code keeps being rewritten, or determinism matters.
- **Benefits**: token-efficient, deterministic, can run without loading into
  context.
- **Note**: Claude may still read a script to patch it or adjust for the
  environment.

### references/

Documentation loaded into context on demand to inform Claude's process.

- **Include when**: Claude should consult docs while working — schemas, API
  references, domain knowledge, policies, detailed workflow guides.
- **Benefits**: keeps SKILL.md lean; loaded only when needed.
- **Large files (>10k words)**: include grep search patterns in SKILL.md.
- **Avoid duplication**: a fact lives in SKILL.md _or_ a reference file, not
  both. Prefer the reference file unless the fact is truly core to the workflow.

### assets/

Files used _within_ the output, not loaded into context — templates, boilerplate
project directories, images, icons, fonts, sample documents.

---

## What to NOT include in a skill

A skill contains only what an AI agent needs to do the job. Do **not** add:

- `README.md`
- `INSTALLATION_GUIDE.md`
- `QUICK_REFERENCE.md`
- `CHANGELOG.md`
- notes about the process that created the skill, setup/testing procedure
  write-ups, or user-facing documentation

These add clutter and confusion without helping the agent.

---

## Progressive disclosure patterns

Skills use a three-level loading system:

1. **Metadata** (name + description) — always in context (~100 words)
2. **SKILL.md body** — loaded when the skill triggers (aim < 500 lines)
3. **Bundled resources** — loaded/executed as needed (effectively unlimited;
   scripts can run without entering the context window)

Keep the body to essentials. When it approaches ~500 lines, split content out —
and always reference the new file from SKILL.md with a clear statement of _when_
to read it, so the reader knows it exists.

**Key principle:** when a skill supports multiple variations, frameworks, or
options, keep only the core workflow and the selection guidance in SKILL.md.
Push variant-specific detail into separate reference files.

### Pattern 1 — High-level guide with references

```markdown
# PDF Processing

## Quick start

Extract text with pdfplumber: [code example]

## Advanced features

- Form filling: see FORMS.md
- API reference: see REFERENCE.md
- Examples: see EXAMPLES.md
```

Claude loads `FORMS.md` / `REFERENCE.md` / `EXAMPLES.md` only when needed.

### Pattern 2 — Domain / variant organization

```text
bigquery-skill/            cloud-deploy/
├── SKILL.md (navigation)  ├── SKILL.md (workflow + provider selection)
└── reference/             └── references/
    ├── finance.md             ├── aws.md
    ├── sales.md               ├── gcp.md
    ├── product.md             └── azure.md
    └── marketing.md
```

When the user asks about sales metrics, Claude reads only `sales.md`. When the
user picks AWS, Claude reads only `aws.md`.

### Pattern 3 — Conditional details

```markdown
# DOCX Processing

## Creating documents

Use docx-js for new documents. See DOCX-JS.md.

## Editing documents

For simple edits, modify the XML directly. **For tracked changes**: see
REDLINING.md **For OOXML details**: see OOXML.md
```

Claude reads `REDLINING.md` / `OOXML.md` only when those features are needed.

---

## Reference-file guidelines

- **Keep references one level deep from SKILL.md.** Every reference file should
  link directly from SKILL.md — avoid reference chains that fan out from other
  references.
- **Add a table of contents** to any reference file longer than ~100 lines, so
  Claude sees the full scope when previewing it.
