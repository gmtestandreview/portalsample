import { test, expect } from '@playwright/test';

test.describe('migration checklist runtime verifier', () => {
    test('demonstrates why the audited notification selector is broken', async ({ page }) => {
        await page.setContent('<div id="notif-message-1" tabindex="-1">Saved</div>');

        const matchCounts = await page.evaluate(() => ({
            broken: document.querySelectorAll('[id^="#notif-"]').length,
            fixed: document.querySelectorAll('[id^="notif-"]').length,
        }));

        expect(matchCounts.broken).toBe(0);
        expect(matchCounts.fixed).toBe(1);
    });

    test('shows the corrected alert focus contract the dashboard and quotation routes need', async ({ page }) => {
        await page.setContent('<div id="notif-message-1" tabindex="-1">Saved</div>');

        const focusedId = await page.evaluate(async () => {
            const focusWithSelector = (selector: string) => {
                const el = document.querySelector(selector) as HTMLElement | null;
                el?.focus();
                return document.activeElement?.id ?? '';
            };

            focusWithSelector('[id^="#notif-"]');
            const afterBroken = document.activeElement?.id ?? '';
            const afterFixed = focusWithSelector('[id^="notif-"]');

            return JSON.stringify({ afterBroken, afterFixed });
        });

        expect(JSON.parse(focusedId)).toEqual({
            afterBroken: '',
            afterFixed: 'notif-message-1',
        });
    });

    test('models the routeAccessibleNavigation timer cleanup needed for StrictMode remounts', async ({ page }) => {
        const updates = await page.evaluate(async () => {
            const messages: string[] = [];

            const mountNavigationEffect = (path: string, title: string) => {
                let timeoutId: number | undefined;

                if (path.slice(1)) {
                    timeoutId = window.setTimeout(() => {
                        messages.push(`Navigated to ${title} page.`);
                    }, 100);
                } else {
                    messages.push(`Navigated to ${title} page.`);
                }

                return () => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                };
            };

            const cleanup = mountNavigationEffect('/dashboard', 'Dashboard');
            cleanup();
            mountNavigationEffect('/quotation', 'Quotation');
            await new Promise((resolve) => window.setTimeout(resolve, 150));
            return messages;
        });

        expect(updates).toEqual(['Navigated to Quotation page.']);
    });

    test('models the quotation loading race the migration needs to remove', async ({ page }) => {
        const timelines = await page.evaluate(async () => {
            const brokenTimeline: boolean[] = [];
            const fixedTimeline: boolean[] = [];

            const brokenFlow = async () => {
                let isLoading = false;
                const record = () => brokenTimeline.push(isLoading);
                const fakeAsync = () => new Promise<void>((resolve) => window.setTimeout(resolve, 50));

                isLoading = true;
                record();
                isLoading = false;
                record();
                await fakeAsync();
                record();
            };

            const fixedFlow = async () => {
                let isLoading = false;
                const record = () => fixedTimeline.push(isLoading);
                const fakeAsync = () => new Promise<void>((resolve) => window.setTimeout(resolve, 50));

                isLoading = true;
                record();
                try {
                    await fakeAsync();
                    record();
                } finally {
                    isLoading = false;
                    record();
                }
            };

            await brokenFlow();
            await fixedFlow();

            return { brokenTimeline, fixedTimeline };
        });

        expect(timelines.brokenTimeline).toEqual([true, false, false]);
        expect(timelines.fixedTimeline).toEqual([true, true, false]);
    });
});
