'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Folder, Trash2, Calendar } from 'lucide-react';
import { loadUserDesigns, deleteDesign } from '@/lib/designService';
import { useStore } from '@/store/useStore';
import type { Layer } from '@/store/useStore';
import Image from 'next/image';

interface DesignGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Design {
    id: string;
    name: string;
    tshirt_color: string;
    layers_data: Layer[];
    preview_img_url: string | null;
    created_at: string;
}

export default function DesignGalleryModal({ isOpen, onClose }: DesignGalleryModalProps) {
    const [designs, setDesigns] = useState<Design[]>([]);
    const [loading, setLoading] = useState(true);
    const setLayers = useStore((s) => s.setLayers);
    const setTshirtColor = useStore((s) => s.setTshirtColor);

    const fetchDesigns = useCallback(async () => {
        setLoading(true);
        const userDesigns = await loadUserDesigns();
        setDesigns(userDesigns);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchDesigns();
        }
    }, [isOpen, fetchDesigns]);

    const handleLoadDesign = (design: Design) => {
        // Load design state into store
        setLayers(design.layers_data);
        setTshirtColor(design.tshirt_color);

        // Close modal and show success
        onClose();
        alert(`✅ "${design.name}" tasarımı yüklendi!`);
    };

    const handleDeleteDesign = async (e: React.MouseEvent, designId: string, designName: string) => {
        e.stopPropagation(); // Prevent loading design when clicking delete

        const confirmed = window.confirm(`"${designName}" tasarımını silmek istediğinize emin misiniz?`);

        if (!confirmed) return;

        const success = await deleteDesign(designId);

        if (success) {
            alert('✅ Tasarım silindi!');
            fetchDesigns(); // Refresh list
        } else {
            alert('❌ Tasarım silinemedi!');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[80vh] bg-white rounded-2xl shadow-2xl p-8 mx-4 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Folder className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-2xl font-bold text-slate-900">Tasarımlarım</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : designs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Folder className="w-20 h-20 text-slate-300 mb-4" />
                            <h3 className="text-xl font-semibold text-slate-700 mb-2">
                                Henüz tasarım yok
                            </h3>
                            <p className="text-slate-500">
                                İlk tasarımınızı oluşturup kaydedin!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {designs.map((design) => (
                                <div
                                    key={design.id}
                                    onClick={() => handleLoadDesign(design)}
                                    className="group relative bg-slate-50 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-indigo-500 transition-all cursor-pointer hover:shadow-lg"
                                >
                                    {/* Thumbnail */}
                                    <div className="aspect-square relative bg-white">
                                        {design.preview_img_url ? (
                                            <Image
                                                src={design.preview_img_url}
                                                alt={design.name}
                                                fill
                                                className="object-contain p-4"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-slate-400">
                                                <Folder className="w-16 h-16" />
                                            </div>
                                        )}

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => handleDeleteDesign(e, design.id, design.name)}
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4 border-t border-slate-200">
                                        <h3 className="font-semibold text-slate-900 mb-1 truncate">
                                            {design.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(design.created_at)}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div
                                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                                style={{ backgroundColor: design.tshirt_color }}
                                            />
                                            <span className="text-xs text-slate-600">
                                                {design.layers_data.length} katman
                                            </span>
                                        </div>
                                    </div>

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-all pointer-events-none" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
