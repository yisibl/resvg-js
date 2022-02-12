// @ts-check
const { buildSync } = require('esbuild')

/** @type {import('esbuild').BuildOptions} */
const commonOptions = {
  bundle: true,
  logLevel: 'error',
  entryPoints: ['wasm-binding.ts'],
  define: { 'import.meta.url': 'undefined' },
}

buildSync({
  ...commonOptions,
  format: 'cjs',
  outfile: 'playground/index.js',
})
buildSync({
  ...commonOptions,
  format: 'esm',
  outfile: 'playground/index.mjs',
})
buildSync({
  ...commonOptions,
  format: 'iife',
  minify: true,
  globalName: 'resvg',
  outfile: 'playground/index.min.js',
})
