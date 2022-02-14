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
  outfile: 'wasm/index.js',
})
buildSync({
  ...commonOptions,
  format: 'esm',
  outfile: 'wasm/index.mjs',
})
buildSync({
  ...commonOptions,
  format: 'iife',
  minify: true,
  globalName: 'resvg',
  outfile: 'wasm/index.min.js',
})
