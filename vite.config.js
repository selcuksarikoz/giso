import { defineConfig } from 'vite';
import { resolve } from 'path';
import terser from '@rollup/plugin-terser';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/gisq.js'),
      name: 'gisq', // Optional, not strictly needed for Node.js ESM build
      formats: ['es'], // Output as an ES module
      fileName: () => 'gisq.js', // Output filename with .js extension
    },
    outDir: 'bin',
    emptyOutDir: true,
    minify: 'terser',
    rollupOptions: {
      plugins: [terser()],
      output: {
        // Configure output for Node.js ESM environment
        format: 'es', // Ensure Rollup also outputs ES module
        exports: 'named', // Preserve named exports
      },
      external: [
        'fs',
        'path',
        'readline',
        'child_process',
        'node-fetch',
        'chalk',
        'inquirer',
        'os',
        'url',
        'crypto',
      ],
    },
  },
  clearScreen: false,
  ssr: {
    external: [
      'fs',
      'path',
      'readline',
      'child_process',
      'node-fetch',
      'chalk',
      'inquirer',
      'os',
      'url',
      'crypto',
    ],
  },
});
