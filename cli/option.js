/** Allow partial options using Camel-Case */
const optionMapping = {
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

/**
 * transform argv to ResvgRenderOptions
 *
 * @param {import ('./help.d').CLIOptions & import('minimist').ParsedArgs} parseArgv
 * @return {[
 *    { input: string, output?: string },
 *    import('../index').ResvgRenderOptions
 *  ]}
 */
module.exports.transformOptions = function transformOptions(parseArgv) {
  const { getPathsByArgs, logger, unkonwOptionExit } = require('./util')
  // #region - Args to Paths
  const [tmpInput, tmpOutput] = parseArgv._
  const result = [getPathsByArgs(tmpInput, tmpOutput)]
  if (parseArgv?.['log-level'] === 'debug') {
    logger.info('Argv', JSON.stringify(parseArgv), 'JSON')
    logger.info('Input and Output Path', JSON.stringify(result[0]), 'JSON')
  }
  delete parseArgv._
  // #endregion

  // #region - Main Options
  const options = {}
  for (const key in parseArgv) {
    // handle fit-*
    if (key.startsWith('fit-')) {
      options['fitTo'] = {
        mode: key.slice(4),
        value: parseArgv[key],
      }
      continue
    }

    // format mutilple string
    if (['font-file', 'font-dir', 'language'].includes(key) && typeof parseArgv[key] === 'string') {
      parseArgv[key] = [parseArgv[key]]
    }
    // format path option
    if (['font-file', 'font-dir'].includes(key)) {
      const { resolve } = require('path')
      parseArgv[key] = Array.isArray(parseArgv[key])
        ? parseArgv[key].map((path) => resolve(process.cwd(), path))
        : resolve(process.cwd(), parseArgv[key])
    }

    // other option using mapping
    !(key in optionMapping) && unkonwOptionExit(key)
    if (key.startsWith('font-') || key === 'system-font') {
      options['font'] ??= {}
      options['font'][optionMapping[key]] = parseArgv[key]
    } else if (key.startsWith('crop-')) {
      options['crop'] ??= {}
      options['crop'][optionMapping[key]] = parseArgv[key]
    } else {
      options[optionMapping[key]] = parseArgv[key]
    }
  }
  // #endregion
  result.push(options)

  if (parseArgv?.['log-level'] === 'debug') {
    logger.info('Options', JSON.stringify(result[1]), 'JSON')
  }
  return result
}
