import { Button, Form, InputGroup } from 'react-bootstrap';
import { useRef, useState } from 'react';
import type { SearchBoxProps } from './searchBoxProps';

const SearchBox = (props: SearchBoxProps) => {
    const {
        containerClassName = '', // default props
        className = '', // default props
        onSearchSubmit,
        initialSearchValue = '',
        placeholder = '',
    } = props;

    const [searchValue, setSearchValue] = useState(initialSearchValue);
    const inputRef = useRef<HTMLInputElement>(null);

    function handleSearchClear(_e?: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
        setSearchValue('');
        inputRef.current?.focus();
        onSearchSubmit(undefined);
    }

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value.length === 0) {
            handleSearchClear();
            return;
        }
        setSearchValue(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onSearchSubmit) {
            e.preventDefault();
            onSearchSubmit(searchValue);
        }
    };

    return (
        <Form.Group id='dash-search' className={`form-field-container ${containerClassName} ${searchValue ? 'active' : ''}`}>
            <Form.Label htmlFor='dash-search-input' className='visually-hidden'>
                Search manufacturer, model, serial
            </Form.Label>
                <InputGroup className={className}>
                    <InputGroup.Text id='search-icon' className='border-0'>
                    <i className='icon-search text-primary' aria-hidden='true' />
                </InputGroup.Text>
                <Form.Control
                    ref={inputRef}
                    id='dash-search-input'
                    type='text'
                    className='-mb-0 px-0 outline-0 border-0'
                    placeholder={placeholder}
                    aria-label='Type keyword and press Enter key to search.'
                    value={searchValue || ''}
                    onChange={handleSearchInputChange}
                    onKeyDown={handleKeyDown}
                    autoComplete='off'
                    data-pii='SearchBox'
                />
                {searchValue && (
                    <InputGroup.Text className='p-0 border-0'>
                        <Button
                            data-testid='clear-search-button'
                            onClick={(e) => handleSearchClear(e)}
                            variant='tertiary'
                            className='ms-md-auto'
                        >
                            <i className='icon-close me-1' aria-hidden='true' />
                            <span className='visually-hidden'>Clear keyword</span>
                        </Button>
                    </InputGroup.Text>
                )}
            </InputGroup>
        </Form.Group>
    );
};

export default SearchBox;
