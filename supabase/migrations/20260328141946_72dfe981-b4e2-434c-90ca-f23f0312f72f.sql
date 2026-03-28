
-- Create storage bucket for submissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own submissions"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'submissions' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to read their own files
CREATE POLICY "Users can read own submissions"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'submissions' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow service role / super admins to read all
CREATE POLICY "Super admins can read all submissions"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'submissions' AND public.has_role(auth.uid(), 'super_admin'));
