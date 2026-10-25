import { act, fireEvent, render, screen } from '@testing-library/react';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Editor, Transforms } from 'slate';

import type * as SlateModule from 'slate';

import SlateEditor from '@/components/SlateEditor/SlateEditor';

import {
  isBreakTag,
  isEmptyParagraphContent,
  serializeToHtml,
} from '@/components/SlateEditor/SlateEditor';

import type { CustomElement } from '@/components/SlateEditor/SlateEditor';

/**
 * Slate builds its document as a plain JavaScript model and only mirrors it into the DOM. Driving
 * the component through the DOM would need `beforeinput` plus a live Selection, neither of which
 * jsdom implements - which is why `onChange` never fired here before and `handleChange` went
 * unmeasured.
 *
 * So these tests drive the model instead. `createEditor` is wrapped to keep a reference to the
 * editor the component builds; the editor itself is the real one, unstubbed. Transforms applied to
 * it call `editor.onChange()`, which `<Slate>` forwards to the `onChange` prop - the same path a
 * keystroke takes once the browser has finished translating it.
 */
const captured = vi.hoisted(() => ({ editors: [] as Editor[] }));

vi.mock(import('slate'), async (importOriginal) => {
  const actual = await importOriginal<typeof SlateModule>();

  return {
    ...actual,
    createEditor: () => {
      const editor = actual.createEditor();
      captured.editors.push(editor);
      return editor;
    },
  } satisfies __ExactMockModule<__TestMockModule55>;
});

/** The editor belonging to the most recently rendered SlateEditor. */
const currentEditor = () => {
  const editor = captured.editors.at(-1);

  if (!editor) {
    throw new Error('No SlateEditor has been rendered');
  }

  return editor;
};

/** Places a collapsed caret in the first text node. Slate ignores marks while there is no selection. */
const placeCaret = async (editor: Editor, offset = 0) => {
  await act(async () => {
    Transforms.select(editor, {
      anchor: { path: [0, 0], offset },
      focus: { path: [0, 0], offset },
    });
  });
};

/**
 * Applies an edit and lets Slate's change notification land.
 *
 * `apply` batches a burst of operations and defers `editor.onChange` to a microtask, so a
 * synchronous `act` returns before `<Slate>` has told the component anything. Awaiting inside `act`
 * drains that microtask and the React update it schedules together.
 */
const applyEdit = async (change: () => void) => {
  await act(async () => {
    change();
  });
};

const paragraph = (text: string): CustomElement[] => [
  {
    type: 'paragraph',
    children: [{ text }],
  },
];

describe('slateEditor helpers', () => {
  it('serializes paragraph text with inline mark formatting', () => {
    expect.assertions(1);
    const html = serializeToHtml([
      {
        type: 'paragraph',
        children: [
          { text: 'Bold', bold: true },
          { text: 'Italic', italic: true },
          { text: 'Underline', underline: true },
          { text: 'Plain' },
        ],
      },
    ]);

    expect(html).toBe(
      '<p><strong>Bold</strong><em>Italic</em><u>Underline</u>Plain</p>',
    );
  });
});

describe('slateEditor helpers', () => {
  it('serializes unknown block types as their child content', () => {
    expect.assertions(1);
    const html = serializeToHtml([
      {
        type: 'heading',
        children: [{ text: 'Heading text' }],
      } as unknown as CustomElement,
    ]);

    expect(html).toBe('Heading text');
  });
});

describe('slateEditor helpers', () => {
  it.each([
    ['<br>', true],
    ['<br/>', true],
    ['<br />', true],
    ['<br class="unexpected">', false],
    ['plain text', false],
    ['<br', false],
  ])('classifies break tag %s as %s', (value, expected) => {
    expect.assertions(1);
    expect(isBreakTag(value)).toBe(expected);
  });
});

describe('slateEditor helpers', () => {
  it.each([
    ['', true],
    ['&nbsp;&#xfeff; \n<br><br />', true],
    ['<br class="unexpected">', false],
    ['<br', false],
    ['visible text', false],
  ])('classifies paragraph content %j as empty=%s', (content, expected) => {
    expect.assertions(1);
    expect(isEmptyParagraphContent(content)).toBe(expected);
  });
});
