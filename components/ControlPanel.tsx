'use client';

import React from 'react';
import Image from 'next/image';
import { Upload, Layers, Type, Download, Eye, EyeOff, Lock, Unlock, ArrowLeftRight, ArrowUpDown } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface ControlPanelProps {
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ControlPanel({ onUpload }: ControlPanelProps) {
    const layers = useStore((s) => s.layers);
    const activeLayerId = useStore((s) => s.activeLayerId);
    const setActiveLayer = useStore((s) => s.setActiveLayer);
    const tshirtColor = useStore((s) => s.tshirtColor);
    const setTshirtColor = useStore((s) => s.setTshirtColor);
    const removeLayer = useStore((s) => s.removeLayer);
    const updateLayerTransform = useStore((s) => s.updateLayerTransform);
    const toggleLayerVisibility = useStore((s) => s.toggleLayerVisibility);
    const toggleLayerLock = useStore((s) => s.toggleLayerLock);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const activeLayer = layers.find((l) => l.id === activeLayerId);

    return (
        <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col shadow-xl z-20">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <h2 className="font-bold text-slate-800 text-lg">Tasarım Paneli</h2>
                <p className="text-xs text-slate-500 mt-1">Özelleştirmeye başla</p>
            </div>

            {/* Tools Grid */}
            <div className="p-4 grid grid-cols-2 gap-3">
                <button
                    onClick={handleUploadClick}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors">
                        Görsel Yükle
                    </span>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onUpload}
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                />

                <button
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all cursor-not-allowed opacity-50"
                    disabled
                >
                    <Type className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-600">Yazı Ekle</span>
                    <span className="text-xs text-slate-400 mt-1">(Yakında)</span>
                </button>
            </div>

            {/* Renk Seçimi */}
            <div className="p-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">T-Shirt Rengi</h3>
                <div className="flex gap-2 flex-wrap">
                    {[
                        { hex: '#FFFFFF', name: 'Beyaz' },
                        { hex: '#000000', name: 'Siyah' },
                        { hex: '#EF4444', name: 'Kırmızı' },
                        { hex: '#3B82F6', name: 'Mavi' },
                        { hex: '#22C55E', name: 'Yeşil' },
                        { hex: '#F59E0B', name: 'Turuncu' },
                    ].map((color) => (
                        <button
                            key={color.hex}
                            onClick={() => setTshirtColor(color.hex)}
                            title={color.name}
                            className={`w-9 h-9 rounded-full border-2 transition-all ${tshirtColor === color.hex
                                ? 'border-blue-500 ring-2 ring-blue-200 scale-110'
                                : 'border-slate-200 hover:border-slate-300 hover:scale-105'
                                }`}
                            style={{ backgroundColor: color.hex }}
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
                        <div className="text-center py-8">
                            <p className="text-sm text-slate-400 mb-2">Henüz katman yok.</p>
                            <p className="text-xs text-slate-300">Yukarıdan görsel yükleyin</p>
                        </div>
                    )}
                    {layers.map((layer, index) => (
                        <div
                            key={layer.id}
                            className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all ${activeLayerId === layer.id
                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                                : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                                }`}
                        >
                            {/* Layer Preview & Info */}
                            <button
                                className="flex-1 flex items-center text-left min-w-0"
                                onClick={() => setActiveLayer(layer.id)}
                            >
                                <div className="relative w-10 h-10 bg-slate-100 rounded overflow-hidden flex-shrink-0 border border-slate-200">
                                    {layer.type === 'image' && (
                                        <Image
                                            src={layer.src}
                                            fill
                                            className="object-cover"
                                            alt={`Layer ${index + 1}`}
                                            unoptimized
                                        />
                                    )}
                                </div>
                                <div className="ml-3 overflow-hidden flex-1">
                                    <p className="text-sm font-medium text-slate-700 truncate">
                                        Katman {index + 1}
                                    </p>
                                    <p className="text-xs text-slate-400 capitalize">{layer.type}</p>
                                </div>
                            </button>

                            {/* ✅ NEW: Quick Actions */}
                            <div className="flex items-center gap-1">
                                {/* Visibility Toggle */}
                                <button
                                    onClick={() => toggleLayerVisibility(layer.id)}
                                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                    title={layer.visible === false ? 'Göster' : 'Gizle'}
                                >
                                    {layer.visible === false ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>

                                {/* Lock Toggle */}
                                <button
                                    onClick={() => toggleLayerLock(layer.id)}
                                    className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${layer.locked
                                        ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                        }`}
                                    title={layer.locked ? 'Kilidi Aç' : 'Kilitle'}
                                >
                                    {layer.locked ? (
                                        <Lock className="w-4 h-4" />
                                    ) : (
                                        <Unlock className="w-4 h-4" />
                                    )}
                                </button>

                                {/* Delete */}
                                <button
                                    onClick={() => removeLayer(layer.id)}
                                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    title="Sil"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scale Control for Active Layer */}
            {activeLayer && !activeLayer.locked && (
                <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50">
                    <div className="flex justify-between items-center">
                        <p className="text-xs font-semibold text-slate-600">Boyut (Scale)</p>
                        <span className="text-xs text-slate-500 font-mono">
                            {Math.round(activeLayer.scale * 100)}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min={0.05}
                        max={0.5}
                        step={0.01}
                        value={activeLayer.scale}
                        onChange={(e) =>
                            updateLayerTransform(activeLayer.id, {
                                scale: parseFloat(e.target.value),
                            })
                        }
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    {/* Flip Controls */}
                    <div className="flex gap-2 pt-2 border-t border-slate-200 mt-2">
                        <button
                            onClick={() => updateLayerTransform(activeLayer.id, { flipX: !activeLayer.flipX })}
                            className={`flex-1 py-1.5 rounded text-xs flex items-center justify-center gap-2 transition-colors border ${activeLayer.flipX
                                ? 'bg-blue-50 text-blue-600 border-blue-200 font-medium'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                            title="Yatay Aynala"
                        >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            Yatay Çevir
                        </button>
                        <button
                            onClick={() => updateLayerTransform(activeLayer.id, { flipY: !activeLayer.flipY })}
                            className={`flex-1 py-1.5 rounded text-xs flex items-center justify-center gap-2 transition-colors border ${activeLayer.flipY
                                ? 'bg-blue-50 text-blue-600 border-blue-200 font-medium'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                            title="Dikey Aynala"
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            Dikey Çevir
                        </button>
                    </div>

                    <p className="text-xs text-slate-400 text-center">
                        Sürükle-bırak ile pozisyon ayarla
                    </p>
                </div>
            )}

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button
                    className="w-full py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-lg font-medium hover:from-slate-700 hover:to-slate-800 transition-all flex items-center justify-center shadow-lg hover:shadow-xl"
                    disabled={layers.length === 0}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Tasarımı Kaydet
                </button>
                {layers.length === 0 && (
                    <p className="text-xs text-slate-400 text-center mt-2">
                        Kaydetmek için önce katman ekleyin
                    </p>
                )}
            </div>
        </div>
    );
}