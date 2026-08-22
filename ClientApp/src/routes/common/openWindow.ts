export const NEW_TAB_TARGET = '_blank';
export const NO_OPENER_FEATURES = 'noopener,noreferrer';

const isSafeInternalRoute = (url: string): boolean => (
    url.startsWith('/')
    && !url.startsWith('//')
    && !/^[a-z][a-z\d+\-.]*:/i.test(url)
);

export const openUrlInSecureNewTab = (url: string): void => {
    const openedWindow = window.open(url, NEW_TAB_TARGET, NO_OPENER_FEATURES);
    if (openedWindow) {
        openedWindow.opener = null;
    }
};

export const openInternalRouteInNewTab = (route: string): void => {
    if (!isSafeInternalRoute(route)) {
        return;
    }

    openUrlInSecureNewTab(route);
};

export const openPdfPageInSecureNewTab = (fileUrl: string, pageNumber: string): void => {
    openUrlInSecureNewTab(`${fileUrl}#page=${encodeURIComponent(pageNumber)}`);
};
