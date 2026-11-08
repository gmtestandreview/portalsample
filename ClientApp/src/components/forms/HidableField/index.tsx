import { useFormikContext } from 'formik';
import type { FormikValues } from 'formik';
import { isHidden } from '../utils';
import type { HidableFieldProps } from './types';
import type { Hideable } from '../types';

interface HidableFormikStatus<T extends FormikValues> {
  hidden?: Hideable<Partial<T>, Partial<T>>;
}

const HidableField = <T extends FormikValues = FormikValues>(
  props: Readonly<HidableFieldProps<T>>,
) => {
  const formikContext = useFormikContext<T>();
  const { values } = formikContext;
  const hidden =
    (formikContext.status as HidableFormikStatus<T> | undefined)
      ?.hidden ?? {};
  const { name, children } = props;

  const isVisible = !isHidden(name, hidden, values);
  const content =
    typeof children === 'function' ? children(values) : children;

  return isVisible ? <>{content}</> : null;
};

export default HidableField;
