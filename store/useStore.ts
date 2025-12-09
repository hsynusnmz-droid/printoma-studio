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
    draggingLayerId: string | null; // Added
    setTshirtColor: (color: string) => void;
    addLayer: (payload: { src: string }) => void;
    startDraggingLayer: (id: string) => void;
    stopDraggingLayer: () => void;
    updateLayerTransform: (id: string, transform: Partial<Pick<Layer, 'position' | 'rotation' | 'scale'>>) => void;
}

export const useStore = create<AppState>((set) => ({
    tshirtColor: '#ef4444', // Default Red
    layers: [],
    draggingLayerId: null, // Added

    setTshirtColor: (c) => set({ tshirtColor: c }),

    addLayer: (payload) => set((state) => {
        const newLayer: Layer = {
            id: crypto.randomUUID(),
            type: 'image',
            src: payload.src,
            position: [0, 0.2, 0.15], // TODO: Front-center raycast ile akıllı yerleştirme
            rotation: [0, 0, 0],
            scale: 0.15
        };
        return { layers: [...state.layers, newLayer] };
    }),

    startDraggingLayer: (id) => set({ draggingLayerId: id }), // Added
    stopDraggingLayer: () => set({ draggingLayerId: null }), // Added

    updateLayerTransform: (id, transform) => set((state) => ({ // Added
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
