-- Supabase Database Setup Script for Ethereal Connectivity

-- Create Admin Roles Enum
CREATE TYPE public.user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');

-- 1. Create the Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  display_name TEXT,
  age INTEGER,
  gender TEXT,
  preferred_gender TEXT DEFAULT 'everyone',
  geo_bucket TEXT,
  resonance_radius FLOAT DEFAULT 1.0,
  privacy_mode BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'pending_verification', 'verified', 'rejected')),
  role public.user_role DEFAULT 'user',
  is_suspended BOOLEAN DEFAULT false,
  trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  personality_vibes JSONB DEFAULT '[]'::jsonb,
  seeking_vibes JSONB DEFAULT '[]'::jsonb
);

-- Turn on Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies for Profiles
CREATE POLICY "Users can view their own profile." 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile." 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view verified profiles of others." 
  ON public.profiles FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Trigger to automatically create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Set up Storage Bucket for University IDs
-- Note: If this fails, the bucket might already exist.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('university_ids', 'university_ids', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for Storage
-- Allow users to upload (INSERT)
CREATE POLICY "Users can upload their own ID." 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'university_ids' AND auth.uid()::text = owner);

-- Allow users to update their own ID (required for upsert)
CREATE POLICY "Users can update their own ID." 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'university_ids' AND auth.uid()::text = owner);

-- Allow users to view their own ID
CREATE POLICY "Users can view their own ID." 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'university_ids' AND auth.uid()::text = owner);

-- 4. Create Matches table for 1-to-1 exclusivity
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  initiator_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'disconnected')),
  CONSTRAINT unique_match_pair UNIQUE (user_1_id, user_2_id)
);

-- Function to prevent a user from having multiple active matches
CREATE OR REPLACE FUNCTION public.check_match_exclusivity()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.matches 
    WHERE (user_1_id = NEW.user_1_id OR user_2_id = NEW.user_1_id OR user_1_id = NEW.user_2_id OR user_2_id = NEW.user_2_id)
    AND status = 'active'
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'One or both users already have an active connection.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_match_exclusivity
  BEFORE INSERT OR UPDATE ON public.matches
  FOR EACH ROW EXECUTE PROCEDURE public.check_match_exclusivity();

-- 5. Create Messages table for Chat
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false
);

-- Turn on RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for Matches
CREATE POLICY "Users can view their own matches." 
  ON public.matches FOR SELECT 
  USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- Policies for Messages
CREATE POLICY "Users can view messages in their matches." 
  ON public.messages FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = messages.match_id 
    AND (matches.user_1_id = auth.uid() OR matches.user_2_id = auth.uid())
  ));

CREATE POLICY "Users can send messages to their matches." 
  ON public.messages FOR INSERT 
  WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = match_id 
    AND (matches.user_1_id = auth.uid() OR matches.user_2_id = auth.uid())
    AND matches.status = 'active'
  ));

-- 6. Admin System Tables
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  admin_id UUID REFERENCES public.profiles(id),
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id),
  details JSONB DEFAULT '{}'::jsonb,
  reason TEXT
);

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id),
  target_user_id UUID REFERENCES public.profiles(id),
  reason_category TEXT NOT NULL,
  evidence_text TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  moderator_notes TEXT
);

CREATE TABLE public.system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES public.profiles(id)
);

-- Initialize AI Weights
INSERT INTO public.system_config (key, value)
VALUES ('matching_weights', '{"personality": 0.4, "vibe": 0.3, "interests": 0.2, "distance": 0.1}')
ON CONFLICT (key) DO NOTHING;

-- Turn on RLS
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view logs." 
  ON public.admin_logs FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Users can create reports." 
  ON public.reports FOR INSERT 
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Moderators can view reports." 
  ON public.reports FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin', 'super_admin')));

CREATE POLICY "Moderators can update reports." 
  ON public.reports FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin', 'super_admin')));

CREATE POLICY "Admins can view config." 
  ON public.system_config FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Super admins can modify config." 
  ON public.system_config FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));
