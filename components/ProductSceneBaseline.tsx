'use client';

import React, { useMemo, useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Canvas, useThree, useFrame, createPortal, ThreeEvent } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls, Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useStore, type Layer } from '@/store/useStore';
import { LayerDecal } from './LayerDecal';
import { MeshDebugger } from './MeshDebugger';

interface ProductSceneBaselineProps {
    modelPath: string;
    scale?: number | [number, number, number];
    position?: [number, number, number];
}

// Helper to merge body parts into one invisible surface for seamless decals
function buildCombinedBodyMesh(root: THREE.Object3D): THREE.Mesh | null {
    const parts: THREE.Mesh[] = [];

    root.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;

        const name = child.name.toLowerCase();
        const parentName = child.parent?.name.toLowerCase() ?? '';

        // Identify T-shirt parts: Object_8 (breast), sleeves, body parts
        if (
            name.includes('object_8') ||
            name.includes('sleeve') ||
            parentName.includes('body_front') ||
            parentName.includes('body_back') ||
            parentName.includes('sleeves')
        ) {
            parts.push(child);
        }
    });

    if (!parts.length) return null;

    const geometries: THREE.BufferGeometry[] = parts.map((mesh) => {
        const geom = mesh.geometry.clone();
        // Bake World Matrix into geometry positions
        geom.applyMatrix4(mesh.matrixWorld);
        return geom;
    });

    // Merge all geometries into one
    const merged = BufferGeometryUtils.mergeGeometries(geometries, true);
    if (!merged) return null;

    const combined = new THREE.Mesh(
        merged,
        new THREE.MeshBasicMaterial({ visible: false }) // Invisible hit target
    );
    combined.name = 'Combined_Body_Surface';

    // Add to root so it exists in the scene graph (optional, but good for raycaster if recursive)
    root.add(combined);

    return combined;
}

