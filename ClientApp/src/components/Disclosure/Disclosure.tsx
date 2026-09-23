'use client';
import { Button } from 'react-aria-components/Button';
import {
  Disclosure as AriaDisclosure,
  DisclosurePanel as AriaDisclosurePanel,
  type DisclosurePanelProps,
  type DisclosureProps,
  type HeadingProps,
} from 'react-aria-components/Disclosure';
import { Heading } from '../react-aria-evaluation/primitives/Content.tsx';
import { ChevronRight } from '../react-aria-evaluation/primitives/NmiIcon.tsx';
import './Disclosure.css';

export function Disclosure(props: Readonly<DisclosureProps>) {
  return <AriaDisclosure {...props} />;
}

export function DisclosureHeader({
  children,
  ...props
}: Readonly<HeadingProps>) {
  return (
    <Heading {...props}>
      <Button slot='trigger' className='disclosure-button'>
        <ChevronRight size={16} />
        <span>{children}</span>
      </Button>
    </Heading>
  );
}

export function DisclosurePanel(props: Readonly<DisclosurePanelProps>) {
  return (
    <AriaDisclosurePanel {...props}>
      <div>{props.children}</div>
    </AriaDisclosurePanel>
  );
}
