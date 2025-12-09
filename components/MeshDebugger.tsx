'use client';
import React from 'react';
import * as THREE from 'three';

export interface DebugMeshInfo {
    uuid: string;
    name: string;
    type: string;
    depth: number;
    object: THREE.Object3D;
}

interface MeshDebuggerProps {
    root: THREE.Group | THREE.Object3D | null;
    onSelectMesh?: (mesh: THREE.Mesh) => void;
}

export function MeshDebugger({ root, onSelectMesh }: MeshDebuggerProps) {
    const [list, setList] = React.useState<DebugMeshInfo[]>([]);
    const [selectedId, setSelectedId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!root) {
            setList([]);
            return;
        }
        const result: DebugMeshInfo[] = [];
        const traverse = (obj: THREE.Object3D, depth = 0) => {
            result.push({
                uuid: obj.uuid,
                name: obj.name || '(no-name)',
                type: obj.type,
                depth,
                object: obj,
            });
            obj.children.forEach((child) => traverse(child, depth + 1));
        };
        traverse(root);
        setList(result);
    }, [root]);

    const handleClick = (info: DebugMeshInfo) => {
        setSelectedId(info.uuid);
        if ((info.object as THREE.Mesh).isMesh && onSelectMesh) {
            onSelectMesh(info.object as THREE.Mesh);

            // Console’a bounding box yaz
            const mesh = info.object as THREE.Mesh;
            const box = new THREE.Box3().setFromObject(mesh);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            // eslint-disable-next-line no-console
            console.log('DEBUG MESH:', {
                name: mesh.name,
                box,
                center,
                size,
            });
        }
    };

    return (
        <div className="fixed bottom-4 left-4 max-h-80 w-80 overflow-y-auto bg-white/90 border border-slate-200 rounded-lg shadow-xl text-xs font-mono z-50">
            <div className="px-3 py-2 border-b border-slate-200 font-semibold text-slate-700">
                Mesh Debugger
            </div>
            <div className="p-2 space-y-1">
                {list.map((info) => (
                    <button
                        key={info.uuid}
                        onClick={() => handleClick(info)}
                        className={`w-full text-left px-2 py-1 rounded ${selectedId === info.uuid ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100'
                            }`}
                    >
                        <span style={{ paddingLeft: info.depth * 8 }}>
                            [{info.type}] {info.name}
                        </span>
                    </button>
                ))}
                {list.length === 0 && (
                    <div className="text-slate-400 px-2 py-1">No meshes loaded.</div>
                )}
            </div>
        </div>
    );
}
