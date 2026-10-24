declare function braces(
  pattern: string,
  options?: braces.Options
): string | string[];

declare namespace braces {
  interface Options {
    compile?: boolean;
    expand?: boolean;
    escapeInvalid?: boolean;
    maxDepth?: number;
    maxLength?: number;
    nodupes?: boolean;
    rangeLimit?: number;
  }
}

export default braces;
