'use client';


import React, { useLayoutEffect, useMemo, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame, ThreeEvent, createPortal } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls, Center, useTexture } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useStore, type Layer } from '@/store/useStore';
import { LayerDecal } from '@/components/LayerDecal';
import { DragProxy } from '@/components/DragProxy';
import { calculateDecalRotation } from '@/utils/geometry';
import { DEFAULT_PRODUCT } from '@/config/products'; // ✅ Config Pattern Integration

interface ProductSceneBaselineProps {
    modelPath: string;
    scale?: number | [number, number, number];
    position?: [number, number, number];
    orbitControlsRef?: React.MutableRefObject<OrbitControlsImpl | null>;
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

// 📸 Screenshot Manager Component
function ScreenshotManager() {
    const { gl, scene, camera } = useThree();
    const screenshotRequested = useStore((s) => s.screenshotRequested);
    const setScreenshotRequested = useStore((s) => s.setScreenshotRequested);
    const layers = useStore((s) => s.layers);

    useFrame(() => {
        if (screenshotRequested) {
            // 1. Force Render
            gl.render(scene, camera);

            // 2. Take Screenshot
            const dataUrl = gl.domElement.toDataURL('image/png', 1.0); // High Quality

            // 3. Download
            const link = document.createElement('a');
            link.setAttribute('download', 'printoma-mockup.png');
            link.setAttribute('href', dataUrl);
            link.click();

            // 4. Log Data (JSON Export)
            console.log('📄 Print Data Export:', JSON.stringify(layers, null, 2));

            // 5. Reset Flag
            setScreenshotRequested(false);
        }
    });

    return null;
}

// ✅ DIAGNOSTIC TOOL: Removed after successful diagnosis
function BaselineModel({
    modelPath,
    scale = 1,
    position = [0, 0, 0],
    orbitControlsRef,
}: ProductSceneBaselineProps) {
    const tshirtColor = useStore((s) => s.tshirtColor);
    const layers = useStore((s) => s.layers);
    const draggingLayerId = useStore((s) => s.draggingLayerId);
    const startDraggingLayer = useStore((s) => s.startDraggingLayer);
    const stopDraggingLayer = useStore((s) => s.stopDraggingLayer);
    const updateLayerTransform = useStore((s) => s.updateLayerTransform);
    const animationType = useStore((s) => s.animationType);
    const animationSpeed = useStore((s) => s.animationSpeed);

    // 👻 Ghost Mode State
    const pendingLayer = useStore((s) => s.pendingLayer);
    const confirmPendingLayer = useStore((s) => s.confirmPendingLayer);

    const gltf = useGLTF(modelPath);
    // ✅ PBR Upgrade: Load Fabric Normal Map
    const rawFabricNormal = useTexture('/textures/fabric_normal.jpg');

    // Texture ayarlarını optimize et (Memoized Clone)
    const fabricNormal = useMemo(() => {
        const t = rawFabricNormal.clone();
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(6, 6); // ✅ 6x6: Macro zoom için yüksek çözünürlüklü sıklık
        t.colorSpace = THREE.NoColorSpace;
        t.needsUpdate = true;
        return t;
    }, [rawFabricNormal]);

    const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

    const baseMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
    const targetMeshRef = useRef<THREE.Mesh | null>(null);
    const boundsRef = useRef<THREE.Box3 | null>(null);
    const prevLayerCount = useRef(layers.length);

    // ✅ FIX: Direct Mutation Refs (Sıfır Gecikme Icin)
    const layerRefs = useRef<{ [id: string]: THREE.Mesh }>({});
    const dragCommitRef = useRef<{ id: string; position: [number, number, number]; normal?: [number, number, number] } | null>(null);
    const animationGroupRef = useRef<THREE.Group>(null);
    const ghostMeshRef = useRef<THREE.Mesh>(null); // 👻 Ghost Ref

    const [isCameraInside, setIsCameraInside] = React.useState(false);

    const pointer = useRef(new THREE.Vector2());
    const raycaster = useRef(new THREE.Raycaster());
    const { camera } = useThree();

    // ✅ Raycaster Tuning: Hassasiyet ayarı
    useLayoutEffect(() => {
        // Varsayılan raycaster threshold değerini düşürerek daha hassas seçim sağlar
        if (raycaster.current.params.Mesh) {
            raycaster.current.params.Mesh.threshold = 0.01;
        }
    }, []);

    // 1) Materyalleri klonla, PBR uygula ve whitelist'e al
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
                    // ✅ PBR FIX: "Patlamayan" Mat Kumaş
                    clone.roughness = 1.0;
                    clone.metalness = 0.0;
                    clone.normalMap = fabricNormal;
                    clone.normalScale.set(3.5, 3.5); // detayları artır (1.5 -> 3.5)
                    clone.envMapIntensity = 0.1; // ✅ Yansımayı neredeyse kapattık (Yağlı hissi yok eder)

                    baseMaterialsRef.current.push(clone);
                    cloned.push(clone);
                } else {
                    cloned.push(mat.clone());
                }
            });

            child.material = Array.isArray(child.material) ? cloned : cloned[0];
        });
    }, [scene, fabricNormal]);

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

            // ✅ FIX: New Model Filters (Config Driven)
            const n = child.name;
            const isTarget = DEFAULT_PRODUCT.targetMeshes.includes(n);

            if (isTarget) {
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
    }, [layers.length, layers, camera, updateLayerTransform]);

    // 5) Pointer move
    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!draggingLayerId) return;

        // ✅ FIX: Use R3F normalized pointer directly (handles canvas offset correctly)
        pointer.current.copy(e.pointer);
    };

    // 👻 Ghost Click Handler
    const handleGhostClick = (e: ThreeEvent<PointerEvent>) => {
        if (!pendingLayer || !targetMesh) return;
        e.stopPropagation();

        const hitPointLocal = targetMesh.worldToLocal(e.point.clone());
        const normal = e.face?.normal.clone().transformDirection(targetMesh.matrixWorld);

        confirmPendingLayer(
            [hitPointLocal.x, hitPointLocal.y, hitPointLocal.z],
            normal ? [normal.x, normal.y, normal.z] : undefined
        );
    };

    // 6) Drag başlangıcı (kilitli layer kontrol ekle)
    const handleLayerPointerDown = (e: ThreeEvent<PointerEvent>, layerId: string) => {
        if (e.button !== 0) return;
        e.stopPropagation(); // ✅ CLICK CONFLICT FIX: Stop OrbitControls

        // 🛑 Imperative Freeze (Fixes Race Condition)
        if (orbitControlsRef && orbitControlsRef.current) {
            orbitControlsRef.current.enabled = false;
        }

        // ✅ Sadece tıklanan layerı seç
        startDraggingLayer(layerId);
    };

    // 7) Drag bitişi (Commit Changes)
    const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();

        // Eğer sürükleme yapıldıysa, son konumu store'a kaydet
        if (dragCommitRef.current) {
            updateLayerTransform(dragCommitRef.current.id, {
                position: dragCommitRef.current.position,
                normal: dragCommitRef.current.normal,
            });
            dragCommitRef.current = null;
        }

        stopDraggingLayer();

        // 🟢 Imperative Unfreeze
        if (orbitControlsRef && orbitControlsRef.current) {
            orbitControlsRef.current.enabled = true;
        }
    };

    // 8) ✅ PERFORMANS: useFrame optimizasyonu (Direct Mutation)
    useFrame((state) => {
        // --- Animation Logic ---
        const group = animationGroupRef.current;
        if (group) {
            const time = state.clock.elapsedTime * animationSpeed;

            if (animationType === 'walk') {
                group.rotation.y = Math.sin(time) * 0.4;
                group.position.y = Math.abs(Math.sin(time * 4)) * 0.05;
            } else if (animationType === 'waves') {
                group.rotation.z = Math.sin(time * 0.5) * 0.05;
                group.rotation.x = Math.cos(time * 0.3) * 0.05;
                group.position.y = Math.sin(time) * 0.05;
            } else if (animationType === 'knit') {
                const s = 1 + Math.sin(time * 2) * 0.02;
                group.scale.setScalar(s);
                group.rotation.set(0, 0, 0);
                group.position.set(0, 0, 0);
            } else {
                // Reset to default
                group.position.set(0, 0, 0);
                group.rotation.set(0, 0, 0);
                group.scale.set(1, 1, 1);
            }
        }

        const targetMesh = targetMeshRef.current;

        // Kamera içinde mi kontrolü
        if (targetMesh && boundsRef.current) {
            const inside = boundsRef.current.containsPoint(camera.position);
            if (inside !== isCameraInside) {
                setIsCameraInside(inside);
            }
        }

        // ✅ FIX: Sadece drag veya ghost sırasında raycast yap
        if ((!draggingLayerId && !pendingLayer) || !targetMesh) return;

        raycaster.current.setFromCamera(pointer.current, camera);
        const hits = raycaster.current.intersectObject(targetMesh, true);
        if (!hits.length) {
            // Ghost boşluğa düşerse gizle
            if (pendingLayer && ghostMeshRef.current) {
                ghostMeshRef.current.visible = false;
            }
            return;
        }

        const hit = hits[0];
        const hitPointLocal = targetMesh.worldToLocal(hit.point.clone());
        const normal = hit.face?.normal.clone().transformDirection(targetMesh.matrixWorld);

        // 👻 Ghost Update Logic
        if (pendingLayer && ghostMeshRef.current) {
            ghostMeshRef.current.visible = true;
            ghostMeshRef.current.position.set(hitPointLocal.x, hitPointLocal.y, hitPointLocal.z);

            if (normal) {
                const n = new THREE.Vector3(normal.x, normal.y, normal.z).normalize();
                const { rotation } = calculateDecalRotation(n, 0);
                ghostMeshRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
            }
            return; // Drag mantığına girmesin
        }

        // --- DIRECT MUTATION START ---
        if (!draggingLayerId) return; // ✅ Null Check
        const activeMesh = layerRefs.current[draggingLayerId];

        if (activeMesh) {
            // 1. Pozisyonu güncelle (GPU)
            activeMesh.position.set(hitPointLocal.x, hitPointLocal.y, hitPointLocal.z);

            // 2. Rotasyonu ve Scale'i güncelle (GPU) - Stable Helper & Mirror Fix
            if (normal) {
                const n = new THREE.Vector3(normal.x, normal.y, normal.z).normalize();

                // Layer'ı bul (Rotation Z, ScaleFlip ve Manuel Flip için)
                const layer = layers.find(l => l.id === draggingLayerId);
                const rotationZ = layer?.rotationZ || 0;

                const { rotation: [rx, ry, rz], scaleX } = calculateDecalRotation(n, rotationZ);

                activeMesh.rotation.set(rx, ry, rz);

                if (layer) {
                    const manualFlipX = layer.flipX ? -1 : 1;
                    const manualFlipY = layer.flipY ? -1 : 1;
                    activeMesh.scale.set(
                        layer.scale * scaleX * manualFlipX,
                        layer.scale * manualFlipY,
                        layer.scale
                    );
                }
            }

            // 3. Commit için referansı sakla (React state update YOK)
            dragCommitRef.current = {
                id: draggingLayerId,
                position: [hitPointLocal.x, hitPointLocal.y, hitPointLocal.z] as [number, number, number],
                normal: normal ? ([normal.x, normal.y, normal.z] as [number, number, number]) : undefined,
            };
        }
        // --- DIRECT MUTATION END ---
    });

    return (
        <Center
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerDown={pendingLayer ? handleGhostClick : undefined} // 👻 Capture click for placement
        >
            <group ref={animationGroupRef}>
                <primitive object={scene} scale={scale} position={position} />

                {/* ✅ Unified Interaction Mesh (Phantom) */}
                {targetMesh && (
                    <primitive
                        object={targetMesh}
                        scale={scale}
                        position={position}
                    />
                )}
            </group>

            {targetMesh &&
                !isCameraInside &&
                layers
                    .filter(layer => layer.visible !== false) // ✅ Görünmez layerları render etme
                    .map((layer: Layer, index) => {
                        const isDragging = draggingLayerId === layer.id;
                        return (
                            <React.Fragment key={layer.id}>
                                {createPortal(
                                    isDragging ? (
                                        <DragProxy
                                            layer={layer}
                                            onRef={(mesh) => { layerRefs.current[layer.id] = mesh; }}
                                            fabricTexture={fabricNormal} // ✅ Texture Integration
                                            onPointerDown={(e) => handleLayerPointerDown(e, layer.id)} // ✅ Specific Handler
                                        />
                                    ) : (
                                        <LayerDecal
                                            layer={layer}
                                            index={index} // ✅ Dynamic Indexing
                                            onRef={(mesh) => { layerRefs.current[layer.id] = mesh; }}
                                            fabricTexture={fabricNormal} // ✅ Texture Integration
                                            onPointerDown={(e) => handleLayerPointerDown(e, layer.id)} // ✅ Specific Handler
                                        />
                                    ),
                                    targetMesh
                                )}
                            </React.Fragment>
                        );
                    })}

            {/* 👻 Ghost Decal Render */}
            {pendingLayer && targetMesh && createPortal(
                <LayerDecal
                    layer={{
                        id: 'ghost',
                        type: pendingLayer.type,
                        src: pendingLayer.src,
                        position: [0, 0, 0], // Position managed by ref
                        rotation: [0, 0, 0],
                        scale: 0.2,
                        visible: true,
                        locked: false,
                        flipX: false,
                        flipY: false
                    }}
                    index={999}
                    onRef={(mesh) => { ghostMeshRef.current = mesh; }}
                    fabricTexture={fabricNormal}
                // Tıklama olayını portal containerı üzerinden alıyoruz ama burada da olabilir
                />,
                targetMesh
            )}
        </Center>
    );
}

