import preview from '../../../../../.storybook/preview';
import { within, expect, fn } from 'storybook/test';
import type { PatternApprovalDashboardDto } from '../../../api/web-api-client';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import PaSearchFilter from './paSearchFilter';

/**
 * `PaSearchFilter` is the toolbar that composes the pattern-approval dashboard search
 * and filtering. It currently renders the `PaFilterMenu` dropdown (the keyword search
 * box is staged behind it) and wires both to the pattern-approval user-profile slice.
 */
const initialFilters: PatternApprovalDashboardDto = {
  filterStatusType: 'allStatuses',
  filterYearType: 'allYears',
  filterSortOrder: 'descending',
  filtersChanged: false,
  filterCurrentPage: 1,
  filterActiveTab: 'requests',
  filterSearchText: '',
};

const meta = preview.meta({
  title: 'Components/SearchFilter/TypeApproval/PaSearchFilter',
  component: PaSearchFilter,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
    portal: {
      authenticated: true,
    },
  },
  args: {
    initialFilters,
    setInitialFilters: fn(),
    setCurrentPage: fn(),
  },
});


export const Default = meta.story({
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Filters applied' }),
    ).toBeVisible();
  },
});
