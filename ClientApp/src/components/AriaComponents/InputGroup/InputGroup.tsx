'use client';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { Group, type GroupProps } from 'react-aria-components/Group';
import { InputContext } from 'react-aria-components/Input';
import { Label } from '../Form/Form';
import { type ReactNode, useId, useMemo } from 'react';
import './InputGroup.css';

interface InputGroupProps extends GroupProps {
  label?: string;
}

function InputContextProvider({
  disabled,
  children,
}: Readonly<{ disabled: boolean; children: ReactNode }>) {
  const inputContextValue = useMemo(() => ({ disabled }), [disabled]);

  return (
    <InputContext.Provider value={inputContextValue}>
      {children}
    </InputContext.Provider>
  );
}

export function InputGroup(props: Readonly<InputGroupProps>) {
  const id = useId();
  return (
    <div className='input-group'>
      {props.label && (
        <Label elementType='span' id={id}>
          {props.label}
        </Label>
      )}
      <Group {...props} aria-labelledby={id} className='react-aria-Group inset'>
        {composeRenderProps(props.children, (children, renderProps) => {
          return (
            <InputContextProvider disabled={renderProps.isDisabled}>
              {children}
            </InputContextProvider>
          );
        })}
      </Group>
    </div>
  );
}
