/** @type {import('esbuild').BuildOptions} */
const commonOptions = {
  entryPoints: ['cli/cli.ts'],
  outfile: 'cli.js',
  logLevel: 'info',
  minify: false,
  bundle: true,
  platform: 'node',
  external: ['./index', './package.json'],
}

if (process.argv?.[2] === '--watch') {
  require('esbuild')
    .context(commonOptions)
    .then(async (ctx) => {
      await ctx.watch()
    })
} else {
  require('esbuild').buildSync(commonOptions)
}
