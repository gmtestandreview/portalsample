import type { ReactNode } from 'react';

export interface HeaderIntroTextProps {
    children : ReactNode;
    className?: string;
}

const HeaderIntroText = ({
    children,
    className = '', // default props
} : HeaderIntroTextProps) => (
    <p className={`header-intro-text ${className}`}>{children}</p>
);

export default HeaderIntroText;
