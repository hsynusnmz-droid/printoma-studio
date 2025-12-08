'use client';

import React from 'react';
import { Upload, Layers, Type, Download } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface ControlPanelProps {
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ControlPanel({
    onUpload,
}: ControlPanelProps) {
    const { layers, activeLayerId, setActiveLayer, tshirtColor, setTshirtColor } = useStore();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col shadow-xl z-20">
            {/* Header */}
            <div className="p-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 text-lg">Tasarım Paneli</h2>
                <p className="text-xs text-slate-400">Özelleştirmeye başla</p>
            </div>

            {/* Tools Grid */}
            <div className="p-4 grid grid-cols-2 gap-3">
                <button
                    onClick={handleUploadClick}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mb-2" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-blue-600">Görsel Yükle</span>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onUpload}
                    className="hidden"
                    accept="image/*"
                />

                <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all">
                    <Type className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-600">Yazı Ekle</span>
                </button>
            </div>

            {/* Renk Seçimi */}
            <div className="p-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">T-Shirt Rengi</h3>
                <div className="flex gap-2">
                    {['#FFFFFF', '#000000', '#EF4444', '#3B82F6', '#22C55E', '#F59E0B'].map((color) => (
                        <button
                            key={color}
                            onClick={() => setTshirtColor(color)}
                            className={`w-8 h-8 rounded-full border-2 ${tshirtColor === color ? 'border-blue-500 scale-110' : 'border-slate-200'}`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>

            {/* Katmanlar (Layers) */}
            <div className="flex-1 overflow-y-auto p-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                    <Layers className="w-4 h-4 mr-2" />
                    Katmanlar ({layers.length})
                </h3>
                <div className="space-y-2">
                    {layers.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">Henüz katman yok.</p>
                    )}
                    {layers.map((layer, index) => (
                        <div
                            key={layer.id}
                            onClick={() => setActiveLayer(layer.id)}
                            className={`flex items-center p-2 rounded-lg cursor-pointer border ${activeLayerId === layer.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                        >
                            <div className="w-10 h-10 bg-slate-100 rounded overflow-hidden flex-shrink-0 border border-slate-200">
                                {layer.type === 'image' && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={layer.url} className="w-full h-full object-cover" alt={`Layer ${index + 1}`} />
                                )}
                            </div>
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-medium text-slate-700 truncate">Katman {index + 1}</p>
                                <p className="text-xs text-slate-400 capitalize">{layer.type}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center">
                    <Download className="w-4 h-4 mr-2" />
                    Tasarımı Kaydet
                </button>
            </div>
        </div>
    );
}
