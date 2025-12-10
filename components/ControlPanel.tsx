'use client';

import React from 'react';
import Image from 'next/image';
import { Upload, Layers, Type, Download, Eye, EyeOff, Lock, Unlock, ArrowLeftRight, ArrowUpDown, RotateCcw, Sparkles, Wand2 } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface ControlPanelProps {
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ControlPanel({ onUpload }: ControlPanelProps) {
    const layers = useStore((s) => s.layers);
    const activeLayerId = useStore((s) => s.activeLayerId);
    const setActiveLayer = useStore((s) => s.setActiveLayer);

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
        <div className="flex flex-col h-full bg-white border-r border-slate-200 shadow-sm animate-in slide-in-from-left duration-500 rounded-2xl overflow-hidden mx-4 my-4 max-h-[calc(100vh-2rem)] w-96 shrink-0">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Katmanlar
                </h2>
                <p className="text-xs text-slate-400 mt-1">Sürükle bırak ile tasarla</p>
            </div>

            {/* Main Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">

                {/* AI Generator Section */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-3 border border-purple-100 mb-2 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>AI Tasarım Oluşturucu</span>
                    </div>
                    <textarea
                        placeholder="Örn: Uzayda sörf yapan astronot..."
                        className="w-full h-16 bg-white border border-purple-100 rounded-lg p-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 resize-none transition-all shadow-sm"
                    />
                    <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold hover:shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm group">
                        <Wand2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                        Sihirli Tasarım Oluştur
                    </button>
                </div>

                {/* Upload Button */}
                <button
                    onClick={handleUploadClick}
                    className="w-full h-12 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all group"
                >
                    <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">Görsel Yükle</span>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onUpload}
                    accept="image/*"
                    className="hidden"
                />

                {/* Layer List */}
                <div className="space-y-2">
                    {layers.map((layer, index) => (
                        <div
                            key={layer.id}
                            className={`group flex items-center p-2 rounded-xl transition-all border ${activeLayerId === layer.id
                                ? 'bg-blue-50 border-blue-200 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            {/* Layer Select Action */}
                            <button
                                onClick={() => setActiveLayer(layer.id)}
                                className="flex items-center flex-1 min-w-0"
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
                                <div className="ml-3 overflow-hidden flex-1 text-left">
                                    <p className="text-sm font-medium text-slate-700 truncate">
                                        Katman {index + 1}
                                    </p>
                                    <p className="text-xs text-slate-400 capitalize">{layer.type}</p>
                                </div>
                            </button>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-1 pl-2">
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

            {/* Transform Controls for Active Layer */}
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

                    {/* Rotation Control */}
                    <div className="pt-3 border-t border-slate-200 mt-2 space-y-2">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Döndür (Açı)</span>
                            </div>
                            <span className="text-xs text-slate-500 font-mono">
                                {Math.round(((activeLayer.rotationZ || 0) * 180) / Math.PI)}°
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={360}
                            step={1}
                            value={Math.round(((activeLayer.rotationZ || 0) * 180) / Math.PI)}
                            onChange={(e) =>
                                updateLayerTransform(activeLayer.id, {
                                    rotationZ: (parseFloat(e.target.value) * Math.PI) / 180,
                                })
                            }
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <p className="text-xs text-slate-400 text-center mt-2">
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