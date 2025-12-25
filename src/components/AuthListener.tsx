'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';

/**
 * AuthListener Component
 * Listens to Supabase auth state changes and updates the global Zustand store
 * Mount this in the root layout to ensure auth state is tracked globally
 */
export default function AuthListener() {
    const setUser = useStore((s) => s.setUser);

    useEffect(() => {
        const supabase = createClient();

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        // Cleanup subscription on unmount
        return () => subscription.unsubscribe();
    }, [setUser]);

    return null; // This component doesn't render anything
}
