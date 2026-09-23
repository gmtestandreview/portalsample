'use client';
import {
  type DisclosureGroupProps,
  DisclosureGroup as RacDisclosureGroup,
} from 'react-aria-components/DisclosureGroup';
import './DisclosureGroup.css';

export function DisclosureGroup(props: DisclosureGroupProps) {
  return <RacDisclosureGroup {...props} />;
}
