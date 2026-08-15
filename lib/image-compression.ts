import imageCompression from "browser-image-compression";

/**
 * Adverts arrive from two places. WhatsApp exports are already small — none of
 * the 32 adverts in the 2024/2026 archive exceed 500KB. Artwork sent straight
 * from a designer is the opposite: print-resolution, often 4000px+ and several
 * megabytes, where almost all of the weight is pixels no phone will ever show.
 *
 * So the strategy is to cap dimensions and leave quality high, rather than
 * squeezing quality to hit a size target. Coffee Times adverts are dense text —
 * phone numbers, service lists — and JPEG artefacts show up on text long before
 * they show up on photos. Downscaling an oversized image costs nothing visually;
 * dropping quality to 60 would make a phone number harder to read.
 */

/** Files at or below this are uploaded untouched. */
export const COMPRESS_THRESHOLD_BYTES = 1024 * 1024; // 1MB

/** Longest edge after resizing. Comfortably above any phone screen. */
export const MAX_EDGE_PX = 1600;

/** High enough that text stays crisp. */
export const JPEG_QUALITY = 0.85;

/** Animated GIFs would be flattened to a single frame, so they are left alone. */
const UNCOMPRESSIBLE_TYPES = ["image/gif"];

export function shouldOfferCompression(file: File): boolean {
  return file.size > COMPRESS_THRESHOLD_BYTES && !UNCOMPRESSIBLE_TYPES.includes(file.type);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Returns a smaller file, or the original if compression could not improve it.
 *
 * Re-encoding an already-optimised image can make it larger, so the result is
 * only used when it actually saves space. PNGs stay PNGs: converting to JPEG
 * would flatten transparency, and logos in this library rely on it.
 */
export async function compressImage(file: File): Promise<File> {
  if (!shouldOfferCompression(file)) return file;

  try {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: MAX_EDGE_PX,
      initialQuality: JPEG_QUALITY,
      useWebWorker: true, // keeps the CMS responsive on large files
      fileType: file.type === "image/png" ? "image/png" : "image/jpeg",
      preserveExif: false, // strips camera/location metadata from the public bucket
    });

    if (compressed.size >= file.size) {
      console.warn(
        `Compression did not reduce "${file.name}" (${file.size} -> ${compressed.size} bytes); keeping the original.`
      );
      return file;
    }

    // The library can return a plain Blob; normalise so the filename survives.
    return new File([compressed], file.name, {
      type: compressed.type || file.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    // A failed compression must not block the upload — fall back to the original.
    console.error(`Could not compress "${file.name}":`, error);
    return file;
  }
}
