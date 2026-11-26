import type { Doc, Value, RhfPort, Delete, Save } from './contracts';
export const options = [
  { label: 'Photo or diagram', value: 'Photo or Diagram' },
  { label: 'Manual', value: 'Manual' },
];
export function read(value: Value): Doc[] {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}
export function bind(form: RhfPort) {
  return {
    read: () => read(form.getValues()),
    write: (docs: Doc[]) => form.setValue('form.docs', docs),
  };
}
export const categoryPath = (index: number) => `form.docs.${index}.category`;
export async function remove(form: RhfPort, id: string, del: Delete) {
  const docs = read(form.getValues());
  await del(id, docs.filter((d) => d.id !== id && !d.locked).length);
  form.setValue(
    'form.docs',
    read(form.getValues()).filter((d) => d.id !== id),
  );
}
export async function save(
  form: RhfPort,
  id: string,
  category: string,
  update: Save,
) {
  await update(id, category);
  form.setValue(
    'form.docs',
    read(form.getValues()).map((d) => (d.id === id ? { ...d, category } : d)),
  );
}
