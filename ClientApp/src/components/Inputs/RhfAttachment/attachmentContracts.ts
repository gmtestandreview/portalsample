import type { AttachmentDto } from '../../../api/web-api-client';

export const CATEGORY_OPTIONS = [
  { displayText: 'Test Report', value: 'Test Report' },
  { displayText: 'Certificate', value: 'Certificate' },
  { displayText: 'Specification', value: 'Specification' },
  { displayText: 'Manual', value: 'Manual' },
  { displayText: 'Photo or diagram', value: 'Photo or Diagram' },
  { displayText: 'Other', value: 'Other' },
];

export type AttachmentCollection =
  | { valid: true; items: AttachmentDto[]; scalar: boolean }
  | { valid: false; items: []; scalar: false };

const isAttachment = (value: unknown): value is AttachmentDto => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const fields = new Map<string, unknown>(Object.entries(value));
  const isOptionalString = (key: string) => {
    const field = fields.get(key);
    return field == null || typeof field === 'string';
  };
  const size = fields.get('attachmentSize');
  const locked = fields.get('documentLocked');
  const modified = fields.get('attachmentModifiedDate');
  return (
    ['id', 'attachmentName', 'documentBytes', 'attachmentCategory'].some(
      (key) => fields.has(key),
    ) &&
    [
      'id',
      'attachmentName',
      'attachmentCategory',
      'documentBytes',
      'attachmentOrigin',
      'attachmentPublishedStatus',
      'attachmentAuthor',
      'attachmentPortalUsername',
    ].every(isOptionalString) &&
    (size == null || typeof size === 'number' || typeof size === 'string') &&
    (locked == null || typeof locked === 'boolean') &&
    (modified == null ||
      typeof modified === 'string' ||
      modified instanceof Date)
  );
};

/** Never filter malformed rows: that would shift registered field indexes. */
export const readAttachments = (value: unknown): AttachmentCollection => {
  if (value == null) return { valid: true, items: [], scalar: false };
  const items: unknown[] = Array.isArray(value) ? value : [value];
  const ids = new Set<string>();
  const objects = new Set<AttachmentDto>();
  const valid: AttachmentDto[] = [];
  for (const item of items) {
    if (
      !isAttachment(item) ||
      objects.has(item) ||
      (item.id && ids.has(item.id))
    ) {
      return { valid: false, items: [], scalar: false };
    }
    objects.add(item);
    if (item.id) ids.add(item.id);
    valid.push(item);
  }
  return { valid: true, items: valid, scalar: !Array.isArray(value) };
};

export const categoryPath = (name: string, index: number, scalar: boolean) =>
  scalar ? `${name}.attachmentCategory` : `${name}.${index}.attachmentCategory`;

export const remainingUnlockedCount = (items: AttachmentDto[], id: string) =>
  items.filter((item) => item.id !== id && !item.documentLocked).length;

/** Preserve selected-batch replacement semantics; enforce single mode explicitly. */
export const validateSelection = (
  files: File[],
  allowedTypes: string,
  maxFiles: number,
  allowMultiple: boolean,
): string[] => {
  const types = allowedTypes.split(',').map((type) => type.trim());
  const typeError =
    `${files.length > 1 ? 'Files' : 'File'} must be` +
    ` ${types.length > 1 ? 'one of the following types' : 'of the following type'}:` +
    ` ${types.join(', ')}`;
  const errors = files
    .filter(
      (file) =>
        !file.name.includes('.') ||
        !types.includes(`.${String(file.name.split('.').pop())}`),
    )
    .map(() => typeError);
  const limit = allowMultiple ? maxFiles : Math.min(maxFiles, 1);
  if (files.length > limit) {
    errors.push(
      `The files selected have not been uploaded as you have selected more files than the maximum number allowed - (${limit}).`,
    );
  }
  return errors;
};

/** Shallow snapshot of DTO properties; detects list replacement/reorder and field edits. */
export const snapshotAttachments = (items: AttachmentDto[]) =>
  items.map((item): [string, unknown][] => Object.entries(item));

export const matchesSnapshot = (
  snapshot: ReturnType<typeof snapshotAttachments>,
  items: AttachmentDto[],
) =>
  snapshot.length === items.length &&
  snapshot.every((entries, index) => {
    const item = items[index];
    if (!item) return false;
    const current = new Map<string, unknown>(Object.entries(item));
    return (
      current.size === entries.length &&
      entries.every(
        ([key, value]) =>
          current.has(key) && Object.is(current.get(key), value),
      )
    );
  });

/** A legacy unidentified row can be edited locally only if its identity is unambiguous.
 * Category is intentionally excluded because a local category edit changes that value.
 */
export const sameUnidentifiedAttachment = (
  left: AttachmentDto,
  right: AttachmentDto,
) => {
  const entries = (item: AttachmentDto): [string, unknown][] =>
    Object.entries(item).filter(([key]) => key !== 'attachmentCategory');
  const before = entries(left);
  const after = new Map<string, unknown>(entries(right));
  return (
    !left.id &&
    !right.id &&
    before.length === after.size &&
    before.every(
      ([key, value]) => after.has(key) && Object.is(after.get(key), value),
    )
  );
};

/** Per-instance synchronous exclusion; acquire before awaiting or updating state. */
export const createMutationGate = () => {
  let active = false;
  return {
    acquire: () => {
      if (active) return false;
      active = true;
      return true;
    },
    release: () => {
      active = false;
    },
  };
};
