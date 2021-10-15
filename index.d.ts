/// <reference types="node" />

export type ResvgRenderOptions = {
  font?: {
    loadSystemFonts?: boolean
    fontFiles?: string[]
    fontDirs?: string[]
    defaultFontFamily?: string
    defaultFontSize?: number
    serifFamily?: string
    sansSerifFamily?: string
    cursiveFamily?: string
    fantasyFamily?: string
    monospaceFamily?: string
  }
  dpi?: number
  languages?: string[]
  shapeRendering?:
    | 0 // optimizeSpeed
    | 1 // crispEdges
    | 2 // geometricPrecision
  textRendering?:
    | 0 // optimizeSpeed
    | 1 // optimizeLegibility
    | 2 // geometricPrecision'
  imageRendering?:
    | 0 // optimizeQuality
    | 1 // optimizeSpeed
  fitTo?:
    | { mode: 'width'; value: number }
    | { mode: 'original' }
    | { mode: 'height'; value: number }
    | { mode: 'zoom'; value: number }
  background?: string
  crop?: {
    left: number
    top: number
    right?: number
    bottom?: number
  }
  logLevel?: 'off' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
}

export function render(svg: string, options?: ResvgRenderOptions): Buffer
