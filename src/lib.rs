// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
#[cfg(not(target_arch = "wasm32"))]
use napi::bindgen_prelude::{AbortSignal, AsyncTask, Buffer, Either, Error as NapiError, Task};
// use napi::{Result as NapiResult};
#[cfg(not(target_arch = "wasm32"))]
use napi_derive::napi;
use options::JsOptions;
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::{
  prelude::{wasm_bindgen, JsValue},
  JsCast,
};

mod error;
mod fonts;
mod options;

use error::Error;

#[cfg(all(
  not(target_arch = "wasm32"),
  not(debug_assertions),
  not(all(target_os = "windows", target_arch = "aarch64")),
  not(all(target_os = "linux", target_arch = "aarch64", target_env = "musl")),
))]
#[global_allocator]
static ALLOC: mimalloc_rust::GlobalMiMalloc = mimalloc_rust::GlobalMiMalloc;

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
extern "C" {
  #[wasm_bindgen(typescript_type = "Uint8Array | string")]
  pub type IStringOrBuffer;
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
#[cfg_attr(not(target_arch = "wasm32"), napi)]
pub struct Resvg {
  tree: usvg::Tree,
  js_options: JsOptions,
}

#[cfg(not(target_arch = "wasm32"))]
#[napi]
impl Resvg {
  #[napi(constructor)]
  pub fn new(svg: Either<String, Buffer>, options: Option<String>) -> Result<Resvg, NapiError> {
    Resvg::new_inner(&svg, options)
  }

  fn new_inner(svg: &Either<String, Buffer>, options: Option<String>) -> Result<Resvg, NapiError> {
    let js_options: JsOptions = options
      .and_then(|o| serde_json::from_str(o.as_str()).ok())
      .unwrap_or_default();
    let _ = env_logger::builder()
      .filter_level(js_options.log_level)
      .try_init();

    let opts = js_options.to_usvg_options();
    let opts_ref = opts.to_ref();
    // Parse the SVG string into a tree.
    let tree = match svg {
      Either::A(a) => usvg::Tree::from_str(a.as_str(), &opts_ref),
      Either::B(b) => usvg::Tree::from_data(b.as_ref(), &opts_ref),
    }
    .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;
    Ok(Resvg { tree, js_options })
  }

  // Renders an SVG in Node.js
  #[napi]
  pub fn render(&self) -> Result<Buffer, NapiError> {
    let buffer = self.render_inner()?;
    Ok(buffer.into())
  }
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
#[cfg_attr(not(target_arch = "wasm32"), napi)]
impl Resvg {
  #[cfg(target_arch = "wasm32")]
  #[wasm_bindgen(getter)]
  pub fn width(&self) -> f64 {
    self.tree.svg_node().size.width()
  }

  #[cfg(target_arch = "wasm32")]
  #[wasm_bindgen(getter)]
  pub fn height(&self) -> f64 {
    self.tree.svg_node().size.height()
  }

  #[cfg(not(target_arch = "wasm32"))]
  #[napi(getter)]
  pub fn width(&self) -> f64 {
    self.tree.svg_node().size.width()
  }

  #[cfg(not(target_arch = "wasm32"))]
  #[napi(getter)]
  pub fn height(&self) -> f64 {
    self.tree.svg_node().size.height()
  }
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
impl Resvg {
  #[wasm_bindgen(constructor)]
  pub fn new(svg: IStringOrBuffer, options: Option<String>) -> Result<Resvg, JsValue> {
    let js_options: JsOptions = options
      .and_then(|o| serde_json::from_str(o.as_str()).ok())
      .unwrap_or_default();

    let opts = js_options.to_usvg_options();
    let opts_ref = opts.to_ref();
    let tree = if js_sys::Uint8Array::instanceof(&svg) {
      let uintarray = js_sys::Uint8Array::unchecked_from_js_ref(&svg);
      let svg_buffer = uintarray.to_vec();
      usvg::Tree::from_data(&svg_buffer, &opts_ref).map_err(Error::from)
    } else if let Some(s) = svg.as_string() {
      usvg::Tree::from_str(s.as_str(), &opts_ref).map_err(Error::from)
    } else {
      Err(Error::InvalidInput)
    }?;
    Ok(Resvg { tree, js_options })
  }

  #[wasm_bindgen]
  // Renders an SVG in WASM
  pub fn render(&self) -> Result<js_sys::Uint8Array, JsValue> {
    let buffer = self.render_inner()?;
    Ok(buffer.as_slice().into())
  }
}

impl Resvg {
  fn render_inner(&self) -> Result<Vec<u8>, Error> {
    let mut pixmap = self
      .js_options
      .create_pixmap(self.tree.svg_node().size.to_screen_size())?;
    // Render the tree
    let image = resvg::render(
      &self.tree,
      self.js_options.fit_to,
      tiny_skia::Transform::default(),
      pixmap.as_mut(),
    );
    let pixmap_size = self
      .js_options
      .fit_to
      .fit_to(self.tree.svg_node().size.to_screen_size())
      .ok_or_else(|| Error::ZeroSized)?;

    // Crop the SVG
    let crop_rect = tiny_skia::IntRect::from_ltrb(
      self.js_options.crop.left,
      self.js_options.crop.top,
      self
        .js_options
        .crop
        .right
        .unwrap_or(pixmap_size.width() as i32),
      self
        .js_options
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
      buffer = pixmap.encode_png().map_err(Error::from)?;
    }

    Ok(buffer)
  }
}

#[cfg(not(target_arch = "wasm32"))]
pub struct AsyncRenderer {
  options: Option<String>,
  svg: Either<String, Buffer>,
}

#[cfg(not(target_arch = "wasm32"))]
#[napi]
impl Task for AsyncRenderer {
  type Output = Vec<u8>;
  type JsValue = Buffer;

  fn compute(&mut self) -> Result<Self::Output, NapiError> {
    let resvg = Resvg::new_inner(&self.svg, self.options.clone())?;
    Ok(resvg.render()?.into())
  }

  fn resolve(&mut self, _env: napi::Env, result: Self::Output) -> Result<Self::JsValue, NapiError> {
    Ok(result.into())
  }
}

#[cfg(not(target_arch = "wasm32"))]
#[napi]
pub fn render_async(
  svg: Either<String, Buffer>,
  options: Option<String>,
  signal: Option<AbortSignal>,
) -> AsyncTask<AsyncRenderer> {
  match signal {
    Some(s) => AsyncTask::with_signal(AsyncRenderer { options, svg }, s),
    None => AsyncTask::new(AsyncRenderer { options, svg }),
  }
}
