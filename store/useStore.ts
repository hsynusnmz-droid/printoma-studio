import { create } from 'zustand';

export type LayerType = 'image' | 'text';

export interface Layer {
    id: string;
    type: LayerType;
    src: string; // ✅ Tek source field
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
    normal?: [number, number, number]; // Surface normal (raycasting için)
    locked?: boolean; // 🆕 Katman kilitleme
    visible?: boolean; // 🆕 Görünürlük toggle
}

interface AppState {
    tshirtColor: string;
    layers: Layer[];
    activeLayerId: string | null;
    draggingLayerId: string | null;

    // Actions
    setTshirtColor: (color: string) => void;
    addLayer: (payload: { src: string; type?: LayerType }) => void;
    removeLayer: (id: string) => void;
    setActiveLayer: (id: string | null) => void;
    startDraggingLayer: (id: string) => void;
    stopDraggingLayer: () => void;
    updateLayerTransform: (
        id: string,
        transform: Partial<Pick<Layer, 'position' | 'rotation' | 'scale' | 'normal'>>
    ) => void;
    toggleLayerVisibility: (id: string) => void; // 🆕
    toggleLayerLock: (id: string) => void; // 🆕
}

export const useStore = create<AppState>((set) => ({
    tshirtColor: '#ef4444',
    layers: [],
    activeLayerId: null,
    draggingLayerId: null,

    setTshirtColor: (color) => set({ tshirtColor: color }),

    addLayer: (payload) =>
        set((state) => {
            const newLayer: Layer = {
                id: crypto.randomUUID(),
                type: payload.type || 'image',
                src: payload.src,
                position: [0, 0.2, 0.15], // İlk pozisyon (raycast düzeltecek)
                rotation: [0, 0, 0], // Başlangıç rotasyonu (normal'dan hesaplanacak)
                scale: 0.2,
                visible: true,
                locked: false,
            };
            return {
                layers: [...state.layers, newLayer],
                activeLayerId: newLayer.id,
            };
        }),

    removeLayer: (id) =>
        set((state) => {
            const filtered = state.layers.filter((l) => l.id !== id);
            const wasActive = state.activeLayerId === id;
            return {
                layers: filtered,
                activeLayerId: wasActive ? filtered.at(-1)?.id ?? null : state.activeLayerId,
            };
        }),

    setActiveLayer: (id) => set({ activeLayerId: id }),

    startDraggingLayer: (id) => 
        set((state) => {
            const layer = state.layers.find(l => l.id === id);
            // Kilitli katman sürüklenemez
            if (layer?.locked) return state;
            return { draggingLayerId: id };
        }),

    stopDraggingLayer: () => set({ draggingLayerId: null }),

    updateLayerTransform: (id, transform) =>
        set((state) => ({
            layers: state.layers.map((l) =>
                l.id === id && !l.locked // Kilitli katman güncellenemez
                    ? {
                        ...l,
                        position: transform.position ?? l.position,
                        rotation: transform.rotation ?? l.rotation,
                        scale: transform.scale ?? l.scale,
                        normal: transform.normal ?? l.normal,
                    }
                    : l
            ),
        })),

    toggleLayerVisibility: (id) =>
        set((state) => ({
            layers: state.layers.map((l) =>
                l.id === id ? { ...l, visible: !l.visible } : l
            ),
        })),

    toggleLayerLock: (id) =>
        set((state) => ({
            layers: state.layers.map((l) =>
                l.id === id ? { ...l, locked: !l.locked } : l
            ),
        })),
}));