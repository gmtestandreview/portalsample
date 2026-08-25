import {
  Button as AriaButton,
} from 'react-aria-components/Button';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import { getButtonClassName } from '../buttonClassName';

/**
 * PrimaryButtonProps
 *
 * Type definitions for the PrimaryButton component. 
 * Represents the mode/theme for the PrimaryButton component. 
 * Provides a consistent structure for button props, including optional class names, mode, and size.
 * 
 * @typedef {Object} PrimaryButtonProps
 * @property {string} [className] - Additional CSS classes for the button element
 * @property {'dark' | 'light'} [mode] - Button theme mode. 'light' applies standard blue styling; 'dark' applies darker blue. Defaults to 'light'.
 * @property {string} [size] - Optional size for the button (e.g., 'small', 'large')
 * @property {boolean} [disabled] - Whether the button is disabled  
 * @typedef {'light' | 'dark'} ButtonMode 
 * 
 */

type PrimaryButtonProps =
  Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className'> & {
      className?: string;
      /** Button theme mode. 'light' applies standard blue styling; 'dark' applies darker blue. Defaults to 'light'. */
      mode?: 'dark' | 'light';
      size?: string;
  };

/**
 * PrimaryButton Component
 *
 * A prominent call-to-action button following the NMI design system.
 * Built on Bootstrap Button with NMI-specific color variants.
 *
 * Use PrimaryButton for main actions like "Submit", "Continue", or "Save".
 *
 * @param {PrimaryButtonProps} props - Component props
 * @param {React.ReactNode} props.children - Button label text
 * @param {'light' | 'dark'} [props.mode='light'] - Button color theme
 * @param {boolean} [props.disabled] - Disable the button
 * @param {Function} [props.onClick] - Click event handler
 *
 * @example
 * // Standard primary button
 * <PrimaryButton onClick={handleSubmit}>
 *   Submit Form
 * </PrimaryButton>
 *
 * @example
 * // Dark mode button
 * <PrimaryButton mode="dark" disabled={isLoading}>
 *   {isLoading ? 'Processing...' : 'Continue'}
 * </PrimaryButton>
 *
 * @returns {JSX.Element} Rendered button element
 */
const PrimaryButton = ({
    mode,
    className,
    disabled,
    ...props
}: PrimaryButtonProps) => {
    const buttonProps = props as ComponentProps<typeof AriaButton>;

    return (
        <AriaButton
            {...buttonProps}
            isDisabled={disabled}
            className={getButtonClassName(mode === 'dark' ? 'primary-dark' : 'primary', className)}
        />
    );
};

export default PrimaryButton;
