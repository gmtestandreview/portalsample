export const BROKEN_NOTIFICATION_SELECTOR = '[id^="#notif-"]';
export const FIXED_NOTIFICATION_SELECTOR = '[id^="notif-"]';

export const hasBrokenNotificationSelector = (source: string) => (
    source.includes(BROKEN_NOTIFICATION_SELECTOR)
);

export const hasBareUseRef = (source: string) => (
    /useRef\s*\(\s*\)\s+as\s+MutableRefObject<[^>]+>/.test(source)
);

export const hasCastBasedUseRef = (source: string) => (
    /useRef\([^)]*\)\s+as\s+MutableRefObject<[^>]+>/.test(source)
    || /useRef\([^)]*\)\s+as\s+unknown\s*\)\s+as\s+MutableRefObject<[^>]+>/.test(source)
    || /useRef\([^)]*\)\s*as\s+unknown\s*as\s+MutableRefObject<[^>]+>/.test(source)
);

export const hasNullableTypedUseRef = (source: string) => (
    /useRef<[^>]+\|\s*null>\s*\(\s*null\s*\)/.test(source)
);

export const hasRenderPhaseNotificationWrites = (source: string) => (
    /if\s*\(\s*(?:errorStatus\.forbidden|forbidden)\s*\)\s*{[\s\S]*?setDashboardNotification\(/.test(source)
    || /if\s*\(\s*(?:errorStatus\.noThirdPartyAccess|noThirdPartyAccess)\s*\)\s*{[\s\S]*?setDashboardNotification\(/.test(source)
    || /if\s*\(\s*showInfo\s*\)\s*{[\s\S]*?setDashboardInfoNotification\(/.test(source)
    || /else\s*{\s*clearDashboardInfoNotification\(\);\s*}/.test(source)
    || (
        /const\s+\w+\s*=\s*\(\)\s*=>\s*{[\s\S]*?setDashboardNotification\(/.test(source)
        && /if\s*\(\s*(?:errorStatus\.forbidden|forbidden)\s*\)\s*{[\s\S]*?\w+\(\);/.test(source)
    )
);

export const hasImmediateLoadingChurn = (source: string) => (
    /setIsLoading\(true\);\s*setIsLoading\(false\);/.test(source)
    || /setIsLoading\(true\);[\s\S]*?await\s+getQuotationDetails\(\);[\s\S]*?setIsLoading\(false\);/.test(source)
    || (
        /const\s+\w+\s*=\s*\(\)\s*=>\s*setIsLoading\(false\);/.test(source)
        && /setIsLoading\(true\);[\s\S]*?\w+\(\);[\s\S]*?await\s+\w+\(\);/.test(source)
    )
);

export const hasTimerUsage = (source: string) => /setTimeout\(/.test(source);

export const hasEventListener = (source: string) => /addEventListener\(/.test(source);

export const hasListenerCleanup = (source: string) => /removeEventListener\(/.test(source);

export const classifyDotnetScript = (source: string) => ({
    hasInfo: /dotnet --info/.test(source),
    hasRestore: /dotnet restore/.test(source),
    hasBuild: /dotnet build/.test(source),
    hasTest: /dotnet test/.test(source),
    hasPublish: /dotnet publish/.test(source),
    mentionsAuth: /authentication/i.test(source),
    mentionsStaticAssets: /static asset/i.test(source),
    mentionsSsr: /SSR\/prerender|prerender/i.test(source),
    mentionsCiCd: /CI\/CD|pipeline/i.test(source),
});
