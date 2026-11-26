# React status fixture requirements

Synthetic evaluation scenario, React 18+ with TypeScript. No historical
original, installed harness, approved performance target or project
configuration supplied.

- R1: The public component accepts a `loadStatus` callback returning a promise
  of `ready` or `failed`. Selecting Refresh starts a load; show Loading, then
  Ready or Failed. A rejected promise also displays Failed.
- R2: When the component unmounts or `loadStatus` changes, a superseded pending
  request must not update the displayed status. When Refresh is selected again,
  only the newest request may update it.
- R3: The status text is exposed in a polite live region and the Refresh control
  remains a native button operable by keyboard.

Inputs and files are synthetic; no real React execution or accessibility test
results are supplied. Test the documented behavior, not source similarity.
