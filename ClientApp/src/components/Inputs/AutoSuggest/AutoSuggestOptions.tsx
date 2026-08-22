import { ListBox } from 'react-aria-components/ComboBox';
import AutoSuggestOption from './AutoSuggestOption';
import type { AutoSuggestOptionsProps } from './types';

function AutoSuggestOptions<T>(props: Readonly<AutoSuggestOptionsProps<T>>) {
    const {
        id,
        options,
        selectedOptionId,
    } = props;

    return (
        <ListBox
            id={id}
            className='suggestion-options'
            aria-label={props.name}
        >
            {options?.map((opt, index) => (
                <AutoSuggestOption
                    key={opt.id}
                    id={opt.id}
                    selected={selectedOptionId}
                    value={opt.value}
                    displayText={opt.displayText}
                    ariaLabel={`${opt.displayText} (${index + 1} of ${options.length})`}
                />
            ))}
        </ListBox>
    );
}

export default AutoSuggestOptions;
