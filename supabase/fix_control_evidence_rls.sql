-- Fix RLS policies for control_evidence table

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view evidence in their organization" ON control_evidence;
DROP POLICY IF EXISTS "Users can insert evidence for their organization" ON control_evidence;
DROP POLICY IF EXISTS "Users can update their own evidence" ON control_evidence;
DROP POLICY IF EXISTS "Users can delete their own evidence" ON control_evidence;

-- Enable RLS on control_evidence table
ALTER TABLE control_evidence ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert evidence
CREATE POLICY "Allow authenticated users to insert evidence" ON control_evidence
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Allow authenticated users to view evidence in their organization
CREATE POLICY "Allow users to view evidence in their organization" ON control_evidence
FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- Allow users to update their own evidence
CREATE POLICY "Allow users to update their own evidence" ON control_evidence
FOR UPDATE USING (
  auth.role() = 'authenticated' 
  AND uploaded_by = auth.uid()
);

-- Allow users to delete their own evidence
CREATE POLICY "Allow users to delete their own evidence" ON control_evidence
FOR DELETE USING (
  auth.role() = 'authenticated' 
  AND uploaded_by = auth.uid()
);
