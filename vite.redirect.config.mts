import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { APPLICATION_VENDOR_CHUNK_GROUPS } from './storybook-vite-policies.ts';

const dirname = path.dirname(fileURLToPath(import.meta.url));

function assetFileNames(assetInfo: {
  name?: string;
  names?: string[];
}): string {
  const assetName = assetInfo.names?.[0] ?? assetInfo.name ?? '';
  const lowerCaseName = assetName.toLowerCase();

  if (lowerCaseName.endsWith('.css')) {
    return 'css/[name].[hash:8][extname]';
  }

  if (/\.(woff2?|eot|ttf|otf)$/u.test(lowerCaseName)) {
    return 'fonts/[name][extname]';
  }

  if (lowerCaseName.endsWith('.svg')) {
    return 'images/[name][extname]';
  }

  return 'assets/[name].[hash:8][extname]';
}

export default defineConfig({
  base: '/',
  publicDir: false,
  build: {
    outDir: 'dist/client',
    emptyOutDir: false,
    sourcemap: true,
    rolldownOptions: {
      input: {
        redirect: path.resolve(dirname, 'redirect.html'),
      },
      output: {
        entryFileNames: 'js/[name].[hash:8].js',
        chunkFileNames: 'js/[name].[hash:8].js',
        assetFileNames,
        codeSplitting: {
          groups: [...APPLICATION_VENDOR_CHUNK_GROUPS],
        },
      },
    },
  },
});
