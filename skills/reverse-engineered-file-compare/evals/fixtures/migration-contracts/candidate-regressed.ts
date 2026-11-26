import type { Doc, Value, RhfPort, Delete, Save } from './contracts';
export const options = [
  { label: 'Photo or diagram', value: 'Photos or diagrams' },
  { label: 'Manual', value: 'Manuals' },
];
export function read(value: Value): Doc[] {
  return Array.isArray(value) ? value.filter((d) => !!d) : [];
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
  // Incorrect callback contract and stale snapshot after await.
  await del(id, 0);
  form.setValue(
    'form.docs',
    docs.filter((d) => d.id !== id),
  );
}
export async function save(
  form: RhfPort,
  id: string,
  category: string,
  update: Save,
) {
  const docs = read(form.getValues());
  await update(id, category);
  form.setValue(
    'form.docs',
    docs.map((d) => (d.id === id ? { ...d, category } : d)),
  );
}
