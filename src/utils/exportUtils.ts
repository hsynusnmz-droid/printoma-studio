import { Layer } from '../store/useStore';

/**
 * Basit Baskı Dosyası Oluşturucu
 * Tüm katmanları yüksek kalitede birleştirir ve şeffaf PNG olarak indirir.
 */
export async function downloadPrintFile(layers: Layer[]): Promise<void> {
    // 1. Görünür katmanları filtrele
    const visibleLayers = layers.filter(l => l.visible !== false);

    if (visibleLayers.length === 0) {
        alert('Lütfen en az bir görünür katman ekleyin!');
        return;
    }

    // 2. Tüm görselleri yükle
    const loadedImages: HTMLImageElement[] = [];

    for (const layer of visibleLayers) {
        try {
            const img = new Image();
            img.crossOrigin = "anonymous";

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = layer.src;
            });

            loadedImages.push(img);
        } catch (err) {
            console.error(`Görsel yüklenemedi:`, err);
        }
    }

    if (loadedImages.length === 0) {
        alert('Hiçbir görsel yüklenemedi!');
        return;
    }

    // 3. En büyük boyutları bul (yüksek kalite için)
    const maxWidth = Math.max(...loadedImages.map(img => img.width));
    const maxHeight = Math.max(...loadedImages.map(img => img.height));

    // 4. Yüksek çözünürlüklü canvas oluştur
    // En az 2000px, maksimum 4000px
    const scale = Math.min(4000 / Math.max(maxWidth, maxHeight), 3);
    const canvasWidth = Math.max(2000, maxWidth * scale);
    const canvasHeight = Math.max(2000, maxHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d', {
        alpha: true,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
    }) as CanvasRenderingContext2D | null;

    if (!ctx) {
        alert('Canvas oluşturulamadı!');
        return;
    }

    // 5. Şeffaf arka plan
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 6. Tüm görselleri ortadan çiz (üst üste)
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    for (const img of loadedImages) {
        const imgWidth = img.width * scale;
        const imgHeight = img.height * scale;

        const x = centerX - imgWidth / 2;
        const y = centerY - imgHeight / 2;

        ctx.drawImage(img, x, y, imgWidth, imgHeight);
    }

    // 7. PNG olarak indir
    const dataURL = canvas.toDataURL('image/png', 1.0);

    if (dataURL === 'data:,') {
        alert('Export başarısız oldu!');
        return;
    }

    const link = document.createElement('a');
    link.download = `baskı-dosyası-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`✅ Baskı dosyası indirildi!\n${canvasWidth}x${canvasHeight}px`);
}

/**
 * Tasarım Önizleme Görseli Oluştur
 * 800x800px düşük çözünürlüklü thumbnail oluşturur (Supabase storage için)
 */
export async function generateDesignThumbnail(layers: Layer[]): Promise<Blob> {
    // 1. Görünür katmanları filtrele
    const visibleLayers = layers.filter(l => l.visible !== false);

    if (visibleLayers.length === 0) {
        throw new Error('En az bir görünür katman gerekli!');
    }

    // 2. Tüm görselleri yükle
    const loadedImages: HTMLImageElement[] = [];

    for (const layer of visibleLayers) {
        try {
            const img = new Image();
            img.crossOrigin = "anonymous";

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = layer.src;
            });

            loadedImages.push(img);
        } catch (err) {
            console.error(`Görsel yüklenemedi:`, err);
        }
    }

    if (loadedImages.length === 0) {
        throw new Error('Hiçbir görsel yüklenemedi!');
    }

    // 3. Thumbnail boyutu (800x800px)
    const THUMBNAIL_SIZE = 800;
    const canvas = document.createElement('canvas');
    canvas.width = THUMBNAIL_SIZE;
    canvas.height = THUMBNAIL_SIZE;

    const ctx = canvas.getContext('2d', {
        alpha: true,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
    }) as CanvasRenderingContext2D | null;

    if (!ctx) {
        throw new Error('Canvas oluşturulamadı!');
    }

    // 4. Şeffaf arka plan
    ctx.clearRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

    // 5. Tüm görselleri ortadan çiz
    const centerX = THUMBNAIL_SIZE / 2;
    const centerY = THUMBNAIL_SIZE / 2;

    // En büyük görsel boyutunu bul
    const maxWidth = Math.max(...loadedImages.map(img => img.width));
    const maxHeight = Math.max(...loadedImages.map(img => img.height));
    const scale = (THUMBNAIL_SIZE * 0.8) / Math.max(maxWidth, maxHeight);

    for (const img of loadedImages) {
        const imgWidth = img.width * scale;
        const imgHeight = img.height * scale;

        const x = centerX - imgWidth / 2;
        const y = centerY - imgHeight / 2;

        ctx.drawImage(img, x, y, imgWidth, imgHeight);
    }

    // 6. Blob olarak dönüştür
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Thumbnail oluşturulamadı!'));
                }
            },
            'image/png',
            0.9 // Quality
        );
    });
}
