import type React from 'react';
import type { AnchorHTMLAttributes, ComponentProps } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  Link as AriaLink,
} from 'react-aria-components/Link';
import { getButtonClassName } from '../buttonClassName';

type LinkButtonProps =
  Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'className' | 'children'> & {
      children: React.ReactNode;
      to?: string;
      as: 'a' | 'Link';
      className?: string;
      href?: string;
      variant?: string;
      target?: React.HTMLAttributeAnchorTarget;
  };

const LinkButton = (props: LinkButtonProps) => {
    const {
        target,
        variant,
        className,
        href,
        to,
        as,
        onClick,
        ...rest
    } = props;

    const hrefValue = as === 'a' ? href : to;
    const resolvedClassName = getButtonClassName(variant || 'nmi-primary', className);
    const linkProps = rest as ComponentProps<typeof AriaLink>;

    return (
        <AriaLink
            {...linkProps}
            href={hrefValue}
            target={target}
            onClick={onClick as ComponentProps<typeof AriaLink>['onClick']}
            className={resolvedClassName}
            render={as === 'Link'
                ? (renderProps) => {
                    if (!('href' in renderProps)) {
                        return <span {...renderProps} />;
                    }

                    return <RouterLink {...renderProps} to={renderProps.href} />;
                }
                : undefined}
        />
    );
};

export default LinkButton;
