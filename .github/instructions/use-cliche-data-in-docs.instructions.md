---
description: 'This file describes best practices for using placeholder data in documentation, prompts, instruction files, skills, examples, and public-facing snippets in this repository. Follow these guidelines to ensure that private or sensitive information is not exposed while keeping examples valid and useful for readers.'
applyTo: 'README.md,docs/**/*.md,.github/prompts/**/*.prompt.md,.github/instructions/**/*.instructions.md,.github/skills/**/SKILL.md,examples/**/*.{md,mdx,json,js,ts,tsx}'
---

# Placeholder data rules

Use these rules when writing or updating documentation, prompts, instruction files, skills, examples, or public-facing snippets.

## Core rule

This rule is about public-facing documentation and examples, not normal application logic, package metadata, or runtime configuration.

Do not copy private, environment-specific, customer/client, credential, account, or prompt-provided data into public-facing documentation or examples.

Use obvious placeholder data instead.

## Use placeholders for

- real people’s names
- email addresses
- phone numbers
- addresses
- client or customer names
- account IDs and usernames
- domains that are not intentionally public
- credentials, tokens, API keys, secrets, and private URLs
- environment-specific paths or config values
- task-specific data from prompts or local files

## Approved placeholders

Prefer:

- `example.com`, `example.org`, `example.net`
- `user@example.com`, `admin@example.org`
- `Jane Doe`, `John Smith`, `Alice`, `Bob`
- `Acme Corp`, `Contoso`, `Northwind Traders`
- `demo-user`, `test-account`
- `Sample App`, `Demo Tool`, `My Project`
- `123 Main Street`, `Springfield`

## Allowed real identifiers

Do not replace legitimate public technical identifiers, such as:

- repository names
- package names
- public product names
- documented public URLs
- public API names
- command names
- route names that are part of the actual documented product
- file paths that readers need to use in this repository

## Keep examples valid

When replacing real data with placeholders:

- preserve syntax and schema validity
- keep commands copy-pasteable when they are intended to be runnable
- do not replace required config keys with fake keys
- do not alter runtime code or real configuration just to make it generic
- do not document features, routes, files, or commands that do not exist

## Comments and snippets

In source comments or snippets, remove private or sensitive data.

Do not remove useful repo-specific rationale, public product names, issue context, or technical constraints merely because they are specific.

## Validation

Before finishing:

- confirm no private data was copied from prompts, local config, scripts, task files, or git-ignored files into docs or examples
- confirm placeholder replacements remain valid and understandable
- confirm public technical identifiers that readers need were preserved
- if unsure whether a value is public or private, treat it as private and flag the uncertainty
