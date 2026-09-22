export const BROKEN_NOTIFICATION_SELECTOR = '[id^="#notif-"]';
export const FIXED_NOTIFICATION_SELECTOR = '[id^="notif-"]';

export const hasBrokenNotificationSelector = (source: string) =>
	source.includes(BROKEN_NOTIFICATION_SELECTOR);

export const hasBareUseRef = (source: string) =>
	/useRef\s*\(\s*\)\s+as\s+MutableRefObject<[^>]+>/u.test(source);

export const hasCastBasedUseRef = (source: string) =>
	/useRef\([^)]*\)\s+as\s+MutableRefObject<[^>]+>/u.test(source) ||
	/useRef\([^)]*\)\s+as\s+unknown\s*\)\s+as\s+MutableRefObject<[^>]+>/u.test(
		source,
	) ||
	/useRef\([^)]*\)\s*as\s+unknown\s*as\s+MutableRefObject<[^>]+>/u.test(source);

export const hasNullableTypedUseRef = (source: string) =>
	/useRef<[^>]+\|\s*null>\s*\(\s*null\s*\)/u.test(source);

export const hasRenderPhaseNotificationWrites = (source: string) =>
	/if\s*\(\s*(?:errorStatus\.forbidden|forbidden)\s*\)\s*{[\s\S]*?setDashboardNotification\(/u.test(
		source,
	) ||
	/if\s*\(\s*(?:errorStatus\.noThirdPartyAccess|noThirdPartyAccess)\s*\)\s*{[\s\S]*?setDashboardNotification\(/u.test(
		source,
	) ||
	/if\s*\(\s*showInfo\s*\)\s*{[\s\S]*?setDashboardInfoNotification\(/u.test(
		source,
	) ||
	/else\s*{\s*clearDashboardInfoNotification\(\);\s*}/u.test(source) ||
	(/const\s+\w+\s*=\s*\(\)\s*=>\s*{[\s\S]*?setDashboardNotification\(/u.test(
		source,
	) &&
		/if\s*\(\s*(?:errorStatus\.forbidden|forbidden)\s*\)\s*{[\s\S]*?\w+\(\);/u.test(
			source,
		));

export const hasImmediateLoadingChurn = (source: string) =>
	/setIsLoading\(true\);\s*setIsLoading\(false\);/u.test(source) ||
	/setIsLoading\(true\);[\s\S]*?await\s+getQuotationDetails\(\);[\s\S]*?setIsLoading\(false\);/u.test(
		source,
	) ||
	(/const\s+\w+\s*=\s*\(\)\s*=>\s*setIsLoading\(false\);/u.test(source) &&
		/setIsLoading\(true\);[\s\S]*?\w+\(\);[\s\S]*?await\s+\w+\(\);/u.test(
			source,
		));

export const hasTimerUsage = (source: string) => /setTimeout\(/u.test(source);

export const hasEventListener = (source: string) =>
	/addEventListener\(/u.test(source);

export const hasListenerCleanup = (source: string) =>
	/removeEventListener\(/u.test(source);

export const classifyDotnetScript = (source: string) => ({
	hasInfo: /dotnet --info/u.test(source),
	hasRestore: /dotnet restore/u.test(source),
	hasBuild: /dotnet build/u.test(source),
	hasTest: /dotnet test/u.test(source),
	hasPublish: /dotnet publish/u.test(source),
	mentionsAuth: /authentication/iu.test(source),
	mentionsStaticAssets: /static asset/iu.test(source),
	mentionsSsr: /SSR\/prerender|prerender/iu.test(source),
	mentionsCiCd: /CI\/CD|pipeline/iu.test(source),
});
