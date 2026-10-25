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

describe(PortalStoryRouter, () => {
  it('matches an exact destination ahead of the story wildcard and reports destination params', async () => {
    expect.assertions(2);
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
      />,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Complete request' }));

    await expect(
      screen.findByText('Destination reference: returned-42'),
    ).resolves.toBeVisible();

    await waitFor(() =>
      expect(observations).toContainEqual({
        pathname: '/complete/returned-42',
        params: { reference: 'returned-42' },
      }),
    );
  });
});
