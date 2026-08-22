import { Dropdown } from 'react-bootstrap';
import { Link } from 'react-router';

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
