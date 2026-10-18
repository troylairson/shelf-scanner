import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'

const MAX_DIMENSION_PX = 1200
const JPEG_QUALITY = 0.7

// Shrink to ~1200px on the long edge as JPEG: plenty for reading spines and keeps uploads small.
export async function prepareForUpload(uri: string, width: number, height: number): Promise<string> {
  const context = ImageManipulator.manipulate(uri)
  if (Math.max(width, height) > MAX_DIMENSION_PX) {
    context.resize(width >= height ? { width: MAX_DIMENSION_PX } : { height: MAX_DIMENSION_PX })
  }
  const image = await context.renderAsync()
  const result = await image.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG })
  return result.uri
}
