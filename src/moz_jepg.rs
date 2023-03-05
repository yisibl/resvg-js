use std::{any::Any, mem};

use mozjpeg_sys::*;

pub struct MozJPEGData {
    pub data: *mut u8,
    pub size: usize,
}

impl Drop for MozJPEGData {
    fn drop(&mut self) {
        unsafe { Vec::from_raw_parts(self.data, self.size, self.size) };
    }
}

#[cfg(target_arch = "wasm32")]
impl MozJPEGData {
    pub fn as_slice(&self) -> &[u8] {
        unsafe { std::slice::from_raw_parts(self.data.cast_const(), self.size) }
    }
}

pub unsafe fn encode(
    buffer: &[u8],
    width: u32,
    height: u32,
    quality: u32,
) -> Result<MozJPEGData, Box<dyn Any + Send>> {
    std::panic::catch_unwind(|| {
        let quality = quality as i32;
        let mut err = mem::zeroed();
        let mut cinfo: jpeg_compress_struct = mem::zeroed();
        cinfo.common.err = jpeg_std_error(&mut err);
        jpeg_create_compress(&mut cinfo);
        let mut buf = std::ptr::null_mut();
        let mut outsize = 0;
        jpeg_mem_dest(&mut cinfo, &mut buf, &mut outsize);

        cinfo.image_width = width;
        cinfo.image_height = height;
        cinfo.in_color_space = J_COLOR_SPACE::JCS_RGB;
        cinfo.input_components = 3;
        jpeg_set_defaults(&mut cinfo);

        let row_stride = cinfo.image_width as usize * cinfo.input_components as usize;
        cinfo.dct_method = J_DCT_METHOD::JDCT_ISLOW;
        jpeg_set_quality(&mut cinfo, quality, true as boolean);

        jpeg_start_compress(&mut cinfo, true as boolean);

        while cinfo.next_scanline < cinfo.image_height {
            let offset = cinfo.next_scanline as usize * row_stride;
            let jsamparray = [buffer[offset..].as_ptr()];
            jpeg_write_scanlines(&mut cinfo, jsamparray.as_ptr(), 1);
        }

        jpeg_finish_compress(&mut cinfo);
        jpeg_destroy_compress(&mut cinfo);
        MozJPEGData {
            data: buf,
            size: outsize as usize,
        }
    })
}
