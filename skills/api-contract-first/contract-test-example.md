---
name: contract-test-example
Description: Example of contract tests for the api-contract-first skill 
---
# Contract Test example

Contract tests must exercise the actual service boundary and verify its
consumer-visible behavior against the approved contract.

Use the project's existing contract/conformance tooling where available.
Do not introduce a validator solely because it appears in this example.

At minimum, cover every materially changed applicable behavior:

- successful responses;
- request validation;
- documented error responses;
- authentication;
- authorization;
- idempotency, retry, ordering, or delivery semantics where relevant.

Example:

```typescript
// [VALID] — exercises the real implementation against the approved contract

import request from 'supertest';

import { app } from '../src/app';
import { assertResponseMatchesOpenApi } from './contract/openapi';

describe('POST /orders contract', () => {
  test('201 — created order conforms to the contract', async () => {
    const response = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${authorizedToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send(validPayload);

    expect(response.status).toBe(201);

    await assertResponseMatchesOpenApi({
      operation: 'POST /orders',
      response,
    });
  });

  test('400 — validation error conforms to the contract', async () => {
    const response = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${authorizedToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({ ...validPayload, items: [] });

    expect(response.status).toBe(400);

    await assertResponseMatchesOpenApi({
      operation: 'POST /orders',
      response,
    });
  });

  test('401 — unauthenticated response conforms to the contract', async () => {
    const response = await request(app)
      .post('/orders')
      .set('Idempotency-Key', crypto.randomUUID())
      .send(validPayload);

    expect(response.status).toBe(401);

    await assertResponseMatchesOpenApi({
      operation: 'POST /orders',
      response,
    });
  });

  test('403 — unauthorized response conforms to the contract', async () => {
    const response = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${unauthorizedToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send(validPayload);

    expect(response.status).toBe(403);

    await assertResponseMatchesOpenApi({
      operation: 'POST /orders',
      response,
    });
  });
});
```

`assertResponseMatchesOpenApi` represents the project's existing OpenAPI
validation tooling. It must validate the actual status code, applicable
response headers/content type, and response body against the approved
OpenAPI operation.

Do not introduce a new validator library when the repository already has
contract/conformance tooling.

## Avoid this anti-pattern

A schema assertion against a fabricated response is not a contract test:

```Typescript
// [INVALID] — does not exercise the service boundary

expect(validateOrder({
  id: '...',
  userId: '...',
})).toBe(true);
```

or

```typescript
// [INVALID] — tests a fabricated response, not the implementation

test('Order matches schema', () => {
  const response = {
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    items: [],
  };

  expect(validateOrder(response)).toBe(true);
});
```

Passing one success-path schema check does not establish conformance.
Run applicable contract tests for every materially changed boundary behavior.
