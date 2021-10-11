# resvg-js

<a href="https://github.com/yisibl/resvg-js/actions"><img alt="GitHub CI Status" src="https://github.com/yisibl/resvg-js/workflows/CI/badge.svg?branch=main"></a>
<a href="https://www.npmjs.com/package/@resvg/resvg-js"><img src="https://img.shields.io/npm/v/@resvg/resvg-js.svg?sanitize=true" alt="npm version"></a>

> A high-performance SVG renderer, powered by Rust based [resvg](https://github.com/RazrFalcon/resvg/) and [napi-rs](https://github.com/napi-rs/napi-rs).

- Very fast, safe and zero dependencies!
- Cross-platform support, including [Apple M1](https://www.apple.com/newsroom/2020/11/apple-unleashes-m1/).
- No need for node-gyp and postinstall, the `.node` file has been compiled for you.
- Support system fonts and custom fonts in SVG text.

## Installation

```shell
npm i @resvg/resvg-js
cnpm i @resvg/resvg-js
pnpm i @resvg/resvg-js
```

## [Example](example/index.js)

This example will load Source Han Serif, and then render the SVG to PNG.

```shell
node example/index.js

Loaded 1 font faces in 0ms.
Font './example/SourceHanSerifCN-Light-subset.ttf':0 found in 0.006ms.
✨ Done in 55.65491008758545 ms
```

| SVG                                      | PNG                                          |
| ---------------------------------------- | -------------------------------------------- |
| <img width="390" src="example/text.svg"> | <img width="390" src="example/text-out.png"> |

## Support matrix

|                  | node12 | node14 | node16 |
| ---------------- | ------ | ------ | ------ |
| Windows x64      | ✓      | ✓      | ✓      |
| Windows x32      | ✓      | ✓      | ✓      |
| Windows arm64    | ✓      | ✓      | ✓      |
| macOS x64        | ✓      | ✓      | ✓      |
| macOS arm64(M1)  | ✓      | ✓      | ✓      |
| Linux x64 gnu    | ✓      | ✓      | ✓      |
| Linux x64 musl   | ✓      | ✓      | ✓      |
| Linux arm gnu    | ✓      | ✓      | ✓      |
| Linux arm64 gnu  | ✓      | ✓      | ✓      |
| Linux arm64 musl | ✓      | ✓      | ✓      |
| Android arm64    | ✓      | ✓      | ✓      |

## Build

You can set the name of the generated `.node` file in `napi.name` of package.json.

After `npm run build` command, you can see `resvgjs.[darwin|win32|linux].node` file in project root. This is the native addon built from [lib.rs](./src/lib.rs).

## Develop requirements

- Install latest `Rust`
- Install `Node.js@10+` which fully supported `Node-API`
- Install `yarn@1.x`

## Test in local

- yarn
- yarn build
- yarn test

And you will see:

```bash
$ ava --verbose

  ✔ sync function from native code
  ✔ sleep function from native code (201ms)
  ─

  2 tests passed
✨  Done in 1.12s.
```

## Release package

We use GitHub actions to automatically publish npm packages.

```
# 1.0.0 => 1.0.1
npm version patch

# or 1.0.0 => 1.1.0
npm version minor

git push --follow-tags
```

## License

[MPLv2.0](https://www.mozilla.org/en-US/MPL/)
