# Managing the ADR Log

Supports `SKILL.md` → "Reading and Maintaining the ADR Log". The layouts below
are **illustrative**; the actual file naming, statuses, and front matter follow
what `docs/adr/` already contains. Create any index or template file only when
the user asks for one, and never rename or migrate existing ADRs unilaterally.

## Directory structure (illustrative)

```text
docs/
└── adr/
    ├── README.md          # Optional index and guidelines
    ├── template.md        # Optional team template
    ├── <existing ADR>.md  # Named per current precedent
    └── <superseding>.md   # Links back to what it supersedes
```

## Index (README.md) template

```markdown
# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for [Project Name].

## Index

| ADR   | Title   | Status                              | Date       |
| ----- | ------- | ----------------------------------- | ---------- |
| <ref> | <title> | <canonical status>                 | YYYY-MM-DD |

## Creating a New ADR

1. Follow the project's ADR skill (`skills/adr/SKILL.md`: Match Repo Precedent
   First; Required Content)
2. Submit a PR for review
3. Update this index after acceptance

## ADR Status

- **Proposed**: Under discussion
- **Accepted**: Decision made
- **Rejected**: Considered but not adopted
- **Superseded by <ref>**: Replaced by a later ADR
- **Deprecated**: No longer relevant; nothing replaces it
```

## Automation (adr-tools)

Optional. [`adr-tools`](https://github.com/npryce/adr-tools) scaffolds numbered
ADR files and indexes. It imposes its own `NNNN-title-with-dashes.md` naming, so
use it **only if `docs/adr/` already follows that convention or the user asks to
adopt it** — otherwise match existing precedent (`SKILL.md` → Match Repo
Precedent First) and do not install or run it unilaterally.

```bash
# Install adr-tools
brew install adr-tools

# Initialize the ADR directory
adr init docs/adr

# Create a new ADR
adr new "Use PostgreSQL as Primary Database"

# Supersede an existing ADR (here, ADR 3)
adr new -s 3 "Deprecate MongoDB in Favor of PostgreSQL"

# Generate a table of contents
adr generate toc > docs/adr/README.md

# Link related ADRs
adr link 2 "Complements" 1 "Is complemented by"
```

## Review checklist (confirm; do not assert)

Use these as prompts to confirm with the people involved. **Never write a review,
consultation, or approval into an ADR unless it actually happened.**

Before submission:

- [ ] Context clearly explains the problem
- [ ] All viable options considered
- [ ] Pros and cons balanced and honest
- [ ] Positive and negative consequences documented
- [ ] Related ADRs linked

During review:

- [ ] At least two senior engineers reviewed (the generic default; use the
      team's own reviewer count if it differs, and say which applies)
- [ ] Reviewers are named only if they actually reviewed
- [ ] Affected teams consulted (if applicable)
- [ ] Security implications considered
- [ ] Cost implications documented
- [ ] Reversibility assessed

After acceptance:

- [ ] Index updated (if one exists)
- [ ] Team notified
- [ ] Implementation tickets created
- [ ] Related documentation updated

## Practices

Do:

- **Write ADRs early**, before implementation starts
- **Keep them short** — one to two pages, while still meeting Required Content
- **Be honest about trade-offs** — include real costs
- **Link related decisions** to build a decision graph
- **Update status** when superseded or deprecated

Don't:

- **Don't change accepted ADRs** — write a new one to supersede
- **Don't skip context** — future readers need the background
- **Don't hide failures** — rejected decisions are valuable
- **Don't be vague** — specific decisions, specific consequences
- **Don't forget implementation** — an ADR without action is waste

## Resources

- [Documenting Architecture Decisions (Michael Nygard)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [MADR Template](https://adr.github.io/madr/)
- [ADR GitHub Organization](https://adr.github.io/)
