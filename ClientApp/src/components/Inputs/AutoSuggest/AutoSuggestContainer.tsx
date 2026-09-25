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
import { Group } from 'react-aria-components/Group';
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

                        // `items={options}` builds the collection this key came from, and a
                        // custom value arrives as null and returns above, so the lookup resolves
                        // for every key React Aria can emit: a key it no longer holds cannot
                        // reach here, because commitSelection suppresses the callback once
                        // collection.getItem misses. Expressed as a filter rather than
                        // find-then-guard so there is no arm here that no input can take; the
                        // behaviour for a missing option is unchanged.
                        options
                            .filter((item) => item.id === String(key))
                            .forEach((option) => { void onSelectOption(option); });
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
                    {/*
                      * React Aria's `Group`, not a bare wrapper: `ComboBox`
                      * exposes its group ref through `GroupContext`, and once a
                      * `Group` claims it the widget stops running the
                      * ResizeObserver `setMenuWidth` fallback it otherwise uses
                      * to size the menu off the lone input. That fallback
                      * commits state after mount - outside a Storybook play's
                      * act() scope - which is the "update to ComboBoxInner was
                      * not wrapped in act(...)" warning. The popover then sizes
                      * off the group instead, which is the shape React Aria's
                      * own ComboBox docs use.
                      */}
                    <Group>
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
                    </Group>
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
