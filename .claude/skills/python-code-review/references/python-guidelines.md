# Python expert: conditional rules and examples

Use this reference only for the relevant Python task. Examples target Python 3.10+.
For older versions, use supported typing syntax and honor project constraints.
Here **bad** examples intentionally illustrate failure; **good** examples
demonstrate the supported pattern. Severity depends on actual behavior, not
solely on which example looks similar.

## Mutable default arguments

**Correctness — critical when state leaks across calls.** Defaults are evaluated
at function definition time; mutable values can persist between unrelated calls.

Bad:

```python
def add_item(item, items=[]):
    items.append(item)
    return items
```

Good:

```python
def add_item(item: str, items: list[str] | None = None) -> list[str]:
    """Append an item to the provided list, or a new list if omitted."""
    if items is None:
        items = []
    items.append(item)
    return items
```

If `None` itself is meaningful input, use a dedicated sentinel instead. An
intentional cache/shared state is a separate design decision and must be explicit.

## Error handling

**Correctness — critical for silent data loss.** Catch only expected exceptions;
decide whether to recover, add context, or propagate. Do not silently swallow
errors or replace failures with misleading defaults.

Bad:

```python
try:
    result = risky_operation()
except:
    pass
```

Good (standalone):

```python
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def read_config(path: Path) -> dict[str, object] | None:
    """Read a JSON object; return None for missing or invalid JSON files."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        logger.warning("Configuration file not found: %s", path)
        return None
    except json.JSONDecodeError as exc:
        logger.error("Invalid JSON in %s: %s", path, exc)
        return None
    if not isinstance(data, dict):
        raise ValueError("Expected a JSON object at the root")
    return data
```

Do not hide permission failures, decoding errors, or schema violations behind
the missing-file fallback. A production caller may prefer re-raising instead.

## Type hints

**Type safety — high when interfaces are shared.** Annotate public contracts
consistent with the target Python version and actual values. Builtin generic
types require Python 3.9+; unions written `X | None` require Python 3.10+.

Bad (undocumented types and hidden global dependency):

```python
def get_user(id):
    return users.get(id)
```

Good:

```python
def get_user(
    user_id: int, users: dict[int, dict[str, object]]
) -> dict[str, object] | None:
    """Return a user record when the ID exists."""
    return users.get(user_id)
```

Do not add `TypeVar` where a concrete annotation suffices. Type checkers help
but cannot replace runtime validation of untrusted input.

## Dataclasses

**Maintainability/type safety — high when a class primarily stores data.**
Dataclasses synthesize boilerplate; choose `frozen=True` only if immutable-style
attribute assignments are intended. Avoid exposing secrets in generated `repr`.

Bad (more handwritten boilerplate and equality pitfalls):

```python
class User:
    def __init__(self, id, name, email):
        self.id = id
        self.name = name
        self.email = email
```

Good:

```python
from dataclasses import dataclass, field

@dataclass
class User:
    id: int
    name: str
    email: str

@dataclass(frozen=True)
class Config:
    api_key: str = field(repr=False)
    timeout: int = 30
```

`repr=False` reduces accidental display; it does not encrypt or otherwise secure
the value. Dataclasses are not always suitable for ORM models, custom descriptor
behavior, or classes with extensive invariants.

## Comprehensions

**Performance/readability — optimize only simple transformations and filters.**
CPython may optimize comprehensions, but readability and real profiling decide.

Bad when a simple collection is all the loop computes:

```python
squares = []
for number in range(10):
    squares.append(number ** 2)
```

Good:

```python
squares = [number ** 2 for number in range(10)]
evens = [number for number in range(20) if number % 2 == 0]
matrix = [[i * j for j in range(3)] for i in range(3)]
```

Prefer an explicit loop for side effects, complex branching, or nested logic
that harms comprehension. Prefer generators when collecting everything is
unnecessary and streaming semantics are appropriate.

## Context managers

**Correctness/resource safety — high for deterministic release.**
A `with` block closes a managed file even when an exception occurs.

Bad:

