# CSS, Less, and Sass Review Guide

Use this guide for styling changes, design-system work, responsive layout, accessibility, and CSS architecture.

## Layout and Responsiveness

- [ ] Layout works at small, medium, large, and wide viewports.
- [ ] Content does not overlap, clip unexpectedly, or require horizontal scrolling.
- [ ] Fixed dimensions are justified and paired with responsive constraints.
- [ ] Grid and flex behavior is explicit for wrapping, gaps, and alignment.
- [ ] Long words, dynamic labels, and translated text have room to fit.

```css
.toolbar-title {
  min-width: 0;
  max-width: 20rem;
  overflow-wrap: anywhere;
}
```

## Accessibility

- [ ] Color contrast meets the target standard.
- [ ] Focus styles are visible and not removed.
- [ ] Interactive states are available for keyboard and pointer users.
- [ ] Motion respects `prefers-reduced-motion`.
- [ ] Layout does not rely on color alone to communicate state.
- [ ] Hit targets are large enough for touch.

## Cascade and Specificity

- [ ] Selectors are as specific as needed, but no more.
- [ ] Avoid `!important` unless overriding third-party styles is unavoidable.
- [ ] Component styles do not leak into unrelated pages.
- [ ] Global selectors are intentional and documented.
- [ ] Source order is not the only thing making the style work.

## Design System Fit

- [ ] Spacing, color, typography, radius, and shadows use existing tokens or conventions.
- [ ] New variants are justified by product need.
- [ ] Components remain visually consistent across states.
- [ ] Disabled, loading, empty, error, hover, focus, active, and selected states are covered where relevant.

## Sass and Less

- [ ] Sass uses `@use` and `@forward` for new files unless local policy says otherwise.
- [ ] Avoid deep variable chains that hide the final value.
- [ ] Mixins generate predictable CSS and are worth their abstraction cost.
- [ ] Nested selectors stay shallow enough to understand.
- [ ] Calculations are readable and avoid deprecated Sass division.

## Performance

- [ ] Avoid large unused CSS payloads.
- [ ] Prefer transform and opacity for animations.
- [ ] Avoid expensive selectors on large DOM trees.
- [ ] Images, fonts, and background assets are sized and loaded appropriately.
- [ ] Critical layout does not shift when fonts or images load.
