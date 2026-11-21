# Refactoring Catalog

Load this reference only when the main workflow needs help identifying a code
smell, choosing a transformation, strengthening types, or deciding whether a
design pattern is justified. Examples are illustrative; repository conventions
and observed behavior take precedence.

## Smells and focused transformations

| Smell                  | Signals                                                 | Prefer                                               | Watch for                                             |
| ---------------------- | ------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| Long function          | Multiple responsibilities; hard-to-name blocks          | Extract Function; compose named steps                | Changed evaluation/order; excessive fragmentation     |
| Duplication            | Same rule or algorithm repeated                         | Extract shared function/module or shared data        | Similar-looking code with different reasons to change |
| Large class/module     | Unrelated responsibilities; many dependency clusters    | Extract Class/Module around cohesive responsibility  | New cyclic dependencies or anemic wrappers            |
| Long parameter list    | Repeated parameter groups; call-site confusion          | Parameter object or domain value object              | Hiding unrelated values in a grab-bag object          |
| Feature envy           | Logic depends mostly on another object's data           | Move behavior toward data owner; expose narrow query | Breaking layering or increasing coupling              |
| Primitive obsession    | Domain concepts repeatedly validated as strings/numbers | Value object, enum, discriminated union, domain type | Serialization/API compatibility                       |
| Magic literal          | Repeated unexplained value with domain meaning          | Named constant/config/domain type                    | Naming incidental values that are clearer inline      |
| Deep nesting           | Guard conditions obscure the main path                  | Guard clauses; extract predicates                    | Changed short-circuiting or side-effect order         |
| Dead code              | Unreferenced implementation, imports, flags, comments   | Remove after confirming reachability/compatibility   | Reflection, dynamic loading, external consumers       |
| Inappropriate intimacy | Deep navigation into another object's internals         | Encapsulate query/operation behind stable boundary   | Creating “tell, don't ask” methods that hide coupling |
| Conditional explosion  | Growing branch matrix around a stable axis              | Strategy/polymorphism/table dispatch                 | Overengineering a small stable conditional            |
| Validation pipeline    | Sequential checks with independent reasons              | Composed validators or chain                         | Changed error precedence or aggregation semantics     |

## Common transformations

### Extract Function

Use when a coherent block has a name that clarifies intent or isolates a
responsibility. Preserve inputs, outputs, control flow, and side-effect order.
Avoid extracting tiny fragments that only add navigation cost.

### Extract Class or Module

Use when a subset of state and behavior changes for a different reason from the
rest of the unit. Move one cohesive responsibility at a time; keep dependency
direction explicit.

### Rename

Use names that reflect domain meaning, not implementation trivia. Verify
reflection, serialization, public APIs, config keys, generated code, and
external callers before renaming symbols that may be referenced indirectly.

### Introduce Parameter Object

Use for a stable cluster of related arguments that travels together. Do not use
it merely to reduce a parameter count; the group should represent a coherent
concept.

### Guard Clauses

Use to make exceptional or invalid paths explicit before the main flow. Preserve
the original branch precedence and any side effects that occurred before later
conditions.

### Named Constants or Domain Types

Use when a literal has stable semantic meaning. Prefer a domain type when the
concept has validation or behavior beyond naming.

## Type-safety improvements

Strengthen types where they encode an existing invariant:

- replace broad types with unions/enums/value objects already implied by runtime
  behavior;
- make nullability and optionality explicit without changing accepted inputs;
- type public boundaries according to their actual supported contract;
- remove unsafe casts only when the replacement preserves runtime semantics.

Do not “improve” types by silently rejecting inputs the runtime previously
accepted. If stricter validation is desired, treat that as a behavior change.

## Design-pattern decision rule

Introduce a pattern only when all are true:

1. A concrete recurring variation or coupling problem exists now.
2. The pattern makes that variation easier to understand or change.
3. The added indirection is smaller than the complexity it removes.
4. Behavior can be compared before and after.

### Strategy

Useful when several interchangeable algorithms vary behind one stable contract.
A small conditional may be clearer when the variants are few and stable.

### Chain of Responsibility / Validator Pipeline

Useful when independent checks need ordered composition or configurable
membership. Preserve whether validation stops at the first failure or aggregates
multiple failures.

### Delegation over inheritance

Useful when inheritance exists mainly for code reuse or creates fragile
coupling. Check substitutability and public API compatibility before changing
hierarchy.

## Behavior-preservation traps

Refactors that look mechanical can change behavior. Recheck:

- getter/property evaluation count;
- lazy versus eager computation;
- iteration order;
- exception timing and stack shape;
- equality, hashing, identity, and memoization;
- default argument evaluation;
- closure capture and variable lifetime;
- async cancellation and cleanup;
- transaction boundaries and lock scope;
- logging/telemetry relied on operationally.

When these are contractual or externally observed, treat them as invariants and
test them directly.
