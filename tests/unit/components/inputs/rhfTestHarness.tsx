import { act } from '@testing-library/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import type {
  DefaultValues,
  FieldValues,
  Resolver,
  UseFormReturn,
} from 'react-hook-form';

/**
 * Per-test handle onto the form a `FieldHarness` renders. Create one inside a
 * test with `createFormHandle`, pass it as `form`, then drive validation
 * through `submit` and `trigger`.
 */
export interface FormHandle<T extends FieldValues> {
  capture: (methods: UseFormReturn<T>) => void;
  submit: () => Promise<void>;
  trigger: () => Promise<void>;
}

export const createFormHandle = <T extends FieldValues>(): FormHandle<T> => {
  let current: UseFormReturn<T> | undefined;
  return {
    capture: (methods) => {
      current = methods;
    },
    submit: () =>
      act(async () => {
        await current?.handleSubmit(() => undefined)();
      }),
    trigger: () =>
      act(async () => {
        await current?.trigger();
      }),
  };
};

interface FieldHarnessProps<T extends FieldValues> {
  field: keyof T & string;
  defaultValue: unknown;
  resolver?: Resolver<T> | undefined;
  form?: FormHandle<T> | undefined;
  children: ReactNode;
}

const ValueProbe = ({ field }: Readonly<{ field: string }>) => {
  const { watch } = useFormContext();
  return <output data-testid='value'>{JSON.stringify(watch(field))}</output>;
};

/** Renders children inside a FormProvider with one field and a value probe. */
export const FieldHarness = <T extends FieldValues>({
  field,
  defaultValue,
  resolver,
  form,
  children,
}: Readonly<FieldHarnessProps<T>>) => {
  const methods = useForm<T>({
    defaultValues: { [field]: defaultValue } as unknown as DefaultValues<T>,
    ...(resolver === undefined ? {} : { resolver }),
  });
  useEffect(() => {
    form?.capture(methods);
  });
  return (
    <FormProvider {...methods}>
      <form>{children}</form>
      <ValueProbe field={field} />
    </FormProvider>
  );
};
