import { render, screen } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import ViewPdfButton from '@/components/Utilities/ViewPdfButton';

const trackGAEventMock = vi.hoisted(() => vi.fn());

vi.mock(
  import('@/analytics/GoogleAnalytics'),
  () =>
    ({
      trackGAEvent: trackGAEventMock,
    }) satisfies __ExactMockModule<__TestMockModule22>,
);

describe(ViewPdfButton, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('shows the download button and file size note when loaded', () => {
    expect.assertions(2);
    render(
      <ViewPdfButton
        text='Download PDF'
        fileSize='1.2 MB'
        isLoaded
        getPdf={vi.fn()}
        gaLabel='Quote'
      />,
    );

    expect(
      screen.getByRole('button', { name: /Download PDF/i }),
    ).toBeInTheDocument();
    // fileSize and its label text share a single <span>, so check the full content together
    expect(
      screen.getByText(/Requires Acrobat PDF reader - PDF file size/),
    ).toHaveTextContent('1.2 MB');
  });
});

describe(ViewPdfButton, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('shows the loading spinner and hides the button while not loaded', () => {
    expect.assertions(3);
    render(
      <ViewPdfButton
        fileSize='1.2 MB'
        isLoaded={false}
        getPdf={vi.fn()}
        gaLabel='Quote'
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Loading data...');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Requires Acrobat PDF reader/),
    ).not.toBeInTheDocument();
  });
});
