import type { ReactNode } from 'react';

export interface GoogleAnalyticsProps {
    children?: ReactNode;
    anonymiseIp?: boolean;
    testMode?: boolean;
    sendPageView?: boolean;
}
