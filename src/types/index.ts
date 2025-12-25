export interface PrintArea {
    id: string;
    width: number;
    height: number;
    position: [number, number, number]; // x, y, z
    rotation: [number, number, number];
}

export interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    model_url: string; // .glb file URL
    base_color: string;
    print_areas: Record<string, PrintArea>; // JSONB from database
    active: boolean;
    created_at?: string;
    updated_at?: string;
}
