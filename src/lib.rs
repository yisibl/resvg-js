// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

use std::sync::Arc;

#[cfg(not(target_arch = "wasm32"))]
use napi::bindgen_prelude::{
    AbortSignal, AsyncTask, Buffer, Either, Error as NapiError, Task, Undefined,
};
use pathfinder_content::{
    outline::{Contour, Outline},
    stroke::{LineCap, LineJoin, OutlineStrokeToFill, StrokeStyle},
};
use pathfinder_geometry::rect::RectF;
use pathfinder_geometry::vector::Vector2F;

#[cfg(not(target_arch = "wasm32"))]
use napi_derive::napi;
use options::JsOptions;
use resvg::tiny_skia::Pixmap;
use resvg::usvg::{self, ImageKind, NodeKind};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::{
    prelude::{wasm_bindgen, JsValue},
    JsCast,
};

mod error;
mod fonts;
mod options;

use error::Error;
use usvg::NodeExt;

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
#[derive(Debug)]
pub struct BBox {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
#[cfg_attr(not(target_arch = "wasm32"), napi)]
pub struct Resvg {
    tree: usvg::Tree,
    js_options: JsOptions,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
#[cfg_attr(not(target_arch = "wasm32"), napi)]
pub struct RenderedImage {
    pix: Pixmap,
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen)]
#[cfg_attr(not(target_arch = "wasm32"), napi)]
impl RenderedImage {
    // Wasm
    #[cfg(not(target_arch = "wasm32"))]
    #[napi]
    /// Write the image data to Buffer
    pub fn as_png(&self) -> Result<Buffer, NapiError> {
        let buffer = self.pix.encode_png().map_err(Error::from)?;
        Ok(buffer.into())
    }

    #[cfg(target_arch = "wasm32")]
    #[wasm_bindgen(getter)]
    /// Get the PNG width
    pub fn width(&self) -> u32 {
        self.pix.width()
    }

    #[cfg(target_arch = "wasm32")]
    #[wasm_bindgen(getter)]
    /// Get the PNG height
    pub fn height(&self) -> u32 {
        self.pix.height()
    }

    // napi-rs
    #[cfg(target_arch = "wasm32")]
    #[wasm_bindgen(js_name = asPng)]
    /// Write the image data to Uint8Array
    pub fn as_png(&self) -> Result<js_sys::Uint8Array, js_sys::Error> {
        let buffer = self.pix.encode_png().map_err(Error::from)?;
        Ok(buffer.as_slice().into())
    }

    /// Get the RGBA pixels of the image
    #[cfg(target_arch = "wasm32")]
    pub fn pixels(&self) -> js_sys::Uint8Array {
        self.pix.data().into()
    }

    /// Get the RGBA pixels of the image
    #[cfg(not(target_arch = "wasm32"))]
    #[napi(getter)]
    pub fn pixels(&self) -> Buffer {
        self.pix.data().into()
    }

    #[cfg(not(target_arch = "wasm32"))]
    #[napi(getter)]
    /// Get the PNG width
    pub fn width(&self) -> u32 {
        self.pix.width()
    }

    #[cfg(not(target_arch = "wasm32"))]
    #[napi(getter)]
    /// Get the PNG height
    pub fn height(&self) -> u32 {
        self.pix.height()
    }
}

#[cfg(not(target_arch = "wasm32"))]
#[napi]
impl Resvg {
    #[napi(constructor)]
    pub fn new(svg: Either<String, Buffer>, options: Option<String>) -> Result<Resvg, NapiError> {
        Resvg::new_inner(&svg, options)
    }

