
-- Prints table
CREATE TABLE public.prints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.prints TO anon, authenticated;
GRANT ALL ON public.prints TO service_role;

ALTER TABLE public.prints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prints" ON public.prints
  FOR SELECT USING (true);

-- Create public storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('prints', 'prints', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, admin writes via service role only
CREATE POLICY "Public can read prints bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'prints');
