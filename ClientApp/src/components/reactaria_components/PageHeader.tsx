import type { ReactNode } from 'react';

interface PageHeaderProps {
  readonly eyebrow?: string;
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: Readonly<PageHeaderProps>) {
  return (
    <header className="portal-page-header">
      <div className="portal-page-header__copy">
        {eyebrow && <p className="portal-kicker">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="portal-page-summary">{description}</p>}
      </div>
      {actions && <div className="portal-button-group">{actions}</div>}
    </header>
  );
}
