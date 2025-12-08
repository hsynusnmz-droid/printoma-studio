import { ProductConfig } from '@/types/supabase-custom';

export const PRODUCTS: Record<string, ProductConfig & { id: string; name: string }> = {
    tshirt: {
        id: 'tshirt',
        name: 'Classic T-Shirt',
        modelPath: '/t-shirt.glb', // Matches your public folder file name
        texturePath: '/placeholder-logo.png', // Fallback
        scale: 0.85, // Maximized size
        position: [0, -0.5, 0],
        cameraPosition: [0, 0, 1.5],
        logoConstraints: { z: 0.5, maxScale: 0.3 },
        // Adding required ProductConfig fields to satisfy type or loose typing 'any'
        printableArea: { x: 0, y: 0.1, scale: 0.3 }
    }
};
