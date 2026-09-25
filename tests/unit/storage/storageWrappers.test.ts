import {
    beforeEach, describe, expect, it,
} from 'vitest';
import {
    clearBranchModalNotification,
    clearDashboardInfoNotification,
    clearDashboardNotification,
    clearGetStartedNotification,
    clearManageAccessNotification,
    clearReportingNotification,
    getBranchModalNotification,
    getDashboardInfoNotification,
    getDashboardNotification,
    getGetStartedNotification,
    getManageAccessNotification,
    getReportingNotification,
    setBranchModalNotification,
    setDashboardInfoNotification,
    setDashboardNotification,
    setGetStartedNotification,
    setManageAccessNotification,
    setReportingNotification,
} from '../../../ClientApp/src/storage/notification';
import setTargetOrganisation, {
    clearTargetOrganisation,
    getTargetOrganisation,
} from '../../../ClientApp/src/storage/targetOrganisation';
import { NotificationSeverity, type Notification } from '../../../ClientApp/src/storage/types';

describe('notification storage wrappers', () => {
    const notification: Notification = {
        message: 'Saved successfully',
        severity: NotificationSeverity.Success,
    };

    beforeEach(() => {
        sessionStorage.clear();
    });

    it.each([
        ['branch modal', setBranchModalNotification, getBranchModalNotification, clearBranchModalNotification, 'branchModalNotification'],
        ['dashboard', setDashboardNotification, getDashboardNotification, clearDashboardNotification, 'dashboardNotification'],
        ['manage access', setManageAccessNotification, getManageAccessNotification, clearManageAccessNotification, 'manageAccessNotification'],
        ['reporting', setReportingNotification, getReportingNotification, clearReportingNotification, 'reportingNotification'],
        ['get started', setGetStartedNotification, getGetStartedNotification, clearGetStartedNotification, 'getStartedNotification'],
        ['dashboard info', setDashboardInfoNotification, getDashboardInfoNotification, clearDashboardInfoNotification, 'dashboardInfoNotification'],
    ])('sets, gets, and clears the %s notification', (_name, setNotification, getNotification, clearNotification, key) => {
        expect(getNotification()).toBeUndefined();

        setNotification(notification);

        expect(sessionStorage.getItem(key)).toBe(JSON.stringify(notification));
        expect(getNotification()).toEqual(notification);

        clearNotification();

        expect(sessionStorage.getItem(key)).toBeNull();
        expect(getNotification()).toBeUndefined();
    });
});

describe('target organisation storage wrapper', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('sets, gets, and clears the target organisation', () => {
        const targetOrganisation = {
            targetOrganisationAbn: '12345678901',
            targetOrganisationName: 'Acme Pty Ltd',
        };

        expect(getTargetOrganisation()).toBeUndefined();

        setTargetOrganisation(targetOrganisation);

        expect(sessionStorage.getItem('targetOrganisation')).toBe(JSON.stringify(targetOrganisation));
        expect(getTargetOrganisation()).toEqual(targetOrganisation);

        clearTargetOrganisation();

        expect(sessionStorage.getItem('targetOrganisation')).toBeNull();
        expect(getTargetOrganisation()).toBeUndefined();
    });
});
