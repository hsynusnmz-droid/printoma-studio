/**
 * Image Optimization Utilities
 * Compresses and resizes user-uploaded images to improve performance
 */

/**
 * Resize and compress an image file
 * @param file - The image file to resize
 * @param maxWidth - Maximum width in pixels (default: 2048)
 * @param maxHeight - Maximum height in pixels (default: 2048)
 * @param quality - JPEG quality 0-1 (default: 0.9)
 * @returns Promise<string> - Blob URL of the resized image
 */
export async function resizeImage(
    file: File,
    maxWidth: number = 2048,
    maxHeight: number = 2048,
    quality: number = 0.9
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Canvas context oluşturulamadı!'));
            return;
        }

        img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
                const aspectRatio = width / height;

                if (width > height) {
                    width = maxWidth;
                    height = maxWidth / aspectRatio;
                } else {
                    height = maxHeight;
                    width = maxHeight * aspectRatio;
                }
            }

            // Set canvas size
            canvas.width = width;
            canvas.height = height;

            // Draw image with high quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        resolve(url);

                        // Log optimization stats
                        const originalSize = file.size / 1024 / 1024;
                        const newSize = blob.size / 1024 / 1024;
                        const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);

                        console.log(`📦 Image Optimized:
- Original: ${originalSize.toFixed(2)}MB (${img.width}x${img.height}px)
- New: ${newSize.toFixed(2)}MB (${width.toFixed(0)}x${height.toFixed(0)}px)
- Reduction: ${reduction}%`);
                    } else {
                        reject(new Error('Blob oluşturulamadı!'));
                    }
                },
                'image/jpeg', // Use JPEG for better compression
                quality
            );
        };

        img.onerror = () => {
            reject(new Error('Görsel yüklenemedi!'));
        };

        // Load the image
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Quick check if an image needs resizing
 * @param file - Image file to check
 * @param maxSize - Max dimension (default: 2048)
 * @returns Promise<boolean> - True if image is larger than maxSize
 */
export async function shouldResizeImage(file: File, maxSize: number = 2048): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
            resolve(img.width > maxSize || img.height > maxSize);
            URL.revokeObjectURL(img.src);
        };

        img.onerror = () => {
            resolve(false);
        };

        img.src = URL.createObjectURL(file);
    });
}
