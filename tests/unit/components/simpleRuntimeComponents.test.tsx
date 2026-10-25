import { render, screen } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { MemoryRouter, useLocation } from 'react-router';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CustomAccordion, CustomAccordionBody } from '@/components/Accordion';

import {
  AlertError,
  AlertInfo,
  AlertSuccess,
  AlertWarning,
} from '@/components/Alert';

import NotificationMessage from '@/components/Alert/NotificationMessage';

import BlockUISpinner from '@/components/BlockUISpinner';

import Breadcrumb from '@/components/Breadcrumb';

import BackToDashboardButton from '@/components/Buttons/BackToDashboardButton';

import EditButton from '@/components/Buttons/EditButton';

import LinkButton from '@/components/Buttons/LinkButton';

import Home from '@/components/Home';

import InTextLink from '@/components/InTextLink';

import PaginationHeader from '@/components/PaginationHeader';

import Welcome from '@/components/Welcome';

import { useAccountState } from '@/authentication/hooks';

import { NotificationSeverity } from '@/storage/types';

vi.mock(
  import('@/components/get-started/get-started'),
  () =>
    ({
      default: () => <main>Get started content</main>,
    }) satisfies __ExactMockModule<__TestMockModule54>,
);

vi.mock(
  import('@/authentication/hooks'),
  () =>
    ({
      useAccountState: vi.fn(),
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

const renderWithRouter = (ui: React.ReactNode) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('simple reusable runtime components', () => {
  beforeEach(() => {
    vi.mocked(useAccountState).mockReturnValue(null);
  });
  it('home delegates to the get started entry content', () => {
    expect.assertions(1);
    renderWithRouter(<Home />);

    expect(screen.getByRole('main')).toHaveTextContent('Get started content');
  });
});
