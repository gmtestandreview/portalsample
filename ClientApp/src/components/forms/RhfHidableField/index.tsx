import { useWatch } from 'react-hook-form';
import type { PropsWithChildren } from 'react';
import { isHidden } from '../utils';
import type { HidableFieldProps } from '../HidableField/types';
import { useHiddenRules } from './hiddenRulesContext';

/**
 * React Hook Form counterpart of `HidableField`. It reads the form values
 * through `useWatch`, so it must render inside a `FormProvider`, and takes the
 * hide rules from `RhfHiddenRulesProvider`.
 */
const RhfHidableField = (
  props: Readonly<PropsWithChildren<HidableFieldProps>>
) => {
  const { name, children } = props;
  const hidden = useHiddenRules();
  const values = useWatch();

  return isHidden(name, hidden, values) ? null : <>{children}</>;
};

export default RhfHidableField;
