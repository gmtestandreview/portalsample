import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Link, useNavigate, useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  PortalStoryRouter,
  withPortalProviders,
  type PortalLocationObservation,
} from '../../../ClientApp/src/storybook/storybookHarness';

type NavigateFunction = ReturnType<typeof useNavigate>;

const Destination = () => {
  const { reference } = useParams();

  return <p>Destination reference: {reference}</p>;
};

const InitialRequest = () => {
  const { requestId } = useParams();

  return <p>Initial request: {requestId}</p>;
};

// eslint-disable-next-line vitest/valid-title -- function suite titles are required by vitest/prefer-describe-function-title.
describe(PortalStoryRouter, () => {
  it('keeps the default story route available without route parameters', () => {
    expect.hasAssertions();

    render(<PortalStoryRouter Story={() => <p>Default story</p>} />);

    expect(screen.getByText('Default story')).toBeVisible();
  });

  it('renders the initial story with its real route parameters', async () => {
    expect.hasAssertions();

    const observeLocation =
      vi.fn<(location: PortalLocationObservation) => void>();

    render(
      <PortalStoryRouter
        Story={InitialRequest}
        initialEntries={['/request/start-7']}
        routePath='/request/:requestId'
        observeLocation={observeLocation}
      />,
    );

    expect(screen.getByText('Initial request: start-7')).toBeVisible();

    await waitFor(() =>
      expect(observeLocation).toHaveBeenCalledWith({
        pathname: '/request/start-7',
        params: { requestId: 'start-7' },
      }),
    );
  });

  it('matches an exact destination ahead of the story wildcard and reports destination params', async () => {
    expect.hasAssertions();

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

  it('falls through to the story wildcard for a wrong returned reference', async () => {
    expect.hasAssertions();

    const observeLocation =
      vi.fn<(location: PortalLocationObservation) => void>();

    render(
      <PortalStoryRouter
        Story={() => (
          <>
            <p>Wrong reference remains in story</p>
            <Link to='/complete/wrong-42'>Return wrong reference</Link>
          </>
        )}
        initialEntries={['/request/start-7']}
        routePath='*'
        destinationRoutes={[
          {
            path: '/complete/returned-42',
            element: <Destination />,
          },
        ]}
        observeLocation={observeLocation}
      />,
    );

    fireEvent.click(
      screen.getByRole('link', { name: 'Return wrong reference' }),
    );

    await expect(
      screen.findByText('Wrong reference remains in story'),
    ).resolves.toBeVisible();
    expect(screen.queryByText('Destination reference: wrong-42')).toBeNull();

    await waitFor(() =>
      expect(observeLocation).toHaveBeenCalledWith({
        pathname: '/complete/wrong-42',
        params: { '*': 'complete/wrong-42' },
      }),
    );
  });

  it('keeps navigation on the same route while an async response settles', async () => {
    expect.hasAssertions();

    let settleResponse!: () => void;
    const pendingResponse = new Promise<void>((resolve) => {
      settleResponse = resolve;
    });
    const observeLocation =
      vi.fn<(location: PortalLocationObservation) => void>();
    const AsyncStory = () => {
      const [settled, setSettled] = useState(false);

      useEffect(() => {
        void pendingResponse.then(() => setSettled(true));
      }, []);

      return (
        <>
          <p>{settled ? 'Response settled' : 'Waiting for response'}</p>
          <Link to='/complete/settled-42'>Continue before response</Link>
        </>
      );
    };

    render(
      <PortalStoryRouter
        Story={AsyncStory}
        initialEntries={['/request/start-7']}
        routePath='*'
        destinationRoutes={[
          { path: '/complete/:reference', element: <Destination /> },
        ]}
        observeLocation={observeLocation}
      />,
    );

    fireEvent.click(
      screen.getByRole('link', { name: 'Continue before response' }),
    );

    await expect(
      screen.findByText('Destination reference: settled-42'),
    ).resolves.toBeVisible();

    act(() => {
      settleResponse();
    });

    expect(screen.queryByText('Response settled')).toBeNull();

    await waitFor(() =>
      expect(observeLocation).toHaveBeenCalledWith({
        pathname: '/complete/settled-42',
        params: { reference: 'settled-42' },
      }),
    );
  });

  it('keeps one router and renders current story args across rerenders', async () => {
    expect.hasAssertions();

    const observeLocation =
      vi.fn<(location: PortalLocationObservation) => void>();
    const firstStory = () => <p>Current value: first</p>;
    const secondStory = () => <p>Current value: second</p>;
    const view = render(
      <PortalStoryRouter
        Story={firstStory}
        initialEntries={['/request/123']}
        routePath='/request/:requestId'
        destinationRoutes={[]}
        observeLocation={observeLocation}
      />,
    );

    expect(screen.getByText('Current value: first')).toBeVisible();

    await waitFor(() =>
      expect(observeLocation).toHaveBeenCalledWith({
        pathname: '/request/123',
        params: { requestId: '123' },
      }),
    );

    view.rerender(
      <PortalStoryRouter
        Story={secondStory}
        initialEntries={['/request/999']}
        routePath='/request/:requestId'
        destinationRoutes={[]}
        observeLocation={observeLocation}
      />,
    );

    await expect(
      screen.findByText('Current value: second'),
    ).resolves.toBeVisible();
    expect(observeLocation).not.toHaveBeenCalledWith({
      pathname: '/request/999',
      params: { requestId: '999' },
    });
  });

  it('preserves navigation across a story rerender on the mounted router', async () => {
    expect.hasAssertions();

    const firstStory = () => (
      <Link to='/complete/rerender-42'>Navigate to destination</Link>
    );
    const secondStory = () => <p>Replacement story</p>;
    const destinationRoutes = [
      { path: '/complete/:reference', element: <Destination /> },
    ];
    const view = render(
      <PortalStoryRouter
        Story={firstStory}
        initialEntries={['/start']}
        routePath='*'
        destinationRoutes={destinationRoutes}
      />,
    );

    fireEvent.click(
      screen.getByRole('link', { name: 'Navigate to destination' }),
    );

    await expect(
      screen.findByText('Destination reference: rerender-42'),
    ).resolves.toBeVisible();

    view.rerender(
      <PortalStoryRouter
        Story={secondStory}
        initialEntries={['/changed']}
        routePath='*'
        destinationRoutes={destinationRoutes}
      />,
    );

    expect(
      screen.getByText('Destination reference: rerender-42'),
    ).toBeVisible();

    view.unmount();
  });

  it('falls back to the story wildcard when no destination route matches', async () => {
    expect.hasAssertions();

    const observeLocation =
      vi.fn<(location: PortalLocationObservation) => void>();

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
      />,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Open unmatched path' }));

    await expect(
      screen.findByText('Wildcard story remains mounted'),
    ).resolves.toBeVisible();

    await waitFor(() =>
      expect(observeLocation).toHaveBeenCalledWith({
        pathname: '/unmatched/path',
        params: { '*': 'unmatched/path' },
      }),
    );
  });

  it('cleans up overlapping router observers in either unmount order', async () => {
    expect.hasAssertions();

    const firstObservations: PortalLocationObservation[] = [];
    const secondObservations: PortalLocationObservation[] = [];
    let firstNavigate: NavigateFunction | undefined;
    let secondNavigate: NavigateFunction | undefined;
    const FirstStory = () => {
      firstNavigate = useNavigate();
      return <p>First router</p>;
    };
    const SecondStory = () => {
      secondNavigate = useNavigate();
      return <p>Second router</p>;
    };

    const view = render(
      <>
        <PortalStoryRouter
          Story={FirstStory}
          initialEntries={['/first']}
          observeLocation={(location) => firstObservations.push(location)}
        />
        <PortalStoryRouter
          Story={SecondStory}
          initialEntries={['/second']}
          observeLocation={(location) => secondObservations.push(location)}
        />
      </>,
    );

    await waitFor(() => {
      expect(firstObservations).toContainEqual({
        pathname: '/first',
        params: { '*': 'first' },
      });
      expect(secondObservations).toContainEqual({
        pathname: '/second',
        params: { '*': 'second' },
      });
    });

    const secondObservationCount = secondObservations.length;
    view.rerender(
      <PortalStoryRouter
        Story={FirstStory}
        initialEntries={['/changed']}
        observeLocation={(location) => firstObservations.push(location)}
      />,
    );

    await act(async () => {
      await secondNavigate?.('/after-second-unmount');
    });

    expect(secondObservations).toHaveLength(secondObservationCount);

    await act(async () => {
      await firstNavigate?.('/after-first-unmount');
    });
    await waitFor(() =>
      expect(firstObservations).toContainEqual({
        pathname: '/after-first-unmount',
        params: { '*': 'after-first-unmount' },
      }),
    );

    const firstObservationCount = firstObservations.length;
    view.unmount();
    await act(async () => {
      await firstNavigate?.('/after-all-unmount');
    });

    expect(firstObservations).toHaveLength(firstObservationCount);
  });

  it('keeps an overlapping story fetch override alive after the first story unmounts', () => {
    expect.hasAssertions();

    const originalFetch = globalThis.fetch;
    const originalWindowFetch = Reflect.get(globalThis.window, 'fetch') as
      typeof globalThis.fetch | undefined;
    const expectActiveFetch = (
      expectedFetch: typeof globalThis.fetch | undefined,
      expectedWindowFetch: typeof globalThis.fetch | undefined = expectedFetch,
    ) => {
      const activeWindowFetch = Reflect.get(globalThis.window, 'fetch') as
        typeof globalThis.fetch | undefined;

      expect(globalThis.fetch).toBe(expectedFetch);
      expect(activeWindowFetch).toBe(expectedWindowFetch);
    };
    const firstFetch = vi.fn<typeof globalThis.fetch>();
    const updatedFirstFetch = vi.fn<typeof globalThis.fetch>();
    const secondFetch = vi.fn<typeof globalThis.fetch>();
    const Story = () => <p>Fetch-owned story</p>;
    const contextFor = (fetchImpl: typeof globalThis.fetch) =>
      ({
        parameters: { portal: { fetch: fetchImpl } },
      }) as unknown as Parameters<typeof withPortalProviders>[1];
    const firstView = render(
      withPortalProviders(Story, contextFor(firstFetch)),
    );
    const secondView = render(
      withPortalProviders(Story, contextFor(secondFetch)),
      { container: document.createElement('div') },
    );

    expectActiveFetch(secondFetch);

    firstView.rerender(
      withPortalProviders(Story, contextFor(updatedFirstFetch)),
    );

    expectActiveFetch(secondFetch);

    firstView.unmount();

    expectActiveFetch(secondFetch);

    secondView.unmount();

    expectActiveFetch(originalFetch, originalWindowFetch);
  });

  it('restores a pre-existing session sentinel through pagehide and teardown', () => {
    expect.hasAssertions();

    const sessionKey = 'storybook:unit:session-sentinel';
    const previousValue = 'pre-existing-session-value';
    const Story = () => <p>Session-owned story</p>;
    const context = {
      parameters: {
        portal: { sessionStorageSentinel: sessionKey },
      },
    } as unknown as Parameters<typeof withPortalProviders>[1];

    globalThis.sessionStorage.setItem(sessionKey, previousValue);
    const pagehideView = render(withPortalProviders(Story, context));

    expect(globalThis.sessionStorage.getItem(sessionKey)).toBe(
      `${sessionKey}:active`,
    );

    act(() => {
      globalThis.dispatchEvent(new Event('pagehide'));
    });

    expect(globalThis.sessionStorage.getItem(sessionKey)).toBe(previousValue);

    pagehideView.unmount();

    expect(globalThis.sessionStorage.getItem(sessionKey)).toBe(previousValue);

    const teardownView = render(withPortalProviders(Story, context));

    expect(globalThis.sessionStorage.getItem(sessionKey)).toBe(
      `${sessionKey}:active`,
    );

    teardownView.unmount();

    expect(globalThis.sessionStorage.getItem(sessionKey)).toBe(previousValue);

    globalThis.sessionStorage.removeItem(sessionKey);
  });

  it('stops observing after the mounted story is removed', async () => {
    expect.hasAssertions();

    const observeLocation =
      vi.fn<(location: PortalLocationObservation) => void>();
    let navigate: NavigateFunction | undefined;
    const Story = () => {
      navigate = useNavigate();
      return <p>Observed story</p>;
    };
    const view = render(
      <PortalStoryRouter
        Story={Story}
        initialEntries={['/start']}
        observeLocation={observeLocation}
      />,
    );

    await waitFor(() =>
      expect(observeLocation).toHaveBeenCalledWith({
        pathname: '/start',
        params: { '*': 'start' },
      }),
    );
    const observationCount = observeLocation.mock.calls.length;

    view.unmount();
    await act(async () => {
      await navigate?.('/after-unmount');
    });

    expect(observeLocation).toHaveBeenCalledTimes(observationCount);
  });
});