export default function ProductSceneBaseline({
    modelPath,
    scale = 1,
    position = [0, 0, 0],
}: ProductSceneBaselineProps) {
    const draggingLayerId = useStore((s) => s.draggingLayerId);
    const stopDraggingLayer = useStore((s) => s.stopDraggingLayer);
    const orbitControlsRef = useRef<OrbitControlsImpl>(null);

    // ✅ GLOBAL SAFETY: Ensure state is reset even if pointer leaves the model
    const handleGlobalPointerUp = (_e: React.PointerEvent) => {
        // Note: This is an HTML/Canvas pointer event, not R3F ThreeEvent, but sufficient for safety
        if (orbitControlsRef.current) {
            orbitControlsRef.current.enabled = true;
        }
        // Force stop dragging if we are still thinking we are dragging
        if (draggingLayerId) {
            stopDraggingLayer();
        }
    };

    return (
        <div className="flex-1 min-w-0 h-full relative bg-gradient-to-br from-slate-50 to-slate-100">
            <Canvas
                shadows
                camera={{ fov: 35, position: [0, 1.3, 2.2] }}
                gl={{
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 0.8, // ✅ Pozlamayı kıstık (Patlamayı önler)
                    antialias: true,
                    preserveDrawingBuffer: true, // 📸 Vital for Screenshots
                }}
                onPointerUp={handleGlobalPointerUp}
                onPointerMissed={() => {
                    if (orbitControlsRef.current) orbitControlsRef.current.enabled = true;
                }}
            >
                {/* ✅ Natural Soft Lighting (Dengeli) */}
                <ambientLight intensity={0.8} /> {/* Gölgeleri yumuşat (0.6 -> 0.8) */}
                <directionalLight
                    intensity={0.2} // Parlamayı azalt (0.3 -> 0.2)
                    position={[2, 3, 2]}
                    castShadow
                    shadow-bias={-0.0001} // Gölge hatalarını önle
                />
                <Environment preset="city" blur={1} /> {/* Blur yansımaları yumuşatır */}

                <BaselineModel
                    modelPath={modelPath}
                    scale={scale}
                    position={position}
                    orbitControlsRef={orbitControlsRef}
                />

                <OrbitControls
                    ref={orbitControlsRef}
                    makeDefault
                    minDistance={0.4} // ✅ Macro Zoom: Yüzeye çok yaklaşmaya izin ver
                    maxDistance={4}
                    enablePan={false}
                    // enabled={!draggingLayerId} // ❌ REMOVED: Managed imperatively via ref
                    dampingFactor={0.05} // ✅ Smooth rotation
                    enableDamping
                />

                <ScreenshotManager />
            </Canvas>
        </div>
    );
}

useGLTF.preload('/t-shirt.glb');