    fn new_inner(
        svg: &Either<String, Buffer>,
        options: Option<String>,
    ) -> Result<Resvg, NapiError> {
        let js_options: JsOptions = options
            .and_then(|o| serde_json::from_str(o.as_str()).ok())
            .unwrap_or_default();
        let _ = env_logger::builder()
            .filter_level(js_options.log_level)
            .try_init();

        let mut opts = js_options.to_usvg_options();
        options::tweak_usvg_options(&mut opts);
        let opts_ref = opts.to_ref();
        // Parse the SVG string into a tree.
        let tree = match svg {
            Either::A(a) => usvg::Tree::from_str(a.as_str(), &opts_ref),
            Either::B(b) => usvg::Tree::from_data(b.as_ref(), &opts_ref),
        }
        .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;
        Ok(Resvg { tree, js_options })
    }

    #[napi]
    /// Renders an SVG in Node.js
    pub fn render(&self) -> Result<RenderedImage, NapiError> {
        Ok(self.render_inner()?)
    }

    #[napi]
    /// Output usvg-simplified SVG string
    pub fn to_string(&self) -> String {
        self.tree.to_string(&usvg::XmlOptions::default())
    }

    #[napi(js_name = innerBBox)]
    /// Calculate a maximum bounding box of all visible elements in this SVG.
    ///
    /// Note: path bounding box are approx values.

    // Either<T, Undefined> depends on napi 2.4.3
    // https://github.com/napi-rs/napi-rs/releases/tag/napi@2.4.3
    pub fn inner_bbox(&self) -> Either<BBox, Undefined> {
        let rect = self.tree.view_box.rect;
        let rect = points_to_rect(
            usvg::Point::new(rect.x(), rect.y()),
            usvg::Point::new(rect.right(), rect.bottom()),
        );
        let mut v = None;
        for child in self.tree.root.children() {
            let child_viewbox = match self.node_bbox(child).and_then(|v| v.intersection(rect)) {
                Some(v) => v,
                None => continue,
            };
            if let Some(v) = v.as_mut() {
                *v = child_viewbox.union_rect(*v);
            } else {
                v = Some(child_viewbox)
            };
        }
        match v {
            Some(v) => Either::A(BBox {
                x: v.min_x().floor() as f64,
                y: v.min_y().floor() as f64,
                width: (v.max_x().ceil() - v.min_x().floor()) as f64,
                height: (v.max_y().ceil() - v.min_y().floor()) as f64,
            }),
            None => Either::B(()),
        }
    }

    #[napi(js_name = getBBox)]
    /// Calculate a maximum bounding box of all visible elements in this SVG.
    /// This will first apply transform.
    /// Similar to `SVGGraphicsElement.getBBox()` DOM API.

    // Either<T, Undefined> depends on napi 2.4.3
    // https://github.com/napi-rs/napi-rs/releases/tag/napi@2.4.3
    pub fn get_bbox(&self) -> Either<BBox, Undefined> {
        match self.tree.root.calculate_bbox() {
            Some(bbox) => Either::A(BBox {
                x: bbox.x(),
                y: bbox.y(),
                width: bbox.width(),
                height: bbox.height(),
            }),
            None => Either::B(()),
        }
    }

    #[napi(js_name = cropByBBox)]
    /// Use a given `BBox` to crop the svg. Currently this method simply changes
    /// the viewbox/size of the svg and do not move the elements for simplicity
    pub fn crop_by_bbox(&mut self, bbox: &BBox) {
        if !bbox.width.is_finite() || !bbox.height.is_finite() {
            return;
        }
        let width = bbox.width;
        let height = bbox.height;
        self.tree.view_box.rect = usvg::Rect::new(bbox.x, bbox.y, width, height).unwrap();
        self.tree.size = usvg::Size::new(width, height).unwrap();
    }

    #[napi]
    pub fn images_to_resolve(&self) -> Result<Vec<String>, NapiError> {
        Ok(self.images_to_resolve_inner()?)
    }

    #[napi]
    pub fn resolve_image(&self, href: String, buffer: Buffer) -> Result<(), NapiError> {
        let buffer = buffer.to_vec();
        Ok(self.resolve_image_inner(href, buffer)?)
    }

    /// Get the SVG width
    #[napi(getter)]
    pub fn width(&self) -> f64 {
        self.tree.size.width().round()
    }

