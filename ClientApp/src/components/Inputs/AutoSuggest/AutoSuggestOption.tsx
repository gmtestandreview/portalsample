import { ListBoxItem } from 'react-aria-components/ListBox';
import type { AutoSuggestOptionProps } from './types';

function AutoSuggestOption<T>(props: Readonly<AutoSuggestOptionProps<T>>) {
    const {
        id,
        displayText,
        selected,
        ariaLabel,
    } = props;

    return (
        <ListBoxItem
            id={id}
            textValue={displayText}
            aria-label={ariaLabel}
            className={({ isFocused }) => [
                'suggestion-option',
                'auto-suggestions',
                isFocused || id === selected ? 'highlighted' : '',
            ].filter(Boolean).join(' ')}
        >
            {displayText}
        </ListBoxItem>
    );
}

export default AutoSuggestOption;
