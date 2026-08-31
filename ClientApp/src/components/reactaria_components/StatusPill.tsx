import type { ReactNode } from 'react';

interface StatusPillProps {
  readonly children: ReactNode;
  readonly tone?: 'success' | 'warning' | 'neutral';
}

export function StatusPill({ children, tone = 'neutral' }: Readonly<StatusPillProps>) {
  return (
    <span className="portal-status-pill" data-tone={tone}>
      {children}
    </span>
  );
}
