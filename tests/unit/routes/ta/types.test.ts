import { describe, expect, it } from 'vitest';

import { DashboardTab } from '../../../../ClientApp/src/components/SearchFilter/types';
import { PatternApprovalDashboard } from '../../../../ClientApp/src/routes/ta/types';

describe('PatternApprovalDashboard', () => {
    it('uses default dashboard filters when no initial values are supplied', () => {
        expect(new PatternApprovalDashboard()).toEqual({
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
        expect(new PatternApprovalDashboard({
            filterStatusType: '',
            filterYearType: '',
            filterSortOrder: '',
            filtersChanged: true,
            filterCurrentPage: 0,
            filterActiveTab: DashboardTab.Requests,
            filterSearchText: 'certificate',
        })).toEqual({
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
