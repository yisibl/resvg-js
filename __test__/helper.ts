import jimp from 'jimp-compact'

/**
 * Convert image to RGBA pixels Array
 * Traverse the pixels in the order from left to right and top to bottom.
 *
 * @param {Buffer} imgBuffer
 * @param {Number} width image width
 * @param {Number} height image height
 * @returns {Array}, e.g. [255, 0, 0, 255, 255, 0, 0, 255]
 */
async function jimpToRgbaPixels(imgBuffer: Buffer, width: number, height: number) {
  const result = await jimp.read(imgBuffer)
  const pixels = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = jimp.intToRGBA(result.getPixelColor(x, y))
      pixels.push(pixel.r)
      pixels.push(pixel.g)
      pixels.push(pixel.b)
      pixels.push(pixel.a)
    }
  }
  return pixels
}

export { jimpToRgbaPixels }
