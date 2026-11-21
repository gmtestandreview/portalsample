import { describe, expect, it } from 'vitest';

import { DashboardTab } from '../../../../ClientApp/src/components/SearchFilter/types';
import { PatternApprovalDashboard } from '../../../../ClientApp/src/routes/ta/types';

const dashboardValues = (dashboard: PatternApprovalDashboard) => ({
  filterStatusType: dashboard.filterStatusType,
  filterYearType: dashboard.filterYearType,
  filterSortOrder: dashboard.filterSortOrder,
  filtersChanged: dashboard.filtersChanged,
  filterCurrentPage: dashboard.filterCurrentPage,
  filterActiveTab: dashboard.filterActiveTab,
  filterSearchText: dashboard.filterSearchText,
});

// function suite titles are required by vitest/prefer-describe-function-title.
describe(PatternApprovalDashboard, () => {
  it('uses default dashboard filters when no initial values are supplied', () => {
    expect.hasAssertions();
    expect(dashboardValues(new PatternApprovalDashboard())).toStrictEqual({
      filterStatusType: 'allStatuses',
      filterYearType: 'allYears',
      filterSortOrder: 'descending',
      filtersChanged: false,
      filterCurrentPage: 1,
      filterActiveTab: DashboardTab.Drafts,
      filterSearchText: '',
    });
  });

  it('uses provided dashboard filters, including falsy but intentional values', () => {
    expect.hasAssertions();
    expect(
      dashboardValues(
        new PatternApprovalDashboard({
          filterStatusType: '',
          filterYearType: '',
          filterSortOrder: '',
          filtersChanged: true,
          filterCurrentPage: 0,
          filterActiveTab: DashboardTab.Requests,
          filterSearchText: 'certificate',
        }),
      ),
    ).toStrictEqual({
      filterStatusType: '',
      filterYearType: '',
      filterSortOrder: '',
      filtersChanged: true,
      filterCurrentPage: 0,
      filterActiveTab: DashboardTab.Requests,
      filterSearchText: 'certificate',
    });
  });
});
