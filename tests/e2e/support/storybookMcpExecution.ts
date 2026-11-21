import { expect, type APIRequestContext } from '@playwright/test';
import {
  executeMcpTestRun,
  readMcpEvent,
  type McpEnvelope,
} from './storybookHelpers';
import {
  parseMcpMarkdownReport,
  type StorybookMcpMarkdownReport,
} from './storybookMcpReport';

export interface NormalizedReceipt {
  ok: boolean;
  errors: { code: string; message: string }[];
  report?: StorybookMcpMarkdownReport;
  receipt?: {
    requestedStoryIds: string[];
    executedStoryIds: string[];
    componentTestStatuses: McpStatus[];
    a11yStatuses: McpStatus[];
  };
}

interface McpStatus {
  storyId: string;
  status: string;
}

const readStructuredContent = (envelope: McpEnvelope) => {
  const textBlocks = envelope.result?.content?.flatMap((block) =>
    block.type === 'text' && block.text !== undefined ? [block.text] : [],
  );
  const contentText = textBlocks?.join('\n');
  const contentStructured = textBlocks
    ?.map((text) => {
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return undefined;
      }
    })
    .find(
      (value) =>
        value !== undefined &&
        typeof value === 'object' &&
        value !== null &&
        'status' in value,
    );

  return {
    contentText,
    structuredContent: envelope.result?.structuredContent ?? contentStructured,
  };
};

const assertStructuredExecution = (
  structuredContent: unknown,
  storyIds: string[],
): { componentTestStatuses: McpStatus[]; a11yStatuses: McpStatus[] } => {
  const completedContent = structuredContent as {
    status?: string;
    result?: {
      componentTestStatuses?: McpStatus[];
      a11yStatuses?: McpStatus[];
      counts?: {
        requested?: number;
        executed?: number;
        component?: number;
        a11y?: number;
      };
      unhandledErrors?: unknown[];
    };
  };
  const execution = completedContent.result;
  const componentTestStatuses = execution?.componentTestStatuses ?? [];
  const a11yStatuses = execution?.a11yStatuses ?? [];

  expect(completedContent.status).toBe('completed');
  expect(
    componentTestStatuses
      .map(({ storyId }) => storyId)
      .sort((a, b) => a.localeCompare(b)),
  ).toEqual([...storyIds].sort((a, b) => a.localeCompare(b)));
  expect(
    a11yStatuses
      .map(({ storyId }) => storyId)
      .sort((a, b) => a.localeCompare(b)),
  ).toEqual([...storyIds].sort((a, b) => a.localeCompare(b)));
  expect(
    componentTestStatuses.every(
      ({ status }) => status === 'status-value:success',
    ),
  ).toBe(true);
  expect(
    a11yStatuses.every(({ status }) => status === 'status-value:success'),
  ).toBe(true);
  expect(execution?.counts).toEqual({
    requested: storyIds.length,
    executed: storyIds.length,
    component: storyIds.length,
    a11y: storyIds.length,
  });
  expect(execution?.unhandledErrors).toEqual([]);

  return { componentTestStatuses, a11yStatuses };
};

const assertMarkdownExecution = (
  contentText: string | undefined,
  storyIds: string[],
): StorybookMcpMarkdownReport => {
  const report = parseMcpMarkdownReport(contentText ?? '');
  const passingStoryIds = [...new Set(report.passingStoryIds)].sort((a, b) =>
    a.localeCompare(b),
  );
  const requestedStoryIds = [...storyIds].sort((a, b) => a.localeCompare(b));

  expect(report.missingSections).not.toContain('Passing Stories');
  expect(passingStoryIds).toEqual(requestedStoryIds);
  expect(
    report.failingStoryIds.filter((storyId) => storyIds.includes(storyId)),
  ).toEqual([]);
  expect(report.accessibilityViolationStoryIds).toEqual([]);
  expect(report.unhandledErrors).toEqual([]);
  return report;
};

export const executeAndAssertMcpTestRun = async (
  request: APIRequestContext,
  storyIdsText: string,
): Promise<NormalizedReceipt> => {
  const storyIds = storyIdsText
    .split(',')
    .map((storyId) => storyId.trim())
    .filter(Boolean);
  const testRun = await executeMcpTestRun(request, storyIds);

  expect(testRun.status()).toBe(200);

  const envelope = await readMcpEvent(testRun, 11);

  expect(envelope.error).toBeUndefined();

  const { contentText, structuredContent } = readStructuredContent(envelope);
  const reportEvidence =
    structuredContent === undefined
      ? assertMarkdownExecution(contentText, storyIds)
      : undefined;
  const { componentTestStatuses, a11yStatuses } =
    structuredContent === undefined
      ? { componentTestStatuses: [], a11yStatuses: [] }
      : assertStructuredExecution(structuredContent, storyIds);
  const componentStoryIds =
    reportEvidence?.passingStoryIds ??
    componentTestStatuses.map(({ storyId }) => storyId);

  return {
    ok: true,
    errors: [],
    ...(reportEvidence === undefined ? {} : { report: reportEvidence }),
    receipt: {
      requestedStoryIds: storyIds,
      executedStoryIds: componentStoryIds,
      componentTestStatuses,
      a11yStatuses,
    },
  };
};
