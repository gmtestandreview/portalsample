'use client';
import { type LinkProps, Link as RacLink } from 'react-aria-components/Link';
import './Link.css';

export function Link(props: Readonly<LinkProps>) {
  return <RacLink {...props} />;
}
