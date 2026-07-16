-- Pressed by Meridia — Supabase schema
-- Run in the Supabase SQL editor. Includes RLS + the auth.users → profiles trigger.

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  subscription_status text DEFAULT 'free', -- 'free'|'pro'|'pro_annual'|'lifetime'
  plan_type text,
  stripe_customer_id text,
  stripe_subscription_id text,
  cancel_at timestamptz,
  renews_at timestamptz,
  theme_preset text DEFAULT 'Midnight',
  gmail_connected boolean DEFAULT false,
  gmail_email text,
  gmail_last_sync timestamptz,
  -- OAuth tokens stored AES-256-GCM encrypted (see routes/gmail.js). NEVER plaintext.
  gmail_tokens text,
  created_at timestamptz DEFAULT now()
);

-- Vault entries (the RAG source of truth for resume generation)
CREATE TABLE IF NOT EXISTS vault_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  section text NOT NULL, -- 'contact'|'summary'|'experience'|'education'|'skills'|'projects'|'certifications'|'awards'|'publications'
  position integer DEFAULT 0,
  title text,
  organization text,
  location text,
  start_date text,
  end_date text,
  current boolean DEFAULT false,
  description text,
  bullets jsonb DEFAULT '[]',
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vault_entries_user_section ON vault_entries(user_id, section, position);

-- Vault files (uploaded resumes)
CREATE TABLE IF NOT EXISTS vault_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text, -- 'pdf'|'docx'
  size integer,
  storage_path text,
  parsed boolean DEFAULT false,
  parsed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Resumes
CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  template text DEFAULT 'classic', -- 'classic'|'modern'|'academic'|'minimal'
  latex_source text,
  placeholders jsonb DEFAULT '{}',
  pdf_path text,
  vault_snapshot jsonb DEFAULT '{}',
  job_description text,
  tailored boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Resume version history (last 10 kept by the API)
CREATE TABLE IF NOT EXISTS resume_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid REFERENCES resumes(id) ON DELETE CASCADE,
  latex_source text,
  placeholders jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Job applications
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  company text NOT NULL,
  role text NOT NULL,
  location text,
  salary_min integer,
  salary_max integer,
  status text DEFAULT 'saved', -- 'saved'|'applied'|'phone_screen'|'interview'|'offer'|'rejected'|'withdrawn'
  applied_at timestamptz,
  source_url text,
  notes text,
  contacts jsonb DEFAULT '[]',
  tags jsonb DEFAULT '[]',
  resume_id uuid REFERENCES resumes(id),
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Gmail action items (deduplicated per thread)
CREATE TABLE IF NOT EXISTS email_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id),
  gmail_thread_id text,
  company text,
  role text,
  action_type text, -- 'interview_invite'|'rejection'|'offer'|'follow_up'|'documents_needed'|'other'
  deadline timestamptz,
  summary text,
  raw_snippet text,
  dismissed boolean DEFAULT false,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, gmail_thread_id)
);

-- Auto-create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row-level security: users only ever see their own rows.
-- (The API uses the service key; RLS protects direct client access.)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "own vault" ON vault_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own files" ON vault_files FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own resumes" ON resumes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own versions" ON resume_versions FOR ALL
  USING (EXISTS (SELECT 1 FROM resumes r WHERE r.id = resume_id AND r.user_id = auth.uid()));
CREATE POLICY "own jobs" ON jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own email actions" ON email_actions FOR ALL USING (auth.uid() = user_id);
