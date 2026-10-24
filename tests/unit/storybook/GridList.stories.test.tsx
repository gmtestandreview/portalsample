import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  renderExample,
  renderSections,
} from '../../../ClientApp/src/components/AriaComponents/GridLists/GridList.stories';

describe('gridList stories', () => {
  it('provides alt text for every image in the example story', () => {
    expect.hasAssertions();

    render(<>{renderExample({ selectionMode: 'multiple', layout: 'grid' })}</>);

    for (const image of screen.getAllByRole('img')) {
      expect(image).toHaveAttribute('alt');
    }
  });

  it('provides alt text for every image in the sections story', () => {
    expect.hasAssertions();

    render(
      <>{renderSections({ selectionMode: 'multiple', layout: 'grid' })}</>,
    );

    for (const image of screen.getAllByRole('img')) {
      expect(image).toHaveAttribute('alt');
    }
  });
});
