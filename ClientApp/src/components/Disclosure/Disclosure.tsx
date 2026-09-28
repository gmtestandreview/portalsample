'use client';
import { Button } from 'react-aria-components/Button';
import {
  Disclosure as AriaDisclosure,
  DisclosurePanel as AriaDisclosurePanel,
  type DisclosureProps,
  type DisclosurePanelProps,
  type HeadingProps,
} from 'react-aria-components/Disclosure';
import { Heading } from '../AriaComponents/Content';
import { ChevronRight } from '../AriaComponents/NmiIcon';
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
