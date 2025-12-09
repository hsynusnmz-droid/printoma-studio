'use client';
import React, { useRef, useState, useEffect, forwardRef } from 'react';
import { useGLTF, Decal, useTexture, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, Layer } from '@/store/useStore';
import { PRODUCTS } from '@/config/products';
import { GLTF } from 'three-stdlib';

// --- MINIMAL LAYER DECAL ---
interface LayerDecalProps {
    layer: Layer;
    isActive: boolean;
    onSelect: () => void;
}

const LayerDecal = forwardRef<THREE.Mesh, LayerDecalProps>(({ layer, isActive, onSelect }, ref) => {
    const texture = useTexture(layer.url);

    // Basic SRGB Fix
    React.useLayoutEffect(() => {
        if (texture) {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.needsUpdate = true;
        }
    }, [texture]);

    return (
        <Decal
            ref={ref}
            position={new THREE.Vector3(...layer.position)}
            rotation={new THREE.Euler(...layer.rotation)}
            scale={[layer.scale, layer.scale, 0.5]}
            onPointerDown={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            <meshBasicMaterial
                map={texture}
                transparent
                polygonOffset
                polygonOffsetFactor={isActive ? -10 : -1}
                depthTest
                depthWrite={false}
                toneMapped={false}
            />
        </Decal>
    );
});
LayerDecal.displayName = 'LayerDecal';

// --- SCENE TYPE ---
type GLTFResult = GLTF & {
    nodes: Record<string, THREE.Mesh>;
    materials: Record<string, THREE.Material>;
};

export default function ActiveProduct() {
    const { tshirtColor, layers, activeLayerId, setActiveLayer, updateLayer } = useStore();
    const { nodes } = useGLTF(PRODUCTS.tshirt.modelPath) as unknown as GLTFResult;

    // REF MAP for Gizmo
    const decalsMap = useRef<Map<string, THREE.Mesh>>(new Map());
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);

    // Sync Gizmo
    useEffect(() => { forceUpdate(); }, [activeLayerId]);

    const activeMesh = activeLayerId ? decalsMap.current.get(activeLayerId) || null : null;

    // Identify Body Mesh
    const bodyMesh = Object.values(nodes).find(n => n.name.includes('Body') || n.geometry?.attributes?.position?.count > 1000);

    return (
        <group dispose={null} scale={PRODUCTS.tshirt.scale} position={PRODUCTS.tshirt.position}>
            {/* 1. GIZMO */}
            {activeLayerId && activeMesh && (
                <TransformControls
                    object={activeMesh}
                    mode="translate"
                    size={0.8}
                    onMouseUp={() => {
                        updateLayer(activeLayerId, {
                            position: [activeMesh.position.x, activeMesh.position.y, activeMesh.position.z],
                            rotation: [activeMesh.rotation.x, activeMesh.rotation.y, activeMesh.rotation.z],
                            scale: activeMesh.scale.x
                        });
                    }}
                />
            )}

            {/* 2. BODY & DECALS */}
            {Object.values(nodes).map((node) => {
                if (!node.isMesh) return null;
                const isBody = (node === bodyMesh);

                return (
                    <mesh
                        key={node.uuid}
                        geometry={node.geometry}
                        castShadow
                        receiveShadow
                        // If body, use StandardMaterial with User Color
                        material={isBody ?
                            new THREE.MeshStandardMaterial({
                                color: tshirtColor,
                                roughness: 1,
                                metalness: 0
                            })
                            : node.material}
                        // Ensure color update
                        material-color={isBody ? tshirtColor : undefined}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            setActiveLayer(null);
                        }}
                    >
                        {isBody && layers.map((layer) => (
                            <LayerDecal
                                key={layer.id}
                                layer={layer}
                                isActive={layer.id === activeLayerId}
                                onSelect={() => setActiveLayer(layer.id)}
                                ref={(mesh) => {
                                    if (mesh) decalsMap.current.set(layer.id, mesh);
                                    else decalsMap.current.delete(layer.id);
                                }}
                            />
                        ))}
                    </mesh>
                );
            })}
        </group>
    );
}

useGLTF.preload(PRODUCTS.tshirt.modelPath);
