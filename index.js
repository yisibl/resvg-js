const { render: _render, renderAsync: _renderAsync } = require('./js-binding')

module.exports.render = function render(svg, options) {
  if (options) {
    return _render(svg, JSON.stringify(options))
  }
  return _render(svg)
}

module.exports.renderAsync = function renderAsync(svg, options, signal) {
  if (options) {
    return _renderAsync(svg, JSON.stringify(options), signal)
  }
  return _renderAsync(svg, null, signal)
}
