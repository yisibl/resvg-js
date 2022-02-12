import init, { render as _render, InitInput } from './wasm-web'

import { ResvgRenderOptions } from './index'

let initialized = false

/**
 * Initialize WASM module
 * @param mod WebAssembly Module or WASM url
 */
export const initialize = async (mod: Promise<InitInput> | InitInput): Promise<void> => {
  if (initialized) {
    throw new Error('Already initialized. The `initialize` function can be used only once.')
  }
  await init(await mod)
  initialized = true
}

/**
 * render svg to png
 * @param {Uint8Array | string} svg
 * @param {ResvgRenderOptions | undefined} options
 * @returns {Uint8Array}
 */
export const render = function render(svg: Uint8Array | string, options?: ResvgRenderOptions) {
  if (!initialized) throw new Error('WASM has not been initialized. Call `initialize()` function.')

  if (options) {
    return _render(svg, JSON.stringify(options))
  }
  return _render(svg)
}
