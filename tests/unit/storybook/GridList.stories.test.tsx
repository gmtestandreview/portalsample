import {render, screen} from '@testing-library/react';
import {
    Example,
    Sections,
} from '../../../ClientApp/src/components/GridLists/GridList.stories';

describe('GridList stories', () => {
  test('provides alt text for every image in the example story', () => {
    render(<>{Example({}, {} as never)}</>);

    for (const image of screen.getAllByRole('img')) {
      expect(image).toHaveAttribute('alt');
    }
  });

  test('provides alt text for every image in the sections story', () => {
    render(<>{Sections({}, {} as never)}</>);

    for (const image of screen.getAllByRole('img')) {
      expect(image).toHaveAttribute('alt');
    }
  });
});
