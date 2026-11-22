// Pure Slate-to-HTML helpers. They live apart from SlateEditor.tsx so that file
// exports only the component (React Fast Refresh) and callers that only need
// the helpers do not pull in the editor chunk.

export interface CustomElement {
  type: 'paragraph';
  children: {
    text: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  }[];
}

const escapeHtml = (text: string): string => {
  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  } as const;

  return text.replace(
    /[&<>"']/g,
    (character) => entities[character as keyof typeof entities],
  );
};

export const serializeToHtml = (value: CustomElement[]): string =>
  value
    .map((element) => {
      const children = element.children
        .map((child) => {
          let text = escapeHtml(child.text);
          if (child.bold) text = `<strong>${text}</strong>`;
          if (child.italic) text = `<em>${text}</em>`;
          if (child.underline) text = `<u>${text}</u>`;
          return text;
        })
        .join('');

      // CustomElement only models paragraphs; widen it to a discriminated union
      // (with exhaustive serialization) before adding other block types.
      return `<p>${children}</p>`;
    })
    .join('');

export const isBreakTag = (value: string) => {
  const normalized = value.toLowerCase();
  if (!normalized.startsWith('<br') || !normalized.endsWith('>')) {
    return false;
  }

  const tagContent = normalized.slice(3, -1).trim();
  return tagContent === '' || tagContent === '/';
};

export const isEmptyParagraphContent = (content: string) => {
  let cursor = 0;
  while (cursor < content.length) {
    const remainder = content.slice(cursor);
    if (remainder.startsWith('&nbsp;')) {
      cursor += '&nbsp;'.length;
      continue;
    }
    if (remainder.toLowerCase().startsWith('&#xfeff;')) {
      cursor += '&#xfeff;'.length;
      continue;
    }
    if (/\s/.test(content.charAt(cursor))) {
      cursor += 1;
      continue;
    }
    if (remainder.toLowerCase().startsWith('<br')) {
      const tagEnd = remainder.indexOf('>');
      if (tagEnd === -1 || !isBreakTag(remainder.slice(0, tagEnd + 1))) {
        return false;
      }
      cursor += tagEnd + 1;
      continue;
    }
    return false;
  }
  return true;
};
