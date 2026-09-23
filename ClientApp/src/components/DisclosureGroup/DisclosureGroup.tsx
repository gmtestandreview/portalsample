'use client';
import {
  type DisclosureGroupProps,
  DisclosureGroup as RacDisclosureGroup,
} from 'react-aria-components/DisclosureGroup';
import './DisclosureGroup.css';

export function DisclosureGroup(props: Readonly<DisclosureGroupProps>) {
  return <RacDisclosureGroup {...props} />;
}
