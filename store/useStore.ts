import { create } from 'zustand';

// Layer definitions
export type LayerType = 'image';

export interface Layer {
    id: string;
    type: LayerType;
    src: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
}

interface AppState {
    tshirtColor: string;
    layers: Layer[];
    activeLayerId: string | null;
    draggingLayerId: string | null;
    setTshirtColor: (color: string) => void;
    addLayer: (payload: { src: string; position?: [number, number, number] }) => void;
    setActiveLayer: (id: string | null) => void;
    removeLayer: (id: string) => void;
    startDraggingLayer: (id: string) => void;
    stopDraggingLayer: () => void;
    updateLayerTransform: (id: string, transform: Partial<Pick<Layer, 'position' | 'rotation' | 'scale'>>) => void;
}

export const useStore = create<AppState>((set) => ({
    tshirtColor: '#ef4444', // Default Red
    layers: [],
    activeLayerId: null,
    draggingLayerId: null,

    setTshirtColor: (c) => set({ tshirtColor: c }),

    addLayer: (payload) => set((state) => {
        const newLayer: Layer = {
            id: crypto.randomUUID(),
            type: 'image',
            src: payload.src,
            position: payload.position ?? [0, 0.2, 0.15],
            rotation: [Math.PI, 0, 0], // Correct upside-down issue
            scale: 0.15
        };
        // Auto-select the newly added layer
        return {
            layers: [...state.layers, newLayer],
            activeLayerId: newLayer.id
        };
    }),

    setActiveLayer: (id) => set({ activeLayerId: id }),

    removeLayer: (id) => set((state) => {
        const filtered = state.layers.filter((l) => l.id !== id);
        const newActive = state.activeLayerId === id ? (filtered[0]?.id ?? null) : state.activeLayerId;
        return {
            layers: filtered,
            activeLayerId: newActive,
        };
    }),

    startDraggingLayer: (id) => set({ draggingLayerId: id }),
    stopDraggingLayer: () => set({ draggingLayerId: null }),

    updateLayerTransform: (id, transform) => set((state) => ({
        layers: state.layers.map(l =>
            l.id === id
                ? {
                    ...l, ...transform,
                    position: transform.position ? transform.position : l.position,
                    rotation: transform.rotation ? transform.rotation : l.rotation
                }
                : l
        )
    })),
}));
