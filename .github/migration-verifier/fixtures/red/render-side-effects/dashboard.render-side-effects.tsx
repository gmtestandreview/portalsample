if (errorStatus.forbidden) {
    setDashboardNotification(DashBoardNotifications.getForbiddenNotification());
}

if (showInfo) {
    setDashboardInfoNotification(DashBoardNotifications.getReportFormsGeneratedNotification());
} else {
    clearDashboardInfoNotification();
}
