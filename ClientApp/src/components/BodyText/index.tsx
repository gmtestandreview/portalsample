import type { ReactNode } from 'react';

export interface BodyTextProps {
    children : ReactNode;
    className?: string;
}

const BodyText = ({
    children,
    className = '', // default props
} : BodyTextProps) => <p className={`body-text ${className}`}>{children}</p>;

export default BodyText;
