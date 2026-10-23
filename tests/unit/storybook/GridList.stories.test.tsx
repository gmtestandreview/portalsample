import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Example,
  Sections,
} from '../../../ClientApp/src/components/AriaComponents/GridLists/GridList.stories';

describe('gridList stories', () => {
  it('provides alt text for every image in the example story', () => {
    render(<>{Example.render?.(Example.args as never, {} as never)}</>);

    for (const image of screen.getAllByRole('img')) {
      expect(image).toHaveAttribute('alt');
    }
  });

  it('provides alt text for every image in the sections story', () => {
    render(<>{Sections({}, {} as never)}</>);

    for (const image of screen.getAllByRole('img')) {
      expect(image).toHaveAttribute('alt');
    }
  });
});
