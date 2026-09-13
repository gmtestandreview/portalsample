# React Review Guide

Use this guide for React components, hooks, state management, forms, routing, accessibility, and rendering performance.

## Component Boundaries

- [ ] Components have a clear responsibility.
- [ ] UI state stays close to the UI that owns it.
- [ ] Shared state is lifted only when multiple consumers need it.
- [ ] Business logic is extracted when it becomes hard to test in the component.
- [ ] Props are explicit and avoid ambiguous boolean combinations.

## Hooks

- [ ] Hook dependency arrays are correct.
- [ ] Effects synchronize with external systems; they do not duplicate derived state.
- [ ] Cleanup functions remove subscriptions, timers, observers, and listeners.
- [ ] Custom hooks return stable, documented values.
- [ ] Hooks are not called conditionally.

```tsx
const visibleItems = items.filter((item) => item.visible);
```

## State and Data Fetching

- [ ] Loading, empty, error, and success states are handled.
- [ ] Stale request responses cannot overwrite newer state.
- [ ] Mutations update or invalidate cached data consistently.
- [ ] Optimistic updates have rollback behavior.
- [ ] Server state and client-only UI state are not mixed unnecessarily.

## Forms

- [ ] Inputs are accessible by label.
- [ ] Validation errors are announced and associated with fields.
- [ ] Required, disabled, pending, and submission states are clear.
- [ ] Form submission handles duplicate clicks and in-flight requests.
- [ ] Controlled and uncontrolled patterns are not mixed accidentally.

## Accessibility

- [ ] Semantic HTML is preferred over custom roles.
- [ ] Buttons are buttons, links are links.
- [ ] Keyboard navigation works for all interactive elements.
- [ ] Focus is managed after dialogs, route changes, and validation errors.
- [ ] ARIA is used only when native HTML cannot express the behavior.
- [ ] Color is not the only state indicator.

## Rendering Performance

- [ ] Expensive computations are memoized only when there is evidence or clear cost.
- [ ] Large lists are virtualized or paginated.
- [ ] Props passed to memoized children are stable where needed.
- [ ] Context providers do not force broad rerenders for frequently changing values.
- [ ] Effects do not create rerender loops.

## Common Bugs

- Missing key stability in lists.
- Using array index as key for reordered or stateful rows.
- Stale closure in event handlers, timers, or async callbacks.
- Mutating state directly.
- Missing cleanup in `useEffect`.
- Fetch race conditions on changing inputs.
- Conditional hook calls.
- Derived state that gets out of sync.

## Testing

- [ ] Tests assert user-visible behavior.
- [ ] Tests use accessible queries where possible.
- [ ] Async tests await settled UI states.
- [ ] Mocks are used for network or browser APIs, not for the component under review.
- [ ] Important keyboard and error flows are covered.
