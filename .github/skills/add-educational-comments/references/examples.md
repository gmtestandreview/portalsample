# Commenting Examples

Use this reference to calibrate tone, placement, note numbering, and supported/unsupported handling.

## Python: Beginner, Note Numbering Enabled

Before:

```python
def total(items):
    result = 0
    for item in items:
        result += item.price
    return result
```

After:

```python
def total(items):
    # Note 1: This variable starts the running total at zero before the loop adds each item's price.
    result = 0
    # Note 2: The loop visits one item at a time, which makes the summing logic easy to read and debug.
    for item in items:
        result += item.price
    # Note 3: Returning the final value lets the caller decide how to display, store, or test the total.
    return result
```

## TypeScript: Intermediate

Before:

```typescript
export function isActive(user: User): boolean {
  return user.enabled && !user.deletedAt;
}
```

After:

```typescript
export function isActive(user: User): boolean {
  // Note 1: This combines the positive state (`enabled`) with the absence of a deletion timestamp, a common soft-delete pattern.
  return user.enabled && !user.deletedAt;
}
```

## YAML: Preserve Indentation

Before:

```yaml
service:
  name: api
  replicas: 3
```

After:

```yaml
service:
  # Note 1: The service name is often referenced by deployment scripts or monitoring, so renaming it can affect other tools.
  name: api
  # Note 2: Replica count controls how many instances run, affecting availability and resource usage.
  replicas: 3
```

## Unsupported JSON

Do not directly comment standard JSON. Offer a sidecar file such as `package.json.notes.md`.
