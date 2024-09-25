import { writeFile, readFile } from 'node:fs/promises'
import process from 'node:process'

import minimist from 'minimist'

import { Resvg } from '../index'

import type { CLIOptions } from './help'
import { printHelp } from './help'
import { transformOptions, transformPaths } from './option'
import { createLogger, getBufferFromStdin, writeBufferToStdout } from './util'

process.on('uncaughtException', (err) => {
  console.error(err.message || err)
  process.exit(1)
})

process.on('SIGINT', () => {
  process.exit(130) // 128 + SIGINT
})

export type ParsedArgs = CLIOptions & minimist.ParsedArgs

export async function main(argvs = process.argv) {
  const { version } = require('../package.json')
  const parsedArgv: ParsedArgs = minimist<CLIOptions>(argvs.slice(2, argvs.length), {
    alias: {
      v: 'version',
      h: 'help',
    },
  })

  if (parsedArgv.version) {
    console.info(version)
  } else if (parsedArgv.help) {
    printHelp(version)
  } else {
    // Main
    const logger = createLogger(parsedArgv?.['log-level'])
    logger.debug('Argv', JSON.stringify(parsedArgv), 'JSON')
    const paths = transformPaths(parsedArgv, logger)
    const resvgOptions = transformOptions(parsedArgv, logger)

    // Input
    let fileData = null
    if (paths.input !== '-') {
      const svgBuffer = await readFile(paths.input)
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
      await writeFile(paths.output, imageBuffer)
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

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err.message || err)
    process.exit(1)
  })
