# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

This changelog also contains important changes in dependencies.

## [Unreleased]

## [2.0.0-alpha.2] - 2022-02-21

### Added

- feat: upgrade resvg to [0.22.0](https://github.com/RazrFalcon/resvg/blob/master/CHANGELOG.md#0220---2022-02-20)

  Support `svg` referenced by `<use>`, this is often used in svg sprite.

  ```html
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <svg id="svg1" xmlns="http://www.w3.org/2000/svg">
      <rect width="50%" height="50%" fill="green" />
    </svg>
    <use id="use1" x="50%" y="50%" xlink:href="#svg1" />
  </svg>
  ```

- feat: upgrade fontdb to [0.9.0](https://github.com/RazrFalcon/fontdb/blob/master/CHANGELOG.md#added), loading system fonts will become faster.

  There are many CJK fonts installed in my local OS, the test result is 2.5 times faster:

  - Before: `Loaded 1085 font faces in 860.447ms.`
  - After: `Loaded 1085 font faces in 339.665ms.`

## [2.0.0-alpha.1] - 2022-02-17

### Added

- feat: playground uses [unpkg.com's](https://unpkg.com/@resvg/resvg-wasm) online resources
  ```html
  <script src="https://unpkg.com/@resvg/resvg-wasm@2.0.0-alpha.0/index.min.js"></script>
  ```
- feat: preload wasm in the playground
  ```html
  <link rel="preload" as="fetch" type="application/wasm" href="https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm" />
  ```
- chore: upload wasm file to artifacts
  Switching from local to building in CI (Linux-x64-gnu) for `.wasm` files can reduce the file size a bit.

  - Local, Mac-x64-darwin: 1969225 bytes
  - CI, Linux-x64-gnu: 1949570 bytes

  After gzip compression, the `.wasm` file is only about 700kB.

## [2.0.0-alpha.0] - 2022-02-15

resvg-js now supports WebAssembly 🎉 What can I do now?

- You can convert SVG to PNG in the browser or Web Worker
- We provide Playground for direct use: https://resvg-js.vercel.app

With WebAssembly, resvg-js gains broader cross-platform compatibility, all by loading only about 2MB of WASM files. And, the API is consistent with the Node.js side.

The current version of WASM does not support loading fonts, so please submit an issue if you have a request.

### Added

- feat: support WebAssembly(wasm32 target) via wasm-bindgen (#51)
- feat: add [WebAssembly playground](https://resvg-js.vercel.app)
- feat: upgrade resvg to 0.21.0
- feat: upgrade to napi-rs 2.1.0 (#60)
- chore: improved error message when output PNG size is 0 (#58)
- doc: add Node.js and WebAssembly usage documentation (#63)

## [1.4.0] - 2022-01-24

### Added

feat: support for glibc 2.12(via zig-cc) (#50)

### Changed

- fix: handle lld not found (#46)
- fix: js-binding for android-arm64 and android-arm-eabi (#53)

## [1.3.0] - 2022-01-01

### Added

- feat: upgrade to resvg 0.20.0(tiny-skia to 0.6.2).
- chore: add oslllo-svg2 to the examples and bench.

## [1.2.0] - 2021-12-25

### Added

- feat: upgrading to napi-rs v2.
- feat: support Android armv7(@resvg/resvg-js-android-arm-eabi).

### Changed

- fix: default_font_family changed from Times New Roman to Arial.
  This is closer to the default rendering font in the browser.

## [1.1.0] - 2021-11-11

### Added

- feat: implement `renderAsync()` function. By @Brooooooklyn

  We have made a major upgrade to napi-rs, from v1 to 2.x alpha. This allows better support for asynchronous binding and automatic generation of TypeScript definitions. Now you can enjoy `async/await`.

  ```js
  const { renderAsync } = require('@resvg/resvg-js')

  async function main() {
    const pngData = await renderAsync(/* SVG string or buffer */)
  }
  ```

- feat: The input to the `render()` and `renderAsync()` functions supports buffer.
- feat: improved webpack support, no more need `@node-rs/helper` dependency.

  The `@node-rs/helper` is convenient to load native binary cross platform and cpu arch. But it's not friendly to [`webpack`](https://github.com/webpack/webpack), [`vercel/nft`](https://github.com/vercel/nft) and [`vercel/ncc`](https://github.com/vercel/ncc) because the logic is too dynamic.

- feat: add `example/compare.js`.

### Changed

- fix: the default font no longer throws an error if it is not found, it changes to a warning.
- chore: benchmark adds tests for svg icons and other improvements.
- chore: upgrade Rust Edition to 2021.

## [1.0.4] - 2021-10-19

### Added

- feat: `background` option supports alpha channel, currently only supports [CSS Colors 3](https://www.w3.org/TR/css-color-3/#colorunits).

  CSS color parse depends on [svgtypes](https://github.com/RazrFalcon/svgtypes/commit/266ee2caff9bd6a75d9a63b6e9850554f6de87b4).

```js
render(svgString, {
  // Support
  background: 'rgba(77, 25, 230, .8)',
  background: 'rgb(77, 25, 230, .8)',
  background: 'rgba(77%, 25%, 230%, .8)',
  background: 'hsla(255, 80%, 50%, .8)',
  background: 'hsl(255, 80%, 50%, .8)',
  // Not support
  background: 'rgb(77 25 230 / 80%)',
  background: 'rgb(77 25 230 / .8)',
  background: 'hsl(255deg 80% 50% / 80%)',
})
```

## [1.0.3] - 2021-10-15

### Added

- feat: update typescript types definition. @axelhzf
- feat: add `logLevel` option, the font loading log is no longer output by default. @axelhzf

### Changed

- chore: provides a better error prompt when the options type is wrong

### Fixed

- fix: loaded font faces time changed from milliseconds to ms

### Removed

- fix: remove the `path` option because we never implemented it

## [1.0.2] - 2021-10-13

### Changed

- docs: add npm packages doc and npm badges for each platform
- chore: ci add ignored files and directories

## [1.0.1] - 2021-10-11

npm has malfunctioned, which caused this version to fail to install.

See also: https://status.npmjs.org/incidents/wy4002vc8ryc

### Changed

- chore: remove FreeBSD support #5
- feat: update resvg to 0.19.0
- chore: remove lint and dependent robot
- remove png crate

### Fixed

- [When the background option is not set, the edges will have black edges](https://github.com/yisibl/resvg-js/commit/8f739243b7363e982fcc29d6705f2eeb90540311).

---

## [1.0.0] - 2021-10-09

The first official version, use [resvg 0.18.0](https://github.com/RazrFalcon/resvg/blob/master/CHANGELOG.md#0180---2021-09-12). Mainly have the following functions:

- Render SVG and convert to PNG.
- Support to set PNG size according to width and height.
- Support custom fonts and system fonts.
- Supports setting the background color of PNG.

[unreleased]: https://github.com/yisibl/resvg-js/compare/v2.0.0-alpha.2...HEAD
[2.0.0-alpha.2]: https://github.com/yisibl/resvg-js/compare/v2.0.0-alpha.1...v2.0.0-alpha.2
[2.0.0-alpha.1]: https://github.com/yisibl/resvg-js/compare/v2.0.0-alpha.0...v2.0.0-alpha.1
[2.0.0-alpha.0]: https://github.com/yisibl/resvg-js/compare/v1.4.0...v2.0.0-alpha.0
[1.4.0]: https://github.com/yisibl/resvg-js/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/yisibl/resvg-js/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/yisibl/resvg-js/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/yisibl/resvg-js/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/yisibl/resvg-js/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/yisibl/resvg-js/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/yisibl/resvg-js/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/yisibl/resvg-js/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/yisibl/resvg-js/releases/tag/v1.0.0
