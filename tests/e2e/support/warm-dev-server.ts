import type { FullConfig } from '@playwright/test';

const WARMUP_TIMEOUT_MS = 120_000;
const SCRIPT_SRC_PATTERN = /<script[^>]+src="([^"]+)"/g;

const fetchText = async (url: string) => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(WARMUP_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Warm-up request failed: ${url} -> ${response.status}`);
  }
  return response.text();
};

// The dev server builds its bundles on first request, which would otherwise
// land inside the first test's 30s navigation timeout on every worker.
export default async function warmDevServer(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) {
    throw new Error('warm-dev-server requires use.baseURL to be configured');
  }

  const html = await fetchText(`${baseURL}/dashboard`);
  const scriptUrls = [...html.matchAll(SCRIPT_SRC_PATTERN)].map(
    ([, src]) => new URL(src ?? '', baseURL).href
  );
  await Promise.all(scriptUrls.map(fetchText));
}
