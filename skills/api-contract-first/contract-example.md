---
name: contract-example
Description: Example of contract for the api-contract-first skill 
---

# Contract Examples

Below are Examples of OpenAPI and Events contracts choose the best format for your project

## REST → OpenAPI 3.x

```yaml
# Use the repository's established contract location.
# Example only: docs/api/openapi.yaml

openapi: 3.1.0

info:
  title: Orders API
  version: 1.0.0

paths:
  /orders:
    post:
      operationId: createOrder
      summary: Create a new order
      description: |
        Creates an order for the supplied user.

        The authenticated caller must be authorized to create orders for
        the supplied userId.

        Requests are idempotent when the same Idempotency-Key and request
        payload are retried. Reusing an Idempotency-Key with a different
        payload returns 409.
      security:
        - bearerAuth: []

      parameters:
        - $ref: '#/components/parameters/IdempotencyKey'

      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateOrderRequest'

      responses:
        '201':
          description: Order created.
          headers:
            Location:
              description: URI of the created order.
              schema:
                type: string
                format: uri-reference
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'

        '400':
          $ref: '#/components/responses/ValidationError'

        '401':
          $ref: '#/components/responses/Unauthorized'

        '403':
          $ref: '#/components/responses/Forbidden'

        '409':
          $ref: '#/components/responses/IdempotencyConflict'

        '429':
          $ref: '#/components/responses/TooManyRequests'

        '500':
          $ref: '#/components/responses/InternalServerError'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: |
        Bearer token accepted by the service.
        The authenticated caller must be authorized to create the order.

  parameters:
    IdempotencyKey:
      name: Idempotency-Key
      in: header
      required: true
      description: |
        Client-generated key used to make order creation safe to retry.
        The same key must not be reused with a different request payload.
      schema:
        type: string
        minLength: 1
        maxLength: 128

  schemas:
    CreateOrderRequest:
      type: object
      additionalProperties: false
      required:
        - userId
        - items
      properties:
        userId:
          type: string
          format: uuid
          description: User for whom the order is being created.

        items:
          type: array
          minItems: 1
          maxItems: 100
          items:
            $ref: '#/components/schemas/OrderItem'

    OrderItem:
      type: object
      additionalProperties: false
      required:
        - productId
        - quantity
      properties:
        productId:
          type: string
          minLength: 1
          maxLength: 100

        quantity:
          type: integer
          minimum: 1
          maximum: 999

    Order:
      type: object
      additionalProperties: false
      required:
        - id
        - userId
        - items
        - status
        - createdAt
      properties:
        id:
          type: string
          format: uuid
          readOnly: true

        userId:
          type: string
          format: uuid

        items:
          type: array
          minItems: 1
          items:
            $ref: '#/components/schemas/OrderItem'

        status:
          type: string
          enum:
            - pending
            - confirmed
            - cancelled

        createdAt:
          type: string
          format: date-time
          readOnly: true

    Problem:
      type: object
      additionalProperties: true
      required:
        - type
        - title
        - status
      properties:
        type:
          type: string
          format: uri-reference

        title:
          type: string

        status:
          type: integer
          minimum: 400
          maximum: 599

        detail:
          type: string

        instance:
          type: string
          format: uri-reference

        errors:
          type: array
          items:
            type: object
            additionalProperties: false
            required:
              - field
              - message
            properties:
              field:
                type: string
              message:
                type: string

  responses:
    ValidationError:
      description: Request validation failed.
      content:
        application/problem+json:
          schema:
            $ref: '#/components/schemas/Problem'

    Unauthorized:
      description: Authentication is missing or invalid.
      content:
        application/problem+json:
          schema:
            $ref: '#/components/schemas/Problem'

    Forbidden:
      description: |
        The authenticated caller is not authorized to create an order
        for the supplied user.
      content:
        application/problem+json:
          schema:
            $ref: '#/components/schemas/Problem'

    IdempotencyConflict:
      description: |
        The Idempotency-Key was previously used with a different
        request payload.
      content:
        application/problem+json:
          schema:
            $ref: '#/components/schemas/Problem'

    TooManyRequests:
      description: The caller exceeded an applicable service rate limit.
      headers:
        Retry-After:
          description: Number of seconds to wait before retrying.
          schema:
            type: integer
            minimum: 1
      content:
        application/problem+json:
          schema:
            $ref: '#/components/schemas/Problem'

    InternalServerError:
      description: An unexpected server error occurred.
      content:
        application/problem+json:
          schema:
            $ref: '#/components/schemas/Problem'
```

**Compatibility classification:** New contract — no previous approved
consumer contract exists.

If modifying an existing `/orders` operation, compare this contract against
the approved baseline before implementation. Do not introduce required
headers, tighter input constraints, changed status codes, or changed
authentication/authorization behaviour without classifying their
compatibility impact.

## Events / Webhooks → AsyncAPI or Approved Payload Schema

```yaml
# Use the repository's established contract location.
# Example only: docs/events/order-created.yaml

asyncapi: 3.0.0

info:
  title: Order Events
  version: 1.0.0
  description: |
    Ordering is guaranteed only for events with the same orderId.
    No ordering guarantee exists across different orders.

    Delivery semantics:
    - Delivery is at least once; consumers must tolerate duplicate events.
    - eventId uniquely identifies an event occurrence and may be used
      for consumer deduplication.
    - Consumers must not rely on global event ordering.
    - Failed deliveries may be retried according to the broker's
      configured retry policy.

defaultContentType: application/json

channels:
  orderCreated:
    address: order.created
    description: Receives notifications when an order has been created.
    messages:
      orderCreated:
        $ref: '#/components/messages/OrderCreated'

operations:
  publishOrderCreated:
    action: send
    summary: Publish an order-created event.
    channel:
      $ref: '#/channels/orderCreated'
    messages:
      - $ref: '#/channels/orderCreated/messages/orderCreated'

components:
  messages:
    OrderCreated:
      name: order.created
      title: Order created
      summary: Indicates that an order was successfully created.
      contentType: application/json

      payload:
        type: object
        additionalProperties: false
        required:
          - eventId
          - orderId
          - userId
          - createdAt

        properties:
          eventId:
            type: string
            format: uuid
            description: Unique identifier for this event occurrence.

          orderId:
            type: string
            format: uuid
            description: Identifier of the order that was created.

          userId:
            type: string
            format: uuid
            description: Identifier of the user associated with the order.

          createdAt:
            type: string
            format: date-time
            description: Time at which the order was created.
```

### JSON Schema Example

```YAML

# docs/events/order-created.schema.yaml

$schema: https://json-schema.org/draft/2020-12/schema
$id: https://example.com/schemas/events/order-created/1-0-0

title: OrderCreated
description: Emitted when an order is successfully created.

type: object
additionalProperties: false

required:
  - eventId
  - orderId
  - userId
  - createdAt

properties:
  eventId:
    type: string
    format: uuid
    description: Unique identifier for this event occurrence.

  orderId:
    type: string
    format: uuid
    description: Identifier of the created order.

  userId:
    type: string
    format: uuid
    description: Identifier of the user associated with the order.

  createdAt:
    type: string
    format: date-time
    description: Time at which the order was created.
```
