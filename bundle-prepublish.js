// @ts-check
const { buildSync } = require('esbuild')

require('./bundle-cli')

buildSync({
  entryPoints: ['js-binding.js'],
  allowOverwrite: true,
  outfile: 'js-binding.js',
  logLevel: 'info',
  minify: true,
})
