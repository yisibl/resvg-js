# npm packages

npm 目录下包含了不同平台编译后的二进制文件，每个平台发布单独的 npm 包，通过 [optionalDependencies](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#optionaldependencies)、`os` 和 `cpu` 三个字段配合，让 npm install 的时候自动选择对应平台的 npm 包。

目前 npm v7+、cnpm 7.1.0+ 和 pnpm 都能很好的使用这种方式进行安装，低于这些版本会导致下载其他平台的包。

请不要使用 `npm install @resvg/resvg-js --no-optional` 进行安装，这会阻止安装任何二进制文件。

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
