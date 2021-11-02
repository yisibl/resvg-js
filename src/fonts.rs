// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

use crate::options::*;
use log::{debug, warn};
use usvg::fontdb::Database;

/// Loads fonts.
pub fn load_fonts(font_options: &JsFontOptions) -> Database {
  // Create a new font database
  let mut fontdb = Database::new();
  let now = std::time::Instant::now();

  // 加载系统字体
  // https://github.com/RazrFalcon/fontdb/blob/052d74b9eb45f2c4f446846a53f33bd965e2662d/src/lib.rs#L261
  if font_options.load_system_fonts {
    fontdb.load_system_fonts();
  }

  // 加载指定路径的字体
  for path in &font_options.font_files {
    if let Err(e) = fontdb.load_font_file(path) {
      warn!("Failed to load '{}' cause {}.", path, e);
    }
  }

  // Load font directories
  for path in &font_options.font_dirs {
    fontdb.load_fonts_dir(path);
  }

  // Set generic font families
  // - `serif` - Times New Roman
  // - `sans-serif` - Arial
  // - `cursive` - Comic Sans MS
  // - `fantasy` - Impact (Papyrus on macOS)
  // - `monospace` - Courier New
  fontdb.set_serif_family(&font_options.serif_family);
  fontdb.set_sans_serif_family(&font_options.sans_serif_family);
  fontdb.set_cursive_family(&font_options.cursive_family);
  fontdb.set_fantasy_family(&font_options.fantasy_family);
  fontdb.set_monospace_family(&font_options.monospace_family);
  debug!(
    "Loaded {} font faces in {}ms.",
    fontdb.len(),
    now.elapsed().as_micros() as f64 / 1000.0
  );

  // 查找指定字体的路径
  let font_family: &str = &font_options.default_font_family;
  let query = fontdb::Query {
    families: &[fontdb::Family::Name(font_family)],
    ..fontdb::Query::default()
  };

  let now = std::time::Instant::now();
  // 当前使用的字体是否存在
  match fontdb.query(&query) {
    Some(id) => {
      let (src, index) = fontdb.face_source(id).unwrap();
      if let fontdb::Source::File(ref path) = &src {
        debug!(
          "Font '{}':{} found in {}ms.",
          path.display(),
          index,
          now.elapsed().as_micros() as f64 / 1000.0
        );
      }
    }
    None => {
      warn!("Warning: The default font '{}' not found.", font_family);
    }
  }

  fontdb
}
