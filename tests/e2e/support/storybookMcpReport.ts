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

const markdownLines = (markdown: string): string[] => markdown.split(/\r?\n/);

const sectionIndex = (markdown: string, heading: string): number =>
  markdownLines(markdown).findIndex(
    (line) => line.trimEnd() === `## ${heading}`
  );

const hasSection = (markdown: string, heading: string): boolean =>
  sectionIndex(markdown, heading) !== -1;

const sectionLines = (markdown: string, heading: string): string[] => {
  const lines = markdownLines(markdown);
  const headingLine = sectionIndex(markdown, heading);
  if (headingLine === -1) {
    return [];
  }

  const nextHeading = lines.findIndex(
    (line, index) => index > headingLine && line.startsWith('## ')
  );

  return lines
    .slice(headingLine + 1, nextHeading === -1 ? undefined : nextHeading)
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
