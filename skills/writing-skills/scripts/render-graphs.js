#!/usr/bin/env node

/**
 * Render fenced DOT diagrams in <skill-directory>/SKILL.md.
 * Usage: node render-graphs.js <skill-directory> [--combine]
 * Requires Graphviz dot in a standard location, or absolute GRAPHVIZ_DOT.
 * Combined SVG embeds independently rendered graphs, preserving their labels
 * and namespaces. Its .dot companion holds the original multi-graph inputs.
 */

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

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

function readFence(line) {
  const indent = /^ {0,3}/.exec(line)[0].length;
  const marker = line[indent];
  if (marker !== '`' && marker !== '~') return null;
  let end = indent;
  while (line[end] === marker) end++;
  if (end - indent < 3) return null;
  return { marker: line.slice(indent, end), info: line.slice(end) };
}

function isClosingFence(line, fence) {
  const closing = readFence(line);
  return (
    closing?.marker.startsWith(fence.marker) && /^[ \t]*$/.test(closing.info)
  );
}

function dotBlock(body, index) {
  const content = body.join('\n').trim();
  // The name affects only a portable filename; Graphviz parses DOT.
  const header = /\bdigraph(?:\s+(?:"((?:\\.|[^"\\])*)"|([^\s{]+)))?\s*\{/.exec(
    content,
  );
  const name = header?.[1] ?? header?.[2] ?? `graph_${index + 1}`;
  return { name, content };
}

function extractDotBlocks(markdown) {
  const blocks = [];
  let fence = null;
  let body = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (!fence) {
      const opening = readFence(line);
      if (opening)
        fence = { marker: opening.marker, dot: opening.info.trim() === 'dot' };
      continue;
    }
    if (isClosingFence(line, fence)) {
      if (fence.dot) blocks.push(dotBlock(body, blocks.length));
      fence = null;
      body = [];
      continue;
    }
    if (fence.dot) body.push(line);
  }
  if (fence?.dot) throw new Error('Unclosed DOT code fence in SKILL.md.');
  return blocks;
}

function unclosedGraph() {
  return new Error(
    'Each DOT block must contain one graph with closed strings, comments and braces.',
  );
}

function skipDelimited(content, start, opening, closing, error) {
  const end = content.indexOf(closing, start + opening.length);
  if (end === -1) throw error;
  return end + closing.length;
}

function skipQuotedString(content, start) {
  let cursor = start + 1;
  while (cursor < content.length) {
    if (content[cursor] === '"') return cursor + 1;
    cursor += content[cursor] === '\\' ? 2 : 1;
  }
  throw unclosedGraph();
}

function skipHtmlSpecial(content, cursor, inTag) {
  if (content.startsWith('<!--', cursor)) {
    return skipDelimited(
      content,
      cursor,
      '<!--',
      '-->',
      new Error('Unclosed HTML comment in DOT.'),
    );
  }
  const char = content[cursor];
  if (inTag && (char === '"' || char === "'")) {
    return skipDelimited(content, cursor, char, char, unclosedGraph());
  }
  return cursor;
}

function skipHtmlString(content, start) {
  let cursor = start + 1;
  let depth = 1;
  let inTag = false;
  while (cursor < content.length) {
    const next = skipHtmlSpecial(content, cursor, inTag);
    if (next !== cursor) {
      cursor = next;
      continue;
    }
    const char = content[cursor];
    if (char === '<') {
      depth++;
      inTag = true;
    } else if (char === '>') {
      depth--;
      inTag = false;
      if (depth === 0) return cursor + 1;
    }
    cursor++;
  }
  throw unclosedGraph();
}

function skipDotTrivia(content, cursor) {
  if (content[cursor] === '#' || content.startsWith('//', cursor)) {
    const end = content.indexOf('\n', cursor);
    return end === -1 ? content.length : end + 1;
  }
  if (content.startsWith('/*', cursor)) {
    return skipDelimited(content, cursor, '/*', '*/', unclosedGraph());
  }
  return /\s/.test(content[cursor]) ? cursor + 1 : cursor;
}

