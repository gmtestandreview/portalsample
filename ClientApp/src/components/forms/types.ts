import type { AnyObjectSchema } from 'yup';

/** Library-neutral shape of any form's values. */
export type FormValues = Record<string, any>;

/** Nested validation messages keyed like the form values. */
export type FormErrors<TValues> = {
  [K in keyof TValues]?: TValues[K] extends any[]
    ? TValues[K][number] extends object
      ? FormErrors<TValues[K][number]>[] | string | string[]
      : string | string[]
    : TValues[K] extends object
      ? FormErrors<TValues[K]> | string
      : string;
};

export interface DiscardProps {
  locationOnDiscard?: string;
  discardButtonTitle?: string;
  cancelButtonTitle?: string;
  showCancelButton?: boolean;
  locationOnCancel?: string;
  onDiscard?: () => void;
  onCancel?: () => void;
  [key: string]: unknown;
}

export interface ModalProps {
  titleText?: string;
  bodyText?: JSX.Element | string;
  modalTitle?: string;
  modalBodyText?: JSX.Element | string;
  yesButtonTitle?: string;
  noButtonTitle?: string;
  [key: string]: unknown;
}

export type ValidationSchema = Pick<AnyObjectSchema, 'validate'>;

export type Validation<T extends FormValues = FormValues> =
  | ValidationSchema
  | ((values: T) => Record<string, unknown> | Promise<Record<string, unknown>>);

export type HideRule<TValues> =
  boolean | ((values: TValues) => boolean) | undefined;

export type Hideable<TField = unknown, TValues = unknown> = {
  [K in keyof TField]?: NonNullable<TField[K]> extends object
    ? Hideable<NonNullable<TField[K]>, TValues> | HideRule<TValues>
    : HideRule<TValues>;
} & {
  this?: HideRule<TValues>;
  [key: string]: unknown;
};
