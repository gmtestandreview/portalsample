import { useState, useEffect } from 'react';

const useVisiblePageRange = (defaultRange: number) => {
    const [visiblePageRange, setVisiblePageRange] = useState(defaultRange);

    useEffect(() => {
        let resizeTimeout: NodeJS.Timeout;

        const updateVisiblePageRange = () => {
            if (window.innerWidth >= 992) {
                setVisiblePageRange(10); // Extra-large screens
                // console.log('LG screens = 10');
            } else if (window.innerWidth >= 768) {
                setVisiblePageRange(7); // Large screens
                // console.log('MD screens = 7');
            } else if (window.innerWidth >= 576) {
                setVisiblePageRange(5); // Medium screens
                // console.log('SM screens = 5');
            } else {
                setVisiblePageRange(3); // Small screens
                // console.log('XS screens = 3');
            }
        };

        const debouncedResizeHandler = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateVisiblePageRange, 500);
        };

        // Set initial value
        updateVisiblePageRange();

        // Add event listener for window resize
        window.addEventListener('resize', debouncedResizeHandler);

        // Cleanup event listener on component unmount
        return () => {
            window.removeEventListener('resize', debouncedResizeHandler);
            clearTimeout(resizeTimeout);
        };
    }, []);

    return visiblePageRange;
};

export default useVisiblePageRange;
