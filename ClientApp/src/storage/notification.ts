import SessionStorageCache from './sessionStorageCache';
import type { Notification } from './types';

const branchModalNotificationKey = 'branchModalNotification';
const dashboardNotificationKey = 'dashboardNotification';
const manageAccessNotificationKey = 'manageAccessNotification';
const getStartedNotificationKey = 'getStartedNotification';
const reportingNotificationKey = 'reportingNotification';
const dashboardInfoNotificationKey = 'dashboardInfoNotification';

export const getBranchModalNotification = () => SessionStorageCache().getItem<Notification>(
    branchModalNotificationKey,
);

export const getDashboardNotification = () => SessionStorageCache().getItem<Notification>(
    dashboardNotificationKey,
);

export const getManageAccessNotification = () => SessionStorageCache().getItem<Notification>(
    manageAccessNotificationKey,
);

export const getReportingNotification = () => SessionStorageCache().getItem<Notification>(
    reportingNotificationKey,
);

export const getGetStartedNotification = () => SessionStorageCache().getItem<Notification>(
    getStartedNotificationKey,
);

export const getDashboardInfoNotification = () => SessionStorageCache().getItem<Notification>(
    dashboardInfoNotificationKey,
);

export const setBranchModalNotification = (item: Notification) => {
    SessionStorageCache().setItem(item, branchModalNotificationKey);
};

export const setDashboardNotification = (item: Notification) => {
    SessionStorageCache().setItem(item, dashboardNotificationKey);
};

export const setManageAccessNotification = (item: Notification) => {
    SessionStorageCache().setItem(item, manageAccessNotificationKey);
};

export const setReportingNotification = (item: Notification) => {
    SessionStorageCache().setItem(item, reportingNotificationKey);
};

export const setGetStartedNotification = (item: Notification) => {
    SessionStorageCache().setItem(item, getStartedNotificationKey);
};

export const setDashboardInfoNotification = (item: Notification) => {
    SessionStorageCache().setItem(item, dashboardInfoNotificationKey);
};

export const clearBranchModalNotification = () => {
    SessionStorageCache().removeItem(branchModalNotificationKey);
};

export const clearDashboardNotification = () => {
    SessionStorageCache().removeItem(dashboardNotificationKey);
};

export const clearManageAccessNotification = () => {
    SessionStorageCache().removeItem(manageAccessNotificationKey);
};

export const clearReportingNotification = () => {
    SessionStorageCache().removeItem(reportingNotificationKey);
};

export const clearGetStartedNotification = () => {
    SessionStorageCache().removeItem(getStartedNotificationKey);
};

export const clearDashboardInfoNotification = () => {
    SessionStorageCache().removeItem(dashboardInfoNotificationKey);
};
