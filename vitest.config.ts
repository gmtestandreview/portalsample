import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(dirname, "ClientApp/src"),
		},
	},
	test: {
		// One-off by default. A bare `vitest` (no `run`) otherwise sits in watch
		// mode "Waiting for file changes"; under coverage + Browser Mode that
		// long-lived process grows past the default Node heap and OOMs after a
		// few minutes. The `test:*:watch` scripts opt back in with `--watch`.
		watch: false,
		projects: ["./vitest.unit.config.ts", "./vitest.storybook.config.ts"],
	},
});
