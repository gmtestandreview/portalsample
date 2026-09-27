'use client';
import { Separator as RACSeparator, type SeparatorProps } from 'react-aria-components/Separator';
import './Separator.css';

export function Separator(props: Readonly<SeparatorProps>) {
  return <RACSeparator {...props} />;
}
