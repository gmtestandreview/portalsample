import { useEffect, useState } from 'react';

type Status = 'idle' | 'loading' | 'ready' | 'failed';
export interface StatusProps {
  loadStatus: () => Promise<'ready' | 'failed'>;
}

export function StatusPanel({ loadStatus }: StatusProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [request, setRequest] = useState(0);

  useEffect(() => {
    if (request === 0) return;
    let current = true;
    setStatus('loading');
    void Promise.resolve()
      .then(loadStatus)
      .then(
        (next) => {
          if (current) setStatus(next);
        },
        () => {
          if (current) setStatus('failed');
        },
      );
    return () => {
      current = false;
    };
  }, [loadStatus, request]);

  const label =
    status === 'idle'
      ? 'Idle'
      : status === 'loading'
        ? 'Loading'
        : status === 'ready'
          ? 'Ready'
          : 'Failed';
  return (
    <section>
      <button type='button' onClick={() => setRequest((value) => value + 1)}>
        Refresh
      </button>
      <p role='status' aria-live='polite'>
        {label}
      </p>
    </section>
  );
}
