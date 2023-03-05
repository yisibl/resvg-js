#[cfg(not(target_arch = "wasm32"))]
extern crate napi_build;

fn main() {
    #[cfg(not(target_arch = "wasm32"))]
    napi_build::setup();

    let arch = std::env::var("CARGO_CFG_TARGET_ARCH").expect("CARGO_CFG_TARGET_ARCH not set");

    if arch == "wasm32" {
        println!("cargo:rustc-link-arg=--no-entry");
    }
}
