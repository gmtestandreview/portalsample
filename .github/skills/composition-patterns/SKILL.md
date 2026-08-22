---
name: composition-patterns
description: >
  React composition patterns that scale. Use when refactoring components with boolean prop
  proliferation, building flexible component libraries, or designing reusable component APIs.
  Triggers on tasks explicitly focused on compound components, render props, context providers,
  component architecture reviews, or state management decoupling.
---

# React Composition Patterns

Composition patterns for building flexible, maintainable React components. Avoid boolean prop
proliferation by using compound components, lifting state, and composing internals. These
patterns make codebases easier for both humans and AI agents to work with as they scale.

Adapted from the [Vercel Labs agent-skills repository](https://github.com/vercel-labs/agent-skills)
(MIT licence, author: Vercel Engineering).

**Scope**: This adaptation omits the `react19-no-forwardref` rule because this repository uses
stable React. All other composition rules apply.

## When to Apply

Reference these guidelines when:

- Refactoring components with many boolean props
- Building reusable component libraries
- Designing flexible component APIs
- Reviewing component architecture
- Working with compound components or context providers

## Rule Categories by Priority

| Priority | Category                | Impact | Prefix          |
| -------- | ----------------------- | ------ | --------------- |
| 1        | Component Architecture  | HIGH   | `architecture-` |
| 2        | State Management        | MEDIUM | `state-`        |
| 3        | Implementation Patterns | MEDIUM | `patterns-`     |

**Precedence rule:**
When a rule from Component Architecture conflicts with State Management or Implementation Patterns, prioritize Component Architecture. If State Management and Implementation Patterns conflict, prioritize State Management.

> **Note**: The `react19-` section (specifically `react19-no-forwardref`) from the original
> Vercel collection is omitted because it requires React 19. If this project upgrades to React 19,
> add that rule from the reference repo.

## Quick Reference

### 1. Component Architecture (HIGH)

- `architecture-avoid-boolean-props` — Don't add boolean props to customise behaviour; use composition
- `architecture-compound-components` — Structure complex components with shared context

### 2. State Management (MEDIUM)

- `state-decouple-implementation` — Provider is the only place that knows how state is managed
- `state-context-interface` — Define generic interface with `state`, `actions`, `meta` for dependency injection
- `state-lift-state` — Move state into provider components for sibling access

### 3. Implementation Patterns (MEDIUM)

- `patterns-explicit-variants` — Create explicit variant components instead of boolean modes
- `patterns-children-over-render-props` — Use `children` for composition instead of `renderX` props

## How to Use

Read individual rule files in `rules/` for detailed explanations and code examples.

Each rule file contains:

- **Why** — The problem this pattern solves
- **Incorrect** — Code pattern to avoid
- **Correct** — Preferred pattern

### Handling legacy boolean props

If you are working in a legacy codebase where boolean props are already deeply integrated:

- Use incremental migration: refactor new features and touched components to use composition patterns, but do not break existing consumers.
- Gradually introduce compound components or explicit variants alongside legacy boolean props, then deprecate booleans over time.
- Document migration plans and provide before/after examples in code reviews.

### Error handling for boolean props

If boolean props are used in new or refactored code, provide a warning in code review and suggest alternative patterns from the rules. Where possible, add TODO comments or lint rules to flag boolean prop proliferation for future migration.

## Attribution

Original rules authored by Vercel Engineering.
Source: <https://github.com/vercel-labs/agent-skills>
Licence: MIT

**About AGDS Starter Kit:**
The AGDS Starter Kit is a Next.js + React 18 codebase using the Australian Government Design System (AGDS) and stable React. This adaptation omits React 19 migration rules because the kit is not yet on React 19. If/when the kit upgrades, add the omitted rules from the reference repo.
