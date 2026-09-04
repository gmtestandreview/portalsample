import type { ReactNode } from 'react';

/**
 * BodyText Component
 *
 * A simple component for rendering body text with optional custom styling. 
 * Provides a consistent structure for body text elements and allows for additional CSS classes to be applied via the `className` prop.
 * 
 * @param {BodyTextProps} props - Component props
 * @returns {JSX.Element} Rendered body text 
 * 
 */

export interface BodyTextProps {
    children : ReactNode;
    className?: string;
}

const BodyText = ({
    children,
    className = '', // default props
} : BodyTextProps) => <p className={`body-text ${className}`}>{children}</p>;

export default BodyText;
