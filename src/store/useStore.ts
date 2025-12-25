import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/types';

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
    flipX?: boolean; // 🆕 Yatay Aynalama
    flipY?: boolean; // 🆕 Dikey Aynalama
    rotationZ?: number; // 🆕 2D Döndürme (Radyan)
}

interface AppState {
    // Auth State
    user: User | null;

    // Product State
    products: Product[];
    currentProduct: Product | null;
    isLoadingProducts: boolean;
    productError: string | null;

    // Design State
    tshirtColor: string;
    layers: Layer[];
    activeLayerId: string | null;
    draggingLayerId: string | null;
    pendingLayer: { src: string; type: LayerType } | null;
    screenshotRequested: boolean; // 🆕 Export State

    // Auth Actions
    setUser: (user: User | null) => void;

    // Product Actions
    loadProducts: () => Promise<void>;
    setCurrentProduct: (productId: string) => void;

    // Design Actions
    setTshirtColor: (color: string) => void;
    setLayers: (layers: Layer[]) => void;  // For loading saved designs
    addLayer: (payload: { src: string; type?: LayerType }) => void;
    removeLayer: (id: string) => void;
    setActiveLayer: (id: string | null) => void;
    startDraggingLayer: (id: string) => void;
    stopDraggingLayer: () => void;
    setPendingLayer: (layer: { src: string; type: LayerType } | null) => void;
    confirmPendingLayer: (position: [number, number, number], normal?: [number, number, number]) => void;
    setScreenshotRequested: (requested: boolean) => void; // 🆕
    updateLayerTransform: (
        id: string,
        transform: Partial<Pick<Layer, 'position' | 'rotation' | 'scale' | 'normal' | 'flipX' | 'flipY' | 'rotationZ'>>
    ) => void;
    toggleLayerVisibility: (id: string) => void; // 🆕
    toggleLayerLock: (id: string) => void; // 🆕

    // Print Export State (Removed - handled via exportUtils)

    // Animation State
    animationType: 'static' | 'walk' | 'waves' | 'knit';
    animationSpeed: number;
    setAnimationType: (type: 'static' | 'walk' | 'waves' | 'knit') => void;
    setAnimationSpeed: (speed: number) => void;
}

export const useStore = create<AppState>((set, get) => ({
    // Auth State
    user: null,
    setUser: (user) => set({ user }),

    // Product State
    products: [],
    currentProduct: null,
    isLoadingProducts: false,
    productError: null,

    // Product Actions
    loadProducts: async () => {
        set({ isLoadingProducts: true, productError: null });
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true) // ✅ FIX: Use correct column name
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Supabase Query Error:', error);
                throw error;
            }

            if (data && data.length > 0) {
                console.log('✅ Products loaded:', data.length, 'products');
                set({
                    products: data as Product[],
                    // Set first product if none selected
                    currentProduct: get().currentProduct || (data[0] as Product),
                });
            } else {
                console.warn('⚠️ No active products found in database');
                set({ productError: 'No active products found' });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
            console.error('❌ Product Load Error:', errorMessage);
            set({ productError: errorMessage });
        } finally {
            set({ isLoadingProducts: false });
        }
    },

    setCurrentProduct: (productId) => {
        const product = get().products.find((p) => p.id === productId);
        if (product) {
            set({ currentProduct: product });
        }
    },

    // Design State
    tshirtColor: '#ef4444',
    layers: [],
    activeLayerId: null,
    draggingLayerId: null,
    pendingLayer: null,
    screenshotRequested: false,

    // Animation Defaults
    animationType: 'static',
    animationSpeed: 0.5,
    setAnimationType: (type) => set({ animationType: type }),
    setAnimationSpeed: (speed) => set({ animationSpeed: speed }),

    setTshirtColor: (color) => set({ tshirtColor: color }),
    setLayers: (layers) => set({ layers, activeLayerId: layers[0]?.id || null }),

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
            // ✅ Memory Leak Fix: Revoke blob URLs
            const layerToRemove = state.layers.find((l) => l.id === id);
            if (layerToRemove?.src.startsWith('blob:')) {
                URL.revokeObjectURL(layerToRemove.src);
            }

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
            return { draggingLayerId: id, activeLayerId: id }; // ✅ Auto-select on drag
        }),

    stopDraggingLayer: () => set({ draggingLayerId: null }),

    setPendingLayer: (layer) => set({ pendingLayer: layer }),

    setScreenshotRequested: (requested) => set({ screenshotRequested: requested }),




    confirmPendingLayer: (position, normal) =>
        set((state) => {
            if (!state.pendingLayer) return state;
            const newLayer: Layer = {
                id: crypto.randomUUID(),
                type: state.pendingLayer.type,
                src: state.pendingLayer.src,
                position,
                rotation: [0, 0, 0],
                scale: 0.2,
                normal,
                visible: true,
                locked: false,
                flipX: false,
                flipY: false,
            };
            return {
                layers: [...state.layers, newLayer],
                activeLayerId: newLayer.id,
                pendingLayer: null, // Clear pending
            };
        }),

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
                        flipX: transform.flipX ?? l.flipX,
                        flipY: transform.flipY ?? l.flipY,
                        rotationZ: transform.rotationZ ?? l.rotationZ,
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