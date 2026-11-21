import { Title } from '../../../api/web-api-client';
import { toTitle } from '../../../utils/apiEnumMappings';
import type { SelectInputOption } from '../../Inputs/SelectInput/types';

/** Title select options, skipping any value without a display title. */
export const getTitles = (): SelectInputOption<string>[] => {
  const options: SelectInputOption<string>[] = [];
  for (const value of Object.values(Title)) {
    const title = toTitle(value);
    if (title === undefined) {
      continue;
    }

    options.push({
      displayText: title.replace(/([A-Z])/g, ' $1').trim(),
      value: title,
    });
  }
  return options;
};