// Deterministic Chest Calculation Helper from Bounding Box
function getChestLocalFromBounds(
    mesh: THREE.Mesh,
    camera: THREE.Camera
): [number, number, number] | null {
    const box = new THREE.Box3().setFromObject(mesh);
    if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Chest height: center Y minus 20% of height (approx upper chest)
        const chestY = center.y - size.y * 0.2;

        // Two candidates for front: Max Z and Min Z (at the calculated chest X, Y)
        const frontLocalCandidate1 = new THREE.Vector3(center.x, chestY, box.max.z);
        const frontLocalCandidate2 = new THREE.Vector3(center.x, chestY, box.min.z);

        // Convert to World to compare distance with camera
        const world1 = mesh.localToWorld(frontLocalCandidate1.clone());
        const world2 = mesh.localToWorld(frontLocalCandidate2.clone());

        const camPos = camera.position.clone();
        const dist1 = camPos.distanceTo(world1);
        const dist2 = camPos.distanceTo(world2);

        // Pick closer face (front facing camera)
        const chosenWorld = dist1 < dist2 ? world1 : world2;

        // Convert chosen point back to Local Space
        const chosenLocal = mesh.worldToLocal(chosenWorld.clone());
        return [chosenLocal.x, chosenLocal.y, chosenLocal.z];
    }
    return null;
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
    const layers = useStore((state): Layer[] => state.layers);
    const draggingLayerId = useStore((state) => state.draggingLayerId);
    const startDraggingLayer = useStore((state) => state.startDraggingLayer);
    const stopDraggingLayer = useStore((state) => state.stopDraggingLayer);
    const updateLayerTransform = useStore((state) => state.updateLayerTransform);

    // State
    const [overrideTargetMesh, setOverrideTargetMesh] = useState<THREE.Mesh | null>(null);

    const gltf = useGLTF(modelPath);
    const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

    const { camera, gl } = useThree();
    const raycaster = useRef(new THREE.Raycaster());
    const pointer = useRef(new THREE.Vector2());

    // Combined Target Mesh Logic
    const targetMesh = useMemo<THREE.Mesh | null>(() => {
        // Try to build a combined surface first
        const combined = buildCombinedBodyMesh(scene);
        if (combined) {
            console.log("Combined Body Surface created successfully.");
            return combined;
        }

        // Fallback: Object_8 or Body_Front
        const found = scene.getObjectByName('Object_8');
        if (found && (found as THREE.Mesh).isMesh) {
            return found as THREE.Mesh;
        }

        let fallback: THREE.Mesh | null = null;
        scene.traverse((child) => {
            if (
                child instanceof THREE.Mesh &&
                (child.name.toLowerCase().includes('body_front') ||
                    child.parent?.name.toLowerCase().includes('body_front'))
            ) {
                if (!fallback) fallback = child;
            }
        });

        return fallback;
    }, [scene]);

    // Use override if available, else auto-found mesh
    const effectiveTargetMesh = overrideTargetMesh ?? targetMesh;

    useLayoutEffect(() => {
        applyTShirtColor(scene, tshirtColor);
    }, [scene, tshirtColor]);

    // Calculate Chest Position (Bounding Box Strategy) using effectiveTargetMesh
    const chestLocal = useMemo(() => {
        if (!effectiveTargetMesh) return null;

        // Ensure matrices are up to date for localToWorld calculations
        effectiveTargetMesh.updateMatrixWorld(true);

        const result = getChestLocalFromBounds(effectiveTargetMesh, camera);
        if (result) {
            console.log("Chest Position (Bounds/Memo):", result, "Mesh:", effectiveTargetMesh.name);
        }
        return result;
    }, [effectiveTargetMesh, camera]);

    // Auto-place new layers
    const prevLayerCount = useRef(0);
    useEffect(() => {
        if (!chestLocal) {
            prevLayerCount.current = layers.length; // Sync
            return;
        }

        if (layers.length > prevLayerCount.current) {
            const newLayer = layers[layers.length - 1];
            updateLayerTransform(newLayer.id, { position: chestLocal });
        }
        prevLayerCount.current = layers.length;
    }, [layers.length, layers, chestLocal, updateLayerTransform]);

    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        pointer.current.set(
            (e.clientX / gl.domElement.clientWidth) * 2 - 1,
            -(e.clientY / gl.domElement.clientHeight) * 2 + 1
        );
    };

    // Drag Logic Loop (World -> Local conversion)
    useFrame(() => {
        if (!draggingLayerId || !effectiveTargetMesh) return;

        raycaster.current.setFromCamera(pointer.current, camera);
        const hits = raycaster.current.intersectObject(effectiveTargetMesh, true);

        if (!hits.length) return;

        const worldPoint = hits[0].point.clone();
        const localPoint = effectiveTargetMesh.worldToLocal(worldPoint);

        updateLayerTransform(draggingLayerId, {
            position: [localPoint.x, localPoint.y, localPoint.z]
        });
    });

    return (
        <Center
            onPointerMove={handlePointerMove}
            onPointerDown={(e) => {
                e.stopPropagation();
                if (!effectiveTargetMesh) return;

                pointer.current.set(
                    (e.clientX / gl.domElement.clientWidth) * 2 - 1,
                    -(e.clientY / gl.domElement.clientHeight) * 2 + 1
                );

                raycaster.current.setFromCamera(pointer.current, camera);
                const hits = raycaster.current.intersectObject(effectiveTargetMesh, true);

                if (!hits.length) return;

                const worldPoint = hits[0].point.clone();
                const localPoint = effectiveTargetMesh.worldToLocal(worldPoint);

                let nearest: Layer | null = null;
                let minDist = Infinity;

                // Distance check in LOCAL space
                for (const layer of layers) {
                    const d = new THREE.Vector3(...layer.position).distanceTo(localPoint);
                    if (d < minDist) { minDist = d; nearest = layer; }
                }

                if (nearest) startDraggingLayer(nearest.id);
            }}
            onPointerUp={(e) => {
                e.stopPropagation();
                stopDraggingLayer();
            }}
        >
            <primitive object={scene} scale={scale} position={position} />
            {effectiveTargetMesh && layers.map((layer: Layer) => (
                <React.Fragment key={layer.id}>
                    {createPortal(
                        <LayerDecal layer={layer} />,
                        effectiveTargetMesh
                    )}
                </React.Fragment>
            ))}

            {/* Mesh Debugger Overlay */}
            <Html>
                <MeshDebugger
                    root={scene}
                    onSelectMesh={setOverrideTargetMesh}
                />
            </Html>
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
