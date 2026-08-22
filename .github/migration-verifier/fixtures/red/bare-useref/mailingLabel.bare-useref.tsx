import { MutableRefObject, useRef } from 'react';

const Example = () => {
    const printAreaRef = useRef() as MutableRefObject<HTMLDivElement>;
    return <div ref={printAreaRef} />;
};
