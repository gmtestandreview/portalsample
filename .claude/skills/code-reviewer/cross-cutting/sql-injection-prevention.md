# SQL Injection Prevention Guide

Use this guide when reviewing database queries, ORM escape hatches, dynamic filters, reporting queries, migrations, search endpoints, or admin tools.

## Primary Rule

Never build SQL by concatenating untrusted input. Use parameterized queries, safe ORM APIs, or query builders that bind values separately from SQL text.

## Safe Patterns

- Parameterized SQL with placeholders.
- ORM query APIs that bind values automatically.
- Query builders that separate identifiers from values.
- Allowlisted dynamic identifiers for table names, column names, and sort directions.
- Least-privilege database accounts.

```python
# Safe: value is bound separately.
cursor.execute("select * from users where email = %s", [email])
```

```ts
// Safe: parameterized query.
await db.query("select * from users where email = $1", [email]);
```

## Dangerous Patterns

- String concatenation, interpolation, or formatting in query text.
- Raw ORM APIs with interpolated user input.
- Dynamic `ORDER BY`, table, or column names without allowlists.
- Passing user-provided filter objects directly into flexible query APIs.
- Escaping manually instead of binding values.
- Database users with broad permissions for application traffic.

```ts
// Vulnerable.
await db.query(`select * from users where email = '${email}'`);
```

## Dynamic Identifiers

Placeholders usually bind values, not identifiers. For identifiers, map user choices to constants.

```ts
const sortColumns = {
  name: "name",
  created: "created_at",
} as const;

const sortColumn = sortColumns[input.sort] ?? "created_at";
await db.query(`select * from users order by ${sortColumn} limit $1`, [limit]);
```

## Review Checklist

- [ ] Every user-controlled value is parameterized.
- [ ] Raw SQL APIs are inspected carefully.
- [ ] Dynamic identifiers use allowlists.
- [ ] Search, filter, report, and export endpoints are covered.
- [ ] Error messages do not expose SQL internals.
- [ ] Database user permissions are limited.
- [ ] Tests cover malicious input for high-risk paths.

## Finding Template

```text
Severity: Blocking
Location: <file:line>
Risk: user input can alter the SQL query
Fix: use parameter binding or an allowlisted query builder
Test: include quotes, comment markers, and boolean expressions in input
```
