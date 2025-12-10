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
    const [isMinimized, setIsMinimized] = React.useState(false);

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

            // Console'a detaylı bilgi
            const mesh = info.object as THREE.Mesh;
            const box = new THREE.Box3().setFromObject(mesh);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            console.group('🔍 MESH DEBUG');
            console.log('Name:', mesh.name);
            console.log('UUID:', mesh.uuid);
            console.log('Bounding Box:', box);
            console.log('Center:', center);
            console.log('Size:', size);
            console.log('Geometry:', mesh.geometry);
            console.log('Material:', mesh.material);
            console.groupEnd();
        }
    };

    // ✅ FIX: Production'da render edilmez
    if (process.env.NODE_ENV === 'production') {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 max-h-96 w-80 bg-white/95 backdrop-blur-sm border border-slate-300 rounded-lg shadow-2xl text-xs font-mono z-[9999] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
                <span className="font-semibold text-slate-700">🔧 Mesh Debugger</span>
                <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-200"
                >
                    {isMinimized ? '▲' : '▼'}
                </button>
            </div>

            {/* Content */}
            {!isMinimized && (
                <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
                    {list.map((info) => (
                        <button
                            key={info.uuid}
                            onClick={() => handleClick(info)}
                            className={`w-full text-left px-2 py-1 rounded transition-colors ${selectedId === info.uuid
                                ? 'bg-blue-500 text-white font-semibold'
                                : 'hover:bg-slate-100 text-slate-700'
                                }`}
                        >
                            <span style={{ paddingLeft: info.depth * 8 }}>
                                <span className="text-slate-400">[{info.type}]</span>{' '}
                                {info.name}
                            </span>
                        </button>
                    ))}
                    {list.length === 0 && (
                        <div className="text-slate-400 px-2 py-4 text-center">
                            No meshes loaded yet.
                        </div>
                    )}
                </div>
            )}

            {/* Stats Footer */}
            {!isMinimized && list.length > 0 && (
                <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 text-slate-500">
                    Total Objects: <span className="font-semibold text-slate-700">{list.length}</span>
                </div>
            )}
        </div>
    );
}