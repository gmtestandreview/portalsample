import { useEffect } from 'react';
import { useLocation } from 'react-router';

const useHtmlTitle = (
    title = 'NMI', // default props
): void => {
    const location = useLocation();
    useEffect(() => {
        const prevTitle = document.title;
        document.title = title;
        return () => {
            document.title = prevTitle;
        };
    }, [location, title]);
};

export default useHtmlTitle;
