#!/usr/bin/env node

/**
 * Render graphviz diagrams from a skill's SKILL.md to SVG files.
 *
 * Usage:
 *   ./render-graphs.js <skill-directory>           # Render each diagram separately
 *   ./render-graphs.js <skill-directory> --combine # Combine all into one diagram
 *
 * Extracts all ```dot blocks from SKILL.md and renders to SVG.
 * Useful for helping the user visualize the process flows.
 *
 * Requires: graphviz (dot) in a standard location, or set GRAPHVIZ_DOT to
 * its absolute path.
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';

const defaultDotPaths = {
  win32: [
    String.raw`C:\Program Files\Graphviz\bin\dot.exe`,
    String.raw`C:\Program Files (x86)\Graphviz\bin\dot.exe`,
    String.raw`C:\ProgramData\chocolatey\bin\dot.exe`,
  ],
  darwin: [
    '/opt/homebrew/bin/dot',
    '/usr/local/bin/dot',
    '/opt/local/bin/dot',
    '/usr/bin/dot',
  ],
  linux: ['/usr/bin/dot', '/usr/local/bin/dot', '/snap/bin/dot'],
};

function writeLine(message) {
  process.stdout.write(`${message}\n`);
}

function resolveExistingPath(candidate) {
  try {
    return fs.realpathSync(candidate);
  } catch {
    return null;
  }
}

function extractDotBlocks(markdown) {
  const blocks = [];
  const regex = /```dot\n([\s\S]*?)```/gu;
  let match = regex.exec(markdown);

  while (match !== null) {
    const content = match[1].trim();

    // Extract digraph name
    const nameMatch = /digraph\s+(\w+)/u.exec(content);
    const name = nameMatch ? nameMatch[1] : `graph_${blocks.length + 1}`;

    blocks.push({ name, content });
    match = regex.exec(markdown);
  }

  return blocks;
}

function extractGraphBody(dotContent) {
  // Extract just the body (nodes and edges) from a digraph
  const headerMatch = /digraph\s+\w+\s*\{/u.exec(dotContent);
  if (!headerMatch) return '';

  const bodyStart = headerMatch.index + headerMatch[0].length;
  const bodyEnd = dotContent.lastIndexOf('}');
  if (bodyEnd < bodyStart) return '';

  let body = dotContent.slice(bodyStart, bodyEnd);

  // Remove rankdir (we'll set it once at the top level). Testing trimmed lines
  // avoids the overlapping \s* quantifiers that backtrack super-linearly.
  const rankdirLine = /^rankdir\s*=\s*\w+\s*;?$/u;
  body = body
    .split('\n')
    .filter((line) => !rankdirLine.test(line.trim()))
    .join('\n');

  return body.trim();
}

function combineGraphs(blocks, skillName) {
  const bodies = blocks.map((block, i) => {
    const body = extractGraphBody(block.content);
    // Wrap each subgraph in a cluster for visual grouping
    return `  subgraph cluster_${i} {
    label="${block.name}";
    ${body
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n')}
  }`;
  });

  return `digraph ${skillName}_combined {
  rankdir=TB;
  compound=true;
  newrank=true;

${bodies.join('\n\n')}
}`;
}

function resolveDotExecutable() {
  const configuredDot = process.env.GRAPHVIZ_DOT;
  const platformPaths =
    defaultDotPaths[process.platform] ?? defaultDotPaths.linux;
  const configuredCandidate = path.isAbsolute(configuredDot ?? '')
    ? resolveExistingPath(configuredDot)
    : null;
  const trustedDefaults = platformPaths
    .map(resolveExistingPath)
    .filter((candidate) => candidate !== null);
  const candidates = [configuredCandidate, ...trustedDefaults].filter(
    (candidate) => candidate !== null
  );

  return [...new Set(candidates)].find((candidate) => {
    try {
      const output = execFileSync(candidate, ['-Tsvg'], {
        input: 'digraph probe {}',
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024,
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      return output.includes('<svg');
    } catch {
      return false;
    }
  });
}

function renderToSvg(dotExecutable, dotContent) {
  try {
    return execFileSync(dotExecutable, ['-Tsvg'], {
      input: dotContent,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err) {
    console.error('Error running dot:', err.message);
    if (err.stderr) console.error(err.stderr.toString());
    return null;
  }
}

function main() {
  const args = process.argv.slice(2);
  const combine = args.includes('--combine');
  const skillDirArg = args.find((a) => !a.startsWith('--'));

  if (!skillDirArg) {
    console.error('Usage: render-graphs.js <skill-directory> [--combine]');
    console.error('');
    console.error('Options:');
    console.error('  --combine    Combine all diagrams into one SVG');
    console.error('');
    console.error('Example:');
    console.error('  ./render-graphs.js ../subagent-driven-development');
    console.error(
      '  ./render-graphs.js ../subagent-driven-development --combine'
    );
    process.exit(1);
  }

  const skillDir = path.resolve(skillDirArg);
  const skillFile = path.join(skillDir, 'SKILL.md');
  const skillName = path.basename(skillDir).replaceAll('-', '_');

  if (!fs.existsSync(skillFile)) {
    console.error(`Error: ${skillFile} not found`);
    process.exit(1);
  }

  const dotExecutable = resolveDotExecutable();
  if (!dotExecutable) {
    console.error('Error: graphviz (dot) not found in a standard location.');
    console.error('Set GRAPHVIZ_DOT to its absolute path or install with:');
    console.error('  brew install graphviz    # macOS');
    console.error('  apt install graphviz     # Linux');
    process.exit(1);
  }

  const markdown = fs.readFileSync(skillFile, 'utf-8');
  const blocks = extractDotBlocks(markdown);

  if (blocks.length === 0) {
    writeLine(`No \`\`\`dot blocks found in ${skillFile}`);
    process.exit(0);
  }

  writeLine(
    `Found ${blocks.length} diagram(s) in ${path.basename(skillDir)}/SKILL.md`
  );

  const outputDir = path.join(skillDir, 'diagrams');
  fs.mkdirSync(outputDir, { recursive: true });

  if (combine) {
    // Combine all graphs into one
    const combined = combineGraphs(blocks, skillName);
    const svg = renderToSvg(dotExecutable, combined);
    if (svg) {
      const outputPath = path.join(outputDir, `${skillName}_combined.svg`);
      fs.writeFileSync(outputPath, svg);
      writeLine(`  Rendered: ${skillName}_combined.svg`);

      // Also write the dot source for debugging
      const dotPath = path.join(outputDir, `${skillName}_combined.dot`);
      fs.writeFileSync(dotPath, combined);
      writeLine(`  Source: ${skillName}_combined.dot`);
    } else {
      console.error('  Failed to render combined diagram');
    }
  } else {
    // Render each separately
    for (const block of blocks) {
      const svg = renderToSvg(dotExecutable, block.content);
      if (svg) {
        const outputPath = path.join(outputDir, `${block.name}.svg`);
        fs.writeFileSync(outputPath, svg);
        writeLine(`  Rendered: ${block.name}.svg`);
      } else {
        console.error(`  Failed: ${block.name}`);
      }
    }
  }

  writeLine(`\nOutput: ${outputDir}/`);
}

main();
