import {render, screen} from '@testing-library/react';
import {Example, Sections} from './GridList.stories';

describe('GridList stories', () => {
  test('provides alt text for every image in the example story', () => {
    render(<>{Example({}, {} as never)}</>);

    for (let image of screen.getAllByRole('img')) {
      expect(image).toHaveAttribute('alt');
    }
  });

  test('provides alt text for every image in the sections story', () => {
    render(<>{Sections({}, {} as never)}</>);

    for (let image of screen.getAllByRole('img')) {
      expect(image).toHaveAttribute('alt');
    }
  });
});
