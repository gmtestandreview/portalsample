import { isFunction, isString } from 'lodash';
import type { MouseEventHandler, ReactNode } from 'react';
import PrimaryButton from '../../Buttons/PrimaryButton';

export type IntentButtonChildren =
  string | ((onClick: MouseEventHandler<HTMLButtonElement>) => ReactNode);

interface IntentButtonProps {
  children?: IntentButtonChildren | undefined;
  onClick: MouseEventHandler<HTMLButtonElement>;
  testId: string;
  label: string;
  className: string;
  mode?: 'dark' | 'light';
}

/**
 * Presentation shared by the save and submit controls of every form shell:
 * a default primary button, or the caller's render prop given the click handler.
 */
const IntentButton = ({
  children,
  onClick,
  testId,
  label,
  className,
  mode,
}: Readonly<IntentButtonProps>) => {
  if (children === undefined || isString(children) || !isFunction(children)) {
    return (
      <PrimaryButton
        data-testid={testId}
        onClick={onClick}
        className={className}
        {...(mode === undefined ? {} : { mode })}
      >
        {children || label}
      </PrimaryButton>
    );
  }

  return <>{children(onClick)}</>;
};

export default IntentButton;
