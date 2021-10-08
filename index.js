const { loadBinding } = require('@node-rs/helper')

/**
 * __dirname means load native addon from current dir
 * 'resvg' means native addon name is `resvg`
 * the first arguments was decided by `napi.name` field in `package.json`
 * the second arguments was decided by `name` field in `package.json`
 * loadBinding helper will load `resvg.[PLATFORM].node` from `__dirname` first
 * If failed to load addon, it will fallback to load from `@resvg/resvgjs-[PLATFORM]`
 */
module.exports = loadBinding(__dirname, 'resvgjs', '@resvg/resvg-js')
