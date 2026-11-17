import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/bin.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  clean: true,
  bundle: true,
  skipNodeModulesBundle: true,
  noExternal: [/^@contribpilot\//],
  splitting: false,
  sourcemap: false,
  minify: false,
});
