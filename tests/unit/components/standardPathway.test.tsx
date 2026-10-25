import { describe, it, expect } from 'vitest';

import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom/vitest';

import { MemoryRouter } from 'react-router';

import StandardPathway from '../../../ClientApp/src/components/tiles/StandardPathway';

describe('standardPathway external links', () => {
  it('uses explicit noopener noreferrer on new-tab external links', () => {
    expect.assertions(4);
    render(
      <StandardPathway
        type='external'
        title='Give us your feedback'
        linkDescription=' '
        bodyText='Feedback survey'
        linkHref='https://industry.au1.qualtrics.com/jfe/form/SV_9X41DIbsi8FvCQu'
        target='_blank'
      />,
    );

    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    expect(link).toHaveAccessibleName(/opens in a new tab/i);
  });
});
