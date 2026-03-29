import { build } from 'esbuild';

await build({
  entryPoints: ['src/demo.js'],
  outfile: 'dist/demo.js',
  format: 'iife',
  bundle: true,
  minify: true,
  target: 'es2020',
});

console.log('✓ Built dist/demo.js');
