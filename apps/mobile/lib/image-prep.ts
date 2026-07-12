import * as ImageManipulator from 'expo-image-manipulator';

export const MAX_IMAGE_EDGE = 2048;
export const MAX_IMAGES = 8;
export const JPEG_QUALITY = 0.85;

/** Comprime y redimensiona antes de subir (ahorra datos en campo). */
export async function prepareListingPhoto(uri: string): Promise<{ uri: string; width: number; height: number }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_IMAGE_EDGE } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  return { uri: result.uri, width: result.width, height: result.height };
}
