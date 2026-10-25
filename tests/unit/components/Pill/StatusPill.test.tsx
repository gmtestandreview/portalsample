import { describe, it, expect } from 'vitest';

import { render, screen, waitFor } from '@testing-library/react';

import StatusPill from '../../../../ClientApp/src/components/Pill/StatusPill';

import {
  DashboardItemStatus,
  PaDashboardItemStatus,
  QuoteStatus,
  ReportStatus,
} from '../../../../ClientApp/src/routes/common/enums';

describe(StatusPill, () => {
  describe('dashboard item status', () => {
    it('renders QuoteAvailable text', async () => {
      expect.assertions(1);
      render(<StatusPill status={DashboardItemStatus.QuoteAvailable} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.QuoteAvailable),
        ).toBeInTheDocument();
      });
    });
  });
});

describe(StatusPill, () => {
  describe('dashboard item status', () => {
    it('renders QuoteAccepted text', async () => {
      expect.assertions(1);
      render(<StatusPill status={DashboardItemStatus.QuoteAccepted} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.QuoteAccepted),
        ).toBeInTheDocument();
      });
    });
  });
});

describe(StatusPill, () => {
  describe('dashboard item status', () => {
    it('renders QuoteDrafted text', async () => {
      expect.assertions(1);
      render(<StatusPill status={DashboardItemStatus.QuoteDrafted} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.QuoteDrafted),
        ).toBeInTheDocument();
      });
    });
  });
});

describe(StatusPill, () => {
  describe('dashboard item status', () => {
    it('renders QuoteDeclined text', async () => {
      expect.assertions(1);
      render(<StatusPill status={DashboardItemStatus.QuoteDeclined} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.QuoteDeclined),
        ).toBeInTheDocument();
      });
    });
  });
});

describe(StatusPill, () => {
  describe('dashboard item status', () => {
    it('renders QuoteExpired text', async () => {
      expect.assertions(1);
      render(<StatusPill status={DashboardItemStatus.QuoteExpired} />);
      await waitFor(() => {
        expect(
          screen.getByText(DashboardItemStatus.QuoteExpired),
        ).toBeInTheDocument();
      });
    });
  });
});
