// Synthetic ports, not real Formik/RHF APIs or a production adapter.
export type Doc = { id: string; category: string; locked?: boolean };
export type Value = Doc | Doc[] | null | undefined;
export type FormikPort = {
  kind: 'formik';
  values: { form: { docs: Value } };
  setDocs: (v: Value) => void;
};
export type RhfPort = {
  kind: 'rhf';
  getValues: () => Value;
  setValue: (path: 'form.docs', value: Value) => void;
};
export type Delete = (id: string, remainingUnlocked: number) => Promise<void>;
export type Save = (id: string, category: string) => Promise<void>;
export const PATH = 'form.docs';