    /// Get the SVG height
    #[napi(getter)]
    pub fn height(&self) -> f64 {
        self.tree.size.height().round()
    }
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
impl Resvg {
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

    /// Get the SVG width
    #[wasm_bindgen(getter)]
    pub fn width(&self) -> f64 {
        self.tree.size.width().round()
    }

    /// Get the SVG height
    #[wasm_bindgen(getter)]
    pub fn height(&self) -> f64 {
        self.tree.size.height().round()
    }

    /// Renders an SVG in Wasm
    pub fn render(&self) -> Result<RenderedImage, js_sys::Error> {
        Ok(self.render_inner()?)
    }

    /// Output usvg-simplified SVG string
    #[wasm_bindgen(js_name = toString)]
    pub fn to_string(&self) -> String {
        self.tree.to_string(&usvg::XmlOptions::default())
    }

    /// Calculate a maximum bounding box of all visible elements in this SVG.
    ///
    /// Note: path bounding box are approx values.
    #[wasm_bindgen(js_name = innerBBox)]
    pub fn inner_bbox(&self) -> Option<BBox> {
        let rect = self.tree.view_box.rect;
        let rect = points_to_rect(
            usvg::Point::new(rect.x(), rect.y()),
            usvg::Point::new(rect.right(), rect.bottom()),
        );
        let mut v = None;
        for child in self.tree.root.children() {
            let child_viewbox = match self.node_bbox(child).and_then(|v| v.intersection(rect)) {
                Some(v) => v,
                None => continue,
            };
            if let Some(v) = v.as_mut() {
                *v = child_viewbox.union_rect(*v);
            } else {
                v = Some(child_viewbox)
            };
        }
        let v = v?;
        Some(BBox {
            x: v.min_x().floor() as f64,
            y: v.min_y().floor() as f64,
            width: (v.max_x().ceil() - v.min_x().floor()) as f64,
            height: (v.max_y().ceil() - v.min_y().floor()) as f64,
        })
    }

    #[wasm_bindgen(js_name = getBBox)]
    /// Calculate a maximum bounding box of all visible elements in this SVG.
    /// This will first apply transform.
    /// Similar to `SVGGraphicsElement.getBBox()` DOM API.
    pub fn get_bbox(&self) -> Option<BBox> {
        let bbox = self.tree.root.calculate_bbox()?;
        Some(BBox {
            x: bbox.x(),
            y: bbox.y(),
            width: bbox.width(),
            height: bbox.height(),
        })
    }

    #[wasm_bindgen(js_name = cropByBBox)]
    /// Use a given `BBox` to crop the svg. Currently this method simply changes
    /// the viewbox/size of the svg and do not move the elements for simplicity
    pub fn crop_by_bbox(&mut self, bbox: &BBox) {
        if !bbox.width.is_finite() || !bbox.height.is_finite() {
            return;
        }
        let width = bbox.width;
        let height = bbox.height;
        self.tree.view_box.rect = usvg::Rect::new(bbox.x, bbox.y, width, height).unwrap();
        self.tree.size = usvg::Size::new(width, height).unwrap();
    }

    #[wasm_bindgen(js_name = imagesToResolve)]
    pub fn images_to_resolve(&self) -> Result<js_sys::Array, js_sys::Error> {
        let images = self.images_to_resolve_inner()?;
        let result = js_sys::Array::from_iter(images.into_iter().map(|s| JsValue::from(s)));
        Ok(result)
    }

