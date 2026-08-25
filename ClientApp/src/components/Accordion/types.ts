import type { ReactNode } from 'react';

/**
 * types.ts
 *
 * Type definitions for the CustomAccordion and CustomAccordionBody components.
 * These interfaces define the props that can be passed to the accordion components, including identifiers, class names, and content.
 * 
 * @module AccordionTypes
 * @author Greg M
 * @version 1.0.0
 * @since 2024-06-15
 * 
 */

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
