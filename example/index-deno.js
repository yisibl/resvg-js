import * as path from 'https://deno.land/std@0.159.0/path/mod.ts'
import { Resvg } from 'npm:@resvg/resvg-js'

const __dirname = path.dirname(path.fromFileUrl(import.meta.url))

const svg = await Deno.readFile(path.join(__dirname, './text.svg'))
const opts = {
  background: 'rgba(238, 235, 230, .9)',
  fitTo: {
    mode: 'width',
    value: 1200,
  },
  font: {
    fontFiles: ['./example/SourceHanSerifCN-Light-subset.ttf'], // Load custom fonts.
    loadSystemFonts: false, // It will be faster to disable loading system fonts.
    defaultFontFamily: 'Source Han Serif CN Light',
  },
  logLevel: 'debug', // Default Value: error
}

const t = performance.now()
const resvg = new Resvg(svg, opts)
const pngData = resvg.render()
const pngBuffer = pngData.asPng()

console.info('Original SVG Size:', `${resvg.width} x ${resvg.height}`)
console.info('Output PNG Size  :', `${pngData.width} x ${pngData.height}`)
console.info('✨ Done in', performance.now() - t, 'ms')

await Deno.writeFile(path.join(__dirname, './text-out-deno.png'), pngBuffer)
