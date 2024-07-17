const process = require('process')

function createLogger() {
  const { createStyle } = require('./style')
  const pc = createStyle()
  const { ___X_CMD_THEME_COLOR_CODE } = process.env
  const pcInf = ___X_CMD_THEME_COLOR_CODE ? pc.rgb(___X_CMD_THEME_COLOR_CODE) : pc.green
  return {
    info: (msg, extraInfo, extraName = 'help') => {
      process.stderr.write(`- ${pcInf('I|resvg-js')}: ${msg}\n`)
      !!extraInfo && process.stderr.write(`  ${pcInf(extraName + ':')} ${extraInfo}\n`)
    },
    warn: (msg, extraInfo, extraName = 'help') => {
      process.stderr.write(`${pc.yellow('-' + ' ' + pc.bold(pc.inverse('W') + '|resvg-js: ' + msg))}\n`)
      !!extraInfo && process.stderr.write(`  ${pc.yellow(extraName + ':')} ${extraInfo}\n`)
    },
    error: (msg, extraInfo, extraName = 'help') => {
      process.stderr.write(`${pc.red('-' + ' ' + pc.bold(pc.inverse('E') + '|resvg-js: ' + msg))}\n`)
      !!extraInfo && process.stderr.write(`  ${pc.red(extraName + ':')} ${extraInfo}\n`)
    },
  }
}
module.exports.createLogger = createLogger

const logger = createLogger()
module.exports.logger = logger

/**
 * Exit directly and prompt for unknown options
 * @param {string} command_options_key
 */
module.exports.unkonwOptionExit = function unkonwOptionExit(key) {
  logger.error(`Unkonw option ==> --${key}`, 'Show more detail `--log-level debug`, or show help `resvg-js --help`')
  process.exit(1)
}

/**
 * Get the input and output paths
 * @param {string} tmpInput
 * @param {string|undefined} tmpOutput
 */
module.exports.getPathsByArgs = function getPathsByArgs(tmpInput, tmpOutput) {
  if (!tmpInput) {
    logger.error('Please provide an input file path', 'resvg-js [OPTIONS] <input_svg_path|"-"> [output_png_path]')
    process.exit(1)
  }
  const base = process.cwd()
  const { resolve } = require('path')
  const { existsSync } = require('fs')
  const input = tmpInput === '-' ? tmpInput : resolve(base, tmpInput)
  if (input !== '-' && !existsSync(input)) {
    logger.error('Input file not found. please check file exsit.', `=> ${input}`)
    process.exit(1)
  }

  if (tmpOutput) {
    const output = resolve(base, tmpOutput)
    return { input, output }
  } else {
    return { input }
  }
}

module.exports.getBufferFromStdin = async function () {
  return new Promise((resolve, reject) => {
    const chunks = []
    process.stdin.on('data', (chunk) => chunks.push(chunk))
    process.stdin.on('error', (err) => reject(err))
    process.stdin.on('end', () => {
      const buffer = Buffer.concat(chunks)
      resolve(buffer)
    })
  })
}

module.exports.writeBufferToStdout = async function (buffer) {
  return new Promise((resolve) => {
    const stream = require('stream')
    const rawStream = new stream.Readable({
      read: function () {
        if (buffer.length === 0) {
          this.push(null)
          resolve()
        } else {
          const chunkSize = 1024 // 1KB
          const chunk = buffer.subarray(0, chunkSize)
          buffer = buffer.subarray(chunkSize)
          this.push(chunk)
        }
      },
    })

    rawStream.pipe(process.stdout)
  })
}
