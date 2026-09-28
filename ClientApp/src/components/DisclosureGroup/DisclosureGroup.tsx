'use client';
import {
  DisclosureGroup as RACDisclosureGroup,
  type DisclosureGroupProps,
} from 'react-aria-components/DisclosureGroup';
import './DisclosureGroup.css';

export function DisclosureGroup(props: Readonly<DisclosureGroupProps>) {
  return <RACDisclosureGroup {...props} />;
}
