import init, { Resvg as _Resvg, InitInput } from './wasm/dist'

import { ResvgRenderOptions } from './index'

let initialized = false

/**
 * Initialize Wasm module
 * @param module_or_path WebAssembly Module or .wasm url
 *
 */
export const initWasm = async (module_or_path: Promise<InitInput> | InitInput): Promise<void> => {
  if (initialized) {
    throw new Error('Already initialized. The `initWasm()` function can be used only once.')
  }
  await init(await module_or_path)
  initialized = true
}

export const Resvg = class extends _Resvg {
  /**
   * @param {Uint8Array | string} svg
   * @param {ResvgRenderOptions | undefined} options
   */
  constructor(svg: Uint8Array | string, options?: ResvgRenderOptions) {
    if (!initialized) throw new Error('Wasm has not been initialized. Call `initWasm()` function.')
    super(svg, JSON.stringify(options))
  }
}
