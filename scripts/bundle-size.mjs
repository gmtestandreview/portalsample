// Records raw and gzip size of the production bundle in dist/js.
// Run after `npm run build`:
//   node scripts/bundle-size.mjs [output.json]
// Without an argument the result is printed only. Chunk names strip the
// content hash so two builds can be compared by name.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const JS_DIR = join(process.cwd(), 'dist', 'js');
const HASH_SUFFIX = /\.[0-9a-f]{8}(?=\.js$)/;

const chunks = readdirSync(JS_DIR)
  .filter((file) => file.endsWith('.js'))
  .sort()
  .map((file) => {
    const content = readFileSync(join(JS_DIR, file));
    return {
      name: file.replace(HASH_SUFFIX, ''),
      rawBytes: statSync(join(JS_DIR, file)).size,
      gzipBytes: gzipSync(content).length,
    };
  });

const total = chunks.reduce(
  (sum, chunk) => ({
    rawBytes: sum.rawBytes + chunk.rawBytes,
    gzipBytes: sum.gzipBytes + chunk.gzipBytes,
  }),
  { rawBytes: 0, gzipBytes: 0 }
);
const result = { node: process.version, chunks, total };

const output = process.argv[2];
if (output) {
  writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
}
console.log(
  `${chunks.length} chunks, raw ${total.rawBytes} B, gzip ${total.gzipBytes} B`
);
