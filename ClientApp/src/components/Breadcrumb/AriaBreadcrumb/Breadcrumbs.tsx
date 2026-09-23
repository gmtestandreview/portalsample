'use client';
import {
  type BreadcrumbProps,
  type BreadcrumbsProps,
  Link,
  type LinkProps,
  Breadcrumb as RacBreadcrumb,
  Breadcrumbs as RacBreadcrumbs,
} from 'react-aria-components/Breadcrumbs';
import { ChevronRight } from '../../react-aria-evaluation/primitives/NmiIcon.tsx';
import './Breadcrumbs.css';

export function Breadcrumbs<T>(props: Readonly<BreadcrumbsProps<T>>) {
  return <RacBreadcrumbs {...props} />;
}

export function Breadcrumb(
  props: Readonly<BreadcrumbProps & Omit<LinkProps, 'className'>>
) {
  return (
    <RacBreadcrumb {...props}>
      {({ isCurrent }) => (
        <>
          <Link {...props} />
          {!isCurrent && <ChevronRight size={14} />}
        </>
      )}
    </RacBreadcrumb>
  );
}
