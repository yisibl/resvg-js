// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

use std::result;

use napi::bindgen_prelude::*;
use napi_derive::napi;
use tiny_skia::Color;
use tiny_skia::Pixmap;

mod fonts;
mod options;

#[cfg(all(
  not(debug_assertions),
  not(all(target_os = "windows", target_arch = "aarch64")),
  not(all(target_os = "linux", target_arch = "aarch64", target_env = "musl")),
))]
#[global_allocator]
static ALLOC: mimalloc_rust::GlobalMiMalloc = mimalloc_rust::GlobalMiMalloc;

/// Try to parse an `Option<String>` into an `Option<usvg::Color>`
fn parse_color(value: &Option<String>) -> result::Result<Option<svgtypes::Color>, svgtypes::Error> {
  value
    .as_ref()
    .map(|color| color.parse::<svgtypes::Color>())
    .transpose()
}

#[inline]
fn svg_to_skia_color(color: svgtypes::Color) -> tiny_skia::Color {
  Color::from_rgba8(color.red, color.green, color.blue, color.alpha)
}

#[inline]
fn render_svg(svg: &Either<String, Buffer>, js_options: &options::JsOptions) -> Result<Vec<u8>> {
  // Parse the background
  let background =
    parse_color(&js_options.background).map_err(|e| napi::Error::from_reason(format!("{}", e)))?;

  // Load fonts
  let fontdb = fonts::load_fonts(&js_options.font);

  // Build the SVG options
  let svg_options = usvg::Options {
    resources_dir: None,
    dpi: js_options.dpi,
    font_family: js_options.font.default_font_family.clone(),
    font_size: js_options.font.default_font_size,
    languages: js_options.languages.clone(),
    shape_rendering: js_options.shape_rendering,
    text_rendering: js_options.text_rendering,
    image_rendering: js_options.image_rendering,
    keep_named_groups: false,
    default_size: usvg::Size::new(100.0_f64, 100.0_f64).unwrap(),
    fontdb,
  };

  // Parse the SVG string into a tree.
  let tree = match svg {
    Either::A(a) => usvg::Tree::from_str(a.as_str(), &svg_options.to_ref()),
    Either::B(b) => usvg::Tree::from_data(b.as_ref(), &svg_options.to_ref()),
  }
  .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;

  let fit_to = js_options.fit_to;
  let pixmap_size = fit_to
    .fit_to(tree.svg_node().size.to_screen_size())
    .ok_or_else(|| napi::Error::from_reason("target size is zero".to_string()))?;

  // Unwrap is safe, because `size` is already valid.
  let mut pixmap = Pixmap::new(pixmap_size.width(), pixmap_size.height()).unwrap();

  if let Some(background) = background {
    pixmap.fill(svg_to_skia_color(background));
  }

  // Render the tree
  let image = resvg::render(
    &tree,
    fit_to,
    tiny_skia::Transform::default(),
    pixmap.as_mut(),
  );

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
  if image.is_some() {
    buffer = pixmap
      .encode_png()
      .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;
  }
  Ok(buffer)
}

/// Renders an SVG
#[napi]
pub fn render(svg: Either<String, Buffer>, options: Option<String>) -> Result<Buffer> {
  let js_options: options::JsOptions = options
    .and_then(|o| serde_json::from_str(o.as_str()).ok())
    .unwrap_or_default();

  let _ = env_logger::builder()
    .filter_level(js_options.log_level)
    .try_init();

  let buffer = render_svg(&svg, &js_options)?;

  Ok(buffer.into())
}

pub struct AsyncRenderer {
  options: options::JsOptions,
  svg: Either<String, Buffer>,
}

#[napi]
impl Task for AsyncRenderer {
  type Output = Vec<u8>;
  type JsValue = Buffer;

  fn compute(&mut self) -> Result<Self::Output> {
    render_svg(&self.svg, &self.options)
  }

  fn resolve(&mut self, _env: napi::Env, result: Self::Output) -> Result<Self::JsValue> {
    Ok(result.into())
  }
}

#[napi]
pub fn render_async(
  svg: Either<String, Buffer>,
  options: Option<String>,
  signal: Option<AbortSignal>,
) -> AsyncTask<AsyncRenderer> {
  let js_options: options::JsOptions = options
    .and_then(|o| serde_json::from_str(o.as_str()).ok())
    .unwrap_or_default();
  match signal {
    Some(s) => AsyncTask::with_signal(
      AsyncRenderer {
        options: js_options,
        svg,
      },
      s,
    ),
    None => AsyncTask::new(AsyncRenderer {
      options: js_options,
      svg,
    }),
  }
}
