'use client';
import {
  SwitchButton,
  SwitchField,
  type SwitchFieldProps,
  type ValidationResult,
} from 'react-aria-components/Switch';
import './Switch.css';
import type { ReactNode } from 'react';
import { Description, FieldError } from '../../forms/AriaForm/Form.tsx';

export interface SwitchProps extends Omit<SwitchFieldProps, 'children'> {
  children: ReactNode;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
}

export function Switch({
  children,
  description,
  errorMessage,
  ...props
}: Readonly<SwitchProps>) {
  return (
    <SwitchField {...props}>
      <SwitchButton>
        {({ isSelected, isDisabled }) => (
          <>
            <div className='track indicator'>
              <div
                data-disabled={isDisabled || undefined}
                className={isSelected ? 'handle' : 'handle indicator'}
              />
            </div>
            {children}
          </>
        )}
      </SwitchButton>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </SwitchField>
  );
}
