# Root Python Application Design

## Purpose

Add a small, self-contained Python application at repository root so the
repository contains a real Python application that CodeQL can discover and
analyze. The application is intentionally independent of the existing React
portal and does not introduce a runtime dependency on the frontend.

## Scope

- Add a `python_app/` package implemented with the Python standard library.
- Expose a small HTTP application with:
  - `GET /health` returning a JSON health response.
  - `POST /echo` accepting a JSON object and returning it in a response
    envelope.
- Reject unsupported methods, unknown paths, malformed JSON, and non-object JSON
  bodies with explicit HTTP errors.
- Add unit tests using `unittest` and an in-process HTTP server.
- Add Python project metadata in `pyproject.toml` without changing the existing
  Node project metadata.
- Document how to run the app, tests, and CodeQL analysis.

## Architecture and data flow

`python_app.server` owns the HTTP server and request routing. `python_app.app`
contains request parsing, response formatting, and validation logic so the
behavior can be tested without binding a network port. A request flows through
the standard-library handler, into the application dispatcher, and back as a
JSON response with a status code.

The application binds to `127.0.0.1` by default and uses port `8000` when run as
a module. There is no external service, database, authentication, or persistent
state.

## Error handling

- Invalid JSON returns `400` with a stable JSON error shape.
- A valid JSON value that is not an object returns `400`.
- Unknown paths return `404`.
- Unsupported methods return `405` and include an `Allow` header where
  appropriate.
- The handler does not echo request headers or unrelated request data.

## Testing

Tests cover health responses, successful echo requests, malformed and invalid
payloads, unknown paths, unsupported methods, and JSON content types. The tests
use only the standard library and do not start a long-lived process.

## Non-goals

- Integrating Python into the React build or deployment pipeline.
- Adding a production web framework.
- Adding a database, authentication, or business-domain behavior.
- Repairing the pre-existing TypeScript type-check failures in the portal.
