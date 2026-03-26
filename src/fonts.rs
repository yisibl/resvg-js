// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

use std::collections::HashSet;

use crate::options::*;
use resvg::usvg::fontdb::{Database, Language};

#[cfg(not(target_arch = "wasm32"))]
use log::{debug, warn};

#[cfg(not(target_arch = "wasm32"))]
use resvg::usvg::fontdb::{Family, Query, Source};

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::JsCast;

#[cfg(target_arch = "wasm32")]
use woff2::decode::{convert_woff2_to_ttf, is_woff2};

/// Loads fonts.
#[cfg(not(target_arch = "wasm32"))]
pub fn load_fonts(font_options: &JsFontOptions) -> Database {
    // Create a new font database
    let mut fontdb = Database::new();
    let now = std::time::Instant::now();

    // 加载指定路径的字体
    for path in &font_options.font_files {
        if let Err(e) = fontdb.load_font_file(path) {
            warn!("Failed to load '{path}' cause {e}.");
        }
    }

    // Load font directories
    for path in &font_options.font_dirs {
        fontdb.load_fonts_dir(path);
    }

    // 加载系统字体
    // 放到最后加载，这样在获取 default_font_family 时才能优先读取到自定义的字体。
    // https://github.com/RazrFalcon/fontdb/blob/052d74b9eb45f2c4f446846a53f33bd965e2662d/src/lib.rs#L261
    if font_options.load_system_fonts {
        fontdb.load_system_fonts();
    }

    set_font_families(font_options, &mut fontdb);

    debug!(
        "Loaded {} font faces in {}ms.",
        fontdb.len(),
        now.elapsed().as_micros() as f64 / 1000.0
    );

    fontdb
}

/// Loads fonts in Wasm.
#[cfg(target_arch = "wasm32")]
pub fn load_wasm_fonts(
    font_options: &JsFontOptions,
    font_buffers: Option<js_sys::Array>,
    fontdb: &mut Database,
) -> Result<(), js_sys::Error> {
    if let Some(ref font_buffers) = font_buffers {
        for font in font_buffers.values().into_iter() {
            let raw_font = font?;
            let font_data = raw_font.dyn_into::<js_sys::Uint8Array>()?.to_vec();

            let font_buffer = if is_woff2(&font_data) {
                convert_woff2_to_ttf(&mut std::io::Cursor::new(font_data))
                    .map_err(|e| js_sys::Error::new(&format!("Failed to decode woff2 font: {e}")))?
            } else {
                font_data
            };
            fontdb.load_font_data(font_buffer);
        }
    }

    set_wasm_font_families(font_options, fontdb, font_buffers);

    Ok(())
}

// Well-known font names for each CSS generic family, covering Windows,
// macOS, and common Linux distributions.
const SANS_SERIF_FALLBACKS: &[&str] = &[
    "Arial",
    "Helvetica",
    "Liberation Sans",
    "Noto Sans",
    "DejaVu Sans",
    "Droid Sans",
    "Adwaita Sans",
];
const SERIF_FALLBACKS: &[&str] = &[
    "Times New Roman",
    "Liberation Serif",
    "Noto Serif",
    "DejaVu Serif",
    "Droid Serif",
];
const MONOSPACE_FALLBACKS: &[&str] = &[
    "Courier New",
    "Liberation Mono",
    "Noto Sans Mono",
    "DejaVu Sans Mono",
    "Droid Sans Mono",
    "Adwaita Mono",
];
const CURSIVE_FALLBACKS: &[&str] = &["Comic Sans MS", "Segoe Script"];
const FANTASY_FALLBACKS: &[&str] = &["Impact", "Papyrus"];

/// Set each CSS generic family to the configured value if available, then
/// probe well-known alternatives (mirroring browser behaviour), then fall
/// back to the first font in fontdb.
fn set_generic_families(font_options: &JsFontOptions, fontdb: &mut Database) {
    let available: HashSet<&str> = fontdb
        .faces()
        .flat_map(|face| face.families.iter().map(|f| f.0.as_str()))
        .collect();
    let first_fallback = get_first_font_family_or_fallback(fontdb);

    let resolve = |configured: &str, fallbacks: &[&str]| -> String {
        if !configured.is_empty() && available.contains(configured) {
            return configured.to_string();
        }
        for name in fallbacks {
            if available.contains(name) {
                return (*name).to_string();
            }
        }
        first_fallback.clone()
    };

    // Resolve all families before mutating fontdb (avoids borrow conflict).
    let serif = resolve(&font_options.serif_family, SERIF_FALLBACKS);
    let sans_serif = resolve(&font_options.sans_serif_family, SANS_SERIF_FALLBACKS);
    let cursive = resolve(&font_options.cursive_family, CURSIVE_FALLBACKS);
    let fantasy = resolve(&font_options.fantasy_family, FANTASY_FALLBACKS);
    let monospace = resolve(&font_options.monospace_family, MONOSPACE_FALLBACKS);

    fontdb.set_serif_family(&serif);
    fontdb.set_sans_serif_family(&sans_serif);
    fontdb.set_cursive_family(&cursive);
    fontdb.set_fantasy_family(&fantasy);
    fontdb.set_monospace_family(&monospace);
}

#[cfg(not(target_arch = "wasm32"))]
fn set_font_families(font_options: &JsFontOptions, fontdb: &mut Database) {
    let default_font_family = font_options.default_font_family.clone().trim().to_string();

    set_generic_families(font_options, fontdb);

    debug!("📝 default_font_family = '{default_font_family}'");

    if !default_font_family.is_empty() {
        find_and_debug_font_path(fontdb, default_font_family.as_str());
    }
}

#[cfg(target_arch = "wasm32")]
fn set_wasm_font_families(
    font_options: &JsFontOptions,
    fontdb: &mut Database,
    _font_buffers: Option<js_sys::Array>,
) {
    set_generic_families(font_options, fontdb);
}

/// Log whether the specified default font family exists in the database.
#[cfg(not(target_arch = "wasm32"))]
fn find_and_debug_font_path(fontdb: &Database, font_family: &str) {
    let query = Query {
        families: &[Family::Name(font_family)],
        ..Query::default()
    };

    let now = std::time::Instant::now();
    match fontdb.query(&query) {
        Some(id) => {
            if let Some((src, index)) = fontdb.face_source(id) {
                if let Source::File(path) = &src {
                    debug!(
                        "Font '{}':{} found in {}ms.",
                        path.display(),
                        index,
                        now.elapsed().as_micros() as f64 / 1000.0
                    );
                }
            }
        }
        None => {
            warn!("Warning: The default font-family '{font_family}' not found.");
        }
    }
}

/// Get the first font family from fontdb, or "Arial" as a last resort.
fn get_first_font_family_or_fallback(fontdb: &Database) -> String {
    fontdb
        .faces()
        .next()
        .and_then(|face| {
            face.families
                .iter()
                .find(|f| f.1 == Language::English_UnitedStates)
                .or(face.families.first())
                .map(|f| f.0.clone())
        })
        .unwrap_or_else(|| "Arial".to_string())
}
