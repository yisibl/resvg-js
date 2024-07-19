import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import stream from 'node:stream'

import type { ResvgRenderOptions } from '../index'

import { isColorizenSupport, createStyle } from './style'

/** log level => allow log level */
const defaultShouldLogMapping = {
  trace: ['trace', 'debug', 'info', 'warn', 'error'],
  debug: ['debug', 'info', 'warn', 'error'],
  info: ['info', 'warn', 'error'],
  warn: ['warn', 'error'],
  error: ['error'],
  off: [],
}
function defaultShouldLog(
  logName: Required<ResvgRenderOptions>['logLevel'],
  logLevel: keyof typeof defaultShouldLogMapping,
) {
  return defaultShouldLogMapping[logLevel].indexOf(logName as never) !== -1
}

export function createLogger(logLevel: ResvgRenderOptions['logLevel'] = 'info', shouldLogCB = defaultShouldLog) {
  // ensure all log output 2 stderr channel
  const pc = createStyle(isColorizenSupport(true, 2))
  const { ___X_CMD_THEME_COLOR_CODE } = process.env
  const pcInf = ___X_CMD_THEME_COLOR_CODE ? pc.rgb(___X_CMD_THEME_COLOR_CODE) : pc.green
  const emptyFn = () => {}
  return {
    logLevel,
    debug: shouldLogCB('debug', logLevel)
      ? (msg: string, extraInfo?: string, extraName = 'help') => {
          process.stderr.write(`- ${pcInf(pc.inverse('D') + '|resvg-js')}: ${msg}\n`)
          if (extraInfo) process.stderr.write(`  ${pcInf(extraName + ':')} ${extraInfo}\n`)
        }
      : emptyFn,
    info: shouldLogCB('info', logLevel)
      ? (msg: string, extraInfo?: string, extraName = 'help') => {
          process.stderr.write(`- ${pcInf('I|resvg-js')}: ${msg}\n`)
          if (extraInfo) process.stderr.write(`  ${pcInf(extraName + ':')} ${extraInfo}\n`)
        }
      : emptyFn,
    warn: shouldLogCB('warn', logLevel)
      ? (msg: string, extraInfo?: string, extraName = 'help') => {
          process.stderr.write(`${pc.yellow('-' + ' ' + pc.bold(pc.inverse('W') + '|resvg-js: ' + msg))}\n`)
          if (extraInfo) process.stderr.write(`  ${pc.yellow(extraName + ':')} ${extraInfo}\n`)
        }
      : emptyFn,
    error: shouldLogCB('error', logLevel)
      ? (msg: string, extraInfo?: string, extraName = 'help') => {
          process.stderr.write(`${pc.red('-' + ' ' + pc.bold(pc.inverse('E') + '|resvg-js: ' + msg))}\n`)
          if (extraInfo) process.stderr.write(`  ${pc.red(extraName + ':')} ${extraInfo}\n`)
        }
      : emptyFn,
  }
}

export type Logger = ReturnType<typeof createLogger>

/**
 * Exit directly and prompt for unknown options
 * @param {string} command_options_key
 */
export function unkonwOptionExit(key: string, logger = createLogger()) {
  logger.error(`Unkonw option ==> --${key}`, 'Show more detail `--log-level debug`, or show help `resvg-js --help`')
  process.exit(1)
}

/**
 * Get the input and output paths
 */
export function getPathsByArgs(tmpInput: string, tmpOutput: string, logger = createLogger()) {
  if (!tmpInput) {
    logger.error('Please provide an input file path', 'resvg-js [OPTIONS] <input_svg_path|"-"> [output_png_path]')
    process.exit(1)
  }
  const base = process.cwd()
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

export async function getBufferFromStdin(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    process.stdin.on('data', (chunk) => chunks.push(chunk))
    process.stdin.on('error', (err) => reject(err))
    process.stdin.on('end', () => {
      const buffer = Buffer.concat(chunks)
      resolve(buffer)
    })
  })
}

export async function writeBufferToStdout(buffer: Buffer) {
  return new Promise((resolve) => {
    const rawStream = new stream.Readable({
      read: function () {
        if (buffer.length === 0) {
          this.push(null)
          resolve(void 0)
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
