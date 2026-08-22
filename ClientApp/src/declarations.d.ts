declare module '*.svg' {
    import type { FunctionComponent, SVGProps } from 'react';
    const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>;
    const src: string;
    export { ReactComponent };
    export default src;
}

declare module '*.png' {
    const src: string;
    export default src;
}

declare module '*.jpg' {
    const src: string;
    export default src;
}

declare module '*.css';
declare module '*.scss';
