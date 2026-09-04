import { useEffect, useRef, useState } from 'react';
import AutoSuggestContainer from './AutoSuggestContainer';
import type { AutoSuggestProps, AutoSuggestOption } from './types';

const AutoSuggest = <T,>(
    props: AutoSuggestProps<T>) => {
    const {
        name,
        getOptions,
        label,
        onSelectedOption,
        selectedOption,
        inlineHelp,
        placeholder,
    } = props;

    const [options, setOptions] = useState<AutoSuggestOption<T>[]>([]);
    const [searchTerm, setSearchTerm] = useState(selectedOption || '');
    const [noResult, setNoResult] = useState(false);
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const requestIdRef = useRef(0);

    const onSearchTermChanged = async (term: string) => {
        const requestId = ++requestIdRef.current;
        setIsLoading(true);
        setNoResult(false);
        setError(false);
        setSearchTerm(term);

        if (term.length === 0) {
            await onSelectedOption();
        }

        if (term.length <= 2) {
            setOptions([]);
            setIsLoading(false);
            return;
        }

        try {
            const opt = await getOptions(term);

            if (requestId !== requestIdRef.current) {
                return;
            }

            setOptions(opt);
            setNoResult(opt.length === 0);
        } catch {
            if (requestId !== requestIdRef.current) {
                return;
            }

            setOptions([]);
            setError(true);
        }

        // Unconditional: both paths above already returned if a newer request had superseded
        // this one, and nothing between those checks and here awaits, so the id cannot go stale
        // in between. Re-testing it only implied a staleness this line can never see.
        setIsLoading(false);
    };

    const onSelectionMade = async (option: AutoSuggestOption<T>) => {
        setIsLoading(true);
        await onSelectedOption(option);
        setIsLoading(false);
    };

    useEffect(() => {
        let mounted = true;
        if (mounted && selectedOption && selectedOption !== '') {
            setSearchTerm(selectedOption);
        }
        return (() => { mounted = false; });
    }, [selectedOption]);

    const onCancel = () => {
        requestIdRef.current += 1;
        setOptions([]);
        setIsLoading(false);
        setError(false);
        setNoResult(false);
        setSearchTerm(selectedOption || '');
    };

    return (
        <AutoSuggestContainer
            name={name}
            label={label}
            options={options}
            searchTerm={searchTerm}
            noResult={noResult}
            error={error}
            loading={isLoading}
            onCancel={onCancel}
            onSearchTermChange={onSearchTermChanged}
            onSelectedOption={onSelectionMade}
            inlineHelp={inlineHelp}
            placeholder={placeholder}
        />
    );
};

export default AutoSuggest;
