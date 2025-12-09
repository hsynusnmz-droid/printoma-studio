'use client';
import React from 'react';
import { Decal, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Layer } from '@/store/useStore';

interface LayerDecalProps {
    layer: Layer;
}

export function LayerDecal({ layer }: LayerDecalProps) {
    const texture = useTexture(layer.src) as THREE.Texture;

    React.useEffect(() => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = false;
        texture.needsUpdate = true;
    }, [texture]);

    return (
        <Decal
            position={layer.position}
            rotation={layer.rotation}
            scale={layer.scale}
        >
            <meshStandardMaterial
                map={texture}
                transparent
                polygonOffset
                polygonOffsetFactor={-1}
                depthTest={true}
                depthWrite={false}
                roughness={0.9}
                metalness={0}
            />
        </Decal>
    );
}
