import { useEffect } from 'react';
import { useLocation } from 'react-router';

const RouteChangeScrollTop = () => {
  const { pathname } = useLocation();

  const resetFocusAndScroll = () => {
    window.scrollTo(0, 0);
    setTimeout(() => {
      const title = document.querySelector<HTMLElement>('#page-title');
      if (title) {
        setTimeout(() => {
          title.focus();
        }, 500);
      } else {
        document.querySelector<HTMLElement>('#page-top')?.focus();
      }
    }, 100);
  };

  useEffect(() => {
    resetFocusAndScroll();
  }, [pathname]);

  return null;
};

export default RouteChangeScrollTop;
