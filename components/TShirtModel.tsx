'use client';
import React, { useState, useRef } from 'react';
import { Decal, useTexture, useGLTF, Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useStore, Layer } from '@/store/useStore';
import { GLTF } from 'three-stdlib';

// --- CUSTOM RESIZE SLIDER (Preserved Original) ---
const ResizeSlider = ({ scale, onChange, position }: { scale: number; onChange: (s: number) => void; position: [number, number, number] }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const minScale = 0.05, maxScale = 0.6;
    const getPctFromScale = (s: number) => Math.min(Math.max(((s - minScale) / (maxScale - minScale)) * 100, 0), 100);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation(); isDraggingRef.current = true;
        updateScaleFromPointer(e.nativeEvent.clientY);
        window.addEventListener('pointermove', handleWindowMove);
        window.addEventListener('pointerup', handleWindowUp);
    };
    const handleWindowMove = (e: PointerEvent) => { if (isDraggingRef.current) updateScaleFromPointer(e.clientY); };
    const handleWindowUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener('pointermove', handleWindowMove);
        window.removeEventListener('pointerup', handleWindowUp);
    };
    const updateScaleFromPointer = (clientY: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const relativeY = rect.bottom - clientY;
        const pct = Math.min(Math.max(relativeY / rect.height, 0), 1);
        onChange(minScale + (pct * (maxScale - minScale)));
    };
    const currentPct = getPctFromScale(scale);

    return (
        <Html position={position} center className="pointer-events-auto" zIndexRange={[100, 0]}>
            <div className="group relative flex flex-col items-center justify-end w-8 h-32 select-none" style={{ transform: 'translate3d(20px, 0, 0)' }}>
                <div ref={trackRef} className="w-full h-full flex flex-col items-center justify-end cursor-ns-resize py-1" onPointerDown={handlePointerDown}>
                    <div className="absolute w-1.5 h-full bg-slate-200/80 backdrop-blur-sm rounded-full border border-slate-300 shadow-sm overflow-hidden pointer-events-none">
                        <div className="absolute bottom-0 w-full bg-blue-500 transition-all duration-75 ease-out" style={{ height: `${currentPct}%` }} />
                    </div>
                    <div className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md z-10 hover:scale-110 active:scale-95 transition-transform" style={{ bottom: `calc(${currentPct}% - 10px)` }} />
                </div>
            </div>
        </Html>
    );
};

// --- LAYER DECAL (Renamed & Safely Typed) ---
interface LayerDecalProps {
    layer: Layer;
    isActive: boolean;
    updateLayer: (id: string, changes: Partial<Layer>) => void;
    setActiveLayer: (id: string | null) => void;
}

const LayerDecal = ({ layer, isActive, updateLayer, setActiveLayer }: LayerDecalProps) => {
    const texture = useTexture(layer.url) as THREE.Texture;

    // Safety check (from user request)
    if (!texture) return null;

    return (
        <group>
            <Decal
                position={layer.position}
                rotation={layer.rotation}
                scale={[layer.scale, layer.scale, 1.5]}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    setActiveLayer(layer.id);
                }}
            >
                <meshBasicMaterial
                    map={texture}
                    transparent
                    polygonOffset
                    polygonOffsetFactor={isActive ? -2 : -1}
                    depthTest={true}
                    depthWrite={false}
                />
            </Decal>

            {isActive && (
                <ResizeSlider
                    scale={layer.scale}
                    onChange={(s: number) => updateLayer(layer.id, { scale: s })}
                    position={[layer.position[0] + layer.scale / 2 + 0.1, layer.position[1], layer.position[2] + 0.1]}
                />
            )}
        </group>
    );
};

// --- MAIN CONTENT ---
type GLTFResult = GLTF & {
    nodes: Record<string, THREE.Mesh>;
    materials: Record<string, THREE.Material>;
};

const TShirtModelContent = ({ nodes }: { nodes: Record<string, THREE.Mesh> }) => {
    const { tshirtColor, layers, activeLayerId, updateLayer, setActiveLayer } = useStore();
    const [isDragging, setIsDragging] = useState(false);

    // 🖱️ RAYCAST DRAG LOGIC (Preserved)
    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!isDragging || !activeLayerId) return;

        // Safety: ensure dragging on known mesh part
        // Using values() since nodes is a Record
        const isTshirtPart = Object.values(nodes).some(n => n === e.object);
        if (!isTshirtPart) return;

        e.stopPropagation();

        if (e.face) {
            const n = e.face.normal.clone().transformDirection(e.object.matrixWorld).normalize();
            const offsetDistance = 0.05;
            const newPos = new THREE.Vector3().copy(e.point).add(n.clone().multiplyScalar(offsetDistance));

            const lookAtPos = new THREE.Vector3().copy(newPos).add(n);
            const dummy = new THREE.Object3D();
            dummy.position.copy(newPos);
            dummy.lookAt(lookAtPos);

            updateLayer(activeLayerId, {
                position: [newPos.x, newPos.y, newPos.z],
                rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z]
            });
        }
    };

    return (
        <group>
            {/* FIND AND RENDER MAIN BODY MESH */}
            {Object.values(nodes).map((node) => {
                if (!node.isMesh) return null;

                // Robust Body Check (from user request)
                // High polygon count usually indicates the main body mesh in this GLB
                const isBody = (node.name.includes('Body') || node.name.includes('Object_14') || node.geometry.attributes.position.count > 1000);

                return (
                    <mesh
                        key={node.uuid}
                        geometry={node.geometry}
                        receiveShadow
                        castShadow
                        onPointerDown={(e) => {
                            if (activeLayerId) {
                                e.stopPropagation();
                                setIsDragging(true);
                                handlePointerMove(e);
                            }
                        }}
                        onPointerMove={handlePointerMove}
                        onPointerUp={() => setIsDragging(false)}
                        onPointerLeave={() => setIsDragging(false)}
                    >
                        <meshStandardMaterial color={tshirtColor} roughness={0.85} metalness={0.1} />

                        {/* ✅ FIX: DECALS ARE NOW CHILDREN OF THE MESH */}
                        {isBody && layers.map((layer) => (
                            <LayerDecal
                                key={layer.id}
                                layer={layer}
                                isActive={layer.id === activeLayerId}
                                updateLayer={updateLayer}
                                setActiveLayer={setActiveLayer}
                            />
                        ))}
                    </mesh>
                )
            })}
        </group>
    );
};

export const TShirtModel = () => {
    // Using the local verified file /t-shirt.glb
    const { nodes } = useGLTF('/t-shirt.glb') as unknown as GLTFResult;

    return (
        <group dispose={null} scale={1} rotation={[0, 0, 0]}>
            <Center>
                <TShirtModelContent nodes={nodes as unknown as Record<string, THREE.Mesh>} />
            </Center>
        </group>
    );
};

// Preload the model
useGLTF.preload('/t-shirt.glb');
