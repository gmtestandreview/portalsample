import type React from 'react';
import type { AnchorHTMLAttributes, ComponentProps } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  Link as AriaLink,
} from 'react-aria-components/Link';
import { getButtonClassName } from '../buttonClassName';

/**
 * LinkButton Component
 *
 * A versatile button component that can render as either an anchor tag or a React Router Link.
 * It provides a consistent structure for link buttons and allows for additional CSS classes to be applied via the `className` prop.
 * 
 * @param {LinkButtonProps} props - Component props
 * @param {string} [props.href] - The URL for the anchor tag (if `as` is 'a')
 * @param {string} [props.to] - The path for the React Router Link (if `as` is 'Link')
 * @param {'a' | 'Link'} props.as - Determines whether to render as an anchor tag or a React Router Link
 * @param {string} [props.className] - Additional CSS classes for the link element
 * @param {string} [props.variant] - Variant of the button for styling purposes
 * @param {React.ReactNode} props.children - The content of the button
 * @param {React.HTMLAttributeAnchorTarget} [props.target] - Specifies where to open the linked document
 * @param {function} [props.onClick] - Click event handler for the button
 * @returns {JSX.Element} Rendered link button
 */

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
