import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useField } from 'formik';
import { Form, ListGroup } from 'react-bootstrap';
import TextInput from '../TextInput';
import type { GetAccountValuesDto } from '../../../api/web-api-client';
import { getFilteredSuggestions } from './suggestionUtils';

export interface OrganisationNameLookupProps {
    id?: string;
    name: string;
    label?: string;
    placeholder?: string;
    inlineHelpTitle?: string;
    inlineHelp?: string | ReactNode;
    optionsFieldName?: string;
    parentName?: string;
    parentOptionsName?: string;
    matchType?: 'startsWith' | 'includes' | 'endsWith';
    maxResults?: number;
}

const OrganisationNameLookup = (
    props: OrganisationNameLookupProps,
) => {
    const {
        id,
        name,
        label,
        placeholder,
        inlineHelpTitle,
        inlineHelp,
        optionsFieldName,
        parentName,
        parentOptionsName,
        matchType = 'includes', // startsWith | includes | endsWith
        maxResults = 30,
    } = props;

    const [_field, _meta, _fieldHelper] = useField(name);
    const [_orgNameOptions] = useField<GetAccountValuesDto>('orgNameOptions');
    const [_parentField] = useField(parentName ?? name);

    const [inputValue, setInputValue] = useState('');
    const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const helpId = inlineHelp ? `help-${id || name}` : undefined;

    // Debounced filtering
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (!inputValue.trim()) {
                // Returning the previous array when it is already empty lets React bail out
                // of the update. A fresh `[]` is never referentially equal, so this timer
                // committed an identical render once per instance on every mount - and in
                // Storybook it committed after the owning story had ended.
                setFilteredSuggestions((prev) => (prev.length === 0 ? prev : []));
                return;
            }
            const options = (_orgNameOptions.value || []) as any[];

            if (inputValue.length >= 2) {
                if (optionsFieldName === undefined) {
                    setFilteredSuggestions([]);
                    setShowSuggestions(false);
                    return;
                }

                if (parentName !== undefined && _parentField.value !== undefined) {
                    const filteredParentOptions = getFilteredSuggestions({
                        inputValue,
                        matchType,
                        maxResults,
                        options,
                        optionsFieldName,
                        parentOptionsName,
                        parentValue: String(_parentField.value),
                    });
                    setFilteredSuggestions(filteredParentOptions);
                    setShowSuggestions(filteredParentOptions.length > 0);
                } else {
                    const filteredOptions = getFilteredSuggestions({
                        inputValue,
                        matchType,
                        maxResults,
                        options,
                        optionsFieldName,
                    });
                    setFilteredSuggestions(filteredOptions);
                    setShowSuggestions(filteredOptions.length > 0);
                }
            } else {
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [
        inputValue,
        _orgNameOptions.value,
        _parentField.value,
        matchType,
        maxResults,
        optionsFieldName,
        parentName,
        parentOptionsName,
    ]);

    // Auto-scroll to active item
    useEffect(() => {
        if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
            itemRefs.current[activeIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [activeIndex]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current && !containerRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (value: string, callback?: () => void) => {
        _fieldHelper.setValue(value);
        _fieldHelper.setTouched(true);
        setShowSuggestions(false);
        if (typeof callback === 'function') {
            callback();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || filteredSuggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => (prev + 1) % filteredSuggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => (
                prev <= 0 ? filteredSuggestions.length - 1 : prev - 1
            ));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < filteredSuggestions.length) {
                handleSelect(filteredSuggestions[activeIndex]);
            } else {
                handleSelect(inputValue);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    return (
        <fieldset className='d-block' aria-live='polite' role='group'>
            <legend className='visually-hidden'>
                {'Enter or find a '}
                {label}
            </legend>
            <Form.Group className='form-field-container' ref={containerRef}>
                <div
                    id={`${name}-announcement`}
                    className='visually-hidden'
                    aria-live='polite'
                >
                    {
                        showSuggestions
                            ? `${filteredSuggestions.length} suggestions displayed. To navigate, use up and down arrow keys.`
                            : ''
                    }
                </div>
                <Form.Group
                    controlId={id}
                    className='form-field-container combobox mb-2'
                >
                    <TextInput
                        id={name}
                        name={name}
                        label={label ?? 'Organisation name'}
                        placeholder={placeholder ?? ''}
                        inlineHelpTitle={inlineHelpTitle ?? ''}
                        inlineHelp={inlineHelp ?? ''}
                        onChange={(e: any) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        role='combobox'
                        autoComplete='off'
                        aria-expanded={showSuggestions ? 'true' : 'false'}
                        aria-haspopup='listbox'
                        aria-controls={`${name}-options`}
                        aria-activedescendant={activeIndex >= 0 ? `${name}-option-${activeIndex}` : undefined}
                        aria-autocomplete='both'
                        containerClassName='mb-0'
                        className='search-box form-field'
                        aria-describedby={
                            _meta.touched && _meta.error
                                ? `${id || name}-validation-msg`
                                : (helpId || undefined)
                        }
                    />

                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div id={`${name}-autocomplete`} className='suggestions-container' aria-live='polite' aria-busy='false'>
                            <ListGroup
                                id={`${name}-options`}
                                as='ul'
                                role='listbox'
                                className='suggestion-list show'
                                aria-label='Suggested options'
                            >
                                {/*
                                  * A listbox may only own `option` and `group` children, so
                                  * this heading row is presentational: it is removed from the
                                  * accessibility tree and the list is announced through the
                                  * `aria-label` above instead. `aria-readonly` is not an
                                  * allowed attribute here and carried no meaning.
                                  */}
                                <ListGroup.Item as='li' role='presentation' className='suggestion-option auto-suggestions mt-0 border-0 small text-muted'>
                                    Did you mean?
                                </ListGroup.Item>
                                {filteredSuggestions.map((item, index) => (
                                    <ListGroup.Item
                                        key={item}
                                        id={`${name}-option-${index}`}
                                        as='li'
                                        role='option'
                                        aria-label={`${item} (${index + 1} of ${filteredSuggestions.length})`}
                                        aria-selected={index === activeIndex}
                                        action
                                        className={`suggestion-option auto-suggestions mt-0 border-0 ${index === activeIndex ? 'highlighted' : ''}`}
                                        onClick={() => {
                                            handleSelect(item, () => setActiveIndex(index));
                                        }}
                                        ref={(el: any) => {
                                            (itemRefs.current[index] = el);
                                        }}
                                    >
                                        <span aria-hidden='true'>{item}</span>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </div>
                    )}
                </Form.Group>
            </Form.Group>
        </fieldset>
    );
};

export default OrganisationNameLookup;
