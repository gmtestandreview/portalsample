import { act } from '@testing-library/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import type { FieldValues, Resolver, UseFormReturn } from 'react-hook-form';

interface FieldHarnessProps<T extends FieldValues> {
  field: keyof T & string;
  defaultValue: unknown;
  resolver?: Resolver<T> | undefined;
  onMethods: (methods: UseFormReturn<T>) => void;
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
  onMethods,
  children,
}: Readonly<FieldHarnessProps<T>>) => {
  const methods = useForm<T>({
    defaultValues: { [field]: defaultValue } as never,
    ...(resolver === undefined ? {} : { resolver }),
  });
  useEffect(() => {
    onMethods(methods);
  });
  return (
    <FormProvider {...methods}>
      <form>{children}</form>
      <ValueProbe field={field} />
    </FormProvider>
  );
};

export const submitForm = (
  methods: Pick<UseFormReturn<FieldValues>, 'handleSubmit'> | undefined
) =>
  act(async () => {
    await methods?.handleSubmit(() => undefined)();
  });
