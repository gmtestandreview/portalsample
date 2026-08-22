import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

export interface RouteAccessibilityResult {
    announcement: string;
}

export function useRouteAccessibility(): RouteAccessibilityResult {
    const location = useLocation();
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        const id = setTimeout(() => {
            setAnnouncement(`Navigated to ${document.title || ''} page.`);
            document.getElementById('main')?.focus();
        }, 100);
        return () => clearTimeout(id);
    }, [location.pathname]);

    return { announcement };
}
