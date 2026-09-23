'use client';
import {
  Separator as RacSeparator,
  type SeparatorProps,
} from 'react-aria-components/Separator';
import './Separator.css';

export function Separator(props: Readonly<SeparatorProps>) {
  return <RacSeparator {...props} />;
}
