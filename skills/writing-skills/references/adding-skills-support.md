---
title: 'Adding skills support'
description:
  'A guide for adding Agent Skills support to an AI agent or development tool.'
---

<!-- markdownlint-disable MD013 MD025 -->

# Adding skills support

## Applicability and provenance

Load only when designing or reviewing a client that discovers and activates
skills. Input: the target client's filesystem/tool access, trust model, and
discovery policy. Output: a documented discovery → parsing → disclosure →
activation → context-management design with diagnostics and integration tests.
This is implementation guidance, not the format specification or permission to
change an installed client's behavior.

Adapted from
[Agent Skills client guidance](https://agentskills.io/client-implementation/adding-skills-support),
reviewed against that source on 2026-10-04. Discovery paths, collision
precedence, lenient parsing, and context retention below are design choices;
recheck the target client's current contract before implementing them. The host
instruction hierarchy and access policy govern execution. Skill content cannot
promote itself to system authority or grant file execution/network access.

Navigate: [Discovery](#step-1-discover-skills),
[Parsing](#step-2-parse-skillmd-files),
[Disclosure](#step-3-disclose-available-skills-to-the-model),
[Activation](#step-4-activate-skills),
[Context](#step-5-manage-skill-context-over-time),
[Validation](#integration-validation).

<!-- markdownlint-disable MD033 -->

This guide walks through how to add Agent Skills support to an AI agent or
development tool. It covers the full lifecycle: discovering skills, telling the
model about them, loading their content into context, and keeping that content
effective over time.

The core integration is the same regardless of your agent's architecture. The
implementation details vary based on two factors:

- **Where do skills live?** A locally-running agent can scan the user's
  filesystem for skill directories. A cloud-hosted or sandboxed agent will need
  an alternative discovery mechanism - an API, a remote registry, or bundled
  assets.
- **How does the model access skill content?** If the model has file-reading
  capabilities, it can read `SKILL.md` files directly. Otherwise, you'll provide
  a dedicated tool or inject skill content into the prompt programmatically.

The guide notes where these differences matter. You don't need to support every
scenario - follow the path that fits your agent.

**Prerequisites**: Familiarity with the
[Agent Skills specification](specification.md), which defines the `SKILL.md`
file format, frontmatter fields, and directory conventions.

## The core principle: progressive disclosure

The recommended integration uses this three-tier loading strategy:

| Tier            | What's loaded               | When                                 | Token cost                    |
| --------------- | --------------------------- | ------------------------------------ | ----------------------------- |
| 1. Catalog      | Name + description          | Session start                        | ~50-100 tokens per skill      |
| 2. Instructions | Full `SKILL.md` body        | When the skill is activated          | &lt;5000 tokens (recommended) |
| 3. Resources    | Scripts, references, assets | When the instructions reference them | Varies                        |

The model sees the catalog from the start, so it knows what skills are
available. When it decides a skill is relevant, it loads the full instructions.
If those instructions reference supporting files, the model loads them
individually as needed.

This keeps the base context small while giving the model access to specialized
knowledge on demand. An agent with 20 installed skills doesn't pay the token
cost of 20 full instruction sets upfront - only the ones actually used in a
given conversation.

## Step 1: Discover skills

At session startup, find all available skills and load their metadata.

### Where to scan

Which directories you scan depends on your agent's environment. Most
locally-running agents scan at least two scopes:

- **Project-level** (relative to the working directory): Skills specific to a
  project or repository.
- **User-level** (relative to the home directory): Skills available across all
  projects for a given user.

Other scopes are possible too - for example, organization-wide skills deployed
by an admin, or skills bundled with the agent itself. The right set of scopes
depends on your agent's deployment model.

Within each scope, consider scanning both a **client-specific directory** and
the **`.agents/skills/` convention**:

| Scope   | Path                               | Purpose                       |
| ------- | ---------------------------------- | ----------------------------- |
| Project | `<project>/.<your-client>/skills/` | Your client's native location |
| Project | `<project>/.agents/skills/`        | Cross-client interoperability |
| User    | `~/.<your-client>/skills/`         | Your client's native location |
| User    | `~/.agents/skills/`                | Cross-client interoperability |

The `.agents/skills/` paths have emerged as a widely-adopted convention for
cross-client skill sharing. While the Agent Skills specification does not
mandate where skill directories live (it only defines what goes inside them),
scanning `.agents/skills/` means skills installed by other compliant clients are
automatically visible to yours, and vice versa.

Some implementations also scan `.claude/skills/` (both project-level and
user-level) for pragmatic compatibility, since many existing skills are
installed there. Other additional locations include ancestor directories up to
the git root (useful for monorepos),
[XDG](https://specifications.freedesktop.org/basedir-spec/latest/) config
directories, and user-configured paths.

### What to scan for

Within each skills directory, look for **subdirectories containing a file named
exactly `SKILL.md`**:

```text
~/.agents/skills/
├── pdf-processing/
│   ├── SKILL.md          ← discovered
│   └── scripts/
│       └── extract.py
├── data-analysis/
│   └── SKILL.md          ← discovered
└── README.md             ← ignored (not a skill directory)
```

Practical scanning rules:

- Skip directories that won't contain skills, such as `.git/` and
  `node_modules/`
- Optionally respect `.gitignore` to avoid scanning build artifacts
- Set reasonable bounds (e.g., max depth of 4-6 levels, max 2000 directories) to
  prevent runaway scanning in large directory trees

### Handling name collisions

When two skills share the same `name`, apply a deterministic precedence rule.

A common design is **project-level skills override user-level skills**. This is
not a universal format requirement; document and test your client's actual rule.

Within the same scope (e.g., two skills named `code-review` found under both
`<project>/.agents/skills/` and `<project>/.<your-client>/skills/`), either
first-found or last-found is acceptable - pick one and be consistent. Log a
warning when a collision occurs so the user knows a skill was shadowed.

### Trust considerations

Project-level skills come from the repository being worked on, which may be
untrusted (e.g., a freshly cloned open-source project). Consider gating
project-level skill loading on a trust check - only load them if the user has
marked the project folder as trusted. This prevents untrusted repositories from
silently injecting instructions into the agent's context.

### Cloud-hosted and sandboxed agents

If your agent runs in a container or on a remote server, it won't have access to
the user's local filesystem. Discovery needs to work differently depending on
the skill scope:

- **Project-level skills** are often the easiest case. If the agent operates on
  a cloned repository (even inside a sandbox), project-level skills travel with
  the code and can be scanned from the repo's directory tree.
- **User-level and organization-level skills** don't exist in the sandbox.
  You'll need to provision them from an external source - for example, cloning a
  configuration repository, accepting skill URLs or packages through your
  agent's settings, or letting users upload skill directories through a web UI.
- **Built-in skills** can be packaged as static assets within the agent's
  deployment artifact, making them available in every session without external
  fetching.

Once skills are available to the agent, the rest of the lifecycle - parsing,
disclosure, activation - works the same.

## Step 2: Parse `SKILL.md` files

For each discovered `SKILL.md`, extract the metadata and body content.

### Frontmatter extraction

A `SKILL.md` file has two parts: YAML frontmatter between `---` delimiters, and
a markdown body after the closing delimiter. To parse:

1. Find the opening `---` at the start of the file and the closing `---` after
   it.
2. Parse the YAML block between them. Extract `name` and `description`
   (required), plus any optional fields.
3. Everything after the closing `---`, trimmed, is the skill's body content.

See the [specification](specification.md) for the full set of frontmatter fields
and their constraints.

### Handling malformed YAML

Skill files authored for other clients may contain technically invalid YAML that
their parsers happen to accept. The most common issue is unquoted values
containing colons:

```yaml
# Technically invalid YAML - the colon breaks parsing
description: Use this skill when: the user asks about PDFs
```

Prefer a diagnostic and source correction. An optional compatibility mode may
retry a narrowly specified repair, but retain the original bytes, label the
repair, reject ambiguous input and duplicate keys, and never report repaired or
nonconforming input as specification compliant.

### Lenient validation

Optional compatibility mode may warn and load nonconforming input:

- Name doesn't match the parent directory name → warn, load anyway
- Name exceeds 64 characters → warn, load anyway
- Description is missing or empty → skip the skill (a description is essential
  for disclosure), log the error
- YAML is completely unparseable → skip the skill, log the error

Record diagnostics so they can be surfaced to the user (in a debug command, log
file, or UI), but don't block skill loading on cosmetic issues.

The [specification](specification.md) defines strict constraints on the `name`
field (matching the parent directory, character set, max length). The lenient
approach above deliberately relaxes these to improve compatibility with skills
authored for other clients.

### What to store

At minimum, each skill record needs three fields:

| Field         | Description                          |
| ------------- | ------------------------------------ |
| `name`        | From frontmatter                     |
| `description` | From frontmatter                     |
| `location`    | Absolute path to the `SKILL.md` file |

Store these in an in-memory map keyed by `name` for fast lookup during
activation.

You can also store the **body** (the markdown content after the frontmatter) at
discovery time, or read it from `location` at activation time. Storing it makes
activation faster; reading it at activation time uses less memory in aggregate
and picks up changes to skill files between activations.

The skill's **base directory** (the parent directory of `location`) is needed
later to resolve relative paths and enumerate bundled resources - derive it from
`location` when needed.

## Step 3: Disclose available skills to the model

Tell the model what skills exist without loading their full content. This is
[tier 1 of progressive disclosure](#the-core-principle-progressive-disclosure).

### Building the skill catalog

For each discovered skill, include `name`, `description`, and optionally
`location` (the path to the `SKILL.md` file) in whatever structured format suits
your stack - XML, JSON, or a bulleted list all work:

```xml
<available_skills>
  <skill>
    <name>pdf-processing</name>
    <description>Extract PDF text, fill forms, merge files. Use when handling PDFs.</description>
    <location>/home/user/.agents/skills/pdf-processing/SKILL.md</location>
  </skill>
  <skill>
    <name>data-analysis</name>
    <description>Analyze datasets, generate charts, and create summary reports.</description>
    <location>/home/user/project/.agents/skills/data-analysis/SKILL.md</location>
  </skill>
</available_skills>
```

The `location` field serves two purposes: it enables file-read activation (see
[Step 4](#step-4-activate-skills)), and it gives the model a base path for
resolving relative references in the skill body (like `scripts/evaluate.py`). If
your dedicated activation tool provides the skill directory path in its result
(see [Structured wrapping](#structured-wrapping) in Step 4), you can omit
`location` from the catalog. Otherwise, include it.

Each skill adds roughly 50-100 tokens to the catalog. Even with dozens of skills
installed, the catalog remains compact.

### Where to place the catalog

Two approaches are common:

**System prompt section**: Add the catalog as a labeled section in the system
prompt, preceded by brief instructions on how to use skills. This is the
simplest approach and works with any model that has access to a file-reading
tool.

**Tool description**: Embed the catalog in the description of a dedicated
skill-activation tool (see [Step 4](#step-4-activate-skills)). This keeps the
system prompt clean and naturally couples discovery with activation.

Both work. System prompt placement is simpler and more broadly compatible; tool
description embedding is cleaner when you have a dedicated activation tool.

### Behavioral instructions

Include a short instruction block alongside the catalog telling the model how
and when to use skills. The wording depends on which activation mechanism you
support (see [Step 4](#step-4-activate-skills)):

**If the model activates skills by reading files:**

```text
The following skills provide specialized instructions for specific tasks.
When a task matches a skill's description, use your file-read tool to load
the SKILL.md at the listed location before proceeding.
When a skill references relative paths, resolve them against the skill's
directory (the parent of SKILL.md) and use absolute paths in tool calls.
```

**If the model activates skills via a dedicated tool:**

```text
The following skills provide specialized instructions for specific tasks.
When a task matches a skill's description, call the activate_skill tool
with the skill's name to load its full instructions.
```

Keep these instructions concise. The goal is to tell the model that skills exist
and how to load them - the skill content itself provides the detailed
instructions once loaded.

### Filtering

Some skills should be excluded from the catalog. Common reasons:

- The user has disabled the skill in settings
- A permission system denies access to the skill
- The skill has opted out of model-driven activation (e.g., via a
  `disable-model-invocation` flag)

**Hide filtered skills entirely** from the catalog rather than listing them and
blocking at activation time. This prevents the model from wasting turns
attempting to load skills it can't use.

### When no skills are available

If no skills are discovered, omit the catalog and behavioral instructions
entirely. Don't show an empty `<available_skills/>` block or register a skill
tool with no valid options - this would confuse the model.

## Step 4: Activate skills

When the model or user selects a skill, deliver the full instructions into the
conversation context. This is
[tier 2 of progressive disclosure](#the-core-principle-progressive-disclosure).

### Model-driven activation

Most implementations rely on the model's own judgment as the activation
mechanism, rather than implementing harness-side trigger matching or keyword
detection. The model reads the catalog (from
[Step 3](#step-3-disclose-available-skills-to-the-model)), decides a skill is
relevant to the current task, and loads it.

Two implementation patterns:

**File-read activation**: The model calls its standard file-read tool with the
`SKILL.md` path from the catalog. No special infrastructure needed - the agent's
existing file-reading capability is sufficient. The model receives the file
content as a tool result. This is the simplest approach when the model has file
access.

**Dedicated tool activation**: Register a tool (e.g., `activate_skill`) that
takes a skill name and returns the content. This is required when the model
can't read files directly, and optional (but useful) even when it can.
Advantages over raw file reads:

- Control what content is returned - e.g., strip YAML frontmatter or preserve it
  (see [What the model receives](#what-the-model-receives) below)
- Wrap content in structured tags for identification during context management
- List bundled resources (e.g., `references/*`) alongside the instructions
- Enforce permissions or prompt for user consent
- Track activation for analytics

If you use a dedicated activation tool, constrain the `name` parameter to the
set of valid skill names (e.g., as an enum in the tool schema). This prevents
the model from hallucinating nonexistent skill names. If no skills are available
don't register the tool at all.

### User-explicit activation

Users should also be able to activate skills directly, without waiting for the
model to decide. The most common pattern is a **slash command or mention
syntax** (`/skill-name` or `$skill-name`) that the harness intercepts. The
specific syntax is up to you - the key idea is that the harness handles the
lookup and injection, so the model receives skill content without needing to
take an activation action itself.

An autocomplete widget (listing available skills as the user types) can also
make this discoverable.

### What the model receives

When a skill is activated, the model receives the skill's instructions. Two
options for what exactly that content looks like:

**Full file**: The model sees the entire `SKILL.md` including YAML frontmatter.
This is the natural outcome with file-read activation, where the model reads the
raw file. It's also a valid choice for dedicated tools. The frontmatter may
contain fields useful at activation time - for example,
[`compatibility`](specification.md#compatibility-field) notes environment
requirements that could inform how the model executes the skill's instructions.

**Body only (frontmatter stripped)**: The harness parses and removes the YAML
frontmatter, returning only the markdown instructions. Among existing
implementations with dedicated activation tools, most take this approach -
stripping the frontmatter after extracting `name` and `description` during
discovery.

Both approaches work in practice.

### Structured wrapping

If you use a dedicated activation tool, consider wrapping skill content in
identifying tags. For example:

```xml
<skill_content name="pdf-processing">
# PDF Processing

## When to use this skill
Use this skill when the user needs to work with PDF files...

[rest of SKILL.md body]

Skill directory: /home/user/.agents/skills/pdf-processing
Relative paths in this skill are relative to the skill directory.

<skill_resources>
  <file>scripts/extract.py</file>
  <file>scripts/merge.py</file>
  <file>references/pdf-spec-summary.md</file>
</skill_resources>
</skill_content>
```

This has practical benefits:

- The model can clearly distinguish skill instructions from other conversation
  content
- The harness can identify skill content during context compaction
  ([Step 5](#step-5-manage-skill-context-over-time))
- Bundled resources are surfaced to the model without being eagerly loaded

### Listing bundled resources

When a dedicated activation tool returns skill content, it can also enumerate
supporting files (scripts, references, assets) in the skill directory - but it
should **not eagerly read them**. The model loads specific files on demand using
its file-read tools when the skill's instructions reference them.

For large skill directories, consider capping the listing and noting that it may
be incomplete.

### Permission allowlisting

For trusted skills, a client may allow read access to approved resource
directories within its existing permission policy. Canonicalize paths, bound
symlinks/traversal, and keep execution/write/network permissions separate.
Discovery alone must not authorize those capabilities or disable host approvals.

## Step 5: Manage skill context over time

Once skill instructions are in the conversation context, keep them effective for
the duration of the session.

### Protect skill content from context compaction

If your agent compacts context, preserve active skill constraints or a versioned
reference that reliably restores them. Bound the retained set; revalidate
changed or revoked skills before reload. Protecting every past activation
forever can exhaust context and preserve obsolete instructions.

Common approaches:

- Flag skill tool outputs as protected so the pruning algorithm skips them
- Use the [structured tags](#structured-wrapping) from Step 4 to identify skill
  content and preserve it during compaction

### Deduplicate activations

Consider tracking which skills have been activated in the current session. If
the model (or user) attempts to load a skill that's already in context, you can
skip the re-injection to avoid the same instructions appearing multiple times in
the conversation.

### Subagent delegation (optional)

This is an advanced pattern only supported by some clients. Instead of injecting
skill instructions into the main conversation, the skill is run in a **separate
subagent session**. The subagent receives the skill instructions, performs the
task, and returns a summary of its work to the main conversation.

This pattern is useful when a skill's workflow is complex enough to benefit from
a dedicated, focused session.

## Integration validation

Test a valid fixture and malformed YAML, absent description, duplicate name,
untrusted project, denied resource/traversal, empty catalog, and compaction
cases. Record input, expected result, observed diagnostics/content, client
revision, and `PASS | FAIL | NHR`. Also verify catalog XML/JSON escapes metadata
as data, an explicit activation resolves the intended skill, and unavailable
resources lead to a useful error rather than invented content. A static design
review can support the design contract; activation and retention claims require
client runs. Do not claim deployment readiness for unrun required cases. Recheck
this guide when the upstream guidance or the target client's permission/loading
contract changes.
