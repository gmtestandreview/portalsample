import type { FunctionComponent, PropsWithChildren } from 'react';
import { Accordion } from 'react-bootstrap';
import type { CustomAccordionBodyProps, CustomAccordionProps } from './types';

/**
 * CustomAccordion Component
 *
 * A collapsible accordion container that manages multiple collapsible sections.
 * Extends Bootstrap's Accordion with NMI-specific styling (wizard-accordion).
 *
 * Use this as a wrapper for CustomAccordionBody items.
 *
 * @param {CustomAccordionProps & PropsWithChildren} props - Component props
 * @param {string} [props.id] - Unique identifier for the accordion container
 * @param {string} [props.containerClassName] - Additional CSS classes for the wrapper div
 * @param {React.ReactNode} props.children - CustomAccordionBody items
 *
 * @example
 * <CustomAccordion id="main-accordion">
 *   <CustomAccordionBody eventKey="0" name="Section 1">
 *     Content goes here
 *   </CustomAccordionBody>
 *   <CustomAccordionBody eventKey="1" name="Section 2">
 *     More content
 *   </CustomAccordionBody>
 * </CustomAccordion>
 *
 * @returns {JSX.Element} Rendered accordion container
 */

export const CustomAccordion: FunctionComponent<CustomAccordionProps> = (props: PropsWithChildren<CustomAccordionProps>) => {
    const {
        id,
        containerClassName,
        children,
    } = props;

    return (
        <div id={id} className={`${containerClassName ?? ''}`}>
            <Accordion defaultActiveKey='0' bsPrefix='wizard-accordion'>
                {children}
            </Accordion>
        </div>
    );
};

/**
 * CustomAccordionBody Component
 *
 * A collapsible accordion item/section containing a header and body.
 * Must be used within a CustomAccordion component.
 *
 * Supports multi-line headers with optional secondary and tertiary text
 * for displaying additional information or status.
 *
 * @param {CustomAccordionBodyProps & PropsWithChildren} props - Component props
 * @param {string} props.eventKey - Unique key for this accordion item (used for open/close state)
 * @param {string} props.name - Primary header text (required)
 * @param {React.ReactNode} [props.namePartTwo] - Secondary header line (optional)
 * @param {string} [props.namePartTwoClassName] - CSS classes for secondary text
 * @param {React.ReactNode} [props.namePartThree] - Tertiary header line (optional, truncated)
 * @param {string} [props.namePartThreeClassName] - CSS classes for tertiary text
 * @param {string} [props.id] - Unique identifier for the item header
 * @param {string} [props.className] - Additional CSS classes for the body content
 * @param {React.ReactNode} props.children - Body content (displayed when expanded)
 *
 * @example
 * // Basic accordion item
 * <CustomAccordionBody eventKey="0" name="Step 1: Enter Details">
 *   Form content here
 * </CustomAccordionBody>
 *
 * @example
 * // With multi-line header
 * <CustomAccordionBody
 *   eventKey="1"
 *   name="Organisation Details"
 *   namePartTwo="Required information"
 *   namePartTwoClassName="text-muted small"
 *   namePartThree="ABN: 00000000000"
 *   namePartThreeClassName="text-secondary"
 * >
 *   Form fields here
 * </CustomAccordionBody>
 *
 * @returns {JSX.Element} Rendered accordion item with header and body
 */

export const CustomAccordionBody: FunctionComponent<CustomAccordionBodyProps> = (props: PropsWithChildren<CustomAccordionBodyProps>) => {
    const {
        id,
        name,
        namePartTwo,
        namePartTwoClassName,
        namePartThree,
        namePartThreeClassName,
        eventKey,
        children,
        className,
    } = props;

    return (
        <Accordion.Item eventKey={eventKey} className='open'>
            <Accordion.Header id={id}>
                <span className='d-block lh-lg'>
                    <span className='d-block acd-title'>{name}</span>
                    {namePartTwo
                        ? (
                            <span className={`d-block ${namePartTwoClassName}`}>
                                {namePartTwo}
                            </span>
                        ) : null}
                    {namePartThree
                        ? (
                            <span className={`d-block fw-normal text-truncate pre-wrap ${namePartThreeClassName}`}>
                                {namePartThree}
                            </span>
                        ) : null}
                </span>
            </Accordion.Header>
            <Accordion.Body className={className}>
                {children}
            </Accordion.Body>
        </Accordion.Item>
    );
};
