import { Link as RouterLink } from 'react-router';
import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs,
} from 'react-aria-components/Breadcrumbs';
import { Link as AriaLink } from 'react-aria-components/Link';

/**
 * CustomBreadcrumb Component
 *
 * A breadcrumb navigation component that uses ARIA attributes for accessibility.
 * It displays a list of breadcrumb items, where each item can be a link or the current page. 
 * provides a consistent structure for breadcrumb navigation and ensures proper ARIA roles and properties are applied.
 * 
 * @param {CustomBreadcrumbProps} props - Component props
 * @returns {JSX.Element | null} Rendered breadcrumb navigation or null if no breadcrumbs are provided
 * 
 */

export interface CustomBreadcrumbItem {
  to?: string;
  text: string;
}

export interface CustomBreadcrumbProps {
  breadcrumbs: CustomBreadcrumbItem[];
  containerClassName?: string;
  ariaLabel?: string;
}

const CustomBreadcrumb = ({
  breadcrumbs,
  containerClassName = '',
  ariaLabel = 'Breadcrumb',
}: CustomBreadcrumbProps) => {
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label={ariaLabel} className={containerClassName}>
      <AriaBreadcrumbs className="breadcrumb custom-breadcrumb py-2">
        {breadcrumbs.map((breadcrumbItem, index) => {
          const isLastItem = index === breadcrumbs.length - 1;
          const key = `${breadcrumbItem.to ?? 'current'}-${breadcrumbItem.text}-${index}`;

          if (!isLastItem && !breadcrumbItem.to) {
            throw new Error(
              `Breadcrumb item "${breadcrumbItem.text}" must include "to" because it is not the current page.`,
            );
          }

          return (
            <AriaBreadcrumb
              key={key}
              className={[
                'breadcrumb-item',
                'custom-breadcrumb__item',
                isLastItem
                  ? 'custom-breadcrumb__item--current active'
                  : 'custom-breadcrumb__item--link with-link',
              ].join(' ')}
            >
              {isLastItem
                ? (
                    <span aria-current="page">
                      {breadcrumbItem.text}
                    </span>
                  )
                : (
                    <AriaLink
                      href={breadcrumbItem.to}
                      render={(props) => {
                        if (!('href' in props)) {
                          return <span {...props} />;
                        }

                        return <RouterLink {...props} to={props.href} />;
                      }}
                    >
                      {breadcrumbItem.text}
                    </AriaLink>
                )}
            </AriaBreadcrumb>
          );
        })}
      </AriaBreadcrumbs>
    </nav>
  );
};

export default CustomBreadcrumb;
