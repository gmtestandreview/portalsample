import {
  Heading as AriaHeading,
  type HeadingProps,
} from 'react-aria-components/Heading';
import { Text as AriaText, type TextProps } from 'react-aria-components/Text';
import './Content.css';

export function Heading(props: Readonly<HeadingProps>) {
  return <AriaHeading {...props} />;
}

export function Text(props: Readonly<TextProps>) {
  return <AriaText {...props} />;
}
