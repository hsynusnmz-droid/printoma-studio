'use client';
import React from 'react';
import { Decal, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Layer } from '@/store/useStore';

interface LayerDecalProps {
    layer: Layer;
    onRef?: (mesh: THREE.Mesh) => void;
}

export function LayerDecal({ layer, onRef }: LayerDecalProps) {
    const baseTexture = useTexture(layer.src) as THREE.Texture;

    // Clone and configure texture in useMemo to avoid mutation side-effects on original texture
    const configuredTexture = React.useMemo(() => {
        const t = baseTexture.clone();
        t.colorSpace = THREE.SRGBColorSpace;
        t.flipY = false;
        t.needsUpdate = true;
        return t;
    }, [baseTexture]);

    React.useEffect(() => {
        return () => {
            configuredTexture.dispose();
        };
    }, [configuredTexture]);

    // ✅ FIX #2: Rotation hesaplaması iyileştirildi (Surface'e tam yapışma)
    const rotation = React.useMemo<[number, number, number]>(() => {
        if (!layer.normal) {
            // Normal yoksa default rotation
            return layer.rotation;
        }

        const normal = new THREE.Vector3(...layer.normal).normalize();

        // Decal'ın "forward" yönü Z ekseni
        const decalForward = new THREE.Vector3(0, 0, 1);

        // Surface normal'ine göre quaternion hesapla
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
            decalForward,
            normal
        );

        const euler = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ');

        // ✅ FIX: Texture orientation düzeltmesi
        // X ekseninde 180° döndürme → Görsel baş aşağı gelmez
        return [euler.x + Math.PI, euler.y, euler.z];
    }, [layer.normal, layer.rotation]);

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
            scale={layer.scale}
        >
            <meshStandardMaterial
                ref={materialRef}
                map={configuredTexture}
                transparent
                polygonOffset
                polygonOffsetFactor={-4} // ✅ FIX: Daha fazla öne çıkar (Outermost visibility)
                depthTest={true}
                depthWrite={false}
                roughness={0.9} // Kumaş gerçekçiliği
                metalness={0}
                side={THREE.FrontSide} // Sadece dış yüz
            />
        </Decal>
    );
}