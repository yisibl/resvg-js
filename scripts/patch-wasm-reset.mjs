// Adds an export to wasm-pack's generated wasm/dist/index.js that clears
// the module-level `wasm` singleton, letting resetWasm() force a fresh
// instance. Re-applied on every `wasm-pack build` (see build:wasm-web),
// so it survives the file being regenerated.
import { readFileSync, writeFileSync } from 'node:fs'

const marker = '// __resvgJsResetWasmModule patch'

const jsTarget = new URL('../wasm/dist/index.js', import.meta.url)
const jsSrc = readFileSync(jsTarget, 'utf8')
if (jsSrc.includes(marker)) {
  console.log('patch-wasm-reset: already applied, skipping')
  process.exit(0)
}
const jsAddition = `\n${marker}\nexport function __resvgJsResetWasmModule() {\n  wasm = undefined;\n}\n`
writeFileSync(jsTarget, jsSrc + jsAddition)

const dtsTarget = new URL('../wasm/dist/index.d.ts', import.meta.url)
const dtsSrc = readFileSync(dtsTarget, 'utf8')
const dtsAddition = `\n${marker}\nexport function __resvgJsResetWasmModule(): void;\n`
writeFileSync(dtsTarget, dtsSrc + dtsAddition)

console.log('patch-wasm-reset: applied to wasm/dist/index.js and index.d.ts')
