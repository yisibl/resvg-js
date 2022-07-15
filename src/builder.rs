use fontdb::{Database, Weight};
use fontkit::{FontKey, Width};
#[cfg(not(target_arch = "wasm32"))]
use napi::bindgen_prelude::{Buffer, Either, Error as NapiError};
#[cfg(not(target_arch = "wasm32"))]
use napi_derive::napi;
use ouroboros::self_referencing;
use roxmltree::Document;

use crate::{options::JsOptions, Resvg};

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
#[cfg_attr(not(target_arch = "wasm32"), napi)]
#[ouroboros::self_referencing]
pub struct ResvgBuilder {
    js_options: JsOptions,
    data: String,
    #[borrows(data)]
    #[covariant]
    doc: Document<'this>,
}

#[napi(js_name = "FontKey")]
pub struct FontKeyWrapper(FontKey);

#[cfg(not(target_arch = "wasm32"))]
#[napi]
impl ResvgBuilder {
    #[napi(constructor)]
    pub fn new_napi(
        svg: Either<String, Buffer>,
        options: Option<String>,
    ) -> Result<ResvgBuilder, NapiError> {
        ResvgBuilder::new_napi_inner(&svg, options)
    }

    pub fn new_napi_inner(
        svg: &Either<String, Buffer>,
        options: Option<String>,
    ) -> Result<ResvgBuilder, NapiError> {
        let js_options: JsOptions = options
            .and_then(|o| serde_json::from_str(o.as_str()).ok())
            .unwrap_or_default();
        let _ = env_logger::builder()
            .filter_level(js_options.log_level)
            .try_init();
        let mut opts = js_options.to_usvg_options();
        crate::options::tweak_usvg_options(&mut opts);
        let data = match svg {
            Either::A(a) => a.as_str(),
            Either::B(b) => std::str::from_utf8(b.as_ref())
                .map_err(|e| napi::Error::from_reason(format!("{}", e)))?,
        };
        ResvgBuilderTryBuilder {
            js_options,
            data: data.to_string(),
            doc_builder: |input| Document::parse(input),
        }
        .try_build()
        .map_err(|e| napi::Error::from_reason(format!("{}", e)))
    }

    #[napi]
    pub fn texts_to_resolve(&self) -> Vec<FontKeyWrapper> {
        self.borrow_doc()
            .descendants()
            .filter_map(|node| {
                let name = node.tag_name().name();
                if name == "text" || name == "tspan" {
                    let family = resolve_font_family(&node).unwrap_or_else(|| {
                        self.borrow_js_options().font.default_font_family.as_str()
                    });
                    let width = node
                        .attribute("font-stretch")
                        .and_then(|s| s.parse::<Width>().ok())
                        .unwrap_or(Width::from(5));
                    let weight = resolve_font_weight(&node);
                    let italic = node
                        .attribute("font-style")
                        .map(|s| s == "italic")
                        .unwrap_or_default();
                    let font_key = FontKey::new(family, weight.0 as u32, italic, width);
                    Some(FontKeyWrapper(font_key))
                } else {
                    None
                }
            })
            .collect()
    }

    pub fn resolve_font(&mut self, font: Buffer) {
        self.with_js_options_mut(|opts| opts.font_db.load_font_data(font.into()));
    }

    pub fn build(self) -> Result<Resvg, NapiError> {
        let ouroboros_impl_resvg_builder::Heads { js_options, data } = self.into_heads();
        let mut opts = js_options.to_usvg_options();
        crate::options::tweak_usvg_options(&mut opts);
        let opts_ref = opts.to_ref();
        let tree = usvg::Tree::from_str(data.as_str(), &opts_ref)
            .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;
        Ok(Resvg { tree, js_options })
    }

    // fn new_inner(
    //     svg: &Either<String, Buffer>,
    //     options: Option<String>,
    // ) -> Result<Resvg, NapiError> {
    //     let opts_ref = opts.to_ref();
    //     // Parse the SVG string into a tree.
    //     let tree = match svg {
    //         Either::A(a) => usvg::Tree::from_str(a.as_str(), &opts_ref),
    //         Either::B(b) => usvg::Tree::from_data(b.as_ref(), &opts_ref),
    //     }
    //     .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;
    //     Ok(Resvg { tree, js_options })
    // }
}

fn resolve_font_family<'a, 'input>(node: &roxmltree::Node<'a, 'input>) -> Option<&'a str> {
    for n in node.ancestors() {
        if let Some(family) = n.attribute("font-family") {
            return Some(family);
        }
    }
    None
}

// This method is extracted from usvg to keep the logic here is the same with usvg
fn resolve_font_weight<'a, 'input>(node: &roxmltree::Node<'a, 'input>) -> fontdb::Weight {
    fn bound(min: usize, val: usize, max: usize) -> usize {
        std::cmp::max(min, std::cmp::min(max, val))
    }

    let nodes: Vec<_> = node.ancestors().collect();
    let mut weight = 400;
    for n in nodes.iter().rev().skip(1) {
        // skip Root
        weight = match n.attribute("font-weight").unwrap_or("") {
            "normal" => 400,
            "bold" => 700,
            "100" => 100,
            "200" => 200,
            "300" => 300,
            "400" => 400,
            "500" => 500,
            "600" => 600,
            "700" => 700,
            "800" => 800,
            "900" => 900,
            "bolder" => {
                // By the CSS2 spec the default value should be 400
                // so `bolder` will result in 500.
                // But Chrome and Inkscape will give us 700.
                // Have no idea is it a bug or something, but
                // we will follow such behavior for now.
                let step = if weight == 400 { 300 } else { 100 };

                bound(100, weight + step, 900)
            }
            "lighter" => {
                // By the CSS2 spec the default value should be 400
                // so `lighter` will result in 300.
                // But Chrome and Inkscape will give us 200.
                // Have no idea is it a bug or something, but
                // we will follow such behavior for now.
                let step = if weight == 400 { 200 } else { 100 };

                bound(100, weight - step, 900)
            }
            _ => weight,
        };
    }

    fontdb::Weight(weight as u16)
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
impl ResvgBuilder {
    #[wasm_bindgen(constructor)]
    pub fn new(svg: IStringOrBuffer, options: Option<String>) -> Result<Resvg, js_sys::Error> {
        let js_options: JsOptions = options
            .and_then(|o| serde_json::from_str(o.as_str()).ok())
            .unwrap_or_default();

        let mut opts = js_options.to_usvg_options();
        options::tweak_usvg_options(&mut opts);
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
}
