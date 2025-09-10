-- Fix the foreign key constraint issue for control_evidence table

-- Drop the existing foreign key constraint
ALTER TABLE control_evidence 
DROP CONSTRAINT IF EXISTS control_evidence_uploaded_by_fkey;

-- Add new constraint that references auth.users instead of users table
ALTER TABLE control_evidence 
ADD CONSTRAINT control_evidence_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Also fix the reviewed_by constraint if it exists
ALTER TABLE control_evidence 
DROP CONSTRAINT IF EXISTS control_evidence_reviewed_by_fkey;

ALTER TABLE control_evidence 
ADD CONSTRAINT control_evidence_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
