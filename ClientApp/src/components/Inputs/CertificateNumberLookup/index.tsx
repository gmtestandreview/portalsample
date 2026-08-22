import {
    useEffect,
    useRef,
    useState,
} from 'react';
import type { ReactNode } from 'react';
import { useField } from 'formik';
import { Form, ListGroup } from 'react-bootstrap';
import TextInput from '../TextInput';
import type { ApplicationAndInstrumentStepDto, LookupResponse } from '../../../api/web-api-client';
import SummaryDisplay from '../../SummaryDisplay';

export interface CertificateNumberLookupProps {
    id?: string;
    name: string;
    idName: string;
    label?: string;
    placeholder?: string;
    inlineHelpTitle?: string;
    inlineHelp?: string | ReactNode;
    optionsFieldName?: string;
    parentName?: string;
    parentOptionsName?: string;
    matchType?: 'startsWith' | 'includes' | 'endsWith';
    maxResults?: number;
    isSummary?: boolean;
}

const CertificateNumberLookup = (
    props: CertificateNumberLookupProps,
) => {
    const {
        id,
        name,
        idName,
        label,
        placeholder,
        inlineHelpTitle,
        inlineHelp,
        optionsFieldName,
        parentName,
        parentOptionsName,
        matchType = 'includes', // startsWith | includes | endsWith
        maxResults = 30,
        isSummary,
    } = props;

    const [_field, _meta, _fieldHelper] = useField(name);
    const [_idField, _idMeta, _idFieldHelper] = useField(idName);
    const [_certNumOptions] = useField<ApplicationAndInstrumentStepDto>('certNameOptions');
    const [_parentField] = useField(parentName ?? name);

    const [inputValue, setInputValue] = useState('');
    const [filteredSuggestions, setFilteredSuggestions] = useState<LookupResponse[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const helpId = inlineHelp ? `help-${id || name}` : undefined;

    // Debounced filtering
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (!inputValue.trim()) {
                setFilteredSuggestions([]);
                return;
            }
            const options = (_certNumOptions.value || [] as LookupResponse[]) as any[];

            if (inputValue.length >= 2) {
                if (parentName !== undefined && _parentField.value !== undefined) {
                    const filteredParentOptions = [...new Set(
                        options
                            .filter((item) => item[parentOptionsName!].toLowerCase()[matchType](_parentField.value.toLowerCase()))
                            .filter((item) => item[optionsFieldName!].toLowerCase()[matchType](inputValue.toLowerCase()))
                            .slice(0, maxResults)
                            .map((item) => item)
                            .sort((x) => x[optionsFieldName!]),
                    )];
                    setFilteredSuggestions(filteredParentOptions);
                    setShowSuggestions(filteredParentOptions.length > 0);
                } else {
                    const filteredOptions = [...new Set(
                        options
                            .filter((item) => item[optionsFieldName!].toLowerCase()[matchType](inputValue.toLowerCase()))
                            .slice(0, maxResults)
                            .map((item) => item)
                            .sort((x) => x[optionsFieldName!]),
                    )];
                    setFilteredSuggestions(filteredOptions);
                    setShowSuggestions(filteredOptions.length > 0);
                }
            } else {
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [
        _certNumOptions.value,
        _parentField.value,
        inputValue,
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

    const handleSelect = (value: string, valueId: string, callback?: () => void) => {
        _fieldHelper.setValue(value);
        _fieldHelper.setTouched(true);
        _idFieldHelper.setValue(valueId);
        _idFieldHelper.setTouched(true);
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
                handleSelect(filteredSuggestions[activeIndex].lookupName!, filteredSuggestions[activeIndex].id!);
            } else {
                handleSelect(inputValue, inputValue);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    if (isSummary) {
        if (_field) {
            return (
                <SummaryDisplay
                    label={label}
                    id={name}
                    as='p'
                    value={_field.value ? _field.value : '-'}
                />
            );
        }
    }

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
                    role='combobox'
                    tabIndex={-1}
                    aria-expanded={showSuggestions ? 'true' : 'false'}
                    aria-haspopup='listbox'
                    aria-controls={`${name}-autocomplete`}
                    className='form-field-container combobox mb-2'
                >
                    <TextInput
                        id={name}
                        name={name}
                        label={label ?? 'Certificate number'}
                        placeholder={placeholder ?? ''}
                        inlineHelpTitle={inlineHelpTitle ?? ''}
                        inlineHelp={inlineHelp ?? ''}
                        onChange={(e: any) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete='off'
                        aria-autocomplete='both'
                        // onFocus={() => setShowSuggestions(true)}
                        containerClassName='mb-0'
                        className='search-box form-field'
                        aria-labelledby={
                            showSuggestions ? `${name}-autosuggest-options` : undefined
                        }
                        aria-describedby={
                            _meta.touched && _meta.error
                                ? `${id || name}-validation-msg`
                                : (helpId || undefined)
                        }
                    />

                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div id={`${name}-autocomplete`} className='suggestions-container' aria-live='polite' aria-busy='false'>
                            <ListGroup
                                id={`${name}-autosuggest-options`}
                                as='ul'
                                role='listbox'
                                className={`suggestion-list ${showSuggestions ? 'show' : ''}`}
                                aria-label='Suggested options'
                            >
                                <ListGroup.Item as='li' className='suggestion-option auto-suggestions mt-0 border-0 small text-muted' aria-readonly>
                                    Did you mean?
                                </ListGroup.Item>
                                {filteredSuggestions.map((item, index) => (
                                    <ListGroup.Item
                                        id={`${item.id}`}
                                        key={item.lookupName}
                                        as='li'
                                        role='option'
                                        aria-label={`${item.lookupName} (${index + 1} of ${filteredSuggestions.length})`}
                                        aria-selected={index === activeIndex}
                                        action
                                        // active={index === activeIndex}
                                        className={`suggestion-option auto-suggestions mt-0 border-0 ${index === activeIndex ? 'highlighted' : ''}`}
                                        onClick={() => {
                                            handleSelect(item.lookupName!, item.id!, () => setActiveIndex(index));
                                        }}
                                        // onMouseEnter={() => setActiveIndex(index)}
                                        ref={(el: any) => {
                                            (itemRefs.current[index] = el);
                                        }}
                                    >
                                        <span aria-hidden='true'>{item.lookupName}</span>
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

export default CertificateNumberLookup;
