import { useFormikContext } from 'formik';
import type { FormikValues } from 'formik';
import type { PropsWithChildren } from 'react';
import { isHidden } from '../utils';
import type { HidableFieldProps } from './types';
import type { Hideable } from '../types';

interface HidableFormikStatus<T extends FormikValues> {
  hidden?: Hideable<Partial<T>, Partial<T>>;
}

const HidableField = <T extends FormikValues>(
  props: Readonly<PropsWithChildren<HidableFieldProps>>,
) => {
  const formikContext = useFormikContext<T>();
  const { values } = formikContext;
  const hidden =
    (formikContext.status as HidableFormikStatus<T> | undefined)?.hidden ?? {};
  const { name, children } = props;

  const isVisible = !isHidden(name, hidden, values);

  return isVisible ? <>{children}</> : null;
};

export default HidableField;
