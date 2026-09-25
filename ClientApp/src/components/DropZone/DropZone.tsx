'use client';
import { type DropZoneProps, DropZone as RACDropZone } from 'react-aria-components/DropZone';
import './DropZone.css';

export function DropZone(props: Readonly<DropZoneProps>) {
  return <RACDropZone {...props} />;
}

export { Text } from 'react-aria-components/DropZone';
