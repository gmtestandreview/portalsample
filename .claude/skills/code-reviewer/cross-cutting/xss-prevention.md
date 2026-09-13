# XSS Prevention Guide

Use this guide when reviewing HTML rendering, rich text, Markdown, templates, user-generated content, unsafe DOM APIs, CSP, or client-side routing.

## Primary Rule

Encode output for the context where it is used. Validation helps, but validation is not a substitute for output encoding or safe rendering.

## Common XSS Sources

- Rendering user-generated HTML.
- Markdown rendered without sanitization.
- `innerHTML`, `dangerouslySetInnerHTML`, or template escape hatches.
- URL, style, script, or event-handler attributes built from user input.
- Server-rendered templates with disabled auto-escaping.
- Stored content displayed later in an admin page or email.

## Safer Patterns

- Prefer text rendering APIs such as `textContent`.
- Keep framework auto-escaping enabled.
- Sanitize trusted rich-text formats with an allowlist sanitizer.
- Encode values for the correct context: HTML text, attribute, URL, CSS, or JavaScript string.
- Use Content Security Policy as defense in depth.
- Validate URL protocols and reject `javascript:` and other unsafe schemes.

```tsx
// Safe for plain text.
return <p>{userSuppliedText}</p>;
```

```tsx
// High risk. Only use with sanitized, trusted HTML.
return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
```

## Dangerous Patterns

- Concatenating HTML strings with user input.
- Allowing arbitrary tags or attributes in rich text.
- Trusting Markdown output without sanitization.
- Writing user input into `style`, `srcdoc`, event handlers, or script blocks.
- Assuming admin-only content is safe.
- Relying only on blacklist validation.

## CSP Review

- [ ] `script-src` avoids broad `unsafe-inline` where practical.
- [ ] Nonces or hashes are used for inline scripts when required.
- [ ] `object-src` is restricted.
- [ ] `base-uri` and `frame-ancestors` are set where relevant.
- [ ] CSP violations are monitored if CSP is security-critical.

## Review Checklist

- [ ] User-controlled content is rendered as text by default.
- [ ] Rich text is sanitized with an allowlist.
- [ ] Unsafe DOM or framework escape hatches are justified and protected.
- [ ] URLs are validated by protocol and destination.
- [ ] Attribute, CSS, JavaScript, and HTML contexts are handled separately.
- [ ] Stored content is safe when rendered in every downstream view.
- [ ] Tests cover malicious HTML, attributes, URLs, and encoded payloads.

## Finding Template

```text
Severity: Blocking
Location: <file:line>
Risk: attacker-controlled content can execute script in another user's browser
Evidence: <unsafe render path>
Fix: render as text, sanitize rich text, or remove the escape hatch
Test: include script tags, event-handler attributes, and javascript URLs
```
