use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
  #[error(transparent)]
  SVG(#[from] svgtypes::Error),
  #[error(transparent)]
  USvg(#[from] usvg::Error),
  #[error(transparent)]
  Encoding(#[from] png::EncodingError),
  #[error("Target size is zero (please do not set the width/height/zoom options to 0)")]
  ZeroSized,
  #[error("Input must be string or Uint8Array")]
  InvalidInput,
}

#[cfg(not(target_arch = "wasm32"))]
impl From<Error> for napi::Error {
  fn from(e: Error) -> Self {
    napi::Error::from_reason(format!("{}", e))
  }
}

#[cfg(target_arch = "wasm32")]
impl From<Error> for wasm_bindgen::JsValue {
  fn from(e: Error) -> Self {
    js_sys::TypeError::new(&format!("{}", e)).into()
  }
}
