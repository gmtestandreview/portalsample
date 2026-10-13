import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import RhfForm, {
  useRhfFormApi,
} from '../../../ClientApp/src/components/forms/RhfForm';
import type { RhfFormProps } from '../../../ClientApp/src/components/forms/RhfForm';
import type { FormValues } from '../../../ClientApp/src/components/forms/types';

/** Next and Save and exit buttons wired to the shell, plus a native form. */
export const ShellControls = ({ children }: { children?: ReactNode }) => {
  const { submit, onFormSubmit } = useRhfFormApi();
  return (
    <form data-testid='form' onSubmit={onFormSubmit} noValidate>
      {children}
      <button type='submit' data-testid='next'>
        Next
      </button>
      <button
        type='button'
        data-testid='save-and-exit'
        onClick={() => void submit('saveAndExit')}
      >
        Save and exit
      </button>
    </form>
  );
};

type ShellProps<T extends FormValues> = Omit<RhfFormProps<T>, 'children'>;

/**
 * RHF counterpart of `helpers/formik.tsx`: renders `RhfForm` with the controls
 * above. Call `rerenderShell` with a new `initialValues` object to simulate a
 * reload.
 */
export const renderRhfShell = <T extends FormValues>(
  props: ShellProps<T>,
  fields: ReactNode
) => {
  const tree = (next: ShellProps<T>) => (
    <RhfForm<T> {...next}>
      <ShellControls>{fields}</ShellControls>
    </RhfForm>
  );
  const result = render(tree(props));
  return {
    ...result,
    rerenderShell: (next: ShellProps<T>) => result.rerender(tree(next)),
  };
};
