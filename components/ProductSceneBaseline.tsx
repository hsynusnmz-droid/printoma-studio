'use client';

import React, { useLayoutEffect, useMemo, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame, ThreeEvent, createPortal } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useStore, type Layer } from '@/store/useStore';
import { LayerDecal } from '@/components/LayerDecal';

interface ProductSceneBaselineProps {
    modelPath: string;
    scale?: number | [number, number, number];
    position?: [number, number, number];
}

const applyTShirtColor = (
    colorHex: string,
    baseMaterialsRef: React.MutableRefObject<THREE.MeshStandardMaterial[]>
) => {
    if (!/^#[0-9A-F]{6}$/i.test(colorHex)) return;

    const c = new THREE.Color(colorHex);

    baseMaterialsRef.current.forEach((mat) => {
        // ✅ FIX: Sadece Decal olmayan materyalleri güncelle
        if (!mat.userData.isDecal) {
            mat.color.setHex(0xffffff).multiply(c);
            mat.needsUpdate = true;
        }
    });
};

function BaselineModel({
    modelPath,
    scale = 1,
    position = [0, 0, 0],
}: ProductSceneBaselineProps) {
    const tshirtColor = useStore((s) => s.tshirtColor);
    const layers = useStore((s) => s.layers);
    const draggingLayerId = useStore((s) => s.draggingLayerId);
    const startDraggingLayer = useStore((s) => s.startDraggingLayer);
    const stopDraggingLayer = useStore((s) => s.stopDraggingLayer);
    const updateLayerTransform = useStore((s) => s.updateLayerTransform);

    const gltf = useGLTF(modelPath);
    const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

    const baseMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
    const targetMeshRef = useRef<THREE.Mesh | null>(null);
    const boundsRef = useRef<THREE.Box3 | null>(null);
    const prevLayerCount = useRef(layers.length);

    const [isCameraInside, setIsCameraInside] = React.useState(false);

    const pointer = useRef(new THREE.Vector2());
    const raycaster = useRef(new THREE.Raycaster());
    const { camera, gl } = useThree();

    // 1) Materyalleri klonla ve whitelist'e al
    useLayoutEffect(() => {
        baseMaterialsRef.current = [];

        scene.traverse((child) => {
            if (!(child instanceof THREE.Mesh) || !child.material) return;

            const materials = Array.isArray(child.material)
                ? child.material
                : [child.material];

            const cloned: THREE.Material[] = [];

            materials.forEach((mat) => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                    const clone = mat.clone();
                    // ✅ PBR iyileştirmesi
                    clone.roughness = 0.85; // Kumaş dokusu
                    clone.metalness = 0.05;
                    baseMaterialsRef.current.push(clone);
                    cloned.push(clone);
                } else {
                    cloned.push(mat.clone());
                }
            });

            child.material = Array.isArray(child.material) ? cloned : cloned[0];
        });
    }, [scene]);

    // 2) Rengi uygula
    useLayoutEffect(() => {
        applyTShirtColor(tshirtColor, baseMaterialsRef);
    }, [tshirtColor]);

    // 3) Unified Interaction Surface (Merged Mesh)
    const targetMesh = useMemo(() => {
        const geometries: THREE.BufferGeometry[] = [];

        scene.traverse((child) => {
            if (!(child instanceof THREE.Mesh) || !child.geometry) return;

            // ✅ Filter Logic:
            // Include: Object_8 (Body) AND Object_10 to Object_20 (Sleeves, etc.)
            // Exclude: Object_6 (Collar/Seams)

            const isMainBody = child.name === 'Object_8';
            const isExtraPart = child.name.startsWith('Object_') &&
                parseInt(child.name.split('_')[1]) >= 10 &&
                parseInt(child.name.split('_')[1]) <= 20;

            const isCollar = child.name === 'Object_6';

            if ((isMainBody || isExtraPart) && !isCollar) {
                const geom = child.geometry.clone();
                // Bake world transform into geometry
                child.updateMatrixWorld();
                geom.applyMatrix4(child.matrixWorld);
                geometries.push(geom);
            }
        });

        if (geometries.length === 0) return null;

        const mergedGeometry = mergeGeometries(geometries);
        const material = new THREE.MeshBasicMaterial({
            visible: false, // Görünmez ama raycast yapılabilir
            opacity: 0,
            transparent: true,
            depthWrite: false,
        });

        const mesh = new THREE.Mesh(mergedGeometry, material);
        // Container'ın transformunu sıfırla çünkü geometriye bake ettik
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 0, 0);
        mesh.scale.set(1, 1, 1);

        return mesh;
    }, [scene]);

    // Update refs for handlers
    useLayoutEffect(() => {
        targetMeshRef.current = targetMesh;
        if (targetMesh) {
            boundsRef.current = new THREE.Box3().setFromObject(targetMesh);
        } else {
            boundsRef.current = null;
        }
    }, [targetMesh]);

    // 4) Center-Camera Spawn Logic
    useEffect(() => {
        if (layers.length > prevLayerCount.current) {
            // Yeni layer eklendi
            const newLayerId = layers[layers.length - 1].id;
            const targetMesh = targetMeshRef.current;

            if (targetMesh) {
                // Kamera merkezinden raycast at
                raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
                const hits = raycaster.current.intersectObject(targetMesh, true);

                if (hits.length > 0) {
                    const hit = hits[0];
                    const hitPointLocal = targetMesh.worldToLocal(hit.point.clone());
                    // Normal vector (eğer varsa)
                    const normal = hit.face?.normal.clone().transformDirection(targetMesh.matrixWorld);

                    updateLayerTransform(newLayerId, {
                        position: [hitPointLocal.x, hitPointLocal.y, hitPointLocal.z],
                        normal: normal ? [normal.x, normal.y, normal.z] : undefined,
                    });
                } else {
                    // Boşluğa bakıyorsa default pozisyon (Göğüs)
                    updateLayerTransform(newLayerId, {
                        position: [0, 0.2, 0.15],
                    });
                }
            }
        }
        prevLayerCount.current = layers.length;
    }, [layers.length, camera, updateLayerTransform]);

    // 5) Pointer move
    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!draggingLayerId) return;

        pointer.current.set(
            (e.clientX / gl.domElement.clientWidth) * 2 - 1,
            -(e.clientY / gl.domElement.clientHeight) * 2 + 1
        );
    };

    // 6) Drag başlangıcı (kilitli layer kontrol ekle)
    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
        if (e.button !== 0) return;
        e.stopPropagation();

        const targetMesh = targetMeshRef.current;
        if (!targetMesh || layers.length === 0) return;

        pointer.current.set(
            (e.clientX / gl.domElement.clientWidth) * 2 - 1,
            -(e.clientY / gl.domElement.clientHeight) * 2 + 1
        );
        raycaster.current.setFromCamera(pointer.current, camera);
        const hits = raycaster.current.intersectObject(targetMesh, true);
        if (!hits.length) return;

        const hitPointWorld = hits[0].point.clone();
        const hitPointLocal = targetMesh.worldToLocal(hitPointWorld);

        let nearest: Layer | null = null;
        let minDist = Infinity;

        // ✅ Sadece görünür ve kilitli olmayan layerları seç (Loop refactoring for TS inference)
        for (const layer of layers) {
            if (layer.visible === false || layer.locked) continue;

            const d = new THREE.Vector3(...layer.position).distanceTo(hitPointLocal);
            if (d < minDist) {
                minDist = d;
                nearest = layer;
            }
        }

        if (nearest) {
            startDraggingLayer(nearest.id);
        }
    };

    // 7) Drag bitişi
    const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        stopDraggingLayer();
    };

    // 8) ✅ PERFORMANS: useFrame optimizasyonu
    useFrame(() => {
        const targetMesh = targetMeshRef.current;

        // Kamera içinde mi kontrolü
        if (targetMesh && boundsRef.current) {
            const inside = boundsRef.current.containsPoint(camera.position);
            if (inside !== isCameraInside) {
                setIsCameraInside(inside);
            }
        }

        // ✅ FIX: Sadece drag sırasında raycast yap
        if (!draggingLayerId || !targetMesh) return;

        raycaster.current.setFromCamera(pointer.current, camera);
        const hits = raycaster.current.intersectObject(targetMesh, true);
        if (!hits.length) return;

        const hit = hits[0];
        const hitPointWorld = hit.point.clone();
        const hitPointLocal = targetMesh.worldToLocal(hitPointWorld);

        // ✅ Normal vector'ü de kaydet (LayerDecal rotation için)
        const normal = hit.face?.normal.clone().transformDirection(targetMesh.matrixWorld);

        updateLayerTransform(draggingLayerId, {
            position: [hitPointLocal.x, hitPointLocal.y, hitPointLocal.z],
            normal: normal ? [normal.x, normal.y, normal.z] : undefined,
        });
    });

    return (
        <Center
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
        >
            <primitive object={scene} scale={scale} position={position} />

            {/* ✅ Unified Interaction Mesh (Phantom) */}
            {targetMesh && (
                <primitive
                    object={targetMesh}
                    scale={scale}
                    position={position}
                />
            )}

            {targetMesh &&
                !isCameraInside &&
                layers
                    .filter(layer => layer.visible !== false) // ✅ Görünmez layerları render etme
                    .map((layer: Layer) => (
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

export default function ProductSceneBaseline({
    modelPath,
    scale = 1,
    position = [0, 0, 0],
}: ProductSceneBaselineProps) {
    const draggingLayerId = useStore((s) => s.draggingLayerId);

    return (
        <div className="w-full h-full relative bg-gradient-to-br from-slate-50 to-slate-100">
            <Canvas
                shadows
                camera={{ fov: 35, position: [0, 1.3, 2.2] }}
                gl={{
                    toneMapping: THREE.ACESFilmicToneMapping,
                    antialias: true, // ✅ Keskin kenarlar için
                }}
            >
                {/* ✅ Işıklandırma iyileştirmesi */}
                <ambientLight intensity={0.3} />
                <directionalLight
                    intensity={0.6}
                    position={[2, 3, 2]}
                    castShadow
                />
                <Environment preset="city" />

                <BaselineModel modelPath={modelPath} scale={scale} position={position} />

                <OrbitControls
                    makeDefault
                    minDistance={1.2}
                    maxDistance={4}
                    enablePan={false}
                    enabled={!draggingLayerId} // Drag varken kamera dönmesin
                    dampingFactor={0.05} // ✅ Smooth rotation
                    enableDamping
                />
            </Canvas>
        </div>
    );
}

useGLTF.preload('/t-shirt.glb');