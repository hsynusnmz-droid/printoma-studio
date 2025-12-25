'use client';

import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, AdaptiveDpr } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useStore } from '@/store/useStore';
import { useGLTF } from '@react-three/drei';
import BaselineModel from './canvas/BaselineModel';
import ExportManager from './canvas/ExportManager';

interface ProductSceneBaselineProps {
    modelPath: string;
    scale?: number | [number, number, number];
    position?: [number, number, number];
}

export default function ProductSceneBaseline({
    modelPath,
    scale = 1,
    position = [0, 0, 0],
}: ProductSceneBaselineProps) {
    const draggingLayerId = useStore((s) => s.draggingLayerId);
    const stopDraggingLayer = useStore((s) => s.stopDraggingLayer);
    const orbitControlsRef = useRef<OrbitControlsImpl>(null);

    // ✅ GLOBAL SAFETY: Ensure state is reset even if pointer leaves the model
    const handleGlobalPointerUp = () => {
        // Note: This is an HTML/Canvas pointer event, not R3F ThreeEvent, but sufficient for safety
        if (orbitControlsRef.current) {
            orbitControlsRef.current.enabled = true;
        }
        // Force stop dragging if we are still thinking we are dragging
        if (draggingLayerId) {
            stopDraggingLayer();
        }
    };

    return (
        <div className="flex-1 min-w-0 h-full relative bg-gradient-to-br from-slate-50 to-slate-100">
            <Canvas
                shadows
                camera={{ fov: 35, position: [0, 1.3, 2.2] }}
                dpr={[1, 2]} // ✅ PERFORMANCE: Cap pixel ratio (instant FPS boost on high DPI screens)
                gl={{
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 0.8,
                    antialias: true,
                    preserveDrawingBuffer: true, // 📸 Vital for Screenshots
                    powerPreference: 'high-performance', // ✅ PERFORMANCE: Use dedicated GPU
                }}
                onPointerUp={handleGlobalPointerUp}
                onPointerMissed={() => {
                    if (orbitControlsRef.current) orbitControlsRef.current.enabled = true;
                }}
            >
                {/* ✅ Natural Soft Lighting (Dengeli) */}
                <ambientLight intensity={0.8} /> {/* Gölgeleri yumuşat (0.6 -> 0.8) */}
                <directionalLight
                    intensity={0.2} // Parlamayı azalt (0.3 -> 0.2)
                    position={[2, 3, 2]}
                    castShadow
                    shadow-bias={-0.0001} // Gölge hatalarını önle
                />
                <Environment preset="city" blur={1} /> {/* Blur yansımaları yumuşatır */}

                <BaselineModel
                    modelPath={modelPath}
                    scale={scale}
                    position={position}
                    orbitControlsRef={orbitControlsRef}
                />

                <OrbitControls
                    ref={orbitControlsRef}
                    makeDefault
                    minDistance={0.4} // ✅ Macro Zoom: Yüzeye çok yaklaşmaya izin ver
                    maxDistance={4}
                    enablePan={false}
                    // enabled={!draggingLayerId} // ❌ REMOVED: Managed imperatively via ref
                    dampingFactor={0.05} // ✅ Smooth rotation
                    enableDamping
                />

                <ExportManager />

                {/* ✅ PERFORMANCE: Auto-reduce resolution during camera movement */}
                <AdaptiveDpr pixelated />
            </Canvas>
        </div>
    );
}

useGLTF.preload('/t-shirt.glb');