// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

use crate::options::*;
use resvg::usvg_text_layout::fontdb::{Database, Language};

#[cfg(not(target_arch = "wasm32"))]
use log::{debug, warn};

#[cfg(not(target_arch = "wasm32"))]
use resvg::usvg_text_layout::fontdb::{Family, Query, Source};

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::JsCast;

/// Loads fonts.
#[cfg(not(target_arch = "wasm32"))]
pub fn load_fonts(font_options: &JsFontOptions) -> Database {
    // Create a new font database
    let mut fontdb = Database::new();
    let now = std::time::Instant::now();

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
    fonts_buffers: Option<js_sys::Array>,
    fontdb: &mut Database,
) -> Result<(), js_sys::Error> {
    if let Some(ref fonts_buffers) = fonts_buffers {
        for font in fonts_buffers.values().into_iter() {
            let raw_font = font?;
            let font_data = raw_font.dyn_into::<js_sys::Uint8Array>()?.to_vec();
            fontdb.load_font_data(font_data);
        }
    }

    set_wasm_font_families(font_options, fontdb, fonts_buffers);

    Ok(())
}

#[cfg(not(target_arch = "wasm32"))]
fn set_font_families(font_options: &JsFontOptions, fontdb: &mut Database) {
    let mut default_font_family = font_options.default_font_family.clone();
    let fallback_font_family = "Arial".to_string(); // 其他情况都 fallback 到指定的这个字体。

    // debug font list
    // for face in fontdb.faces() {
    //     let family = face
    //         .families
    //         .iter()
    //         .find(|f| f.1 == Language::English_UnitedStates)
    //         .unwrap_or(&face.families[0]);

    //     debug!("font_id = {}, family_name = {}", face.id, family.0);
    // }

    // 当 default_font_family 为空时，尝试把 fontdb 中字体列表的第一个字体设置为默认的字体。
    if font_options
        .default_font_family
        .to_string()
        .trim()
        .is_empty()
    {
        // font_files 或 font_dirs 选项不为空时, 从字体列表中获取第一个字体的 font family。
        if !font_options.font_files.is_empty() || !font_options.font_dirs.is_empty() {
            // 获取字体列表中第一个字体的 font family。
            match fontdb.faces().iter().next() {
                Some(face) => {
                    let new_family = face
                        .families
                        .iter()
                        .find(|f| f.1 == Language::English_UnitedStates)
                        .unwrap_or(&face.families[0]);

                    default_font_family = new_family.0.clone();
                }
                None => {
                    default_font_family = fallback_font_family;
                }
            }
        } else {
            default_font_family = fallback_font_family;
        }
    }

    fontdb.set_serif_family(&default_font_family);
    fontdb.set_sans_serif_family(&default_font_family);
    fontdb.set_cursive_family(&default_font_family);
    fontdb.set_fantasy_family(&default_font_family);
    fontdb.set_monospace_family(&default_font_family);

    debug!("default_font_family = {}", default_font_family);

    #[cfg(not(target_arch = "wasm32"))]
    find_and_debug_font_path(fontdb, default_font_family.as_str())
}

#[cfg(target_arch = "wasm32")]
fn set_wasm_font_families(
    font_options: &JsFontOptions,
    fontdb: &mut Database,
    fonts_buffers: Option<js_sys::Array>,
) {
    let mut default_font_family = font_options.default_font_family.clone();
    let fallback_font_family = "Arial".to_string(); // 其他情况都 fallback 到指定的这个字体。

    // 当默认字体为空时，尝试直接从 font_files 中加载读取字体名称，然后设置到默认的 font-family 中
    if font_options
        .default_font_family
        .to_string()
        .trim()
        .is_empty()
    {
        if let Some(_fonts_buffers) = fonts_buffers {
            // 获取字体列表中第一个字体的 font family。
            match fontdb.faces().iter().next() {
                Some(face) => {
                    let new_family = face
                        .families
                        .iter()
                        .find(|f| f.1 == Language::English_UnitedStates)
                        .unwrap_or(&face.families[0]);

                    default_font_family = new_family.0.clone();
                }
                None => {
                    default_font_family = fallback_font_family;
                }
            }
        } else {
            default_font_family = fallback_font_family;
        }
    }

    fontdb.set_serif_family(&default_font_family);
    fontdb.set_sans_serif_family(&default_font_family);
    fontdb.set_cursive_family(&default_font_family);
    fontdb.set_fantasy_family(&default_font_family);
    fontdb.set_monospace_family(&default_font_family);
}

#[cfg(not(target_arch = "wasm32"))]
fn find_and_debug_font_path(fontdb: &mut Database, font_family: &str) {
    // 查找指定字体的路径
    let query = Query {
        families: &[Family::Name(font_family)],
        ..Query::default()
    };

    let now = std::time::Instant::now();
    // 当前使用的字体是否存在
    match fontdb.query(&query) {
        Some(id) => {
            let (src, index) = fontdb.face_source(id).unwrap();
            if let Source::File(ref path) = &src {
                debug!(
                    "Font '{}':{} found in {}ms.",
                    path.display(),
                    index,
                    now.elapsed().as_micros() as f64 / 1000.0
                );
            }
        }
        None => {
            warn!(
                "Warning: The default font-family '{}' not found.",
                font_family
            );
        }
    }
}
