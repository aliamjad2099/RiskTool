-- Add due_date and comments columns to risks table
-- due_date: Control implementation due date
-- comments: Additional comments/notes about the risk

ALTER TABLE risks 
ADD COLUMN due_date DATE COMMENT 'Control implementation due date',
ADD COLUMN comments TEXT COMMENT 'Additional comments/notes about the risk';

-- Add indexes for better query performance
CREATE INDEX idx_risks_due_date ON risks(due_date);
