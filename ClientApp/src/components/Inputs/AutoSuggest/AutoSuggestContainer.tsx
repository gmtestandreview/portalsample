import { useField } from 'formik';
import { useContext, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  ComboBox,
  ComboBoxStateContext,
  Input,
  Label,
  Popover,
} from 'react-aria-components/ComboBox';
import AutoSuggestOptions from './AutoSuggestOptions';
import type { AutoSuggestOption, AutoSuggestContainerProps } from './types';

const keys = {
    ESC: 'Escape',
};

const AutoSuggestMenuState = ({ hasOptions }: { hasOptions: boolean }) => {
    const state = useContext(ComboBoxStateContext);
    const previousHasOptions = useRef(false);

    useEffect(() => {
        if (hasOptions && state?.isFocused && !previousHasOptions.current) {
            state?.open(null, 'input');
        } else if (!hasOptions && previousHasOptions.current) {
            state?.close();
        }
        previousHasOptions.current = hasOptions;
    }, [hasOptions, state]);

    return null;
};

const AutoSuggestContainer = <T,>(
    props: Readonly<AutoSuggestContainerProps<T>>) => {
    const {
        id,
        name,
        label,
        inlineHelp,
        options,
        noResult,
        noResultMessage,
        error,
        errorMessage,
        loading,
        loadingMessage,
        searchTerm,
        onSearchTermChange,
        onSelectedOption,
        onCancel,
        placeholder,
    } = props;

    const helpId = inlineHelp ? `help-${id || name}` : undefined;
    const controlId = `${id || name}`;
    const [_field, _meta, { setTouched }] = useField<string>(name);
    const errorId = `${id || name}-validation-msg`;

    const [isOpen, setIsOpen] = useState(false);

    const onSelectOption = async (value: AutoSuggestOption<T>) => {
        setIsOpen(false);
        await onSelectedOption(value);
    };

    const onKeyDown = async (
        event: KeyboardEvent<HTMLInputElement>,
    ) => {
        switch (event.key) {
            case keys.ESC:
                onCancel();
                break;
            default:
                break;
        }
    };
    const describedBy = [
        helpId,
        _meta.touched && _meta.error ? errorId : undefined,
    ]
        .filter(Boolean)
        .join(' ') || undefined;

    return (
        <>
            <div
                id={`${name}-announcement`}
                className='visually-hidden'
                aria-live='polite'
            >
                {
                        isOpen
                            ? `${options.length} suggestions displayed. To navigate, use up and down arrow keys.`
                            : ''
                }
            </div>
            <div className='form-field-container combobox mb-2'>
                <ComboBox<AutoSuggestOption<T>>
                    items={options}
                    inputValue={searchTerm ?? ''}
                    onInputChange={(value) => {
                        setTouched(true);
                        void onSearchTermChange(value);
                    }}
                    onSelectionChange={(key) => {
                        if (key == null) {
                            return;
                        }

                        const option = options.find((item) => item.id === String(key));
                        if (option) {
                            void onSelectOption(option);
                        }
                    }}
                    allowsCustomValue
                    menuTrigger='input'
                    onOpenChange={setIsOpen}
                >
                    <AutoSuggestMenuState hasOptions={options.length > 0} />
                    {/*
                      * React Aria's `Label`, not a raw `<label>`: `ComboBox`
                      * detects its label through `LabelContext`, and without a
                      * registered `Label` it treats the widget as unnamed -
                      * emitting the missing-visible-label warning and omitting
                      * `aria-labelledby` from the input. `htmlFor` is kept so
                      * the existing control id association is unchanged.
                      */}
                    <Label
                        htmlFor={controlId}
                        className={`${name.toLowerCase()}-auto-suggest-label form-label`}
                    >
                        {label}
                    </Label>
                    {inlineHelp && (
                        <p id={helpId} className='contextual-help'>
                            {inlineHelp}
                        </p>
                    )}
                    <Input
                        id={controlId}
                        name={name}
                        autoComplete='off'
                        spellCheck={false}
                        onKeyDown={onKeyDown}
                        className='search-box form-field'
                        placeholder={placeholder}
                        aria-describedby={describedBy}
                        aria-invalid={_meta.touched && _meta.error ? 'true' : undefined}
                    />
                    {options.length > 0 && (
                        <Popover
                            className='suggestions-container'
                            aria-busy={loading}
                            isNonModal
                            offset={0}
                        >
                            <AutoSuggestOptions<T>
                                id={`${name}-options`}
                                options={options}
                            />
                        </Popover>
                    )}
                    {loading && <p>{loadingMessage || 'Loading options'}</p>}
                    {_meta.touched && _meta.error
                        ? (
                            <div className='invalid-feedback' id={errorId}>
                                {_meta.error}
                            </div>
                        )
                        : null}
                </ComboBox>
            </div>
            {(!loading && noResult) && <p>{noResultMessage || 'No matches found'}</p>}
            {error && <p>{errorMessage || 'Results could not be fetched'}</p>}
        </>
    );
};

export default AutoSuggestContainer;
