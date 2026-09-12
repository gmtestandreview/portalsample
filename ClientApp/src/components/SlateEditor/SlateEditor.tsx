import React, { useMemo } from 'react';
import {
    createEditor,
    type BaseEditor,
    Editor,
    type Descendant,
} from 'slate';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import { Slate, Editable, withReact } from 'slate-react';
import PrimaryButton from '../Buttons/PrimaryButton';

// slate helpers
export const serializeToHtml = (value: CustomElement[]): string => value
    .map((element) => {
        const children = element.children.map((child) => {
            let { text } = child;
            if (child.bold) text = `<strong>${text}</strong>`;
            if (child.italic) text = `<em>${text}</em>`;
            if (child.underline) text = `<u>${text}</u>`;
            return text;
        }).join('');

        switch (element.type) {
            case 'paragraph':
                return `<p>${children}</p>`;
            default:
                return children; // Add more cases for other block types if needed
        }
    })
    .join('');
export type CustomElement = { type: 'paragraph'; children: { text: string; bold?: boolean; italic?: boolean; underline?: boolean }[] };
// end slate helpers
interface SlateEditorProps {
    value: CustomElement[];
    setValue: (value: CustomElement[]) => void;
    placeholder?: string;
    onSubmit?: () => void;
    maxCharacters?: number;
}

type CustomText = { text: string; bold?: boolean; italic?: boolean; underline?: boolean };
declare module 'slate' {
    interface CustomTypes {
        Editor: BaseEditor;
        Element: CustomElement;
        Text: CustomText;
    }
}

const isMarkActive = (editor: Editor, format: keyof CustomText) => {
    const marks = Editor.marks(editor) as Partial<CustomText> | null;
    return marks ? (marks[format] === true) : false;
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

const ToolbarButton = ({
    format, icon, label, editor,
}: { format: keyof CustomText, icon: string, label: string, editor: Editor }) => (
    <button
        type='button'
        className='btn btn-light btn-sm me-2'
        onMouseDown={(event) => {
            event.preventDefault();
            toggleMark(editor, format);
        }}
        aria-label={label}
        title={label}
    >
        <span>
            {renderHtmlBody(icon)}
        </span>
    </button>
);

const SlateEditor: React.FC<SlateEditorProps> = ({
    value, setValue, placeholder, onSubmit, maxCharacters,
}) => {
    const editor = useMemo(() => withReact(createEditor()), []);
    const [errors, setErrors] = React.useState<string[]>([]);
    const max = maxCharacters ?? 1000;
    const [liveCharCount, setLiveCharCount] = React.useState<number>(0);

    function getCharCount(v: CustomElement[]): number {
        const serializedHtml = serializeToHtml(v);

        // Treat editor scaffolding as empty
        const htmlWithoutEmptyBlocks = serializedHtml
            .replace(/<p>(?:(?:&nbsp;|&#xfeff;|<br\s*\/?>)|\s)*<\/p>/gi, '')
            .trim();

        if (!htmlWithoutEmptyBlocks) return 0;

        return serializedHtml.length;
    }

    const handleChange = (newValue: Descendant[]) => {
        const nextCount = getCharCount(newValue as CustomElement[]);
        setLiveCharCount(nextCount); // Update counter with HTML length

        // Keep source-of-truth in sync
        setValue(newValue as CustomElement[]);

        if (nextCount <= max) {
            setErrors((prev) => prev.filter((e) => !e.startsWith('Message cannot exceed')));
        } else {
            const errorMsg = `Message cannot exceed ${max} characters (including formatting)`;
            setErrors((prev) => (prev.includes(errorMsg) ? prev : [...prev, errorMsg]));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
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
            setErrors([`Message cannot exceed ${max} characters (including formatting)`]);
            return;
        }
        onSubmit?.();
    };

    return (
        <>
            {/*        {errors.length > 0 && (
                <Alert
                    variant='danger'
                    role='alert'
                    aria-live='assertive'
                    id='form-error-summary'
                    data-testid='form-error-summary'
                    className='d-flex mb-3'
                    tabIndex={-1}
                >
                    <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
                        <div className='bgCircle me-3'>
                            <i className='icon-warning' aria-hidden='true' />
                        </div>
                    </div>
                    <div>
                        <Alert.Heading as='h2' className='h5 fw-normal'>
                            The following issue(s) must be corrected before you can continue:
                        </Alert.Heading>
                        <ul>
                            {errors.map((error, idx) => (
                                <li className='text-danger' key={idx}>{error}</li>
                            ))}
                        </ul>
                    </div>
                </Alert>
            )} */}

            <form className='mb-4' onSubmit={handleSubmit}>
                <Slate editor={editor} initialValue={value} onChange={handleChange}>
                    <Editable
                        id='slate-editor'
                        // Slate renders a contenteditable div with role="textbox", which gets
                        // no accessible name from the placeholder the way a native input
                        // would. Name it explicitly with the same text a sighted user sees.
                        aria-label={placeholder || 'Message NMI'}
                        placeholder={placeholder || 'Message NMI'}
                        className='form-control mb-0 border border-bottom-0'
                        style={{ minHeight: '4rem' }}
                        spellCheck
                        renderLeaf={({ attributes, children, leaf }) => {
                            let rendered = children;
                            if ((leaf as CustomText).bold) {
                                rendered = <strong>{rendered}</strong>;
                            }
                            if ((leaf as CustomText).italic) {
                                rendered = <em>{rendered}</em>;
                            }
                            if ((leaf as CustomText).underline) {
                                rendered = <u>{rendered}</u>;
                            }
                            return <span {...attributes}>{rendered}</span>;
                        }}
                    />
                    <div className='d-flex justify-content-between mb-0 py-2 px-3 bg-light border border-top-0'>
                        <div>
                            <ToolbarButton format='bold' icon='<b>B</b>' label='Bold' editor={editor} />
                            <ToolbarButton format='italic' icon='<i>I</i>' label='Italic' editor={editor} />
                            <ToolbarButton format='underline' icon='<u>U</u>' label='Underline' editor={editor} />
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
                                    <i className='icon icon-send' aria-hidden='true' role='presentation' />
                                </span>
                                <span className='visually-hidden'>Send</span>
                            </PrimaryButton>
                        </div>
                    </div>
                    <div className='d-flex justify-content-between'>
                        <div className='text-start mt-1'>
                            {errors.length > 0 && (
                                <span className='text-danger ms-2'>{errors[errors.length - 1]}</span>
                            )}
                        </div>
                        <div className='text-end mt-1'>
                            <span className='me-2 small text-muted'>
                                {liveCharCount}
                                {' '}
                                /
                                {max}
                            </span>
                        </div>
                    </div>
                </Slate>
            </form>
        </>
    );
};

export default SlateEditor;
