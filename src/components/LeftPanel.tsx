'use client';

import React, { useState } from 'react';
import { ChevronDown, Upload, User, Footprints, Waves, Grid3x3 } from 'lucide-react';
import { useStore } from '@/store/useStore';

const PRESET_COLORS = [
    '#ffffff', '#171717', '#ef4444', '#3b82f6',
    '#22c55e', '#eab308', '#f97316', '#a855f7',
    '#ec4899', '#64748b'
];

export default function LeftPanel() {
    const {
        tshirtColor,
        setTshirtColor,
        animationType: animType,
        setAnimationType: setAnimType,
        animationSpeed: animSpeed,
        setAnimationSpeed: setAnimSpeed
    } = useStore();

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        garment: true,
        background: false,
        animation: false,
        camera: false
    });

    const toggleSection = (key: string) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 w-80 shrink-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-2">

                {/* Garment Color */}
                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                    <button
                        onClick={() => toggleSection('garment')}
                        className="w-full flex items-center justify-between p-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <span>Garment Color</span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections.garment ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.garment && (
                        <div className="p-3 border-t border-slate-100 flex flex-col gap-3">
                            {/* Preset Grid */}
                            <div className="grid grid-cols-5 gap-2">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setTshirtColor(color)}
                                        className={`w-8 h-8 rounded-full border border-slate-200 shadow-sm transition-transform hover:scale-110 ${tshirtColor === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                                            }`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>

                            {/* Custom Color Picker */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                                <span className="text-xs text-slate-500 font-medium">Custom:</span>
                                <div className="flex-1 h-8 relative rounded-lg overflow-hidden border border-slate-200">
                                    <input
                                        type="color"
                                        value={tshirtColor}
                                        onChange={(e) => setTshirtColor(e.target.value)}
                                        className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer p-0 border-0"
                                    />
                                </div>
                                <span className="text-xs font-mono text-slate-400 uppercase">{tshirtColor}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Background */}
                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                    <button
                        onClick={() => toggleSection('background')}
                        className="w-full flex items-center justify-between p-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <span>Background</span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections.background ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.background && (
                        <div className="p-3 border-t border-slate-100 flex flex-col items-center gap-2">
                            <div className="w-full h-28 border-2 border-dashed border-slate-200 bg-slate-50 rounded-lg flex flex-col items-center justify-center gap-2 opacity-50 cursor-not-allowed relative">
                                {/* Yakında Badge */}
                                <div className="absolute top-2 right-2">
                                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">
                                        Yakında
                                    </span>
                                </div>
                                <div className="p-2 bg-white rounded-full border border-slate-100 shadow-sm">
                                    <Upload className="w-5 h-5 text-slate-300" />
                                </div>
                                <span className="text-xs font-medium text-slate-400">Arka Plan Yükle</span>
                            </div>
                            <p className="text-[10px] text-slate-400 text-center px-2 w-full">
                                Modelin arkasına sabit görsel ekleyebileceksiniz
                            </p>
                        </div>
                    )}
                </div>

                {/* Animation (Pro) */}
                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                    <button
                        onClick={() => toggleSection('animation')}
                        className="w-full flex items-center justify-between p-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <span>Animation</span>
                            <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded">Pro</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections.animation ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.animation && (
                        <div className="p-3 border-t border-slate-100 space-y-4">
                            {/* Animation Type Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'static', label: 'Static', icon: User },
                                    { id: 'walk', label: 'Walk', icon: Footprints },
                                    { id: 'waves', label: 'Waves', icon: Waves },
                                    { id: 'knit', label: 'Knit', icon: Grid3x3 },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setAnimType(item.id as 'static' | 'walk' | 'waves' | 'knit')}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${animType === item.id
                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <item.icon className="w-6 h-6 mb-1" />
                                        <span className="text-xs font-semibold">{item.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Speed Slider */}
                            <div className="space-y-2 pt-2 border-t border-slate-50">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium text-slate-600">Animasyon Hızı</span>
                                    <span className="font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{animSpeed.toFixed(1)}x</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={animSpeed}
                                    onChange={(e) => setAnimSpeed(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Camera Animation (Pro) */}
                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                    <button
                        onClick={() => toggleSection('camera')}
                        className="w-full flex items-center justify-between p-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <span>Camera Animation</span>
                            <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded">Pro</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections.camera ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.camera && (
                        <div className="p-3 border-t border-slate-100 min-h-[100px] flex items-center justify-center text-xs text-slate-400">
                            Content here
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
