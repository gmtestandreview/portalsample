import type { ReactNode } from 'react';

export interface CustomAccordionProps {
    id?: string;
    containerClassName?: string;
    children?: ReactNode;
}

export interface CustomAccordionBodyProps {
    id?: string;
    name: string;
    namePartTwo?: ReactNode;
    namePartTwoClassName?: string;
    namePartThree?: ReactNode;
    namePartThreeClassName?: string;
    nameRHS?: ReactNode;
    eventKey: string;
    className?: string;
    children?: ReactNode;
}
