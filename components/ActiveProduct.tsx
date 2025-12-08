'use client';
import React from 'react';
import { useGLTF, Decal, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, Layer } from '@/store/useStore';
import { PRODUCTS } from '@/config/products';
import { GLTF } from 'three-stdlib';

interface LayerDecalProps {
    layer: Layer;
    isActive: boolean;
    setActiveLayer: (id: string | null) => void;
}

const LayerDecal = ({ layer, isActive, setActiveLayer }: LayerDecalProps) => {
    const texture = useTexture(layer.url) as THREE.Texture;
    return (
        <Decal
            position={layer.position}
            rotation={layer.rotation}
            scale={[layer.scale, layer.scale, 1]}
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
                depthTest
                depthWrite={false}
            />
        </Decal>
    );
};

type GLTFResult = GLTF & {
    nodes: Record<string, THREE.Mesh>;
    materials: Record<string, THREE.Material>;
};

export default function ActiveProduct() {
    const { tshirtColor, layers, activeLayerId, setActiveLayer } = useStore();
    const { nodes } = useGLTF(PRODUCTS.tshirt.modelPath) as unknown as GLTFResult;

    // Use a Base64 data URI for a simple noise/fabric normal map to ensure it always loads.
    const fabricNormalMapUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhZWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==';
    const fabricTexture = useTexture(fabricNormalMapUrl);

    React.useLayoutEffect(() => {
        if (fabricTexture) {
            fabricTexture.wrapS = fabricTexture.wrapT = THREE.RepeatWrapping;
            fabricTexture.repeat.set(20, 20); // Higher repeat for the small pattern
            fabricTexture.needsUpdate = true;
        }
    }, [fabricTexture]);

    return (
        <group dispose={null} scale={PRODUCTS.tshirt.scale} position={PRODUCTS.tshirt.position}>
            {Object.values(nodes).map((node) => {
                if (!node.isMesh) return null;

                return (
                    <mesh
                        key={node.uuid}
                        geometry={node.geometry}
                        material={node.material}
                        castShadow
                        receiveShadow
                    >
                        {/* 1. Base Material Override with Fabric Effect */}
                        {/* 1. Base Material Override with Fabric Effect */}
                        <meshPhysicalMaterial
                            color={tshirtColor}
                            roughness={0.7}
                            metalness={0.0}
                            reflectivity={0.0}
                            sheen={1.0}
                            sheenRoughness={0.5}
                            sheenColor={new THREE.Color(tshirtColor).lerp(new THREE.Color(0xffffff), 0.2)}
                            normalMap={fabricTexture}
                            normalScale={new THREE.Vector2(0.5, 0.5)}
                        />

                        {/* 2. Decals MUST be inside this mesh */}
                        {layers.map((layer) => (
                            <LayerDecal
                                key={layer.id}
                                layer={layer}
                                isActive={layer.id === activeLayerId}
                                setActiveLayer={setActiveLayer}
                            />
                        ))}
                    </mesh>
                );
            })}
        </group>
    );
}

useGLTF.preload(PRODUCTS.tshirt.modelPath);
