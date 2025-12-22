import { createClient } from '@/lib/supabase/server';
import StudioMain from '@/components/StudioMain';

export default async function Home() {
  const supabase = await createClient();

  // Fetch the first active product
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error || !product) {
    console.error('Product fetch error:', error);
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-800">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-red-100">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Ürün Yüklenemedi</h2>
          <p className="text-slate-500 mb-4">{error?.message || 'Aktif ürün bulunamadı. Lütfen veritabanını kontrol edin.'}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <StudioMain product={product} />
    </main>
  );
}
