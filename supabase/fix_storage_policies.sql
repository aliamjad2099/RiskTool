-- Fix storage bucket policies for control-evidence

-- First, check if bucket exists and create if needed
INSERT INTO storage.buckets (id, name, public)
VALUES ('control-evidence', 'control-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can upload evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their organization's evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploaded files" ON storage.objects;

-- Create proper storage policies
CREATE POLICY "Allow authenticated uploads to control-evidence" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'control-evidence' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated reads from control-evidence" ON storage.objects
FOR SELECT USING (
  bucket_id = 'control-evidence' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'control-evidence' 
  AND auth.role() = 'authenticated'
  AND owner = auth.uid()
);

-- Update existing files to have proper owner
UPDATE storage.objects 
SET owner = auth.uid()
WHERE bucket_id = 'control-evidence' 
AND owner IS NULL;