function skipDotString(content, cursor) {
  if (content[cursor] === '"') return skipQuotedString(content, cursor);
  if (content[cursor] === '<') return skipHtmlString(content, cursor);
  return cursor + 1;
}

function assertOneGraph(content) {
  // This is a lexical boundary check, not a DOT grammar parser. Keep comments
  // and strings opaque; Graphviz owns attributes, identifiers and layout.
  let depth = 0;
  let complete = false;
  let cursor = 0;
  while (cursor < content.length) {
    const next = skipDotTrivia(content, cursor);
    if (next !== cursor) {
      cursor = next;
      continue;
    }
    if (complete)
      throw new Error('Each DOT block must contain exactly one graph.');
    const char = content[cursor];
    if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth < 0) throw new Error('Unmatched closing brace in DOT.');
      complete = depth === 0;
    }
    cursor = skipDotString(content, cursor);
  }
  if (!complete) throw unclosedGraph();
}

function runDot(executable, content) {
  assertOneGraph(content);
  const result = spawnSync(executable, ['-Tsvg'], {
    input: content,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: 30000,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (result.error) throw result.error;
  // Graphviz may exit0 after dropping an unavailable image or approximating
  // unsupported input. Preserve its diagnostics and fail instead of implying
  // that the requested visual survived intact.
  const diagnostic = (result.stderr ?? '').trim();
  if (result.status !== 0 || diagnostic) {
    throw new Error(
      diagnostic || `Graphviz failed with status ${result.status}.`,
    );
  }
  const svg = result.stdout;
  if ([...svg.matchAll(/<svg\b/g)].length !== 1) {
    throw new Error('Each DOT block must contain exactly one graph.');
  }
  return svg;
}

function resolveDotExecutable() {
  const configured = process.env.GRAPHVIZ_DOT;
  const candidates = [
    ...(configured && path.isAbsolute(configured) ? [configured] : []),
    ...(defaultDotPaths[process.platform] ?? defaultDotPaths.linux),
  ];
  for (const candidate of candidates) {
    try {
      const executable = fs.realpathSync(candidate);
      if (runDot(executable, 'digraph probe {}').includes('<svg'))
        return executable;
    } catch {
      // Try the next configured/standard Graphviz location.
    }
  }
  throw new Error(
    'Graphviz dot not found; set GRAPHVIZ_DOT to its absolute path.',
  );
}

function trimBoundaryDots(stem) {
  let start = 0;
  let end = stem.length;
  while (stem[start] === '.') start++;
  while (end > start && stem[end - 1] === '.') end--;
  return stem.slice(start, end);
}

function portableStem(name) {
  let stem = name
    .replaceAll('-', '_')
    .replace(/[^a-zA-Z0-9_.]/g, '_')
    .slice(0, 80);
  stem = trimBoundaryDots(stem);
  if (!stem) stem = 'graph';
  if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(stem))
    stem = `_${stem}`;
  return stem;
}

function uniqueStems(blocks) {
  const used = new Set();
  return blocks.map((block) => {
    const base = portableStem(block.name);
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate.toLowerCase())) candidate = `${base}_${suffix++}`;
    used.add(candidate.toLowerCase());
    return candidate;
  });
}

function prepareOutputDirectory(skillDir) {
  const directory = path.join(skillDir, 'diagrams');
  const stat = fs.lstatSync(directory, { throwIfNoEntry: false });
  if (stat) {
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(
        'The diagrams output directory must be a real directory inside the skill.',
      );
    }
  }
  fs.mkdirSync(directory, { recursive: true });
  if (fs.realpathSync(directory) !== directory) {
    throw new Error(
      'The diagrams output directory resolves outside its expected location.',
    );
  }
  return directory;
}

