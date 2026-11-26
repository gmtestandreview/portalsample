import type { Doc, Value, FormikPort, Delete, Save } from './contracts';
export const options = [
  { label: 'Photo or diagram', value: 'Photo or Diagram' },
  { label: 'Manual', value: 'Manual' },
];
export function read(value: Value): Doc[] {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}
export function bind(form: FormikPort) {
  return {
    read: () => read(form.values.form.docs),
    write: (docs: Doc[]) => form.setDocs(docs),
  };
}
export const categoryPath = (index: number) => `form.docs.${index}.category`;
export async function remove(form: FormikPort, id: string, del: Delete) {
  const docs = read(form.values.form.docs);
  const remaining = docs.filter((d) => d.id !== id);
  // Inherited defect: rejection leaves the optimistic deletion in local state.
  form.setDocs(remaining);
  await del(id, remaining.filter((d) => !d.locked).length);
}
export async function save(
  form: FormikPort,
  id: string,
  category: string,
  update: Save,
) {
  await update(id, category);
  const current = read(form.values.form.docs);
  form.setDocs(current.map((d) => (d.id === id ? { ...d, category } : d)));
}
