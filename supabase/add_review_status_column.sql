-- Add missing review_status column to control_evidence table

ALTER TABLE control_evidence 
ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected'));

-- Also add review_date and review_notes columns if they don't exist
ALTER TABLE control_evidence 
ADD COLUMN IF NOT EXISTS review_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS review_notes TEXT;
