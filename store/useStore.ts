import { create } from 'zustand';

export interface Layer {
    id: string;
    type: 'image';
    url: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
}

interface AppState {
    tshirtColor: string;
    layers: Layer[];
    activeLayerId: string | null;
    setTshirtColor: (c: string) => void;
    addLayer: (url: string) => void;
    updateLayer: (id: string, chg: Partial<Layer>) => void;
    setActiveLayer: (id: string | null) => void;
    removeLayer: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
    tshirtColor: '#ffffff',
    layers: [],
    activeLayerId: null,
    setTshirtColor: (c) => set({ tshirtColor: c }),
    addLayer: (url) => set((state) => {
        const newLayer: Layer = {
            id: crypto.randomUUID(),
            type: 'image',
            url,
            position: [0, 0.2, 0.15],
            rotation: [0, 0, 0],
            scale: 0.15
        };
        return { layers: [...state.layers, newLayer], activeLayerId: newLayer.id };
    }),
    updateLayer: (id, chg) => set((state) => ({
        layers: state.layers.map(l => l.id === id ? { ...l, ...chg } : l)
    })),
    setActiveLayer: (id) => set({ activeLayerId: id }),
    removeLayer: (id) => set((state) => ({
        layers: state.layers.filter(l => l.id !== id),
        activeLayerId: state.activeLayerId === id ? null : state.activeLayerId
    }))
}));
