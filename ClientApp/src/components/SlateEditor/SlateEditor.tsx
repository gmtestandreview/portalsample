import { orIfEmpty } from '../../utils/orIfEmpty';
import React, { useMemo } from 'react';
import { createEditor, type BaseEditor, Editor, type Descendant } from 'slate';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import { Slate, Editable, withReact } from 'slate-react';
import PrimaryButton from '../Buttons/PrimaryButton';
import { serializeToHtml, type CustomElement } from './slateHtml';

interface SlateEditorProps {
  value: CustomElement[];
  setValue: (value: CustomElement[]) => void;
  placeholder?: string;
  onSubmit?: () => void;
  maxCharacters?: number;
}

interface CustomText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

const isMarkActive = (editor: Editor, format: keyof CustomText) => {
  const marks = Editor.marks(editor);
  return marks ? Reflect.get(marks, format) === true : false;
};

const toggleMark = (editor: Editor, format: keyof CustomText) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const renderHtmlBody = (html: string) => {
  const safeHtml = DOMPurify.sanitize(html);
  return parse(safeHtml);
};

// WCAG 2.2 target size (minimum): the B/I/U glyphs alone render narrower than 24px.
const TOOLBAR_BUTTON_MIN_WIDTH_PX = 24;

const ToolbarButton = ({
  format,
  icon,
  label,
  editor,
}: Readonly<{
  format: keyof CustomText;
  icon: string;
  label: string;
  editor: Editor;
}>) => (
  <button
    type='button'
    className='btn btn-light btn-sm me-2'
    style={{ minWidth: TOOLBAR_BUTTON_MIN_WIDTH_PX }}
    onMouseDown={(event) => {
      event.preventDefault();
      toggleMark(editor, format);
    }}
    aria-label={label}
    title={label}
  >
    <span>{renderHtmlBody(icon)}</span>
  </button>
);

function getCharCount(v: CustomElement[]): number {
  // Check emptiness at the model level — avoids HTML serialisation purely for the empty check.
  const hasContent = v.some((el) =>
    el.children.some((child) => child.text.trim() !== ''),
  );
  if (!hasContent) return 0;
  return serializeToHtml(v).length;
}

const SlateEditor: React.FC<SlateEditorProps> = ({
  value,
  setValue,
  placeholder,
  onSubmit,
  maxCharacters,
}) => {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [errors, setErrors] = React.useState<string[]>([]);
  const max = maxCharacters ?? 1000;
  const [liveCharCount, setLiveCharCount] = React.useState<number>(0);

  const handleChange = (newValue: Descendant[]) => {
    const nextCount = getCharCount(newValue as CustomElement[]);
    setLiveCharCount(nextCount); // Update counter with HTML length

    // Keep source-of-truth in sync
    setValue(newValue as CustomElement[]);

    if (nextCount <= max) {
      setErrors((prev) =>
        prev.filter((e) => !e.startsWith('Message cannot exceed')),
      );
    } else {
      const errorMsg = `Message cannot exceed ${max} characters (including formatting)`;
      setErrors((prev) =>
        prev.includes(errorMsg) ? prev : [...prev, errorMsg],
      );
    }
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors([]);

    const currentCount = getCharCount(value);

    // Both branches replace rather than append: setErrors([]) above already emptied the queued
    // state, so the de-duplicating updater handleChange uses would never find a duplicate here.
    if (currentCount === 0) {
      setErrors(['Message cannot be empty or spaces only']);
      return;
    }
    if (currentCount > max) {
      setErrors([
        `Message cannot exceed ${max} characters (including formatting)`,
      ]);
      return;
    }
    onSubmit?.();
  };

  return (
    <form className='mb-4' onSubmit={handleSubmit}>
      <Slate editor={editor} initialValue={value} onChange={handleChange}>
        <Editable
          id='slate-editor'
          // Slate renders a contenteditable div with role="textbox", which gets
          // no accessible name from the placeholder the way a native input
          // would. Name it explicitly with the same text a sighted user sees.
          aria-label={orIfEmpty(placeholder, 'Message NMI')}
          placeholder={orIfEmpty(placeholder, 'Message NMI')}
          className='form-control mb-0 border border-bottom-0'
          style={{ minHeight: '4rem' }}
          spellCheck
          renderLeaf={({ attributes, children, leaf }) => {
            let rendered: React.ReactNode = <>{children}</>;
            if (leaf.bold) {
              rendered = <strong>{rendered}</strong>;
            }
            if (leaf.italic) {
              rendered = <em>{rendered}</em>;
            }
            if (leaf.underline) {
              rendered = <u>{rendered}</u>;
            }
            return <span {...attributes}>{rendered}</span>;
          }}
        />
        <div className='d-flex justify-content-between mb-0 py-2 px-3 bg-light border border-top-0'>
          <div>
            <ToolbarButton
              format='bold'
              icon='<b>B</b>'
              label='Bold'
              editor={editor}
            />
            <ToolbarButton
              format='italic'
              icon='<i>I</i>'
              label='Italic'
              editor={editor}
            />
            <ToolbarButton
              format='underline'
              icon='<u>U</u>'
              label='Underline'
              editor={editor}
            />
          </div>
          <div className='text-end'>
            <PrimaryButton
              data-testid='send-button'
              type='submit'
              size='sm'
              title='Send message'
              className='d-flex align-items-center justify-content-center p-2'
            >
              <span className='d-flex align-items-center justify-content-center w-100 h-100'>
                <i className='icon icon-send' aria-hidden='true' />
              </span>
              <span className='visually-hidden'>Send</span>
            </PrimaryButton>
          </div>
        </div>
        <div className='d-flex justify-content-between'>
          <div className='text-start mt-1'>
            {errors.length > 0 && (
              <span className='text-danger ms-2'>{errors.at(-1)}</span>
            )}
          </div>
          <div className='text-end mt-1'>
            <span className='me-2 small text-muted'>
              {liveCharCount} /{max}
            </span>
          </div>
        </div>
      </Slate>
    </form>
  );
};

export default SlateEditor;
