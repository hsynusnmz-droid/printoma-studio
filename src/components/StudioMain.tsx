'use client';

import React from 'react';
import ProductSceneBaseline from './ProductSceneBaseline';
import ControlPanel from './ControlPanel';
import LeftPanel from './LeftPanel';
import { useStore } from '@/store/useStore';
import { ProductConfig } from '@/config/products';
import { resizeImage } from '@/utils/imageOptimizer';

interface StudioMainProps {
    product: ProductConfig;
}

export default function StudioMain({ product }: StudioMainProps) {
    const { setPendingLayer } = useStore();

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // ✅ Image validation
        if (!file.type.startsWith('image/')) {
            alert('Lütfen sadece görsel dosyası yükleyin (PNG, JPG, SVG)');
            return;
        }

        // ✅ PERFORMANCE: Resize large images before upload
        try {
            console.log('🔄 Görsel optimize ediliyor...');
            const optimizedUrl = await resizeImage(file, 2048, 2048, 0.9);
            setPendingLayer({ src: optimizedUrl, type: 'image' });
        } catch (error) {
            console.error('Görsel optimizasyonu başarısız:', error);
            // Fallback: Use original if optimization fails
            const url = URL.createObjectURL(file);
            setPendingLayer({ src: url, type: 'image' });
        }

        e.target.value = '';
    };

    return (
        <div className="flex items-stretch h-screen w-full bg-slate-50 overflow-hidden">
            {/* Left Control Panel */}
            <LeftPanel />

            {/* Main Canvas Area */}
            <ProductSceneBaseline
                modelPath={product.modelPath}
                scale={1}
                position={[0, 0, 0]}
            />

            {/* Right Control Panel */}
            <ControlPanel onUpload={handleUpload} />
        </div>
    );
}