```python
f = open("file.txt")
data = f.read()
f.close()
```

Good:

```python
from pathlib import Path

def uppercase_small_file(source: Path, destination: Path) -> None:
    """Uppercase a small UTF-8 file; overwrites destination."""
    with source.open("r", encoding="utf-8") as infile:
        data = infile.read()
    with destination.open("w", encoding="utf-8") as outfile:
        outfile.write(data.upper())
```

Check before overwriting an existing destination; use atomic replacement where
partial writes would be damaging. For large files, stream lines instead of
reading into memory. Context managers apply to locks and transactions when
supported, not as a universal speed optimization.

## PEP 8

**Style — medium unless project rules elevate it.** Prefer descriptive
`snake_case` functions and variables, `CapWords` classes, readable whitespace,
and the project's configured formatter/linter. PEP 8 recommends 79-character
lines; projects often explicitly choose 88 or another limit.

Bad:

```python
def CalculateTotal(itemPrice,qty):
  return itemPrice*qty

class user_account:
  pass
```

Good:

```python
def calculate_total(item_price: float, quantity: int) -> float:
    """Return the price times item quantity."""
    return item_price * quantity


class UserAccount:
    """Represent a user account."""
```

Existing public names may be compatibility contracts: do not rename them
without examining callers and planning any needed migration.

## Docstrings

**Documentation — medium except for public contract ambiguity.**
Document public APIs, side effects, error conditions, and non-obvious behavior.
Avoid repetitive filler or claiming an exception that code never raises.

Bad:

```python
def process(data, config):
    # processes the data
    return result
```

Good (standalone):

```python
def normalize_email(address: str) -> str:
    """Normalize a nonempty email address.

    Args:
        address: Email address with optional surrounding whitespace.

    Returns:
        Trimmed address with lowercase letters.

    Raises:
        ValueError: If the trimmed address is empty.

    Example:
        >>> normalize_email(" TEST@Example.com ")
        'test@example.com'
    """
    cleaned = address.strip()
    if not cleaned:
        raise ValueError("Email address must be nonempty")
    return cleaned.lower()
```

Choose a consistent team convention (e.g., Google or NumPy style) without
requiring expansive docstrings for obvious private helpers.

## Duplicate example

**Type contract gotcha.** `Counter` uses hashing: an unconstrained type
variable would falsely suggest lists or other unhashable elements work.

Good (requires hashable inputs; preserves first duplicate appearance):

```python
from collections import Counter
from collections.abc import Hashable
from typing import TypeVar

T = TypeVar("T", bound=Hashable)

def find_duplicates(items: list[T]) -> list[T]:
    """Return repeated hashable values once, in first-occurrence order.

    Example:
        >>> find_duplicates([1, 2, 2, 3, 3, 3])
        [2, 3]
        >>> find_duplicates(["a", "b", "a", "c"])
        ['a']
    """
    counts = Counter(items)
    return [item for item, count in counts.items() if count > 1]
```

Average-case time is O(n), space O(u) for u distinct hashable items. Hash and
equality semantics matter: unhashable nested values require a different
algorithm or an explicitly justified canonical key.

## Python code review output

Report only issues supported by the code and context. Use this compact structure:

- **Summary:** affected behavior and highest severity.
- **Findings:** severity, known file/line, reproduction or mechanism, impact,
  minimal fix, and any compatibility tradeoff.
- **Validation:** test commands *actually run* with results; otherwise a
  proposed reproduction and regression checklist.
- **Residual risks:** unknown version, dependencies, user intent, or inputs.

Severity: **critical** for credible security, data loss, or major correctness
failures; **high** for material correctness/resource risks; **medium** for
maintainability and non-critical style; **low** for optional preferences.
Do not assert arbitrary style preferences as correctness failures.

## Reference links

- [PEP 8](https://peps.python.org/pep-0008/)
- [PEP 257](https://peps.python.org/pep-0257/)
- [PEP 484](https://peps.python.org/pep-0484/)
- [Python typing documentation](https://docs.python.org/3/library/typing.html)
