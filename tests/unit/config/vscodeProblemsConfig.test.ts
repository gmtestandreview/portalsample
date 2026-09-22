import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "../../..");

function readJson<T>(relativePath: string): T {
	return JSON.parse(
		readFileSync(path.join(repoRoot, relativePath), "utf8"),
	) as T;
}

describe("VS Code Problems configuration", () => {
	it("keeps workspace diagnostics aligned with clean-code Problems visibility", () => {
		const settings = readJson<Record<string, unknown>>(".vscode/settings.json");

		expect(settings["sonarlint.focusOnNewCode"]).toBe(true);
		expect(settings["eslint.enable"]).toBe(true);
		expect(settings["eslint.lintTask.enable"]).toBe(true);
		expect(settings["eslint.workingDirectories"]).toEqual([
			{ mode: "location" },
		]);
		expect(settings["eslint.validate"]).toEqual([
			"javascript",
			"javascriptreact",
			"typescript",
			"typescriptreact",
		]);
		expect(settings["js/ts.tsdk.path"]).toBe("./node_modules/typescript/lib");
	});

	it("recommends extensions that contribute repository diagnostics", () => {
		const extensions = readJson<{ recommendations: string[] }>(
			".vscode/extensions.json",
		);

		expect(extensions.recommendations).toEqual(
			expect.arrayContaining([
				"ms-playwright.playwright",
				"alexkrechik.cucumberautocomplete",
				"charliermarsh.ruff",
				"dbaeumer.vscode-eslint",
				"sonarsource.sonarlint-vscode",
			]),
		);
	});

	it("has a VS Code rule-citation adapter script", () => {
		const script = readFileSync(
			path.join(repoRoot, "scripts/vscode-rule-citation-problems.mjs"),
			"utf8",
		);

		expect(script).toContain("verify-rule-citations.mjs");
		expect(script).toContain("formatProblem");
		expect(script).toContain("MISCITED");
		expect(script).toContain("UNRESOLVED");
	});

	it("the rule-citation adapter emits VS Code parseable diagnostics", () => {
		const result = spawnSync(
			process.execPath,
			["scripts/vscode-rule-citation-problems.mjs"],
			{
				cwd: repoRoot,
				encoding: "utf8",
			},
		);

		expect(result.status).toBe(0);
		const diagnosticLines = result.stdout
			.split(/\r?\n/u)
			.filter(
				(line) => line.includes("): warning ") || line.includes("): error "),
			);

		expect(diagnosticLines.length).toBeGreaterThan(0);
		expect(diagnosticLines[0]).toMatch(
			/^[^(]+\(\d+,\d+\): (warning|error) RULE-\d+: \[[A-Z_]+\] .+$/u,
		);
	});

	it("defines VS Code tasks that feed diagnostics into Problems", () => {
		const tasks = readJson<{
			version: string;
			tasks: Array<{
				label: string;
				type?: string;
				script?: string;
				command?: string;
				args?: string[];
				dependsOn?: string[];
				dependsOrder?: string;
				problemMatcher?: unknown;
			}>;
		}>(".vscode/tasks.json");

		expect(tasks.version).toBe("2.0.0");

		const byLabel = new Map(tasks.tasks.map((task) => [task.label, task]));

		expect(byLabel.get("diagnostics: type-check")).toMatchObject({
			type: "npm",
			script: "type-check",
			problemMatcher: ["$tsc"],
		});
		expect(byLabel.get("diagnostics: eslint")).toMatchObject({
			type: "npm",
			script: "lint",
			problemMatcher: ["$eslint-stylish"],
		});
		expect(byLabel.get("diagnostics: rule citations")).toMatchObject({
			type: "process",
			command: "node",
			args: ["scripts/vscode-rule-citation-problems.mjs"],
		});
		expect(byLabel.get("diagnostics: all")?.dependsOn).toEqual([
			"diagnostics: type-check",
			"diagnostics: eslint",
			"diagnostics: rule citations",
			"diagnostics: sonar backlog",
		]);
		expect(byLabel.get("diagnostics: all")?.dependsOrder).not.toBe("sequence");
	});

	it("RED: the combined diagnostics task does not fail fast before later problem sources run", () => {
		const tasks = readJson<{
			tasks: Array<{
				label: string;
				dependsOn?: string[];
				dependsOrder?: string;
			}>;
		}>(".vscode/tasks.json");

		const allDiagnostics = tasks.tasks.find(
			(task) => task.label === "diagnostics: all",
		);

		expect(allDiagnostics?.dependsOn).toEqual([
			"diagnostics: type-check",
			"diagnostics: eslint",
			"diagnostics: rule citations",
			"diagnostics: sonar backlog",
		]);
		expect(allDiagnostics?.dependsOrder).not.toBe("sequence");
	});

	it("GREEN: exposes every repository diagnostic source as a runnable VS Code task", () => {
		const tasks = readJson<{ tasks: Array<{ label: string }> }>(
			".vscode/tasks.json",
		);
		const labels = tasks.tasks.map((task) => task.label);

		expect(labels).toEqual(
			expect.arrayContaining([
				"diagnostics: type-check",
				"diagnostics: eslint",
				"diagnostics: rule citations",
				"diagnostics: sonar backlog",
				"diagnostics: all",
			]),
		);
	});

	it("AMBER: keeps Sonar editor Problems clean-code focused while requiring a full backlog task", () => {
		const settings = readJson<Record<string, unknown>>(".vscode/settings.json");
		const tasks = readJson<{ tasks: Array<{ label: string }> }>(
			".vscode/tasks.json",
		);

		expect(settings["sonarlint.focusOnNewCode"]).toBe(true);
		expect(
			tasks.tasks.some((task) => task.label === "diagnostics: sonar backlog"),
		).toBe(true);
	});
});
