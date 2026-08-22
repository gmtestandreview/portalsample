---
applyTo: "static/js/validationSchemas/**"
---

# Yup extension guard

Files under `static/js/validationSchemas/` may use custom Yup string methods (`.allowedFormat()`, `.maxLength()`, `.minEntered()`, `.fixedDigits()`, `.phone()`, `.postcode()`, `.numbersOnly()`, `.decimalNumbersOnly()`, `.addressFormat()`, `.minValue()`, `.maxValue()`). These methods are registered as a side effect in `stringExtensions.ts` and are **not** available unless explicitly imported.

## Rule

Any schema file that calls one or more of these methods **must** contain this import:

```ts
import '../../validationSchemas/yupExtensions';
```

The import path must resolve relative to the file's location inside `validationSchemas/`. For files one level deeper (e.g. a sub-folder), adjust accordingly.

## When editing a schema file

1. Scan the file for any of the custom method names listed above.
2. If any are used and the side-effect import is **absent**, add it directly below the `yup` import line:
   ```ts
   import * as yup from 'yup';
   import '../../validationSchemas/yupExtensions'; // ← add this
   ```
3. If none of the custom methods are used, the import is not required — do not add it unnecessarily.
4. When **adding** a new custom method call to an existing file, check for the import first and add it if missing.

## Why this matters

Omitting this import causes silent runtime failures — the custom method exists on the type (TypeScript compiles) but throws `schema.method is not a function` at runtime. There is no build-time error.
