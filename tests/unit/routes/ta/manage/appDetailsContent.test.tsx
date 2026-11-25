import { fireEvent, render, screen } from '@testing-library/react';
import type { Dispatch, SetStateAction } from 'react';
import { describe, expect, it, vi } from 'vitest';
import AppDetailsContent from '@/routes/ta/manage/appDetailsContent';

vi.mock('@/components/BlockUISpinner', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div role='status'>{children}</div>
  ),
}));

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

vi.mock('@/routes/ta/manage/applicationDetailsStatus', () => ({
  default: () => <div>Application status content</div>,
}));

vi.mock('@/routes/ta/organisationAndContact', () => ({
  default: () => <div>Organisation details content</div>,
}));

vi.mock('@/routes/ta/applicationAndInstrument', () => ({
  default: () => <div>Application details content</div>,
}));

vi.mock('@/routes/ta/supportingDocuments', () => ({
  default: ({
    attachment,
  }: {
    attachment: { onUploadFiles: () => Promise<unknown[]> };
  }) => (
    <div>
      <div>Supporting documents content</div>
      <button type='button' onClick={() => void attachment.onUploadFiles()}>
        Invoke upload placeholder
      </button>
    </div>
  ),
}));

describe(AppDetailsContent, () => {
  it('shows a loading status while application details load', () => {
    expect.hasAssertions();

    render(
      <AppDetailsContent
        isDataLoading
        setActiveTab={vi.fn<() => void>()}
        onTabChange={vi.fn<() => void>()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Loading data...');
    expect(screen.getByRole('status').parentElement).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(
      screen.queryByText('Record of application submitted'),
    ).not.toBeInTheDocument();
  });

  it('renders submitted details and moves to the documents tab from the link', () => {
    expect.hasAssertions();

    const setActiveTab = vi.fn<Dispatch<SetStateAction<string>>>();
    const scrollTo = vi
      .spyOn(window, 'scrollTo')
      .mockImplementation(() => undefined);
    window.history.replaceState({}, '', '/ta/APP-1/manage?tab=details');

    render(
      <AppDetailsContent
        isDataLoading={false}
        isModalOpen={false}
        setActiveTab={setActiveTab}
        onTabChange={vi.fn<(key: string | null) => void>()}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Invoke upload placeholder' }),
    );

    fireEvent.click(screen.getByRole('button', { name: /view documents/i }));

    expect({
      statusContent: screen.queryByText('Application status content') !== null,
      submittedHeading:
        screen.queryByText('Record of application submitted') !== null,
      organisationContent:
        screen.queryByText('Organisation details content') !== null,
      applicationContent:
        screen.queryByText('Application details content') !== null,
      supportingDocuments:
        screen.queryByText('Supporting documents content') !== null,
      locationSearch: window.location.search,
      activeTab: setActiveTab.mock.calls.at(-1)?.[0],
      scrollTo: scrollTo.mock.calls.at(-1),
    }).toStrictEqual({
      statusContent: true,
      submittedHeading: true,
      organisationContent: true,
      applicationContent: true,
      supportingDocuments: true,
      locationSearch: '?tab=documents',
      activeTab: 'documents',
      scrollTo: [0, 0],
    });

    scrollTo.mockRestore();
  });

  it('keeps the details visible while the modal is open during loading', () => {
    expect.hasAssertions();

    render(
      <AppDetailsContent
        isDataLoading
        isModalOpen
        setActiveTab={vi.fn<Dispatch<SetStateAction<string>>>()}
        onTabChange={vi.fn<(key: string | null) => void>()}
      />,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(
      screen.getByText('Record of application submitted'),
    ).toBeInTheDocument();
    expect(screen.getByText('Application status content')).toBeInTheDocument();
  });
});
