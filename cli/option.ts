import { resolve } from 'node:path'

import type { ResvgRenderOptions } from '../index'

import type { ParsedArgs } from './cli'
import type { Logger } from './util'
import { getPathsByArgs, unkonwOptionExit } from './util'

/** Allow partial options using Camel-Case */
type ResvgOptionsKeys =
  | keyof ResvgRenderOptions
  | keyof Required<ResvgRenderOptions>['font']
  | keyof Required<ResvgRenderOptions>['crop']
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
  'log-level': 'logLevel',
}

type Result = [{ input: string; output?: string }, ResvgRenderOptions]
/**
 * transform argv to ResvgRenderOptions
 */
export function transformOptions(parseArgv: ParsedArgs, logger: Logger) {
  // #region - Args to Paths
  const [tmpInput, tmpOutput] = parseArgv._
  const result: Result = [getPathsByArgs(tmpInput, tmpOutput, logger), {}]
  logger.debug('Argv', JSON.stringify(parseArgv), 'JSON')
  logger.debug('Input and Output Path', JSON.stringify(result[0]), 'JSON')
  // #endregion

  // #region - Main Options Handler
  const options: ResvgRenderOptions = {}
  for (const key in parseArgv) {
    if (key === '_') continue
    // handle fit-*
    if (key.startsWith('fit-')) {
      options['fitTo'] = {
        mode: key.slice(4) as Required<ResvgRenderOptions>['fitTo']['mode'],
        value: parseArgv[key],
      }
      continue
    }

    // transform mutilple string
    if (['font-file', 'font-dir', 'language'].includes(key) && typeof parseArgv[key] === 'string') {
      parseArgv[key] = [parseArgv[key]]
    }
    // transform path option
    if (['font-file', 'font-dir'].includes(key)) {
      parseArgv[key] = Array.isArray(parseArgv[key])
        ? parseArgv[key].map((path) => resolve(process.cwd(), path))
        : resolve(process.cwd(), parseArgv[key])
    }

    // other option using mapping transform
    !(key in optionMapping) && unkonwOptionExit(key, logger)
    if (key.startsWith('font-') || key === 'system-font') {
      options['font'] ??= {}
      const fontkey = optionMapping[key] as keyof Required<ResvgRenderOptions>['font']
      options['font'][fontkey] = parseArgv[key]
    } else if (key.startsWith('crop-')) {
      options['crop'] ??= {} as Required<ResvgRenderOptions>['crop']
      const cropkey = key.slice(5) as keyof Required<ResvgRenderOptions>['crop']
      options['crop'][cropkey] = parseArgv[key]
    } else {
      const optkey = optionMapping[key] as keyof ResvgRenderOptions
      options[optkey] = parseArgv[key]
    }
  }
  // #endregion
  result[1] = options

  logger.debug('Options', JSON.stringify(result[1]), 'JSON')
  return result
}
