import StudioMain from '@/components/StudioMain';
import { DEFAULT_PRODUCT } from '@/config/products';

export default function Home() {
  // ✅ Use local product config instead of Supabase query
  // No database fetch needed - product definitions are in config file

  return (
    <main className="min-h-screen">
      <StudioMain product={DEFAULT_PRODUCT} />
    </main>
  );
}
