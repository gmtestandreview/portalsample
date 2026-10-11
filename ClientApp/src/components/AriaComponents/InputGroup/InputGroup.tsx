'use client';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { Group, type GroupProps } from 'react-aria-components/Group';
import { InputContext } from 'react-aria-components/Input';
import { Label } from '../Form/Form';
import { useId } from 'react';
import './InputGroup.css';

interface InputGroupProps extends GroupProps {
  label?: string;
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
          const inputContextValue = { disabled: renderProps.isDisabled };

          return (
            <InputContext.Provider value={inputContextValue}>
              {children}
            </InputContext.Provider>
          );
        })}
      </Group>
    </div>
  );
}
