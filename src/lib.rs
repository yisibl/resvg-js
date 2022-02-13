// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
#[cfg(not(target_arch = "wasm32"))]
use napi::bindgen_prelude::{AbortSignal, AsyncTask, Buffer, Either, Error as NapiError, Task};
#[cfg(not(target_arch = "wasm32"))]
use napi_derive::napi;
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::{
  prelude::{wasm_bindgen, JsValue},
  JsCast,
};

mod error;
mod fonts;
mod options;

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

/// Renders an SVG
#[cfg(not(target_arch = "wasm32"))]
#[napi]
pub fn render(svg: Either<String, Buffer>, options: Option<String>) -> Result<Buffer, NapiError> {
  let js_options: options::JsOptions = options
    .and_then(|o| serde_json::from_str(o.as_str()).ok())
    .unwrap_or_default();

  let _ = env_logger::builder()
    .filter_level(js_options.log_level)
    .try_init();

  let buffer = js_options.render(&svg)?;

  Ok(buffer.into())
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn render(
  svg: IStringOrBuffer,
  options: Option<String>,
) -> Result<js_sys::Uint8Array, JsValue> {
  let js_options: options::JsOptions = options
    .and_then(|o| serde_json::from_str(o.as_str()).ok())
    .unwrap_or_default();
  Ok(if js_sys::Uint8Array::instanceof(&svg) {
    let uintarray = js_sys::Uint8Array::unchecked_from_js_ref(&svg);
    let svg_buffer = uintarray.to_vec();
    let buffer = js_options.render(svg_buffer.as_slice())?;
    buffer.as_slice().into()
  } else if let Some(s) = svg.as_string() {
    let buffer = js_options.render(s.as_str())?;
    buffer.as_slice().into()
  } else {
    return Err(error::Error::InvalidInput.into());
  })
}

#[cfg(not(target_arch = "wasm32"))]
pub struct AsyncRenderer {
  options: options::JsOptions,
  svg: Either<String, Buffer>,
}

#[cfg(not(target_arch = "wasm32"))]
#[napi]
impl Task for AsyncRenderer {
  type Output = Vec<u8>;
  type JsValue = Buffer;

  fn compute(&mut self) -> Result<Self::Output, NapiError> {
    Ok(self.options.render(&self.svg)?)
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
