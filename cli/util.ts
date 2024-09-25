import { Buffer } from 'node:buffer'
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

export const logFormatter = () => {
  // ensure all log output 2 stderr channel
  const pc = createStyle(isColorizenSupport(true, 2))
  const { ___X_CMD_THEME_COLOR_CODE } = process.env
  const pcInf = ___X_CMD_THEME_COLOR_CODE ? pc.rgb(___X_CMD_THEME_COLOR_CODE) : pc.green
  return {
    debug: (msg: string, extraInfo?: string, extraName = 'help') => {
      const base = `- ${pc.blue(pc.inverse('D') + '|resvg-js')}: ${msg}\n`
      return extraInfo ? base + `  ${pc.blue(extraName + ':')} ${extraInfo}\n` : base
    },
    info: (msg: string, extraInfo?: string, extraName = 'help') => {
      const base = `- ${pcInf('I|resvg-js')}: ${msg}\n`
      return extraInfo ? base + `  ${pcInf(extraName + ':')} ${extraInfo}\n` : base
    },
    warn: (msg: string, extraInfo?: string, extraName = 'help') => {
      const base = `${pc.yellow('-' + ' ' + pc.bold(pc.inverse('W') + '|resvg-js: ' + msg))}\n`
      return extraInfo ? base + `  ${pc.yellow(extraName + ':')} ${extraInfo}\n` : base
    },
    error: (msg: string, extraInfo?: string, extraName = 'help') => {
      const base = `${pc.red('-' + ' ' + pc.bold(pc.inverse('E') + '|resvg-js: ' + msg))}\n`
      return extraInfo ? base + `  ${pc.red(extraName + ':')} ${extraInfo}\n` : base
    },
  }
}

export function createLogger(logLevel: ResvgRenderOptions['logLevel'] = 'info', shouldLogCB = defaultShouldLog) {
  const emptyFn = () => {}
  const logger = logFormatter()
  return {
    logLevel,
    debug: shouldLogCB('debug', logLevel)
      ? (msg: string, extraInfo?: string, extraName = 'help') =>
          process.stderr.write(logger.debug(msg, extraInfo, extraName))
      : emptyFn,
    info: shouldLogCB('info', logLevel)
      ? (msg: string, extraInfo?: string, extraName = 'help') =>
          process.stderr.write(logger.info(msg, extraInfo, extraName))
      : emptyFn,
    warn: shouldLogCB('warn', logLevel)
      ? (msg: string, extraInfo?: string, extraName = 'help') =>
          process.stderr.write(logger.warn(msg, extraInfo, extraName))
      : emptyFn,
    error: shouldLogCB('error', logLevel)
      ? (msg: string, extraInfo?: string, extraName = 'help') =>
          process.stderr.write(logger.error(msg, extraInfo, extraName))
      : emptyFn,
  }
}

export type Logger = ReturnType<typeof createLogger>

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
