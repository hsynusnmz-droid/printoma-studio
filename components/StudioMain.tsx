'use client';

import React from 'react';
import StudioCanvas from './StudioCanvas'; // Correct default import
import ControlPanel from './ControlPanel'; // Correct import
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
        if (e.target.files && e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            addLayer(url);

            // Allow multiple uploads of same file
            e.target.value = '';
        }
    };

    if (!product) {
        return <div className="flex items-center justify-center h-screen">Ürün yükleniyor...</div>;
    }

    return (
        <div className="flex items-stretch h-screen w-full bg-slate-50 overflow-hidden">
            {/* Main Canvas Area */}
            <div className="flex-1 relative">
                {/* We pass product config if needed by Canvas, but TShirtModel now uses local file mostly */}
                <StudioCanvas
                // We can still pass product props if StudioCanvas needs them, 
                // but TShirtModel handles the layers internally via store now.
                />
            </div>

            {/* Right Control Panel (formerly RightSidebar) */}
            <ControlPanel onUpload={handleUpload} />
        </div>
    );
}
