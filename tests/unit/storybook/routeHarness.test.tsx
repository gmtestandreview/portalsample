import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, useParams } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import {
  PortalStoryRouter,
  type PortalLocationObservation,
} from '../../../ClientApp/src/storybook/storybookHarness';

const Destination = () => {
  const { reference } = useParams();

  return <p>Destination reference: {reference}</p>;
};

describe('PortalStoryRouter', () => {
  it('matches an exact destination ahead of the story wildcard and reports destination params', async () => {
    const observations: PortalLocationObservation[] = [];

    render(
      <PortalStoryRouter
        Story={() => <Link to='/complete/returned-42'>Complete request</Link>}
        initialEntries={['/request/start-7']}
        routePath='*'
        destinationRoutes={[
          { path: '/complete/:reference', element: <Destination /> },
        ]}
        observeLocation={(location) => observations.push(location)}
      />
    );

    fireEvent.click(screen.getByRole('link', { name: 'Complete request' }));

    expect(
      await screen.findByText('Destination reference: returned-42')
    ).toBeVisible();
    await waitFor(() =>
      expect(observations).toContainEqual({
        pathname: '/complete/returned-42',
        params: { reference: 'returned-42' },
      })
    );
  });

  it('keeps one router and renders current story args across rerenders', async () => {
    const observeLocation = vi.fn();
    const firstStory = () => <p>Current value: first</p>;
    const secondStory = () => <p>Current value: second</p>;
    const view = render(
      <PortalStoryRouter
        Story={firstStory}
        initialEntries={['/request/123']}
        routePath='/request/:requestId'
        destinationRoutes={[]}
        observeLocation={observeLocation}
      />
    );

    expect(screen.getByText('Current value: first')).toBeVisible();
    await waitFor(() =>
      expect(observeLocation).toHaveBeenCalledWith({
        pathname: '/request/123',
        params: { requestId: '123' },
      })
    );

    view.rerender(
      <PortalStoryRouter
        Story={secondStory}
        initialEntries={['/request/999']}
        routePath='/request/:requestId'
        destinationRoutes={[]}
        observeLocation={observeLocation}
      />
    );

    expect(await screen.findByText('Current value: second')).toBeVisible();
    expect(observeLocation).not.toHaveBeenCalledWith({
      pathname: '/request/999',
      params: { requestId: '999' },
    });
  });

  it('falls back to the story wildcard when no destination route matches', async () => {
    const observeLocation = vi.fn();

    render(
      <PortalStoryRouter
        Story={() => (
          <>
            <p>Wildcard story remains mounted</p>
            <Link to='/unmatched/path'>Open unmatched path</Link>
          </>
        )}
        initialEntries={['/']}
        routePath='*'
        destinationRoutes={[]}
        observeLocation={observeLocation}
      />
    );

    fireEvent.click(screen.getByRole('link', { name: 'Open unmatched path' }));

    expect(
      await screen.findByText('Wildcard story remains mounted')
    ).toBeVisible();
    await waitFor(() =>
      expect(observeLocation).toHaveBeenCalledWith({
        pathname: '/unmatched/path',
        params: { '*': 'unmatched/path' },
      })
    );
  });
});
