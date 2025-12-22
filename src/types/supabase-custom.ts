export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface LayerState {
    id: string
    type: 'image' | 'text'
    content: string
    settings: {
        x: number
        y: number
        scale: number
        rotation: number
    }
    zIndex: number
    visible: boolean
    locked: boolean
}

export interface ProductConfig {
    modelPath: string
    texturePath?: string
    scale: number
    position: [number, number, number]
    cameraPosition?: [number, number, number]
    logoConstraints?: {
        z: number
        maxScale: number
    }
    printableArea: {
        x: number
        y: number
        scale: number
    }
}

export interface CanvasState {
    layers: LayerState[]
    activeLayerId: string | null
    backgroundColor?: string
}

export interface Database {
    public: {
        Tables: {
            products: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    model_url: string
                    config: ProductConfig
                    is_active: boolean
                    created_at: string
                }
            }
        }
    }
}