    #[wasm_bindgen(js_name = resolveImage)]
    pub fn resolve_image(
        &self,
        href: String,
        buffer: js_sys::Uint8Array,
    ) -> Result<(), js_sys::Error> {
        let buffer = buffer.to_vec();
        Ok(self.resolve_image_inner(href, buffer)?)
    }
}

impl Resvg {
    fn node_bbox(&self, node: usvg::Node) -> Option<RectF> {
        let transform = node.borrow().transform();
        let bbox = match &*node.borrow() {
            usvg::NodeKind::Path(p) => {
                let no_fill = p.fill.is_none()
                    || p.fill
                        .as_ref()
                        .map(|f| f.opacity.get() == 0.0)
                        .unwrap_or_default();
                let no_stroke = p.stroke.is_none()
                    || p.stroke
                        .as_ref()
                        .map(|f| f.opacity.get() == 0.0)
                        .unwrap_or_default();
                if no_fill && no_stroke {
                    return None;
                }
                let mut outline = Outline::new();
                let mut contour = Contour::new();
                let mut iter = p.data.segments().peekable();
                while let Some(seg) = iter.next() {
                    match seg {
                        usvg::PathSegment::MoveTo { x, y } => {
                            if !contour.is_empty() {
                                outline
                                    .push_contour(std::mem::replace(&mut contour, Contour::new()));
                            }
                            contour.push_endpoint(Vector2F::new(x as f32, y as f32));
                        }
                        usvg::PathSegment::LineTo { x, y } => {
                            let v = Vector2F::new(x as f32, y as f32);
                            if let Some(usvg::PathSegment::ClosePath) = iter.peek() {
                                let first = contour.position_of(0);
                                if (first - v).square_length() < 1.0 {
                                    continue;
                                }
                            }
                            contour.push_endpoint(v);
                        }
                        usvg::PathSegment::CurveTo {
                            x1,
                            y1,
                            x2,
                            y2,
                            x,
                            y,
                        } => {
                            contour.push_cubic(
                                Vector2F::new(x1 as f32, y1 as f32),
                                Vector2F::new(x2 as f32, y2 as f32),
                                Vector2F::new(x as f32, y as f32),
                            );
                        }
                        usvg::PathSegment::ClosePath => {
                            contour.close();
                            outline.push_contour(std::mem::replace(&mut contour, Contour::new()));
                        }
                    }
                }
                if !contour.is_empty() {
                    outline.push_contour(std::mem::replace(&mut contour, Contour::new()));
                }
                if let Some(stroke) = p.stroke.as_ref() {
                    if !no_stroke {
                        let mut style = StrokeStyle::default();
                        style.line_width = stroke.width.get() as f32;
                        style.line_join = LineJoin::Miter(style.line_width);
                        style.line_cap = match stroke.linecap {
                            usvg::LineCap::Butt => LineCap::Butt,
                            usvg::LineCap::Round => LineCap::Round,
                            usvg::LineCap::Square => LineCap::Square,
                        };
                        let mut filler = OutlineStrokeToFill::new(&outline, style);
                        filler.offset();
                        outline = filler.into_outline();
                    }
                }
                Some(outline.bounds())
            }
            usvg::NodeKind::Group(g) => {
                let clippath = if let Some(clippath) =
                    g.clip_path.as_ref().and_then(|n| n.root.first_child())
                {
                    self.node_bbox(clippath)
                } else if let Some(mask) = g.mask.as_ref().and_then(|n| n.root.first_child()) {
                    self.node_bbox(mask)
                } else {
                    Some(self.viewbox())
                }?;
                let mut v = None;
                for child in node.children() {
                    let child_viewbox =
                        match self.node_bbox(child).and_then(|v| v.intersection(clippath)) {
                            Some(v) => v,
                            None => continue,
                        };
                    if let Some(v) = v.as_mut() {
                        *v = child_viewbox.union_rect(*v);
                    } else {
                        v = Some(child_viewbox)
                    };
                }
                v.and_then(|v| v.intersection(self.viewbox()))
            }
            usvg::NodeKind::Image(image) => {
                let rect = image.view_box.rect;
                Some(points_to_rect(
                    usvg::Point::new(rect.x(), rect.y()),
                    usvg::Point::new(rect.right(), rect.bottom()),
                ))
            }
        }?;
        let (x1, y1) = transform.apply(bbox.min_x() as f64, bbox.min_y() as f64);
        let (x2, y2) = transform.apply(bbox.max_x() as f64, bbox.max_y() as f64);
        let (x3, y3) = transform.apply(bbox.min_x() as f64, bbox.max_y() as f64);
        let (x4, y4) = transform.apply(bbox.max_x() as f64, bbox.min_y() as f64);
        let x_min = x1.min(x2).min(x3).min(x4);
        let x_max = x1.max(x2).max(x3).max(x4);
        let y_min = y1.min(y2).min(y3).min(y4);
        let y_max = y1.max(y2).max(y3).max(y4);
        let r = points_to_rect(
            usvg::Point::new(x_min, y_min),
            usvg::Point::new(x_max, y_max),
        );
        Some(r)
    }

