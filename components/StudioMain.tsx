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

        const url = URL.createObjectURL(file);
        addLayer({ src: url });

        // TODO: Uygun zamanda URL.revokeObjectURL(url) çağırılacak.
        e.target.value = '';
    };

    if (!product) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-500">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <span>Ürün yükleniyor...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-stretch h-screen w-full bg-slate-50 overflow-hidden">
            {/* Main Canvas Area */}
            <ProductSceneBaseline
                // Fallback to local file if Supabase URL is broken/unreachable
                modelPath={product.model_url && !product.model_url.includes('supabase') ? product.model_url : '/t-shirt.glb'}
                scale={product.config.scale}
                position={product.config.position}
            />

            {/* Right Control Panel */}
            <ControlPanel onUpload={handleUpload} />
        </div>
    );
}
