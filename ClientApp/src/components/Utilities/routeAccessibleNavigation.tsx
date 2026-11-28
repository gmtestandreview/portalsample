import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router';

const RouteAccessibleNavigation = () => {
  const [announcedMessage, setAnnouncedMessage] = useState(document.title);
  const location = useLocation();
  const path = location.pathname;
  const routeMessageRef = useRef<HTMLSpanElement>(null);
  const isRoot = !path.slice(1);

  useEffect(() => {
    if (isRoot) {
      return undefined;
    }
    const timeoutId = setTimeout(() => {
      setAnnouncedMessage(`Navigated to ${document.title} page.`);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isRoot, path, location]);

  // The root route is announced immediately, so derive it during render
  // instead of syncing it into state from an effect.
  const message = isRoot
    ? `Navigated to ${document.title || ''} page.`
    : announcedMessage;

  return (
    <span
      ref={routeMessageRef}
      className='visually-hidden'
      role='status'
      aria-live='polite'
    >
      {message}
    </span>
  );
};

export default RouteAccessibleNavigation;
