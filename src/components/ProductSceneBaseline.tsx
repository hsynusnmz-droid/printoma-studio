'use client';

import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, AdaptiveDpr } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useStore } from '@/store/useStore';
import BaselineModel from './canvas/BaselineModel';
import ExportManager from './canvas/ExportManager';

interface ProductSceneBaselineProps {
    scale?: number | [number, number, number];
    position?: [number, number, number];
}

export default function ProductSceneBaseline({
    scale = 1,
    position = [0, 0, 0],
}: ProductSceneBaselineProps) {
    const draggingLayerId = useStore((s) => s.draggingLayerId);
    const stopDraggingLayer = useStore((s) => s.stopDraggingLayer);
    const currentProduct = useStore((s) => s.currentProduct);
    const isLoadingProducts = useStore((s) => s.isLoadingProducts);
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
                {/* Lights */}
                <ambientLight intensity={0.4} />
                <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
                <directionalLight position={[-10, -10, -5]} intensity={0.3} />

                <Environment preset="city" />

                {/* ✅ Only render when product is loaded */}
                {currentProduct && currentProduct.model_url ? (
                    <BaselineModel
                        key={currentProduct.id} // ✅ Force remount when product changes
                        scale={scale}
                        position={position}
                        orbitControlsRef={orbitControlsRef}
                    />
                ) : isLoadingProducts ? (
                    <mesh>
                        <boxGeometry args={[0.5, 0.5, 0.5]} />
                        <meshStandardMaterial color="#6366f1" wireframe />
                    </mesh>
                ) : null}

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

// Preload will be managed by store when product loads