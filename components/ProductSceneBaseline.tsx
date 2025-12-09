'use client';

import React, { useMemo, useLayoutEffect, useRef } from 'react';
import { Canvas, useThree, useFrame, createPortal, ThreeEvent } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, Layer } from '@/store/useStore';
import { LayerDecal } from './LayerDecal';

interface ProductSceneBaselineProps {
    modelPath: string;
    scale?: number | [number, number, number];
    position?: [number, number, number];
}

const applyTShirtColor = (scene: THREE.Group, colorHex: string) => {
    if (!colorHex || typeof colorHex !== 'string') return;
    const targetColor = new THREE.Color(colorHex);

    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                    mat.color.setHex(0xffffff).multiply(targetColor);
                    mat.needsUpdate = true;
                }
            });
        }
    });
};

function BaselineModel({ modelPath, scale, position }: ProductSceneBaselineProps) {
    const tshirtColor = useStore((state) => state.tshirtColor);
    const layers = useStore((state) => state.layers);
    const draggingLayerId = useStore((state) => state.draggingLayerId);
    const startDraggingLayer = useStore((state) => state.startDraggingLayer);
    const stopDraggingLayer = useStore((state) => state.stopDraggingLayer);
    const updateLayerTransform = useStore((state) => state.updateLayerTransform);

    const gltf = useGLTF(modelPath);
    const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

    // Tools for raycasting
    const { camera, gl } = useThree();
    const raycaster = useRef(new THREE.Raycaster());
    const pointer = useRef(new THREE.Vector2());

    // Find mesh with useMemo (safe, efficient)
    const targetMesh = useMemo(() => {
        let foundMesh: THREE.Mesh | null = null;
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                // Clone material to avoid shared state issues
                if (Array.isArray(child.material)) {
                    child.material = child.material.map(m => m.clone());
                } else {
                    child.material = child.material.clone();
                }

                // Heuristic: Prefer "Body" or found mesh
                if (!foundMesh) foundMesh = child;
                if (child.name.includes('Body')) foundMesh = child;
            }
        });
        return foundMesh;
    }, [scene]);

    useLayoutEffect(() => {
        applyTShirtColor(scene, tshirtColor);
    }, [scene, tshirtColor]);

    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        // Manual pointer update as requested
        pointer.current.set(
            (e.clientX / gl.domElement.clientWidth) * 2 - 1,
            -(e.clientY / gl.domElement.clientHeight) * 2 + 1
        );
    };

    // Drag Logic Loop
    useFrame(() => {
        if (draggingLayerId && targetMesh) {
            raycaster.current.setFromCamera(pointer.current, camera);
            const intersects = raycaster.current.intersectObject(targetMesh, true);

            if (intersects.length > 0) {
                const hit = intersects[0];
                updateLayerTransform(draggingLayerId, {
                    position: [hit.point.x, hit.point.y, hit.point.z]
                });
            }
        }
    });

    return (
        <Center
            onPointerMove={handlePointerMove}
            onPointerDown={(e) => {
                e.stopPropagation();
                if (!targetMesh) return;

                // Sync pointer for the click check
                pointer.current.set(
                    (e.clientX / gl.domElement.clientWidth) * 2 - 1,
                    -(e.clientY / gl.domElement.clientHeight) * 2 + 1
                );

                raycaster.current.setFromCamera(pointer.current, camera);
                const intersects = raycaster.current.intersectObject(targetMesh, true);

                if (!intersects.length) return;
                const hitPoint = intersects[0].point;

                // Find nearest layer
                let nearest: Layer | null = null;
                let minDist = Infinity;

                // Threshold for picking could be added (e.g. 0.1 units)
                layers.forEach(layer => {
                    const d = new THREE.Vector3(...layer.position).distanceTo(hitPoint);
                    if (d < minDist) {
                        minDist = d;
                        nearest = layer;
                    }
                });

                // Start dragging closest layer if found (and maybe within threshold? user didn't specify threshold)
                // Assuming implicit intent to pick *something* if clicking near it.
                // Or user might want to drag ONLY if clicking ON the decal? 
                // The current request says: "Hit point + normal’a göre... layers içinden hitPoint’e en yakın... layer’ı bul"
                // So clicking anywhere on the shirt will pick the closest decal. This is acceptable for now.
                if (nearest) {
                    startDraggingLayer(nearest.id);
                }
            }}
            onPointerUp={(e) => {
                e.stopPropagation();
                stopDraggingLayer();
            }}
        >
            <primitive object={scene} scale={scale} position={position} />
            {targetMesh && layers.map((layer) => (
                <React.Fragment key={layer.id}>
                    {createPortal(
                        <LayerDecal layer={layer} />,
                        targetMesh
                    )}
                </React.Fragment>
            ))}
        </Center>
    );
}

export default function ProductSceneBaseline({ modelPath, scale = 1, position = [0, 0, 0] }: ProductSceneBaselineProps) {
    return (
        <div className="w-full h-full relative bg-[#f3f4f6]">
            <Canvas
                shadows
                camera={{ fov: 35, position: [0, 1.3, 2.2] }}
                gl={{ toneMapping: THREE.ACESFilmicToneMapping }}
            >
                {/* LIGHTING SETUP */}
                <ambientLight intensity={0.25} />
                <directionalLight intensity={0.5} position={[1, 2, 2]} />
                <Environment preset="city" />

                <BaselineModel
                    modelPath={modelPath}
                    scale={scale}
                    position={position}
                />

                <OrbitControls makeDefault minDistance={1} maxDistance={4} enablePan={false} />
            </Canvas>
        </div>
    );
}
