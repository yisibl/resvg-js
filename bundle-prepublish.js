// @ts-check
const { buildSync } = require('esbuild')

buildSync({
  entryPoints: ['js-binding.js'],
  allowOverwrite: true,
  outfile: 'js-binding.js',
  logLevel: 'info',
  minify: true,
})

buildSync({
  entryPoints: ['cli/cli.js'],
  outfile: 'cli.js',
  logLevel: 'info',
  minify: false,
  bundle: true,
  platform: 'node',
  external: ['./index'],
})
