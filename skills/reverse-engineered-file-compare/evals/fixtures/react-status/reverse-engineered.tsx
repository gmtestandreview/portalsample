import { useEffect, useState } from 'react';

type Status = 'idle' | 'loading' | 'ready' | 'failed';
export interface StatusProps {
  loadStatus: () => Promise<'ready' | 'failed'>;
}
const LABELS = {
  idle: 'Idle',
  loading: 'Loading',
  ready: 'Ready',
  failed: 'Failed',
} satisfies Record<Status, string>;

export function StatusPanel({ loadStatus }: StatusProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [request, setRequest] = useState(0);

  useEffect(() => {
    if (request === 0) return;
    setStatus('loading');
    void Promise.resolve()
      .then(loadStatus)
      .then(setStatus, () => setStatus('failed'));
  }, [loadStatus, request]);

  return (
    <section>
      <button type='button' onClick={() => setRequest((value) => value + 1)}>
        Refresh
      </button>
      <p>{LABELS[status]}</p>
    </section>
  );
}
