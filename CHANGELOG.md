# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

This changelog also contains important changes in dependencies.

## [Unreleased]

### Added

- feat: update typescript types definition

### Changed

- chore: provides a better error prompt when the options type is wrong

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

[unreleased]: https://github.com/yisibl/resvg-js/compare/v1.0.0...HEAD
[1.0.2]: https://github.com/yisibl/resvg-js/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/yisibl/resvg-js/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/yisibl/resvg-js/releases/tag/v1.0.0
