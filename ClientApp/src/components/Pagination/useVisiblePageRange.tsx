import { useMemo, useSyncExternalStore } from 'react';

const subscribeToResize = (onStoreChange: () => void) => {
  let resizeTimeout: ReturnType<typeof setTimeout> | undefined;

  const debouncedResizeHandler = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(onStoreChange, 500);
  };

  globalThis.addEventListener('resize', debouncedResizeHandler);

  return () => {
    globalThis.removeEventListener('resize', debouncedResizeHandler);
    clearTimeout(resizeTimeout);
  };
};

const getViewportWidth = () => globalThis.innerWidth;
const getServerViewportWidth = () => 0;

const getVisiblePageRange = (viewportWidth: number, defaultRange: number) => {
  if (viewportWidth >= 992) {
    return 10; // Extra-large screens
  }
  if (viewportWidth >= 768) {
    return 7; // Large screens
  }
  if (viewportWidth >= 576) {
    return 5; // Medium screens
  }
  if (typeof globalThis.innerWidth !== 'number') {
    return defaultRange;
  }
  return 3; // Small screens
};

const useVisiblePageRange = (defaultRange: number) => {
  const viewportWidth = useSyncExternalStore(
    subscribeToResize,
    getViewportWidth,
    getServerViewportWidth,
  );

  return useMemo(
    () => getVisiblePageRange(viewportWidth, defaultRange),
    [defaultRange, viewportWidth],
  );
};

export default useVisiblePageRange;
