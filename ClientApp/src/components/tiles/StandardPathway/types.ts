import type { ReactNode } from 'react';

export interface StandardPathwayFooterProps {
    linkDescription?: ReactNode;
}

export interface StandardBasePathwayProps extends StandardPathwayFooterProps {
    title: ReactNode;
    bodyText?: ReactNode;
    digitalIdentity?: boolean;
}

export interface StandardInternalPathwayProps extends StandardBasePathwayProps {
    type: 'internal';
    to: string;
}

export interface StandardExternalPathwayProps extends StandardBasePathwayProps {
    type: 'external';
    linkHref: string;
    target?: string;
}

export type StandardPathwayProps = StandardInternalPathwayProps | StandardExternalPathwayProps;
