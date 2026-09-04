import { Dropdown } from 'react-bootstrap';
import { Link } from 'react-router';

/**
 * Actions Component
 *
 * A dropdown menu component for displaying a list of actions.
 * Can be rendered as a text button or an icon button.
 *
 * @param {ActionsProps} props - Component props
 * @param {string} [props.id] - Unique identifier for the dropdown
 * @param {'icon'} [props.as] - Render as an icon button if specified
 * @param {DropdownActionItem[]} props.dropDownActions - List of action items to display in the dropdown
 * @param {(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void} [props.onItemClick] - Callback for item click events
 * @param {string} [props.variant='flat'] - Bootstrap variant for the dropdown toggle button
 * @param {string} [props.containerClassName] - Additional CSS classes for the dropdown container
 * @param {string} [props.className] - Additional CSS classes for the dropdown toggle button
 * @param {'start' | 'end'} [props.align] - Alignment of the dropdown menu
 * @param {string} [props.buttonTitle='Actions'] - Text for the dropdown toggle button
 * @param {string} [props.buttonAriaTitle=''] - Additional accessible name for the button
 *
 * @example
 * <Actions
 *   id="request-actions"
 *   dropDownActions={[
 *     { action: 'view', text: 'View details', route: '/quotation/Q-2024-000456' },
 *     { action: 'copy', text: 'Request recalibration' },
 *     { action: 'delete', text: 'Delete draft' },
 *   ]}
 *   onItemClick={(e) => console.log('Action clicked:', e.currentTarget.textContent)}
 * />
 *
 * @returns {JSX.Element} Rendered actions dropdown component
 */

export interface DropdownActionItem {
    action: string;
    text: string;
    route?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

interface ActionsProps {
    id?: string;
    as?: 'icon';
    dropDownActions: DropdownActionItem[];
    onItemClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    variant?: string;
    containerClassName?: string;
    className?: string;
    align?: 'start' | 'end';
    buttonTitle?: string;
    buttonAriaTitle?: string;
}

const Actions = (props: ActionsProps) => {
    const {
        id,
        as,
        dropDownActions,
        onItemClick,
        variant = 'flat',
        containerClassName = '',
        className = '',
        align,
        buttonTitle = 'Actions',
        buttonAriaTitle = '',
    } = props;

    const triggerAccessibleName = [buttonTitle, buttonAriaTitle].filter(Boolean).join(' ');

    const createDropdownItem = (itemAction: DropdownActionItem, index: number) => {
        if (itemAction.route) {
            return (
                <Dropdown.Item
                    key={`actions-dd-${id}-${index}`}
                    as={Link}
                    eventKey={index}
                    to={itemAction.route}
                    onClick={itemAction.onClick || onItemClick}
                >
                    {itemAction.text}
                </Dropdown.Item>
            );
        }

        return (
            <Dropdown.Item
                key={`actions-dd-${id}-${index}`}
                as='button'
                eventKey={index}
                onClick={itemAction.onClick || onItemClick}
            >
                {itemAction.text}
            </Dropdown.Item>
        );
    };

    return (
        <Dropdown
            align={align}
            className={`actions-menu ${containerClassName}`}
        >
            <Dropdown.Toggle
                id={`actions-dropdown-button-${id}`}
                variant={variant}
                className={`${as === 'icon' ? 'dropdown-toggle-none actions-icon' : ''} ${className}`}
                aria-label={triggerAccessibleName}
            >
                {as === 'icon'
                    ? (
                        <>
                            <i className='icon-ellipsis' aria-hidden='true' />
                            <span className='visually-hidden'>{buttonTitle}</span>
                            <span className='visually-hidden'>{buttonAriaTitle}</span>
                        </>
                    )
                    : (
                        <>
                            <span>{buttonTitle}</span>
                            <span className='visually-hidden'>{buttonAriaTitle}</span>
                        </>
                    )}
            </Dropdown.Toggle>
            <Dropdown.Menu variant='dark'>
                {dropDownActions.map((action, index) => createDropdownItem(action, index))}
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default Actions;
