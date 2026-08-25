import {
  Button as AriaButton,
} from 'react-aria-components/Button';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import { getButtonClassName } from '../buttonClassName';

export type PrimaryButtonProps =
  Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className'> & {
      /** Additional CSS classes appended to the NMI primary-button styles. */
      className?: string;
      /** Uses the standard treatment on light surfaces or the alternate treatment on dark surfaces. */
      mode?: 'dark' | 'light';
      /** Optional sizing value forwarded to the rendered button. */
      size?: string;
  };

/**
 * PrimaryButton Component
 *
 * The prominent call-to-action used for the main action on a page or dialog,
 * such as Submit, Continue, or Save. It preserves native button attributes and
 * React Aria keyboard behaviour while applying the NMI primary-button style.
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
