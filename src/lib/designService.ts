import { createClient } from '@/lib/supabase/client';
import { useStore, type Layer } from '@/store/useStore';
import { generateDesignThumbnail } from '@/utils/exportUtils';

/**
 * Save Design to Supabase
 * Uploads thumbnail and layer images to storage, saves design data to database
 */
export async function saveDesign(
    designName: string,
    layers: Layer[],
    tshirtColor: string
): Promise<{ success: boolean; message: string; designId?: string }> {
    try {
        // 1. Check Authentication
        const user = useStore.getState().user;

        if (!user) {
            throw new Error('Tasarımı kaydetmek için giriş yapmalısınız!');
        }

        // 2. Validate inputs
        if (!designName || designName.trim() === '') {
            throw new Error('Lütfen tasarım için bir isim girin!');
        }

        if (layers.length === 0) {
            throw new Error('En az bir katman ekleyin!');
        }

        const supabase = createClient();
        const timestamp = Date.now();

        // 3. ✅ FIX DEAD BLOB: Upload blob URLs to cloud storage
        console.log('☁️ Katman görselleri yükleniyor...');
        const persistentLayers: Layer[] = [];

        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];

            // Check if this is a blob URL
            if (layer.src.startsWith('blob:')) {
                try {
                    // Fetch blob data
                    const response = await fetch(layer.src);
                    const blob = await response.blob();

                    // Generate unique filename
                    const layerFileName = `${user.id}/${timestamp}-layer-${i}.png`;

                    // Upload to uploads bucket
                    const { error: layerUploadError } = await supabase.storage
                        .from('uploads')
                        .upload(layerFileName, blob, {
                            contentType: blob.type || 'image/png',
                            cacheControl: '3600',
                            upsert: false,
                        });

                    if (layerUploadError) {
                        throw new Error(`Katman ${i + 1} yüklenemedi: ${layerUploadError.message}`);
                    }

                    // Get permanent public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('uploads')
                        .getPublicUrl(layerFileName);

                    // Create layer with permanent URL
                    persistentLayers.push({
                        ...layer,
                        src: publicUrl, // Replace blob URL with permanent URL
                    });

                    console.log(`✅ Katman ${i + 1}/${layers.length} yüklendi`);
                } catch (error) {
                    console.error(`Katman ${i + 1} hatası:`, error);
                    throw new Error(`Katman görseli yüklenemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
                }
            } else {
                // Already a permanent URL, keep as is
                persistentLayers.push(layer);
            }
        }

        // 4. Generate Thumbnail
        console.log('📸 Thumbnail oluşturuluyor...');
        const thumbnailBlob = await generateDesignThumbnail(persistentLayers);

        // 5. Upload Thumbnail to Supabase Storage
        const thumbnailFileName = `${user.id}/${timestamp}-thumbnail.png`;

        console.log('☁️ Thumbnail yükleniyor...');
        const { error: uploadError } = await supabase.storage
            .from('previews')
            .upload(thumbnailFileName, thumbnailBlob, {
                contentType: 'image/png',
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            throw new Error(`Thumbnail yüklenemedi: ${uploadError.message}`);
        }

        // 6. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('previews')
            .getPublicUrl(thumbnailFileName);

        // 7. Save Design to Database with persistent URLs
        console.log('💾 Tasarım kaydediliyor...');
        const { data: designData, error: insertError } = await supabase
            .from('designs')
            .insert({
                user_id: user.id,
                name: designName.trim(),
                tshirt_color: tshirtColor,
                layers_data: persistentLayers, // ✅ Save with cloud URLs, not blob URLs
                preview_img_url: publicUrl,
            })
            .select('id')
            .single();

        if (insertError) {
            // Clean up uploaded files if DB insert fails
            await supabase.storage.from('previews').remove([thumbnailFileName]);
            // Also clean up layer images
            for (let i = 0; i < persistentLayers.length; i++) {
                const fileName = `${user.id}/${timestamp}-layer-${i}.png`;
                await supabase.storage.from('uploads').remove([fileName]);
            }
            throw new Error(`Veritabanı hatası: ${insertError.message}`);
        }

        return {
            success: true,
            message: '✅ Tasarım başarıyla kaydedildi!',
            designId: designData.id,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata oluştu';
        console.error('❌ Tasarım kaydetme hatası:', errorMessage);
        return {
            success: false,
            message: errorMessage,
        };
    }
}

export async function loadUserDesigns(): Promise<Array<{
    id: string;
    name: string;
    tshirt_color: string;
    layers_data: Layer[];
    preview_img_url: string | null;
    created_at: string;
}>> {
    const user = useStore.getState().user;

    if (!user) {
        return [];
    }

    const supabase = createClient();
    const { data, error } = await supabase
        .from('designs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Tasarımlar yüklenemedi:', error);
        return [];
    }

    return data || [];
}

/**
 * Delete Design from Supabase
 */
export async function deleteDesign(designId: string): Promise<boolean> {
    const user = useStore.getState().user;

    if (!user) {
        return false;
    }

    const supabase = createClient();

    // Get design to find image URL
    const { data: design } = await supabase
        .from('designs')
        .select('preview_img_url')
        .eq('id', designId)
        .single();

    // Delete from database
    const { error: deleteError } = await supabase
        .from('designs')
        .delete()
        .eq('id', designId)
        .eq('user_id', user.id); // Security: only delete own designs

    if (deleteError) {
        console.error('Silme hatası:', deleteError);
        return false;
    }

    // Delete image from storage if exists
    if (design?.preview_img_url) {
        const fileName = design.preview_img_url.split('/previews/')[1];
        if (fileName) {
            await supabase.storage.from('previews').remove([fileName]);
        }
    }

    return true;
}
