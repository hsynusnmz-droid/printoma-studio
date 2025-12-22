'use client';
import React from 'react';
import { Decal, useTexture } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Layer } from '@/store/useStore';
import { calculateDecalRotation } from '@/utils/geometry';

interface LayerDecalProps {
    layer: Layer;
    onRef?: (mesh: THREE.Mesh) => void;
    fabricTexture?: THREE.Texture;
    index: number;
    onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
}

export function LayerDecal({ layer, index, onRef, fabricTexture, onPointerDown }: LayerDecalProps) {
    const baseTexture = useTexture(layer.src) as THREE.Texture;

    // Clone and configure texture in useMemo to avoid mutation side-effects on original texture
    const configuredTexture = React.useMemo(() => {
        const t = baseTexture.clone();
        t.colorSpace = THREE.SRGBColorSpace;
        t.flipY = false;
        t.anisotropy = 16; // ✅ FIX: High quality at oblique angles
        t.needsUpdate = true;
        return t;
    }, [baseTexture]);

    React.useEffect(() => {
        return () => {
            configuredTexture.dispose();
        };
    }, [configuredTexture]);

    // ✅ FIX #2: Rotation ve Scale hesaplaması (Mirror Correction)
    const { rotation, scaleX } = React.useMemo(() => {
        if (!layer.normal) {
            // Normal yoksa default
            return { rotation: layer.rotation, scaleX: 1 };
        }

        const n = new THREE.Vector3(...layer.normal).normalize();
        return calculateDecalRotation(n, layer.rotationZ || 0);
    }, [layer.normal, layer.rotation, layer.rotationZ]);

    const materialRef = React.useRef<THREE.MeshStandardMaterial | null>(null);

    // Material'i 'Decal' olarak işaretle (Renk değişiminden etkilenmemesi için)
    React.useLayoutEffect(() => {
        if (materialRef.current) {
            materialRef.current.userData.isDecal = true;
        }
    }, []);

    return (
        <Decal
            ref={(mesh) => {
                if (mesh && onRef) onRef(mesh as THREE.Mesh);
            }}
            position={layer.position}
            rotation={rotation}
            scale={[
                layer.scale * scaleX * (layer.flipX ? -1 : 1),
                layer.scale * (layer.flipY ? -1 : 1),
                0.15, // ✅ FIX: Constant depth to prevent stretching on curves
            ]}
            onPointerDown={(e) => {
                e.stopPropagation(); // ✅ STRICT: Prevent bleed-through to T-shirt
                onPointerDown?.(e);
            }}
            onPointerUp={(e) => {
                e.stopPropagation();
            }}
        >
            <meshStandardMaterial
                ref={materialRef}
                map={configuredTexture}
                transparent
                polygonOffset
                polygonOffsetFactor={-1 - index} // ✅ FIX: Dynamic Z-Priority (Newer on Top)
                depthTest={true}
                depthWrite={false}
                roughness={1.0} // ✅ UPDATED: Tam Mat görünüm
                metalness={0.0}
                normalMap={fabricTexture} // ✅ Kumaş dokusu ile birleş
                normalScale={new THREE.Vector2(0.8, 0.8)} // ✅ FIX: Doku var ama renk kararmasın (3.5 -> 0.8)
                side={THREE.FrontSide} // Sadece dış yüz
            />
        </Decal>
    );
}