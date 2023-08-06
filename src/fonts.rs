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

    // 加载系统字体，Wasm 不支持
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

/// Loads fonts.
#[cfg(target_arch = "wasm32")]
pub fn load_wasm_fonts(
    font_options: &JsFontOptions,
    fonts_buffers: Option<js_sys::Array>,
    fontdb: &mut Database,
) -> Result<(), js_sys::Error> {
    if let Some(fonts_buffers) = fonts_buffers {
        for font in fonts_buffers.values().into_iter() {
            let raw_font = font?;
            let font_data = raw_font.dyn_into::<js_sys::Uint8Array>()?.to_vec();
            fontdb.load_font_data(font_data);
        }
    }

    set_font_families(font_options, fontdb);

    Ok(())
}

fn set_font_families(font_options: &JsFontOptions, fontdb: &mut Database) {
    let mut default_font_family = font_options.default_font_family.clone();

    // 当默认字体为空时，尝试直接从 font_files 中加载读取字体名称，然后设置到默认的 font-family 中
    if font_options.default_font_family.to_string().trim().is_empty() {
        if font_options.font_files.len() > 0 || font_options.font_dirs.len() > 0  {
            for face in fontdb.faces() {
                // debug!("font_id = {}, post_script_name = {} ", face.id, face.post_script_name);

                let new_family = face
                    .families
                    .iter()
                    .find(|f| f.1 == Language::English_UnitedStates)
                    .unwrap_or(&face.families[0]);

                default_font_family = new_family.0.clone();
                // debug!("默认字体匹配到了 = {} ", default_font_family);
                break;
            }


            // 遍历所有加载的字体
            // for face in fontdb.faces() {
            //     if let Source::File(ref path) = &face.source {
            //         // 如果 path.display() 中包含了 font_options.font_files 中的字体路径，则设置为默认字体，并打印出 font_files 中的路径
            //         // debug!("font_id = {}, post_script_name = {} ", face.id, face.post_script_name);

            //         // 匹配到 font_files 中的字体后，设置默认字体
            //         for font_file in &font_options.font_files {
            //             if path.display().to_string().contains(font_file) {
            //                 let new_family = face
            //                     .families
            //                     .iter()
            //                     .find(|f| f.1 == Language::English_UnitedStates)
            //                     .unwrap_or(&face.families[0]);

            //                 default_font_family = new_family.0.clone();
            //                 break;
            //             }
            //         }
            //     }
            // }

            // If a default font family exists, set all other families to that family.
            // This prevents fonts from not being rendered in SVG.
            // fontdb.faces().into_iter().for_each(|face| {
            //     if let Some(new_family) = face
            //         .families
            //         .iter()
            //         .find(|f| f.1 == Language::English_UnitedStates)
            //     {
            //         default_font_family = new_family.0.clone();
            //         debug!("默认字体匹配到了 = {} ", default_font_family);
            //     }
            // });

        } else {
            default_font_family = "Arial".to_string();
        }

        fontdb.set_serif_family(&default_font_family);
        fontdb.set_sans_serif_family(&default_font_family);
        fontdb.set_cursive_family(&default_font_family);
        fontdb.set_fantasy_family(&default_font_family);
        fontdb.set_monospace_family(&default_font_family);
    } else {
        fontdb.set_serif_family(&font_options.default_font_family);
        fontdb.set_sans_serif_family(&font_options.default_font_family);
        fontdb.set_cursive_family(&font_options.default_font_family);
        fontdb.set_fantasy_family(&font_options.default_font_family);
        fontdb.set_monospace_family(&font_options.default_font_family);
    }

    #[cfg(not(target_arch = "wasm32"))]
    find_and_debug_font_path(fontdb, default_font_family.as_str())
}

#[cfg(not(target_arch = "wasm32"))]
fn find_and_debug_font_path(fontdb: &mut Database, font_family: &str) {
    // 查找指定字体的路径
    // let font_family: &str = default_font_family.as_str();
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
            warn!("Warning: The default font '{}' not found.", font_family);
        }
    }
}
