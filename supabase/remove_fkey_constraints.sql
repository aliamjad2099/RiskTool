-- Temporarily remove foreign key constraints to get uploads working
-- We can add them back later once user sync is fixed

ALTER TABLE control_evidence 
DROP CONSTRAINT IF EXISTS control_evidence_uploaded_by_fkey;

ALTER TABLE control_evidence 
DROP CONSTRAINT IF EXISTS control_evidence_reviewed_by_fkey;
