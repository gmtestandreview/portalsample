'use client';
import { Button, type ButtonProps } from 'react-aria-components/Button';
import {
  type FieldErrorProps,
  FieldError as RacFieldError,
} from 'react-aria-components/FieldError';
import { type FormProps, Form as RacForm } from 'react-aria-components/Form';
import {
  type LabelProps,
  Label as RacLabel,
} from 'react-aria-components/Label';
import type { TextProps } from 'react-aria-components/Text';
import './Form.css';
import { Text } from '../../react-aria-evaluation/primitives/Content.tsx';

export function Form(props: Readonly<FormProps>) {
  return <RacForm {...props} />;
}

export function Label(props: Readonly<LabelProps>) {
  return <RacLabel {...props} />;
}

export function FieldError(props: Readonly<FieldErrorProps>) {
  return <RacFieldError {...props} />;
}

export function Description(props: Readonly<TextProps>) {
  return <Text slot='description' className='field-description' {...props} />;
}

export function FieldButton(props: Readonly<ButtonProps>) {
  return <Button {...props} className='field-Button' />;
}
