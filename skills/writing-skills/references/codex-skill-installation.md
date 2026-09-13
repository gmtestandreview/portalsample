# Codex Skill Installation

Use this reference when a user asks to list installable Codex skills, install a curated or experimental Codex skill, install a skill from a GitHub repository path, or inspect where Codex user skills are installed.

This reference preserves Codex-specific installation behavior. It does not define the universal Agent Skills specification.

## Scope

Support these tasks:

- list skills available from `openai/skills`;
- install one or more skills from the curated collection;
- install one or more skills from a GitHub repo/path, including private repositories when credentials are already available;
- explain the local user-skill destination and post-install activation behavior.

Do not use this reference for ordinary skill authoring, `SKILL.md` validation, runtime/client implementation, or project-local registration unless the user is also asking about Codex installation behavior.

## Source Selection

Default public source:

- repo: `openai/skills`
- curated path: `skills/.curated`
- experimental path: `skills/.experimental`
- default ref: `main`

Use curated skills by default. Use experimental skills only when the user asks for experimental skills or provides an experimental path.

If the user provides a GitHub URL or `owner/repo` plus path, use that source instead of the curated collection.

## Installer Tools

Prefer a dedicated Codex installer skill or available installer scripts when the active environment provides them.

Known installer operations, when supported by the environment:

- list skills with installed annotations;
- output the list as JSON when the caller needs structured data;
- install from `--repo <owner>/<repo> --path <path/to/skill>`;
- install from `--url https://github.com/<owner>/<repo>/tree/<ref>/<path>`;
- choose `--method auto|download|git` when the installer exposes this option;
- set `--ref <ref>` or `--dest <path>` only when the user or task requires it.

Before naming or running a script path, verify that the script exists in the active skill/package. Do not claim that `scripts/list-curated-skills.py`, `scripts/list-skills.py`, or `scripts/install-skill-from-github.py` is available unless that file is actually present in the active installer resources.

Installer operations use network access. Follow the current execution environment's permission and sandbox rules before running them.

## Install Behavior

Codex user skills install into:

```text
$CODEX_HOME/skills/<skill-name>
```

If `CODEX_HOME` is unset, the default is:

```text
~/.codex/skills
```

Expected behavior to preserve:

- direct download is the default path for public GitHub repos;
- if download fails because of authentication or permission errors, the installer may fall back to git sparse checkout;
- private GitHub repos require existing git credentials or optional `GITHUB_TOKEN`/`GH_TOKEN` when the installer supports token-based download;
- git fallback tries HTTPS before SSH when that is the installer behavior;
- installation aborts when the destination skill directory already exists;
- multiple paths may install multiple skills in one run;
- installed annotations are determined from `$CODEX_HOME/skills`.

System skills from `openai/skills` under `skills/.system` are preinstalled in Codex. If a user asks to install a system skill, explain that it is already preinstalled. If they explicitly insist on overwriting or reinstalling it, treat that as a high-impact change and require the same backup, validation, and overwrite safeguards used for destructive skill deployment.

## Communication

When listing available skills, use a compact list and mark already installed skills:

```text
Skills from <repo/path>:
1. skill-1
2. skill-2 (already installed)
3. ...

Which ones would you like installed?
```

After installing a skill, tell the user when Codex will pick it up. Prefer the active installer guidance when available; if it is not available, the conservative message is:

```text
Restart Codex or start a new turn to pick up newly installed skills.
```

## Failure Handling

If listing fails because GitHub or the requested repo path is unavailable, report the error and stop rather than inventing a list.

If the installer capability or referenced script is missing, report it as unavailable and explain what was checked.

If the destination already exists, do not overwrite silently. Ask only if the user's requested outcome requires replacing it; otherwise stop with the existing path.

If credentials are missing for a private repository, state that existing git credentials or a supported token such as `GITHUB_TOKEN`/`GH_TOKEN` are required. Do not ask the user to paste secrets into chat.

## Validation

After installation, verify what the environment makes observable:

1. the expected destination directory exists;
2. the installed directory contains `SKILL.md`;
3. `SKILL.md` frontmatter parses and passes applicable Agent Skills specification checks;
4. any installer output matches the requested source, path, ref, and destination;
5. the user-facing activation message does not promise immediate availability unless the active Codex environment supports it.

Use `SKILL-testing-checklist.md` and `specification.md` for validation claims about the installed skill package.