    fn viewbox(&self) -> RectF {
        RectF::new(
            Vector2F::new(0.0, 0.0),
            Vector2F::new(self.width() as f32, self.height() as f32),
        )
    }

    fn render_inner(&self) -> Result<RenderedImage, Error> {
        let pixmap_size = self
            .js_options
            .fit_to
            .fit_to(self.tree.size.to_screen_size())
            .ok_or_else(|| Error::ZeroSized)?;
        let mut pixmap = self.js_options.create_pixmap(pixmap_size)?;
        // Render the tree
        let _image = resvg::render(
            &self.tree,
            self.js_options.fit_to,
            resvg::tiny_skia::Transform::default(),
            pixmap.as_mut(),
        );

        // Crop the SVG
        let crop_rect = resvg::tiny_skia::IntRect::from_ltrb(
            self.js_options.crop.left,
            self.js_options.crop.top,
            self.js_options
                .crop
                .right
                .unwrap_or(pixmap_size.width() as i32),
            self.js_options
                .crop
                .bottom
                .unwrap_or(pixmap_size.height() as i32),
        );

        if let Some(crop_rect) = crop_rect {
            pixmap = pixmap.clone_rect(crop_rect).unwrap_or(pixmap);
        }

        Ok(RenderedImage { pix: pixmap })
    }

    fn images_to_resolve_inner(&self) -> Result<Vec<String>, Error> {
        let mut data = vec![];
        for node in self.tree.root.descendants() {
            if let NodeKind::Image(i) = &mut *node.borrow_mut() {
                if let ImageKind::RAW(_, _, buffer) = &mut i.kind {
                    let s = String::from_utf8(buffer.clone())?;
                    data.push(s);
                }
            }
        }
        Ok(data)
    }

    fn resolve_image_inner(&self, href: String, buffer: Vec<u8>) -> Result<(), Error> {
        let resolver = usvg::ImageHrefResolver::default_data_resolver();
        let options = self.js_options.to_usvg_options();
        let mime = infer::get(&buffer)
            .ok_or_else(|| Error::UnrecognizedBuffer)?
            .to_string();
        for node in self.tree.root.descendants() {
            if let NodeKind::Image(i) = &mut *node.borrow_mut() {
                let matched = if let ImageKind::RAW(_, _, data) = &mut i.kind {
                    let s = String::from_utf8(data.clone()).map_err(Error::from)?;
                    s == href
                } else {
                    false
                };
                if matched {
                    let data = (resolver)(&mime, Arc::new(buffer.clone()), &options.to_ref());
                    if let Some(kind) = data {
                        i.kind = kind;
                    }
                }
            }
        }
        Ok(())
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
    type Output = RenderedImage;
    type JsValue = RenderedImage;

    fn compute(&mut self) -> Result<Self::Output, NapiError> {
        let resvg = Resvg::new_inner(&self.svg, self.options.clone())?;
        Ok(resvg.render()?)
    }

    fn resolve(
        &mut self,
        _env: napi::Env,
        result: Self::Output,
    ) -> Result<Self::JsValue, NapiError> {
        Ok(result)
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

fn points_to_rect(min: usvg::Point<f64>, max: usvg::Point<f64>) -> RectF {
    let min = Vector2F::new(min.x as f32, min.y as f32);
    let max = Vector2F::new(max.x as f32, max.y as f32);
    RectF::new(min, max - min)
}
