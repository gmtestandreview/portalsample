import { useEffect, useState } from 'react';

const getLocalToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const useStableToday = () => {
  const [today, setToday] = useState(getLocalToday);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);

    const timeoutId = globalThis.setTimeout(() => {
      setToday(getLocalToday());
    }, nextMidnight.getTime() - now.getTime());

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [today]);

  return today;
};
