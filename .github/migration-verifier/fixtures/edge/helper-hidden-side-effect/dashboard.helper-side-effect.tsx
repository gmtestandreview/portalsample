const writeForbiddenNotification = () => {
    setDashboardNotification(DashBoardNotifications.getForbiddenNotification());
};

if (errorStatus.forbidden) {
    writeForbiddenNotification();
}
