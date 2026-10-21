export interface StorybookMcpMarkdownReport {
  passingStoryIds: string[];
  failingStoryIds: string[];
  accessibilityViolationStoryIds: string[];
  unhandledErrors: string[];
  missingSections: string[];
}

const REPORT_SECTIONS = [
  'Passing Stories',
  'Failing Stories',
  'Accessibility Violations',
  'Unhandled Errors',
] as const;

const hasSection = (markdown: string, heading: string): boolean =>
  new RegExp(
    `^## ${heading.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*$`,
    'm'
  ).test(markdown);

const sectionLines = (markdown: string, heading: string): string[] => {
  const headingPattern = new RegExp(
    `^## ${heading.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*$`,
    'm'
  );
  const headingMatch = headingPattern.exec(markdown);
  if (headingMatch === null) {
    return [];
  }

  const sectionStart = headingMatch.index + headingMatch[0].length;
  const nextHeading = /^## .+$/m.exec(markdown.slice(sectionStart));
  const section = markdown.slice(
    sectionStart,
    nextHeading === null ? markdown.length : sectionStart + nextHeading.index
  );

  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
};

export const parseMcpMarkdownReport = (
  markdown: string
): StorybookMcpMarkdownReport => ({
  passingStoryIds: sectionLines(markdown, 'Passing Stories'),
  failingStoryIds: sectionLines(markdown, 'Failing Stories'),
  accessibilityViolationStoryIds: sectionLines(
    markdown,
    'Accessibility Violations'
  ),
  unhandledErrors: sectionLines(markdown, 'Unhandled Errors'),
  missingSections: REPORT_SECTIONS.filter(
    (heading) => !hasSection(markdown, heading)
  ),
});
