-- Add control_name and control_rating columns to risks table
ALTER TABLE risks 
ADD COLUMN IF NOT EXISTS control_name TEXT,
ADD COLUMN IF NOT EXISTS control_rating DECIMAL(3,2) DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN risks.control_name IS 'Name of the control applied to this risk';
COMMENT ON COLUMN risks.control_rating IS 'Effectiveness rating of the control (0.0 to 1.0, representing 0% to 100%)';
