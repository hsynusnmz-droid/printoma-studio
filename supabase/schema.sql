-- =====================================================
-- PRINTOMA STUDIO - SUPABASE DATABASE SCHEMA
-- =====================================================
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Then click "RUN" to execute all commands
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
-- Stores user profile information (extends auth.users)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- RLS Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policy: Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. DESIGNS TABLE
-- =====================================================
-- Stores 3D t-shirt design data
-- =====================================================

CREATE TABLE IF NOT EXISTS public.designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Untitled Design',
    tshirt_color TEXT NOT NULL DEFAULT '#ffffff',
    layers_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    preview_img_url TEXT,
    is_public BOOLEAN DEFAULT false, -- For future public gallery feature
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS designs_user_id_idx ON public.designs(user_id);
CREATE INDEX IF NOT EXISTS designs_created_at_idx ON public.designs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own designs
CREATE POLICY "Users can view own designs"
    ON public.designs
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Anyone can view public designs (for sharing)
CREATE POLICY "Anyone can view public designs"
    ON public.designs
    FOR SELECT
    USING (is_public = true);

-- RLS Policy: Users can insert their own designs
CREATE POLICY "Users can insert own designs"
    ON public.designs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own designs
CREATE POLICY "Users can update own designs"
    ON public.designs
    FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own designs
CREATE POLICY "Users can delete own designs"
    ON public.designs
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 3. AUTOMATIC UPDATED_AT TRIGGER
-- =====================================================
-- Automatically update updated_at timestamp on row changes
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles table
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Apply trigger to designs table
CREATE TRIGGER set_designs_updated_at
    BEFORE UPDATE ON public.designs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 4. AUTO-CREATE PROFILE ON USER SIGNUP
-- =====================================================
-- Automatically create a profile when a new user signs up
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 5. STORAGE BUCKETS (Run separately or via Dashboard)
-- =====================================================
-- These commands create storage buckets for file uploads
-- Note: You can also create these via Supabase Dashboard → Storage
-- =====================================================

-- Create 'uploads' bucket for user-uploaded layer images
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Create 'previews' bucket for design thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('previews', 'previews', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 6. STORAGE RLS POLICIES
-- =====================================================
-- Security policies for file uploads and access
-- =====================================================

-- UPLOADS BUCKET POLICIES

-- Policy: Authenticated users can upload to uploads bucket
CREATE POLICY "Authenticated users can upload images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'uploads');

-- Policy: Users can view their own uploaded images
CREATE POLICY "Users can view own uploads"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can update their own uploaded images
CREATE POLICY "Users can update own uploads"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can delete their own uploaded images
CREATE POLICY "Users can delete own uploads"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- PREVIEWS BUCKET POLICIES

-- Policy: Authenticated users can upload previews
CREATE POLICY "Authenticated users can upload previews"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'previews');

-- Policy: Anyone can view preview images (public thumbnails)
CREATE POLICY "Anyone can view previews"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'previews');

-- Policy: Users can update their own previews
CREATE POLICY "Users can update own previews"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'previews' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can delete their own previews
CREATE POLICY "Users can delete own previews"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'previews' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- SCHEMA SETUP COMPLETE! ✅
-- =====================================================
-- Next steps:
-- 1. Verify tables created: Go to "Table Editor" in Supabase Dashboard
-- 2. Test RLS: Try querying from your Next.js app
-- 3. Upload test file to storage to verify policies work
-- =====================================================
