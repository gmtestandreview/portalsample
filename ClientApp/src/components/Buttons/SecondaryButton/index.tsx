import {
  Button as AriaButton,
} from 'react-aria-components/Button';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import { getButtonClassName } from '../buttonClassName';

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
