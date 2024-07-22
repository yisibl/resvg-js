import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

import type { ResvgRenderOptions } from '../index'

import type { ParsedArgs } from './cli'
import { createLogger, logFormatter } from './util'

/**
 * transform argv to input and output path
 */
export function transformPaths(parsedArgv: ParsedArgs, logger = createLogger()) {
  const [tmpInput, tmpOutput] = parsedArgv._
  if (!tmpInput) {
    throw new Error(
      logFormatter()
        .error('Please provide svg input file path', 'resvg-js [OPTIONS] <input_svg_path|"-"> [output_image_path]')
        .trim(),
    )
  }
  const base = process.cwd()
  const input = tmpInput === '-' ? tmpInput : resolve(base, tmpInput)
  if (input !== '-' && !existsSync(input)) {
    throw new Error(
      logFormatter().error('Input file not found. please check file exsit.', `==> ${input}`, 'input').trim(),
    )
  }

  const output = tmpOutput ? resolve(base, tmpOutput) : undefined
  const result = output ? { input, output } : { input }
  logger.debug('Input and Output Path', JSON.stringify(result), 'JSON')
  return result
}

type ResvgOptionsKeys =
  | keyof ResvgRenderOptions
  | keyof Required<ResvgRenderOptions>['font']
  | keyof Required<ResvgRenderOptions>['crop']
/** Allow partial options using Camel-Case */
const optionMapping: Record<string, ResvgOptionsKeys> = {
  // font
  'system-font': 'loadSystemFonts',
  'font-file': 'fontFiles',
  'font-dir': 'fontDirs',
  'font-default-size': 'defaultFontSize',
  'font-default-family': 'defaultFontFamily',
  'font-serif-family': 'serifFamily',
  'font-sans-serif-family': 'sansSerifFamily',
  'font-cursive-family': 'cursiveFamily',
  'font-fantasy-family': 'fantasyFamily',
  'font-monospace-family': 'monospaceFamily',
  // rendering
  'shape-rendering': 'shapeRendering',
  shapeRendering: 'shapeRendering',
  'text-rendering': 'textRendering',
  textRendering: 'textRendering',
  'image-rendering': 'imageRendering',
  imageRendering: 'imageRendering',
  // crop
  'crop-top': 'top',
  'crop-left': 'left',
  'crop-right': 'right',
  'crop-bottom': 'bottom',
  // other
  dpi: 'dpi',
  language: 'languages',
  background: 'background',
  logLevel: 'logLevel',
  'log-level': 'logLevel',
}

/**
 * transform argv to ResvgRenderOptions
 */
export function transformOptions(parsedArgv: ParsedArgs, logger = createLogger()): ResvgRenderOptions {
  const result: ResvgRenderOptions = {}
  for (const key in parsedArgv) {
    if (key === '_') continue

    // handle fit-*
    if (key.startsWith('fit-')) {
      result['fitTo'] = {
        mode: key.slice(4) as Required<ResvgRenderOptions>['fitTo']['mode'],
        value: parsedArgv[key],
      }
      continue
    }

    // transform mutilple string
    if (['font-file', 'font-dir', 'language'].includes(key) && typeof parsedArgv[key] === 'string') {
      parsedArgv[key] = [parsedArgv[key]]
    }

    // transform path option
    if (['font-file', 'font-dir'].includes(key)) {
      parsedArgv[key] = Array.isArray(parsedArgv[key])
        ? parsedArgv[key].map((path) => resolve(process.cwd(), path))
        : resolve(process.cwd(), parsedArgv[key])
    }

    // other option using mapping transform
    if (!(key in optionMapping))
      throw new Error(logFormatter().error(`Unkonw option ==> --${key}`, 'resvg-js --help').trim())
    if (key.startsWith('font-') || key === 'system-font') {
      result['font'] ??= {}
      const fontkey = optionMapping[key] as keyof Required<ResvgRenderOptions>['font']
      result['font'][fontkey] = parsedArgv[key]
    } else if (key.startsWith('crop-')) {
      result['crop'] ??= {} as Required<ResvgRenderOptions>['crop']
      const cropkey = key.slice(5) as keyof Required<ResvgRenderOptions>['crop']
      result['crop'][cropkey] = parsedArgv[key]
    } else {
      const optkey = optionMapping[key] as keyof ResvgRenderOptions
      result[optkey] = parsedArgv[key]
    }
  }

  logger.debug('Options', JSON.stringify(result), 'JSON')
  return result
}
