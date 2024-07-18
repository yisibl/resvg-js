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
    const { createLogger } = require('./util')
    const { transformOptions } = require('./option')
    const logger = createLogger(parsedArgv?.['log-level'])
    const [paths, resvgOptions] = transformOptions(parsedArgv, logger)

    // Input
    /** @type {import ('../index.d').RenderedImage | null} */
    let fileData = null
    const { Resvg } = require('../index')
    const { getBufferFromStdin, writeBufferToStdout } = require('./util')
    if (paths.input !== '-') {
      const { promises } = require('fs')
      const svgBuffer = await promises.readFile(paths.input)
      const resvg = new Resvg(svgBuffer, resvgOptions)
      fileData = resvg.render()
    } else {
      const svgBuffer = await getBufferFromStdin()
      const resvg = new Resvg(svgBuffer, resvgOptions)
      fileData = resvg.render()
    }

    // Output
    // TODO: wait for add more output formats, e.g. avif, webp, JPEG XL
    const imageBuffer = fileData.asPng()
    if (paths.output && fileData) {
      const { promises } = require('fs')
      await promises.writeFile(paths.output, imageBuffer)
      if (resvgOptions?.logLevel === 'info') {
        // Have specify info level options
        logger.info(paths.output, `{ width: ${fileData.width}, height: ${fileData.height} }`, 'image')
      } else {
        // default will output image path
        logger.info(paths.output)
      }
    } else {
      await writeBufferToStdout(imageBuffer)
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
