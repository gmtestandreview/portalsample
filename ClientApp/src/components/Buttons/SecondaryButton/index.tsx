import {
  Button as AriaButton,
} from 'react-aria-components/Button';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import { getButtonClassName } from '../buttonClassName';

/**
 * SecondaryButtonProps
 *
 * Type definitions for the SecondaryButton component.
 * Represents the mode/theme for the SecondaryButton component.
 * Provides a consistent structure for button props, including optional class names. 
 * Props are derived from the standard HTML button attributes, with the addition of an optional `className` for custom styling.
 * 
 * @typedef {Object} SecondaryButtonProps
 * @property {string} [className] - Additional CSS classes for the button element
 * @property {boolean} [disabled] - Whether the button is disabled
 * 
 */

type SecondaryButtonProps =
  Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className'> & {
      className?: string;
  };

const SecondaryButton = ({
    className,
    disabled,
    ...props
}: SecondaryButtonProps) => {
    const buttonProps = props as ComponentProps<typeof AriaButton>;

    return (
        <AriaButton
            {...buttonProps}
            isDisabled={disabled}
            className={getButtonClassName('nmi-secondary', className)}
        />
    );
};

export default SecondaryButton;
