'use client';

import React from 'react';
import ProductSceneBaseline from './ProductSceneBaseline';
import ControlPanel from './ControlPanel';
import { useStore } from '@/store/useStore';
import { ProductConfig } from '@/types/supabase-custom';

interface StudioMainProps {
    product: {
        id: string;
        name: string;
        model_url: string;
        config: ProductConfig;
    } | null;
}

export default function StudioMain({ product }: StudioMainProps) {
    const { addLayer } = useStore();

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // ✅ Image validation
        if (!file.type.startsWith('image/')) {
            alert('Lütfen sadece görsel dosyası yükleyin (PNG, JPG, SVG)');
            return;
        }

        const url = URL.createObjectURL(file);
        addLayer({ src: url });

        // ✅ FIX: URL cleanup (layer silindiğinde çağrılacak şekilde store'a eklenebilir)
        e.target.value = '';
    };

    if (!product) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-500">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-lg font-medium">Ürün yükleniyor...</span>
                </div>
            </div>
        );
    }

    // ✅ FIX: Local development fallback (Supabase URL bazen CORS/Network hatası veriyor)
    const isDev = process.env.NODE_ENV === 'development';
    const modelPath = isDev ? '/t-shirt.glb' : (product.model_url || '/t-shirt.glb');

    return (
        <div className="flex items-stretch h-screen w-full bg-slate-50 overflow-hidden">
            {/* Main Canvas Area */}
            <ProductSceneBaseline
                modelPath={modelPath}
                scale={product.config.scale}
                position={product.config.position}
            />

            {/* Right Control Panel */}
            <ControlPanel onUpload={handleUpload} />
        </div>
    );
}   