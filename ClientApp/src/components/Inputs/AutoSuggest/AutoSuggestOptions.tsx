import { ListBox } from 'react-aria-components/ComboBox';
import AutoSuggestOption from './AutoSuggestOption';
import type { AutoSuggestOptionsProps } from './types';
import { omitUndefined } from '../../../utils/omitUndefined';

function AutoSuggestOptions<T>(props: Readonly<AutoSuggestOptionsProps<T>>) {
  const { id, options, selectedOptionId } = props;

  // The ListBox is left unnamed unless a caller supplies `aria-label`: inside a
  // `ComboBox`, React Aria labels the popup from the same `Label` as the
  // input, and any name set here makes `useLabels` self-reference this
  // element to preserve it - announcing both, one after the other.
  return (
    <ListBox
      {...omitUndefined({ id, 'aria-label': props['aria-label'] })}
      className='suggestion-options'
    >
      {options?.map((opt, index) => (
        <AutoSuggestOption
          key={opt.id}
          id={opt.id}
          {...omitUndefined({ selected: selectedOptionId })}
          value={opt.value}
          displayText={opt.displayText}
          ariaLabel={`${opt.displayText} (${index + 1} of ${options.length})`}
        />
      ))}
    </ListBox>
  );
}

export default AutoSuggestOptions;
