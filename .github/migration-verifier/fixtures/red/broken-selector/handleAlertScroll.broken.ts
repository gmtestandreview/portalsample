const handleAlertScroll = () => {
    window.scrollTo(0, 0);
    setTimeout(() => {
        const el = document.querySelector('[id^="#notif-"]') as HTMLElement | null;
        el?.focus();
    }, 100);
};
