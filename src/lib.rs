// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

mod fonts;
mod options;

extern crate napi;
#[macro_use]
extern crate napi_derive;

use std::convert::TryInto;

/// Trys to parse an `Option<String>` into an `Option<usvg::Color>`
fn parse_color(value: &Option<String>) -> Result<Option<usvg::Color>, svgtypes::Error> {
  value
    .as_ref()
    .map(|color| color.parse::<usvg::Color>())
    .transpose()
}

/// Renders an SVG
#[js_function(2)]
fn render(ctx: napi::CallContext) -> napi::Result<napi::JsBuffer> {
  let svg_string: String = ctx.get::<napi::JsString>(0)?.into_utf8()?.try_into()?;

  let js_options: options::JsOptions = if ctx.length > 1 {
    ctx.env.from_js_value(ctx.get::<napi::JsUnknown>(1)?)?
  } else {
    options::JsOptions::default()
  };

  let _ = env_logger::builder().filter_level(js_options.log_level).try_init();

  // Parse the background
  let background =
    parse_color(&js_options.background).map_err(|e| napi::Error::from_reason(format!("{}", e)))?;

  // Load fonts
  let fontdb = fonts::load_fonts(&js_options.font);

  // Build the SVG options
  let svg_options = usvg::Options {
    resources_dir: None,
    dpi: js_options.dpi,
    font_family: js_options.font.default_font_family,
    font_size: js_options.font.default_font_size,
    languages: js_options.languages,
    shape_rendering: js_options.shape_rendering,
    text_rendering: js_options.text_rendering,
    image_rendering: js_options.image_rendering,
    keep_named_groups: false,
    default_size: usvg::Size::new(100.0 as f64, 100.0 as f64).unwrap(),
    fontdb,
  };

  // Parse the SVG string into a tree.
  let tree = usvg::Tree::from_str(&svg_string, &svg_options.to_ref())
    .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;

  let pixmap_size = js_options
    .fit_to
    .fit_to(tree.svg_node().size.to_screen_size())
    .ok_or_else(|| napi::Error::from_reason("target size is zero".to_string()))?;

  // Unwrap is safe, because `size` is already valid.
  let mut pixmap = tiny_skia::Pixmap::new(pixmap_size.width(), pixmap_size.height()).unwrap();

  if let Some(background) = background {
    pixmap.fill(tiny_skia::Color::from_rgba8(
      background.red,
      background.green,
      background.blue,
      255,
    ));
  }

  // Render the tree
  let image = resvg::render(&tree, js_options.fit_to, pixmap.as_mut());

  // Crop the SVG
  let crop_rect = tiny_skia::IntRect::from_ltrb(
    js_options.crop.left,
    js_options.crop.top,
    js_options.crop.right.unwrap_or(pixmap_size.width() as i32),
    js_options
      .crop
      .bottom
      .unwrap_or(pixmap_size.height() as i32),
  );

  if let Some(crop_rect) = crop_rect {
    pixmap = pixmap.clone_rect(crop_rect).unwrap_or(pixmap);
  }

  // Write the image data to a buffer
  let mut buffer: Vec<u8> = vec![];
  if let Some(_) = image {
    buffer = pixmap
      .encode_png()
      .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;
  }

  ctx
    .env
    .create_buffer_with_data(buffer)
    .map(|v| v.into_raw())
}

#[module_exports]
fn init(mut exports: napi::JsObject, _env: napi::Env) -> napi::Result<()> {
  exports.create_named_method("render", render)?;
  Ok(())
}
