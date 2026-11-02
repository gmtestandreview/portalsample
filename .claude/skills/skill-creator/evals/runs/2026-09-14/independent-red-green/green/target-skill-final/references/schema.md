# Incident Review Output Schema

Use this schema when producing machine-readable incident review output.

```json
{
  "type": "object",
  "required": ["summary", "timeline", "rootCause", "remediations"],
  "properties": {
    "summary": { "type": "string" },
    "timeline": { "type": "array", "items": { "type": "string" } },
    "rootCause": { "type": "string" },
    "remediations": { "type": "array", "items": { "type": "string" } }
  }
}
```

`remediations` entries should include the owner name, action, and target date as
a single string.
