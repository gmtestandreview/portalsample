import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import Ajv from "ajv";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const ignoredDirectories = new Set([
	".claude",
	".git",
	".worktrees",
	"coverage",
	"node_modules",
	"reports",
	"storybook-static",
]);
const jsoncFiles = new Set(["tsconfig.json"]);
const ignoredPathParts = [
	path.join("ClientApp", "css"),
	path.join("ClientApp", "source-map-http-downloads"),
	path.join("ClientApp", "src", "api"),
	path.join("ClientApp", "webpack"),
];

const jsonFiles = [];
const failures = [];

const ajvDraft7 = addFormats(
	new Ajv({
		allErrors: true,
		strict: true,
	}),
);
const ajvDraft2020 = addFormats(
	new Ajv2020({
		allErrors: true,
		strict: true,
	}),
);

const toRelativePath = (filePath) => path.relative(root, filePath);

const shouldIgnorePath = (filePath) => {
	const relativePath = toRelativePath(filePath);

	return ignoredPathParts.some((ignoredPathPart) =>
		relativePath.startsWith(ignoredPathPart),
	);
};

const collectJsonFiles = async (directory) => {
	if (shouldIgnorePath(directory)) {
		return;
	}

	const entries = await readdir(directory, { withFileTypes: true });

	await Promise.all(
		entries.map(async (entry) => {
			if (entry.isDirectory()) {
				if (ignoredDirectories.has(entry.name)) {
					return;
				}

				await collectJsonFiles(path.join(directory, entry.name));
				return;
			}

			if (entry.isFile() && entry.name.endsWith(".json")) {
				if (jsoncFiles.has(entry.name)) {
					return;
				}

				jsonFiles.push(path.join(directory, entry.name));
			}
		}),
	);
};

const isSchemaFile = (filePath) => {
	const fileName = path.basename(filePath);

	return fileName === "schema.json" || fileName.endsWith(".schema.json");
};

const getAjvForSchema = (schema) => {
	if (
		typeof schema.$schema === "string" &&
		schema.$schema.includes("2020-12")
	) {
		return ajvDraft2020;
	}

	return ajvDraft7;
};

await collectJsonFiles(root);

const parsedFiles = await Promise.all(
	jsonFiles
		.toSorted((left, right) => left.localeCompare(right))
		.map(async (filePath) => {
			try {
				const content = await readFile(filePath, "utf8");
				const parsed = JSON.parse(content);

				return { filePath, parsed };
			} catch (error) {
				failures.push(
					`${toRelativePath(filePath)}: invalid JSON (${error.message})`,
				);
			}
		}),
);

const schemaFiles = parsedFiles
	.filter((result) => result !== undefined && isSchemaFile(result.filePath))
	.map((result) => result);

for (const { filePath, parsed } of schemaFiles) {
	try {
		getAjvForSchema(parsed).compile(parsed);
	} catch (error) {
		failures.push(
			`${toRelativePath(filePath)}: invalid JSON Schema (${error.message})`,
		);
	}
}

if (failures.length > 0) {
	console.error("JSON validation failed:");
	failures.forEach((failure) => {
		console.error(`- ${failure}`);
	});
	process.exitCode = 1;
} else {
	process.stdout.write(`Validated JSON syntax in ${jsonFiles.length} files.\n`);
	process.stdout.write(`Compiled ${schemaFiles.length} JSON Schema files.\n`);
}
