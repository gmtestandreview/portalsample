useEffect(() => {
    if (errorStatus.forbidden) {
        setDashboardNotification(DashBoardNotifications.getForbiddenNotification());
    }
}, [errorStatus.forbidden]);

useEffect(() => {
    if (!scrollToTop) {
        return;
    }

    const timeoutId = window.setTimeout(() => {
        const el = document.querySelector('[id^="notif-"]') as HTMLElement | null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el?.focus();
    }, 100);

    return () => clearTimeout(timeoutId);
}, [scrollToTop]);
