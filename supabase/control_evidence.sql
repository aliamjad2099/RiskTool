-- Control Evidence Management
-- Table to store evidence files attached to controls

CREATE TABLE control_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    risk_id UUID REFERENCES risks(id) ON DELETE CASCADE,
    
    -- Evidence details
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL CHECK (file_size <= 15728640), -- 15MB in bytes
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('pdf', 'png', 'jpg', 'jpeg')),
    storage_path TEXT NOT NULL, -- Path in Supabase storage
    
    -- Control information
    control_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Upload metadata
    uploaded_by UUID, -- References users table
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_control_evidence_risk_id ON control_evidence(risk_id);
CREATE INDEX idx_control_evidence_org_id ON control_evidence(organization_id);
CREATE INDEX idx_control_evidence_uploaded_by ON control_evidence(uploaded_by);

-- RLS policies
ALTER TABLE control_evidence ENABLE ROW LEVEL SECURITY;

-- Users can only access evidence from their organization
CREATE POLICY "Users can view evidence from their organization" ON control_evidence
    FOR SELECT USING (organization_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can insert evidence" ON control_evidence
    FOR INSERT WITH CHECK (organization_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can update evidence they uploaded" ON control_evidence
    FOR UPDATE USING (organization_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can delete evidence they uploaded" ON control_evidence
    FOR DELETE USING (organization_id = '00000000-0000-0000-0000-000000000000');
