import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
    hasBareUseRef,
    hasBrokenNotificationSelector,
    hasCastBasedUseRef,
    hasEventListener,
    hasImmediateLoadingChurn,
    hasListenerCleanup,
    hasNullableTypedUseRef,
    hasRenderPhaseNotificationWrites,
    hasTimerUsage,
} from '../support/verifierDetectors';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const repoRoot = path.resolve(currentDir, '../../../../');

const readRepoFile = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('migration checklist static verifier', () => {
    it('pins the current audited route findings in dashboard and quotation', () => {
        const dashboard = readRepoFile('static/js/routes/dashboard/index.tsx');
        const quotation = readRepoFile('static/js/routes/quotation/index.tsx');

        expect(hasBrokenNotificationSelector(dashboard)).toBe(true);
        expect(hasRenderPhaseNotificationWrites(dashboard)).toBe(true);

        expect(hasBrokenNotificationSelector(quotation)).toBe(true);
        expect(hasRenderPhaseNotificationWrites(quotation)).toBe(true);
        expect(hasImmediateLoadingChurn(quotation)).toBe(true);
    });

    it('pins the current audited ref typing issue in mailingLabel', () => {
        const mailingLabel = readRepoFile('static/js/components/Utilities/mailingLabel.tsx');

        expect(hasBareUseRef(mailingLabel)).toBe(true);
        expect(hasCastBasedUseRef(mailingLabel)).toBe(true);
        expect(hasNullableTypedUseRef(mailingLabel)).toBe(false);
    });

    it('pins the timeout and listener-sensitive files called out for runtime validation', () => {
        const files = [
            'static/js/components/forms/ErrorSummary/index.tsx',
            'static/js/components/Utilities/routeAccessibleNavigation.tsx',
            'static/js/components/Utilities/routeChangeScrollTop.tsx',
            'static/js/components/Inputs/AutoSuggest/AutoSuggestContainer.tsx',
            'static/js/components/Inputs/OrganisationNameLookup/index.tsx',
            'static/js/components/Pagination/useVisiblePageRange.tsx',
        ].map(readRepoFile);

        expect(files.filter(hasTimerUsage).length).toBeGreaterThanOrEqual(5);
        expect(files.filter(hasEventListener).length).toBeGreaterThanOrEqual(3);
        expect(files.filter(hasListenerCleanup).length).toBeGreaterThanOrEqual(3);
    });

    it('accepts the first green fixtures as valid migration targets', () => {
        const dashboardGreen = readRepoFile('.github/migration-verifier/fixtures/green/clean-react19/dashboard.fixed.tsx');
        const quotationGreen = readRepoFile('.github/migration-verifier/fixtures/green/strictmode-clean/quotation.fixed.tsx');
        const mailingLabelGreen = readRepoFile('.github/migration-verifier/fixtures/green/ts6-clean/mailingLabel.fixed.tsx');

        expect(hasBrokenNotificationSelector(dashboardGreen)).toBe(false);
        expect(hasRenderPhaseNotificationWrites(dashboardGreen)).toBe(false);

        expect(hasBrokenNotificationSelector(quotationGreen)).toBe(false);
        expect(hasRenderPhaseNotificationWrites(quotationGreen)).toBe(false);
        expect(hasImmediateLoadingChurn(quotationGreen)).toBe(false);

        expect(hasBareUseRef(mailingLabelGreen)).toBe(false);
        expect(hasCastBasedUseRef(mailingLabelGreen)).toBe(false);
        expect(hasNullableTypedUseRef(mailingLabelGreen)).toBe(true);
    });

    it('flags the first red fixtures for the same reasons as the merged audit', () => {
        const dashboardRed = readRepoFile('.github/migration-verifier/fixtures/red/render-side-effects/dashboard.render-side-effects.tsx');
        const selectorRed = readRepoFile('.github/migration-verifier/fixtures/red/broken-selector/handleAlertScroll.broken.ts');
        const quotationRed = readRepoFile('.github/migration-verifier/fixtures/red/loading-flicker/quotation.loading-flicker.tsx');
        const useRefRed = readRepoFile('.github/migration-verifier/fixtures/red/bare-useref/mailingLabel.bare-useref.tsx');

        expect(hasRenderPhaseNotificationWrites(dashboardRed)).toBe(true);
        expect(hasBrokenNotificationSelector(selectorRed)).toBe(true);
        expect(hasImmediateLoadingChurn(quotationRed)).toBe(true);
        expect(hasBareUseRef(useRefRed)).toBe(true);
    });

    it('rejects the first edge fixtures that try to hide incomplete fixes', () => {
        const partialSelector = readRepoFile('.github/migration-verifier/fixtures/edge/partial-selector-fix/notificationSelectors.mixed.ts');
        const hiddenSideEffect = readRepoFile('.github/migration-verifier/fixtures/edge/helper-hidden-side-effect/dashboard.helper-side-effect.tsx');
        const fakeUseRef = readRepoFile('.github/migration-verifier/fixtures/edge/fake-useref-fix/mailingLabel.fake-fix.tsx');
        const helperLoadingRace = readRepoFile('.github/migration-verifier/fixtures/edge/helper-loading-race/quotation.helper-loading-race.tsx');
        const unstableListener = readRepoFile('.github/migration-verifier/fixtures/edge/unstable-listener-cleanup/routeListener.no-cleanup.tsx');

        expect(hasBrokenNotificationSelector(partialSelector)).toBe(true);
        expect(hasRenderPhaseNotificationWrites(hiddenSideEffect)).toBe(true);
        expect(hasBareUseRef(fakeUseRef)).toBe(false);
        expect(hasCastBasedUseRef(fakeUseRef)).toBe(true);
        expect(hasImmediateLoadingChurn(helperLoadingRace)).toBe(true);
        expect(hasEventListener(unstableListener)).toBe(true);
        expect(hasListenerCleanup(unstableListener)).toBe(false);
    });
});
