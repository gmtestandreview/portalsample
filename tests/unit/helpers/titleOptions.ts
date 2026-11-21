import { screen } from '@testing-library/react';
import { vi } from 'vitest';
import type { Title } from '@/api/web-api-client';
import * as apiEnumMappings from '@/utils/apiEnumMappings';

/**
 * Renders via `render` while `toTitle` reports `unmapped` as having no display
 * title, then returns the text of every rendered select option.
 */
export const renderTitleOptionTexts = (
  unmapped: Title,
  render: () => void,
): (string | null)[] => {
  const toTitle = vi
    .spyOn(apiEnumMappings, 'toTitle')
    .mockImplementation((value) =>
      value === unmapped ? undefined : (value as Title),
    );

  try {
    render();

    return screen.getAllByRole('option').map((option) => option.textContent);
  } finally {
    toTitle.mockRestore();
  }
};
