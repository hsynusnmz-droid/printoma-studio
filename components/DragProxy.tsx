'use client';
import React, { useMemo, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Layer } from '@/store/useStore';

interface DragProxyProps {
    layer: Layer;
    onRef?: (mesh: THREE.Mesh) => void;
}

export function DragProxy({ layer, onRef }: DragProxyProps) {
    const baseTexture = useTexture(layer.src) as THREE.Texture;

    const configuredTexture = useMemo(() => {
        const t = baseTexture.clone();
        t.colorSpace = THREE.SRGBColorSpace;
        t.flipY = false;
        t.needsUpdate = true;
        return t;
    }, [baseTexture]);

    React.useEffect(() => {
        return () => configuredTexture.dispose();
    }, [configuredTexture]);

    const materialRef = useRef<THREE.MeshStandardMaterial>(null);

    return (
        <mesh
            ref={(mesh) => {
                if (mesh && onRef) onRef(mesh as THREE.Mesh);
            }}
            position={layer.position} // Initial position from layer
            rotation={layer.rotation} // Initial rotation
            scale={layer.scale}      // Scale matches LayerDecal
        >
            {/* Simple Plane for 60fps drag */}
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial
                ref={materialRef}
                map={configuredTexture}
                transparent
                polygonOffset
                polygonOffsetFactor={-10} // Priority over everything
                depthTest={true}
                depthWrite={false}
                roughness={0.9}
                metalness={0}
                side={THREE.DoubleSide} // Plane might flip, so double side is safer
            />
        </mesh>
    );
}
