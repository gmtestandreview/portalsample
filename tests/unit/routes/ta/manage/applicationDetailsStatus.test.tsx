import { fireEvent, render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import type { Dispatch, SetStateAction } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { ApplicationDetailsDto } from '@/api/web-api-client';
import { trackGAEvent } from '@/analytics/GoogleAnalytics';
import ApplicationDetailsStatus from '@/routes/ta/manage/applicationDetailsStatus';

vi.mock('@/components/Accordion', () => ({
  CustomAccordion: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CustomAccordionBody: ({
    children,
    name,
    nameRHS,
  }: {
    children: React.ReactNode;
    name: string;
    nameRHS?: React.ReactNode;
  }) => (
    <section>
      <h4>{name}</h4>
      {nameRHS}
      {children}
    </section>
  ),
}));

vi.mock('@/analytics/GoogleAnalytics', () => ({
  trackGAEvent: vi.fn<typeof trackGAEvent>(),
}));

const renderStatus = (
  applicationDetails?: ApplicationDetailsDto,
  setActiveTab?: Dispatch<SetStateAction<string>>,
  onTabChange?: (key: string | null) => void,
) =>
  render(
    <Formik initialValues={{ applicationDetails }} onSubmit={() => undefined}>
      <ApplicationDetailsStatus
        name='applicationDetails'
        {...(setActiveTab ? { setActiveTab } : {})}
        {...(onTabChange ? { onTabChange } : {})}
      />
    </Formik>,
  );

describe(ApplicationDetailsStatus, () => {
  it('shows application metadata and routes to messages', () => {
    expect.hasAssertions();

    vi.clearAllMocks();
    window.history.replaceState({}, '', '/');

    const setActiveTab = vi.fn<Dispatch<SetStateAction<string>>>();
    const onTabChange = vi.fn<(key: string | null) => void>();
    const scrollTo = vi
      .spyOn(window, 'scrollTo')
      .mockImplementation(() => undefined);
    window.history.replaceState({}, '', '/ta/APP-1/manage?tab=details');
    renderStatus(
      {
        referenceId: 'APP-1',
        lastUpdated: '2024-02-03T00:00:00.000Z',
        submittedDate: '2024-01-05T00:00:00.000Z',
        assessedAs: 'Type approved',
        status: 'In progress',
        statusDetail: 'Assessment underway',
        title: 'Application status title',
      },
      setActiveTab,
      onTabChange,
    );

    expect({
      referenceId: screen.queryByText('APP-1') !== null,
      lastUpdated: screen.queryByText('03 Feb 2024') !== null,
      submittedDate: screen.queryByText('05 Jan 2024') !== null,
      assessedAs: screen.queryByText('Type approved') !== null,
      statusDetail: screen.queryByText('Assessment underway') !== null,
    }).toStrictEqual({
      referenceId: true,
      lastUpdated: true,
      submittedDate: true,
      assessedAs: true,
      statusDetail: true,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Messages' }));

    expect({
      locationSearch: window.location.search,
      activeTab: setActiveTab.mock.calls.at(-1)?.[0],
      changedTab: onTabChange.mock.calls.at(-1)?.[0],
      analytics: vi.mocked(trackGAEvent).mock.calls.at(-1),
      scrollTo: scrollTo.mock.calls.at(-1),
    }).toStrictEqual({
      locationSearch: '?tab=messages',
      activeTab: 'messages',
      changedTab: 'messages',
      analytics: ['Application item/view messages'],
      scrollTo: [0, 0],
    });

    scrollTo.mockRestore();
  });

  it('handles missing details and optional message navigation callbacks', () => {
    expect.hasAssertions();

    vi.clearAllMocks();
    window.history.replaceState({}, '', '/');
    const scrollTo = vi
      .spyOn(window, 'scrollTo')
      .mockImplementation(() => undefined);
    renderStatus();

    expect(
      screen.getByRole('heading', { name: 'Application status' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Reference ID').parentElement).toHaveTextContent(
      'Reference ID',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Messages' }));

    expect(trackGAEvent).toHaveBeenCalledWith('Application item/view messages');
    expect(window.location.search).toBe('?tab=messages');

    scrollTo.mockRestore();
  });
});
