'use client';
import {
  Dialog as RACDialog,
  DialogTrigger as RACDialogTrigger,
  type DialogProps,
  type DialogTriggerProps,
} from 'react-aria-components/Dialog';
import './Dialog.css';

export function Dialog(props: Readonly<DialogProps>) {
  return <RACDialog {...props} />;
}

export function DialogTrigger(props: Readonly<DialogTriggerProps>) {
  return <RACDialogTrigger {...props} />;
}

export { Heading } from 'react-aria-components/Dialog';
