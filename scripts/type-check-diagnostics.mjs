import path from 'node:path';
import ts from 'typescript';
import { makeDirectory, readTextFile, writeTextFile } from './safe-file-io.mjs';

const outputFlag = process.argv.indexOf('--out');
const outputPath = outputFlag >= 0 ? process.argv[outputFlag + 1] : undefined;

if (outputFlag >= 0 && !outputPath) {
  process.stderr.write('The --out option requires a file path.\n');
  process.exitCode = 2;
} else {
  const projectRoot = process.cwd();
  const configPath = ts.findConfigFile(
    projectRoot,
    ts.sys.fileExists,
    'tsconfig.json',
  );

  if (!configPath) {
    process.stderr.write('Unable to locate tsconfig.json.\n');
    process.exitCode = 2;
  } else {
    const configFile = ts.readConfigFile(configPath, (file) =>
      readTextFile(file, projectRoot),
    );
    const configDiagnostics = configFile.error ? [configFile.error] : [];
    const parsed = configFile.error
      ? undefined
      : ts.parseJsonConfigFileContent(
          configFile.config,
          ts.sys,
          path.dirname(configPath),
        );
    const parseDiagnostics = parsed?.errors ?? [];
    const program = parsed
      ? ts.createProgram({
          rootNames: parsed.fileNames,
          options: parsed.options,
        })
      : undefined;
    const diagnostics = program
      ? ts.getPreEmitDiagnostics(program)
      : [...configDiagnostics, ...parseDiagnostics];
    const categoryNames = ['warning', 'error', 'suggestion', 'message'];
    const entries = diagnostics.map((diagnostic) => {
      const position = diagnostic.file?.getLineAndCharacterOfPosition(
        diagnostic.start ?? 0,
      );

      return {
        code: diagnostic.code,
        category: categoryNames[diagnostic.category] ?? 'unknown',
        file: diagnostic.file?.fileName,
        line: position ? position.line + 1 : undefined,
        column: position ? position.character + 1 : undefined,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      };
    });
    const errorCount = entries.filter(
      ({ category }) => category === 'error',
    ).length;
    const report = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      projectRoot,
      configFile: path.relative(projectRoot, configPath),
      typescriptVersion: ts.version,
      sourceFileCount: parsed?.fileNames.length ?? 0,
      counts: {
        total: entries.length,
        errors: errorCount,
      },
      diagnostics: entries,
    };
    const serialized = `${JSON.stringify(report, null, 2)}\n`;

    if (outputPath) {
      const resolvedOutput = path.resolve(projectRoot, outputPath);
      makeDirectory(path.dirname(resolvedOutput), projectRoot);
      writeTextFile(resolvedOutput, serialized, undefined, projectRoot);
      process.stdout.write(`TypeScript diagnostics written to ${outputPath}\n`);
    } else {
      process.stdout.write(serialized);
    }

    process.exitCode = errorCount > 0 ? 1 : 0;
  }
}
