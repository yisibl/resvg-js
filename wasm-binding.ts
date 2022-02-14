import init, { render as _render, InitInput } from './wasm/dist'

import { ResvgRenderOptions } from './index'

let initialized = false

/**
 * Initialize WASM module
 * @param module_or_path WebAssembly Module or WASM url
 *
 */
export const initWasm = async (module_or_path: Promise<InitInput> | InitInput): Promise<void> => {
  if (initialized) {
    throw new Error('Already initialized. The `initWasm()` function can be used only once.')
  }
  await init(await module_or_path)
  initialized = true
}

/**
 * render svg to png
 * @param {Uint8Array | string} svg
 * @param {ResvgRenderOptions | undefined} options
 * @returns {Uint8Array}
 */
export const render = function render(svg: Uint8Array | string, options?: ResvgRenderOptions) {
  if (!initialized) throw new Error('WASM has not been initialized. Call `initWasm()` function.')

  if (options) {
    return _render(svg, JSON.stringify(options))
  }
  return _render(svg)
}
