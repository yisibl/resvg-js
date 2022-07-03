# resvg-js

<a href="https://github.com/yisibl/resvg-js/actions"><img alt="GitHub CI Status" src="https://github.com/yisibl/resvg-js/workflows/CI/badge.svg?branch=main"></a>
<a href="https://www.npmjs.com/package/@resvg/resvg-js"><img src="https://img.shields.io/npm/v/@resvg/resvg-js.svg?sanitize=true" alt="@resvg/resvg-js npm version"></a>
<a href="https://npmcharts.com/compare/@resvg/resvg-js?minimal=true"><img src="https://img.shields.io/npm/dm/@resvg/resvg-js.svg?sanitize=true" alt="@resvg/resvg-js downloads"></a>

> resvg-js is a high-performance SVG renderer and toolkit, powered by Rust based [resvg](https://github.com/RazrFalcon/resvg/) and [napi-rs](https://github.com/napi-rs/napi-rs).

## Features

- Fast, safe and zero dependencies.
- Convert SVG to PNG, includes cropping, scaling and setting the background color.
- Support system fonts and custom fonts in SVG text.
- `v2`: Gets the width and height of the SVG and the generated PNG.
- `v2`: Support for outputting simplified SVG strings, such as converting shapes(rect, circle, etc) to `<path>`.
- `v2`: Support WebAssembly.
- No need for node-gyp and postinstall, the `.node` file has been compiled for you.
- Cross-platform support, including [Apple M Chips](https://www.apple.com/newsroom/2020/11/apple-unleashes-m1/).

## Installation

### Node.js

```shell
npm i @resvg/resvg-js
```

### Browser(Wasm)

```html
<script src="https://unpkg.com/@resvg/resvg-wasm"></script>
```

## [Example](example/index.js)

This example will load Source Han Serif, and then render the SVG to PNG.

```shell
node example/index.js

Loaded 1 font faces in 0ms.
Font './example/SourceHanSerifCN-Light-subset.ttf':0 found in 0.006ms.
✨ Done in 55.65491008758545 ms
```

| SVG                                                                                                                                                                                        | PNG                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <img width="500" src="example/anime_girl.svg" alt="Anime girl SVG"><br/>[CC BY 3.0](https://creativecommons.org/licenses/by/3.0): [Niabot](https://commons.wikimedia.org/wiki/User:Niabot) | <img width="500" src="example/out-resvg-js.png" alt="Anime girl png" /><br/>[CC BY 3.0](https://creativecommons.org/licenses/by/3.0): [Niabot](https://commons.wikimedia.org/wiki/User:Niabot) |
| <img width="500" src="example/text.svg">                                                                                                                                                   | <img width="500" src="example/text-out.png">                                                                                                                                                   |

## Usage

### Node.js

```js
const { promises } = require('fs')
const { join } = require('path')
const { Resvg } = require('@resvg/resvg-js')

async function main() {
  const svg = await promises.readFile(join(__dirname, './text.svg'))
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
  }
  const resvg = new Resvg(svg, opts)
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  console.info('Original SVG Size:', `${resvg.width} x ${resvg.height}`)
  console.info('Output PNG Size  :', `${pngData.width} x ${pngData.height}`)

  await promises.writeFile(join(__dirname, './text-out.png'), pngBuffer)
}

main()
```

### WebAssembly

Although we support the use of Wasm packages in Node.js, this is not recommended. The native addon performs better.

#### Browser

```html
<script src="https://unpkg.com/@resvg/resvg-wasm"></script>
<script>
  ;(async function () {
    // The Wasm must be initialized first
    await resvg.initWasm(fetch('https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm'))
    const opts = {
      fitTo: {
        mode: 'width', // If you need to change the size
        value: 800,
      },
    }

    const svg = '<svg> ... </svg>' // Input SVG, String or Uint8Array
    const resvgJS = new resvg.Resvg(svg, opts)
    const pngData = resvgJS.render(svg, opts) // Output PNG data, Uint8Array
    const pngBuffer = pngData.asPng()
    const svgURL = URL.createObjectURL(new Blob([pngData], { type: 'image/png' }))
    document.getElementById('output').src = svgURL
  })()
</script>
```

See [playground](playground/index.html), it is also possible to [call Wasm in Node.js](example/wasm-node.js), but there is a performance penalty and this is not recommended.

## Benchmark

```shell
Running "resize width" suite...
  resvg-js(Rust):
    12 ops/s, ±22.66%   | fastest 🚀

  sharp:
    9 ops/s, ±64.52%    | 25% slower

  skr-canvas(Rust):
    7 ops/s, ±3.72%    | 41.67% slower

  svg2img(canvg and node-canvas):
    6 ops/s, ±16.94%    | slowest, 50% slower
```

## Support matrix

|                  | node12 | node14 | node16 | npm                                                                                                                                                                     |
| ---------------- | ------ | ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows x64      | ✓      | ✓      | ✓      | [![npm version](https://img.shields.io/npm/v/@resvg/resvg-js-win32-x64-msvc.svg?sanitize=true)](https://www.npmjs.com/package/@resvg/resvg-js-win32-x64-msvc)           |
|                  |
| Windows x32      | ✓      | ✓      | ✓      | [![npm version](https://img.shields.io/npm/v/@resvg/resvg-js-win32-ia32-msvc.svg?sanitize=true)](https://www.npmjs.com/package/@resvg/resvg-js-win32-ia32-msvc)         |
|                  |
| Windows arm64    | ✓      | ✓      | ✓      | [![npm version](https://img.shields.io/npm/v/@resvg/resvg-js-win32-arm64-msvc.svg?sanitize=true)](https://www.npmjs.com/package/@resvg/resvg-js-win32-arm64-msvc)       |
|                  |
| macOS x64        | ✓      | ✓      | ✓      | [![npm version](https://img.shields.io/npm/v/@resvg/resvg-js-darwin-x64.svg?sanitize=true)](https://www.npmjs.com/package/@resvg/resvg-js-darwin-x64)                   |
|                  |
| macOS arm64(M1)  | ✓      | ✓      | ✓      | [![npm version](https://img.shields.io/npm/v/@resvg/resvg-js-darwin-arm64.svg?sanitize=true)](https://www.npmjs.com/package/@resvg/resvg-js-darwin-arm64)               |
|                  |
| Linux x64 gnu    | ✓      | ✓      | ✓      | [![npm version](https://img.shields.io/npm/v/@resvg/resvg-js-linux-x64-gnu.svg?sanitize=true)](https://www.npmjs.com/package/@resvg/resvg-js-linux-x64-gnu)             |
|                  |
| Linux x64 musl   | ✓      | ✓      | ✓      | [![npm version](https://img.shields.io/npm/v/@resvg/resvg-js-linux-x64-musl.svg?sanitize=true)](https://www.npmjs.com/package/@resvg/resvg-js-linux-x64-musl)           |
|                  |
| Linux arm gnu    | ✓      | ✓      | ✓      | [![npm version](https://img.shields.io/npm/v/@resvg/resvg-js-linux-arm-gnueabihf.svg?sanitize=true)](https://www.npmjs.com/package/@resvg/resvg-js-linux-arm-gnueabihf) |
|                  |
| Linux arm64 gnu  | ✓      | ✓      | ✓      | [![npm version](https://img.shields.io/npm/v/@resvg/resvg-js-linux-arm64-gnu.svg?sanitize=true)](https://www.npmjs.com/package/@resvg/resvg-js-linux-arm64-gnu)         |
|                  |
| Linux arm64 musl | ✓      | ✓      | ✓      | [![npm version](https://img.shields.io/npm/v/@resvg/resvg-js-linux-arm64-musl.svg?sanitize=true)](https://www.npmjs.com/package/@resvg/resvg-js-linux-arm64-musl)       |
|                  |
| Android arm64    | ✓      | ✓      | ✓      | [![npm version](https://img.shields.io/npm/v/@resvg/resvg-js-android-arm64.svg?sanitize=true)](https://www.npmjs.com/package/@resvg/resvg-js-android-arm64)             |
|                  |
| Android armv7    | ✓      | ✓      | ✓      | [![npm version](https://img.shields.io/npm/v/@resvg/resvg-js-android-arm-eabi.svg?sanitize=true)](https://www.npmjs.com/package/@resvg/resvg-js-android-arm-eabi)       |
|                  |

## Test or Contributing

- Install latest `Rust`
- Install `Node.js@10+` which fully supported `Node-API`
- Install `wasm-pack`

  ```bash
  curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
  ```

  Normally `wasm-pack` will install `wasm-bindgen` automatically, but if the installation [fails due to network reasons](https://github.com/rustwasm/wasm-pack-template/issues/44#issuecomment-521657516), please try to install it manually.

  ```bash
  cargo install wasm-bindgen-cli
  ```

  On computers with Apple M chips, the following error message may appear:

  > Error: failed to download from https://github.com/WebAssembly/binaryen/releases/download/version_90/binaryen-version_90-x86_64-apple-darwin.tar.gz

  Please install binaryen manually:

  ```bash
  brew install binaryen
  ```

### Build Node.js bindings

```bash
npm i
npm run build
npm test
```

### Build WebAssembly bindings

```bash
npm i
npm run build:wasm
npm run test:wasm
```

## Roadmap

I will consider implementing the following features, if you happen to be interested,
please feel free to discuss with me or submit a PR.

- [x] Support async API
- [x] Upgrade to napi-rs v2
- [x] Support WebAssembly
- [x] Output usvg-simplified SVG string
- [x] Support for getting SVG Bounding box
- [ ] Support for generating more lossless bitmap formats, e.g. avif, webp, JPEG XL

## Release package

We use GitHub actions to automatically publish npm packages.

```bash
# 1.0.0 => 1.0.1
npm version patch

# or 1.0.0 => 1.1.0
npm version minor
```

## License

[MPLv2.0](https://www.mozilla.org/en-US/MPL/)

Copyright (c) 2021-present, yisibl(一丝)
