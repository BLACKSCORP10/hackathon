/**
 * Image compression utility using HTML Canvas
 * Resizes large images (up to 5MB+) to max dimension 800px with 0.6 quality,
 * producing compact Base64 strings (<100KB) that fit comfortably within Firestore's 1MB limit.
 */

export interface CompressedImageResult {
  dataUrl: string;
  sizeBytes: number;
  sizeFormatted: string;
  width: number;
  height: number;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function compressImage(
  fileOrDataUrl: File | string,
  maxDimension: number = 800,
  quality: number = 0.6
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    // If running in an environment without document/window
    if (typeof window === 'undefined') {
      if (typeof fileOrDataUrl === 'string') {
        return resolve({
          dataUrl: fileOrDataUrl,
          sizeBytes: fileOrDataUrl.length,
          sizeFormatted: formatBytes(fileOrDataUrl.length),
          width: maxDimension,
          height: maxDimension,
        });
      }
    }

    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;

        // Calculate new dimensions respecting aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context unavailable');
        }

        // Draw image into canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with specified quality
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Approximate base64 payload size in bytes
        const sizeBytes = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          sizeBytes,
          sizeFormatted: formatBytes(sizeBytes),
          width,
          height,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for canvas compression'));
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          img.src = reader.result;
        } else {
          reject(new Error('FileReader returned non-string result'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
