import type { ReactNode } from 'react';
import { Heading, Text } from '../AriaComponents/Content';

interface AlertMessageProps {
  readonly title: string;
  readonly children: ReactNode;
  readonly tone?: 'info' | 'success' | 'warning';
}

export function AlertMessage({ title, children, tone = 'info' }: Readonly<AlertMessageProps>) {
  return (
    <section aria-live="polite" className="portal-alert" data-tone={tone} role="status">
      <div className="portal-alert__body">
        <Heading aria-level={2} className="portal-alert__title" level={2}>
          {title}
        </Heading>
        <Text className="portal-alert__text">{children}</Text>
      </div>
    </section>
  );
}