function writeArtifact(directory, filename, content) {
  const target = path.join(directory, filename);
  const stat = fs.lstatSync(target, { throwIfNoEntry: false });
  if (stat) {
    if (stat.isSymbolicLink() || !stat.isFile()) {
      throw new Error(
        `Refusing to replace a linked or non-file output: ${filename}`,
      );
    }
  }
  // Rename a new local file instead of following an existing file symlink.
  const temporary = path.join(directory, `.render-${randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporary, content, { flag: 'wx' });
    fs.renameSync(temporary, target);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
  process.stdout.write(`  Rendered: ${filename}\n`);
}

function combineSvgs(svgs) {
  let y = 0;
  let width = 0;
  const images = svgs.map((svg) => {
    for (const image of svg.matchAll(
      /<image\b[^>]*\b(?:xlink:)?href="([^"]+)"/g,
    )) {
      if (!image[1].startsWith('data:')) {
        throw new Error(
          'Combined SVG cannot contain external image references.',
        );
      }
    }
    const opening = /<svg\b[^>]*>/.exec(svg)?.[0] ?? '';
    const graphWidth = Number(/\bwidth="([\d.]+)pt"/.exec(opening)?.[1]);
    const graphHeight = Number(/\bheight="([\d.]+)pt"/.exec(opening)?.[1]);
    if (!(
      graphWidth > 0
      && graphHeight > 0
      && Number.isFinite(graphWidth)
      && Number.isFinite(graphHeight)
    )) {
      throw new Error(
        'Graphviz returned SVG without supported finite dimensions.',
      );
    }
    const image = `  <image x="0" y="${y}" width="${graphWidth}" height="${graphHeight}" href="data:image/svg+xml;base64,${Buffer.from(svg, 'utf-8').toString('base64')}"/>`;
    width = Math.max(width, graphWidth);
    y += graphHeight + 24;
    return image;
  });
  const height = y - 24;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}pt" height="${height}pt" viewBox="0 0 ${width} ${height}">\n${images.join('\n')}\n</svg>\n`;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    process.stdout.write(
      'Usage: render-graphs.js <skill-directory> [--combine]\n',
    );
    return;
  }
  const positional = args.filter((argument) => !argument.startsWith('--'));
  if (
    positional.length !== 1
    || args.filter((argument) => argument === '--combine').length > 1
    || args.some(
      (argument) => argument.startsWith('--') && argument !== '--combine',
    )
  ) {
    throw new Error('Usage: render-graphs.js <skill-directory> [--combine]');
  }
  const combine = args.includes('--combine');
  const skillDir = fs.realpathSync(path.resolve(positional[0]));
  const skillFile = path.join(skillDir, 'SKILL.md');
  const blocks = extractDotBlocks(fs.readFileSync(skillFile, 'utf-8'));
  if (blocks.length === 0) {
    process.stdout.write(`No dot blocks found in ${skillFile}\n`);
    return;
  }
  const dot = resolveDotExecutable();
  process.stdout.write(
    `Found ${blocks.length} diagram(s) in ${path.basename(skillDir)}/SKILL.md\n`,
  );
  const outputDir = prepareOutputDirectory(skillDir);
  if (combine) {
    // Render each graph before writing composed output. Graphviz owns parsing
    // and layout, and embedded SVGs keep independent IDs and label semantics.
    const svg = combineSvgs(blocks.map((block) => runDot(dot, block.content)));
    const name = `${portableStem(path.basename(skillDir))}_combined`;
    writeArtifact(outputDir, `${name}.svg`, svg);
    writeArtifact(
      outputDir,
      `${name}.dot`,
      blocks.map((block) => block.content).join('\n\n'),
    );
  } else {
    const stems = uniqueStems(blocks);
    let failed = false;
    for (const [index, block] of blocks.entries()) {
      try {
        writeArtifact(
          outputDir,
          `${stems[index]}.svg`,
          runDot(dot, block.content),
        );
      } catch (error) {
        failed = true;
        process.stderr.write(`Failed diagram ${index + 1}: ${error.message}\n`);
      }
    }
    if (failed) process.exitCode = 1;
  }
  process.stdout.write(`Output: ${outputDir}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exitCode = 1;
}
