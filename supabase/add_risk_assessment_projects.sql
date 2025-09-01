-- Risk Assessment Projects Feature
-- Run these queries in Supabase SQL Editor

-- Create risk_assessment_projects table
CREATE TABLE risk_assessment_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    
    -- Project metadata
    created_by UUID, -- references users(id) when needed
    start_date DATE,
    target_completion_date DATE,
    
    -- Soft delete support
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, name) -- Per-organization unique names
);

-- Add project association to risks table
ALTER TABLE risks ADD COLUMN project_id UUID REFERENCES risk_assessment_projects(id);

-- Performance indexes
CREATE INDEX idx_risks_project_id ON risks(project_id);
CREATE INDEX idx_risk_assessment_projects_organization_id ON risk_assessment_projects(organization_id);
CREATE INDEX idx_risk_assessment_projects_status ON risk_assessment_projects(organization_id, status);
CREATE INDEX idx_risk_assessment_projects_not_deleted ON risk_assessment_projects(organization_id, is_deleted) WHERE is_deleted = FALSE;

-- Enable Row Level Security
ALTER TABLE risk_assessment_projects ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for development
CREATE POLICY "Allow all for testing risk_assessment_projects" ON risk_assessment_projects FOR ALL USING (true);

-- Add audit trail for risk assessment projects
CREATE TRIGGER audit_risk_assessment_projects AFTER INSERT OR UPDATE OR DELETE ON risk_assessment_projects
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
