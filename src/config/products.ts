export interface ProductConfig {
    id: string;
    name: string;
    modelPath: string;
    targetMeshes: string[]; // Mesh names for Raycasting
    cameraPosition: [number, number, number];
}

export const PRODUCTS: Record<string, ProductConfig> = {
    'tshirt-classic': {
        id: 'tshirt-classic',
        name: 'Classic Cotton T-Shirt',
        modelPath: '/t-shirt.glb',
        targetMeshes: ['Object_2', 'Object_3', 'Object_4', 'Object_5'], // Moved from hardcoded logic
        cameraPosition: [0, 0, 1.5]
    }
};

export const DEFAULT_PRODUCT = PRODUCTS['tshirt-classic'];
