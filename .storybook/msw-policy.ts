/**
 * Detailed MSW request output is opt-in so routine Storybook and CI runs stay
 * concise without suppressing warnings, errors, or unhandled requests.
 */
export const isStorybookMswDebugEnabled = (search: string): boolean => new URLSearchParams(search).get('msw-debug') === 'true';
