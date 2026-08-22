export type HideRule<TValues> = boolean | ((values: TValues) => boolean) | undefined;

export type Hideable<TField = unknown, TValues = unknown> = {
    [K in keyof TField]?: NonNullable<TField[K]> extends object
        ? Hideable<NonNullable<TField[K]>, TValues> | HideRule<TValues>
        : HideRule<TValues>;
} & {
    this?: HideRule<TValues>;
    [key: string]: unknown;
};
