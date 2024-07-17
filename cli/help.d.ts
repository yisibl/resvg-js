import { ResvgRenderOptions } from '../index'

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
