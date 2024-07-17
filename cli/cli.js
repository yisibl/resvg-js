const process = require('process')

process.on('uncaughtException', (err) => {
  console.error(err.message || err)
  process.exit(1)
})

process.stdin.on('data', (key) => {
  // ensure catch SIGINT signal like control+c
  // eslint-disable-next-line eqeqeq
  if (key == '\u0003') {
    process.exit(130) // 128 + SIGINT
  }
})

async function bootsrap(argvs = process.argv) {
  const { version } = require('../package.json')

  const minimist = require('minimist')
  /** @type {import ('./help.d').CLIOptions & import('minimist').ParsedArgs} */
  const parsedArgv = minimist(argvs.slice(2, argvs.length), {
    alias: {
      v: 'version',
      h: 'help',
    },
  })

  if (parsedArgv.version) {
    // eslint-disable-next-line no-console
    console.log(version)
  } else if (parsedArgv.help) {
    const { printHelp } = require('./help')
    printHelp(version)
  } else {
    // Main
    const { transformOptions } = require('./option')
    const [paths, resvgOptions] = transformOptions(parsedArgv)

    // Input
    /** @type {import ('../index.d').RenderedImage | null} */
    let fileData = null
    const { Resvg } = require('../index')
    if (paths.input !== '-') {
      const { promises } = require('fs')
      const svgBuffer = await promises.readFile(paths.input)
      const resvg = new Resvg(svgBuffer, resvgOptions)
      fileData = resvg.render()
    } else {
      const { getBufferFromStdin } = require('./util')
      const svgBuffer = await getBufferFromStdin()
      const resvg = new Resvg(svgBuffer, resvgOptions)
      fileData = resvg.render()
    }

    // Output
    if (paths.output && fileData) {
      const { promises } = require('fs')
      const { logger } = require('./util')
      // TODO: wait for add more output formats, e.g. avif, webp, JPEG XL
      await promises.writeFile(paths.output, fileData.asPng())
      switch (resvgOptions?.logLevel) {
        case 'off':
          break
        case 'info':
          logger.info(paths.output, `{ width: ${fileData.width}, height: ${fileData.height} }`, 'image')
          break
        default:
          logger.info(paths.output)
          break
      }
    } else {
      process.stdout.write(fileData.asPng())
    }
  }
}

bootsrap()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err.message || err)
    process.exit(1)
  })
