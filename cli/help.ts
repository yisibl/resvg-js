import type { ResvgRenderOptions } from '../index'

import { pc } from './style'

/**
 * plz ensure modify options will check the help message
 */
export type CLIOptions = {
  help?: boolean
  version?: boolean
  'system-font'?: boolean
  'font-file'?: string | string[]
  'font-dir'?: string | string[]
  'font-default-size'?: number
  'font-default-family'?: string
  'font-serif-family'?: string
  'font-sans-serif-family'?: string
  'font-cursive-family'?: string
  'font-fantasy-family'?: string
  'font-monospace-family'?: string
  'shape-rendering'?: 0 | 1 | 2
  'text-rendering'?: 0 | 1 | 2
  'image-rendering'?: 0 | 1
  'fit-width'?: number
  'fit-height'?: number
  'fit-zoom'?: number
  'crop-top'?: number
  'crop-left'?: number
  'crop-right'?: number
  'crop-bottom'?: number
  dpi?: number
  language?: string | string[]
  background?: string
  'log-level'?: ResvgRenderOptions['logLevel']
}

/* prettier-ignore */
export function printHelp(version: string) {
  console.info(
    `${pc.yellow('NAME:')}
    ${pc.green('resvg-js')} - A high-performance SVG renderer CLI, powered by Rust based resvg and napi-rs

${pc.yellow('WEBSITE:')}
    ${pc.underline('https://github.com/yisibl/resvg-js')}

${pc.yellow('VERSION:')} ${version}

${pc.yellow('SYNOPSIS:')}
    resvg-js [OPTIONS] <input_svg_path | '-'> [output_path]

${pc.yellow('OPTIONS:')}
  ${pc.gray('Font:')}
    ${pc.cyan('--no-system-font')}                ${pc.red('Unuse system font, it will be faster')}
    ${pc.cyan('--font-file        <file_path>')}  ${pc.red('Local font file path')}   ${pc.gray('[Mutilple]')}
    ${pc.cyan('--font-dir          <dir_path>')}  ${pc.red('Local font directories')} ${pc.gray('[Mutilple]')}
    ${pc.cyan('--font-default-size      <num>')}  ${pc.red('Default font size')}      ${pc.gray('[Default: 12]')}
    ${pc.cyan('--font-default-family    <str>')}  ${pc.red('The default font family')}
    ${pc.cyan('--font-serif-family      <str>')}  ${pc.red('The serif font family')}
    ${pc.cyan('--font-sans-serif-family <str>')}  ${pc.red('The sans-serif font family')}
    ${pc.cyan('--font-cursive-family    <str>')}  ${pc.red('The cursive font family')}
    ${pc.cyan('--font-fantasy-family    <str>')}  ${pc.red('The fantasy font family')}
    ${pc.cyan('--font-monospace-family  <str>')}  ${pc.red('The monospace font family')}

  ${pc.gray('Rendering Optimize:')}
    ${pc.cyan('--shape-rendering <0|1|2>')}       ${pc.red('Shape rendering optimize rule')}
        ${pc.gray('[0: optimizeSpeed, 1: crispEdges, 2: geometricPrecision]')}
    ${pc.cyan('--text-rendering  <0|1|2>')}       ${pc.red('Text rendering optimize rule')}
        ${pc.gray('[0: optimizeSpeed, 1: optimizeLegibility, 2: geometricPrecision]')}
    ${pc.cyan('--image-rendering <0|1>')}         ${pc.red('Image rendering optimize rule')}
        ${pc.gray('[0: optimizeQuality, 1: optimizeSpeed]')}

  ${pc.gray('Fit To (default use original):')}
    ${pc.cyan('--fit-width   <num>')}             ${pc.red('Use fit to width mode')}
    ${pc.cyan('--fit-height  <num>')}             ${pc.red('Use fit to height mode')}
    ${pc.cyan('--fit-zoom    <num>')}             ${pc.red('Use fit to zoom mode')}

  ${pc.gray('Crop:')}
    ${pc.cyan('--crop-top    <num>')}             ${pc.red('Crop image top size')}
    ${pc.cyan('--crop-left   <num>')}             ${pc.red('Crop image left size')}
    ${pc.cyan('--crop-right  <num>')}             ${pc.red('Crop image right size')}
    ${pc.cyan('--crop-bottom <num>')}             ${pc.red('Crop image bottom size')}

    ${pc.cyan('--dpi        <num>')}              ${pc.red('Dots Per Inch')}
    ${pc.cyan('--language   <lang>')}             ${pc.red('Language code')} ${pc.gray('[Mutilple]')}
    ${pc.cyan('--background <CSS3_color>')}       ${pc.red('Background color')}
    ${pc.cyan('--log-level  <logLevel>')}         ${pc.red('Setting log level')}

${pc.yellow('ARGS:')}
    ${pc.cyan('<input_file_path>')}               ${pc.red('SVG file path. Use "-" for stdin')}
    ${pc.cyan('[output_file_path]')}              ${pc.red('Output image file path')}

${pc.yellow('EXAMPLES:')}
    ${pc.cyan('resvg-js input.svg output.png')}
    ${pc.cyan('resvg-js --fit-width 1200 input.svg output.png')}
    ${pc.cyan(`resvg-js \\
        --no-system-font                    \\
        --font-file "./Font-Light.ttf"      \\
        --font-file "./Font-Bold.ttf"       \\
        --font-default-family "Font"        \\
        --background "rgba(238,235,230,.9)" \\
        ./input.svg ./output.png`)}
    ${pc.cyan('cat a.svg | resvg-js --fit-width 1200 --image-rending 0 - output.png')}
`)
}
