import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router';

const RouteAccessibleNavigation = () => {
    const [message, setMessage] = useState(document.title);
    const location = useLocation();
    const path = location.pathname;
    const routeMessageRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout | number | undefined;
        if (path.slice(1)) {
            timeoutId = setTimeout(() => setMessage(`Navigated to ${document.title} page.`), 100);
        } else {
            setMessage(`Navigated to ${document.title || ''} page.`);
        }
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [path, location]);

    return (
        <span ref={routeMessageRef} className='visually-hidden' role='status' aria-live='polite'>
            {message}
        </span>
    );
};

export default RouteAccessibleNavigation;
