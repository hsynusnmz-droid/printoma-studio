'use client';

import { useEffect } from 'react';
import StudioMain from '@/components/StudioMain';
import { useStore } from '@/store/useStore';

export default function Home() {
  const loadProducts = useStore((s) => s.loadProducts);
  const currentProduct = useStore((s) => s.currentProduct);
  const isLoadingProducts = useStore((s) => s.isLoadingProducts);
  const productError = useStore((s) => s.productError);

  useEffect(() => {
    // Load products from Supabase on mount
    loadProducts();
  }, [loadProducts]);

  // Loading state
  if (isLoadingProducts) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700">Loading Printoma Studio...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (productError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-red-100 max-w-md">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Product Load Error</h2>
          <p className="text-slate-600 mb-4">{productError}</p>
          <button
            onClick={() => loadProducts()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No product loaded
  if (!currentProduct) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-700 mb-2">No Products Available</h2>
          <p className="text-slate-500">Please add products to the database</p>
        </div>
      </div>
    );
  }

  // Product loaded successfully - convert to ProductConfig format
  const productConfig = {
    id: currentProduct.id,
    name: currentProduct.name,
    modelPath: currentProduct.model_url,
    targetMeshes: ['Object_2', 'Object_3', 'Object_4', 'Object_5'], // Default meshes
    cameraPosition: [0, 0, 1.5] as [number, number, number],
  };

  return (
    <main className="min-h-screen">
      <StudioMain product={productConfig} />
    </main>
  );
}
