const { render: _render, renderAsync: _renderAsync } = require('./js-binding')

module.exports.render = function render(svgString, options) {
  if (options) {
    return _render(svgString, JSON.stringify(options))
  }
  return _render(svgString)
}

module.exports.renderAsync = function renderAsync(svgString, options, signal) {
  if (options) {
    return _renderAsync(svgString, JSON.stringify(options), signal)
  }
  return _renderAsync(svgString, null, signal)
}
