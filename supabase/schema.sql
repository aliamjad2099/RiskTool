-- Risk Management SaaS Database Schema
-- This schema supports flexible risk methodologies and multi-tenant architecture

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations table (multi-tenant support)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global Risk Matrix Configuration (applies to ALL risk types)
CREATE TABLE risk_matrix_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    matrix_size INTEGER NOT NULL DEFAULT 5 CHECK (matrix_size IN (3, 4, 5)),
    
    -- Risk Levels Configuration (stored as JSONB array)
    risk_levels JSONB NOT NULL DEFAULT '[
        {"id": "low", "name": "Low", "minScore": 1, "maxScore": 7, "color": "rg-risk-low-professional"},
        {"id": "medium", "name": "Medium", "minScore": 8, "maxScore": 14, "color": "rg-risk-medium-professional"},
        {"id": "high", "name": "High", "minScore": 15, "maxScore": 19, "color": "rg-risk-high-professional"},
        {"id": "critical", "name": "Critical", "minScore": 20, "maxScore": 25, "color": "rg-risk-critical-professional"}
    ]'::jsonb,
    
    -- Likelihood and Impact scales
    likelihood_labels JSONB NOT NULL DEFAULT '["Very Low", "Low", "Medium", "High", "Very High"]'::jsonb,
    impact_labels JSONB NOT NULL DEFAULT '["Negligible", "Minor", "Moderate", "Major", "Severe"]'::jsonb,
    
    -- Matrix configuration metadata
    last_modified_by UUID, -- will reference users table when implemented
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk methodologies (configurable frameworks)
CREATE TABLE risk_methodologies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    likelihood_scale JSONB NOT NULL, -- e.g., [{"value": 1, "label": "Very Low"}, ...]
    impact_scale JSONB NOT NULL,
    scoring_formula VARCHAR(255) DEFAULT 'likelihood * impact',
    risk_matrix JSONB NOT NULL, -- defines risk levels based on scores
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table (hierarchical structure)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES departments(id),
    
    -- Special department flags for access control
    is_risk_department BOOLEAN DEFAULT FALSE, -- Risk dept sees all risks
    is_executive_department BOOLEAN DEFAULT FALSE, -- CEO dept sees all risks
    
    -- Department metadata
    department_code VARCHAR(50), -- e.g., "RISK", "CEO", "IT", "FIN"
    manager_id UUID, -- will reference users table
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, name),
    UNIQUE(organization_id, department_code)
);

-- Users table (integrates with Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Supabase Auth integration
    auth_user_id UUID UNIQUE, -- References auth.users.id from Supabase Auth
    
    -- User profile information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    job_title VARCHAR(255),
    
    -- User status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, email)
);

-- User-Department mappings (many-to-many)
CREATE TABLE user_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    
    -- Assignment metadata
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    is_primary_department BOOLEAN DEFAULT FALSE, -- User's main department
    
    UNIQUE(user_id, department_id)
);

-- Risk categories and taxonomies
CREATE TABLE risk_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES risk_categories(id),
    color VARCHAR(7), -- hex color code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk Assessment Projects (grouping mechanism for risks)
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

-- Risk register
CREATE TABLE risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    risk_id VARCHAR(50) NOT NULL, -- user-friendly ID like RISK-001
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES risk_categories(id),
    methodology_id UUID REFERENCES risk_methodologies(id),
    matrix_config_id UUID REFERENCES risk_matrix_config(id), -- Links to global matrix config
    
    -- Project association (optional - risks can exist without projects)
    project_id UUID REFERENCES risk_assessment_projects(id),
    
    -- Department association for risk visibility
    department_id UUID REFERENCES departments(id), -- Primary department for this risk
    
    -- Risk ownership
    owner_id UUID REFERENCES users(id), -- Risk owner from users table
    stakeholders UUID[], -- array of user IDs
    business_unit VARCHAR(255),
    
    -- Inherent risk assessment (uses global matrix config)
    inherent_likelihood INTEGER NOT NULL,
    inherent_impact INTEGER NOT NULL,
    inherent_score DECIMAL(10,2) GENERATED ALWAYS AS (inherent_likelihood * inherent_impact) STORED,
    
    -- Residual risk assessment (after controls - uses same matrix config)
    residual_likelihood INTEGER,
    residual_impact INTEGER, 
    residual_score DECIMAL(10,2) GENERATED ALWAYS AS (residual_likelihood * residual_impact) STORED,
    
    -- Control risk assessment (risk of control failure - uses same matrix config)
    control_likelihood INTEGER,
    control_impact INTEGER,
    control_score DECIMAL(10,2) GENERATED ALWAYS AS (control_likelihood * control_impact) STORED,
    
    -- Risk appetite and tolerance
    risk_appetite VARCHAR(50), -- acceptable, review, unacceptable
    risk_tolerance_threshold DECIMAL(10,2),
    
    -- Status and lifecycle
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, mitigated, closed
    priority VARCHAR(50), -- critical, high, medium, low
    
    -- Dates
    identified_date DATE DEFAULT CURRENT_DATE,
    target_mitigation_date DATE,
    last_reviewed_date DATE,
    next_review_date DATE,
    
    -- Control information (stored directly for simplicity)
    control_name VARCHAR(255),
    control_rating DECIMAL(3,2) DEFAULT 0.0,
    due_date DATE,
    comments TEXT,
    
    -- Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, risk_id)
);

-- Controls library
CREATE TABLE controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    control_id VARCHAR(50) NOT NULL, -- user-friendly ID like CTRL-001
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Control classification
    control_type VARCHAR(50) NOT NULL, -- preventive, detective, corrective
    control_nature VARCHAR(50) NOT NULL, -- manual, automated, hybrid
    control_frequency VARCHAR(50), -- continuous, daily, weekly, monthly, quarterly, annual
    
    -- Control effectiveness
    design_effectiveness INTEGER CHECK (design_effectiveness >= 1 AND design_effectiveness <= 5),
    operating_effectiveness INTEGER CHECK (operating_effectiveness >= 1 AND operating_effectiveness <= 5),
    overall_effectiveness DECIMAL(3,2) GENERATED ALWAYS AS ((design_effectiveness + operating_effectiveness) / 10.0) STORED,
    
    -- Control ownership
    owner_id UUID, -- will reference users table
    implementer_id UUID,
    
    -- Implementation details
    implementation_status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, implemented, not_effective
    implementation_date DATE,
    last_tested_date DATE,
    next_test_date DATE,
    
    -- Cost-benefit
    implementation_cost DECIMAL(12,2),
    annual_operating_cost DECIMAL(12,2),
    
    -- Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, control_id)
);

-- Risk-Control mappings (many-to-many)
CREATE TABLE risk_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_id UUID REFERENCES risks(id) ON DELETE CASCADE,
    control_id UUID REFERENCES controls(id) ON DELETE CASCADE,
    control_effectiveness_override DECIMAL(3,2), -- override for this specific risk
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(risk_id, control_id)
);

-- Risk assessments (historical tracking) - ALL use the same global matrix config
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_id UUID REFERENCES risks(id) ON DELETE CASCADE,
    matrix_config_id UUID REFERENCES risk_matrix_config(id), -- Links to matrix config used for this assessment
    assessment_date DATE DEFAULT CURRENT_DATE,
    assessor_id UUID, -- will reference users table
    assessment_type VARCHAR(50) NOT NULL DEFAULT 'inherent', -- inherent, residual, control, etc.
    
    -- Assessment scores (uses same matrix config for all risk types)
    likelihood INTEGER NOT NULL,
    impact INTEGER NOT NULL,
    risk_score DECIMAL(10,2) GENERATED ALWAYS AS (likelihood * impact) STORED,
    
    -- Legacy fields for backward compatibility
    inherent_score DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE WHEN assessment_type = 'inherent' THEN likelihood * impact ELSE NULL END
    ) STORED,
    residual_likelihood INTEGER,
    residual_impact INTEGER,
    residual_score DECIMAL(10,2),
    
    -- Assessment details
    assessment_notes TEXT,
    evidence_links TEXT[],
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Key Risk Indicators (KRIs)
CREATE TABLE key_risk_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    risk_id UUID REFERENCES risks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- KRI configuration
    measurement_unit VARCHAR(100),
    target_value DECIMAL(12,2),
    threshold_yellow DECIMAL(12,2),
    threshold_red DECIMAL(12,2),
    frequency VARCHAR(50), -- daily, weekly, monthly
    
    -- Current status
    current_value DECIMAL(12,2),
    last_measured_date DATE,
    status VARCHAR(50) DEFAULT 'green', -- green, yellow, red
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit trail for all changes
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- insert, update, delete
    old_values JSONB,
    new_values JSONB,
    user_id UUID, -- will reference users table
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_matrix_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_methodologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessment_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_risk_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies for development (DISABLE IN PRODUCTION)
CREATE POLICY "Allow all for testing organizations" ON organizations FOR ALL USING (true);
CREATE POLICY "Allow all for testing departments" ON departments FOR ALL USING (true);
CREATE POLICY "Allow all for testing users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for testing user_departments" ON user_departments FOR ALL USING (true);
CREATE POLICY "Allow all for testing risk_matrix_config" ON risk_matrix_config FOR ALL USING (true);
CREATE POLICY "Allow all for testing risk_methodologies" ON risk_methodologies FOR ALL USING (true);
CREATE POLICY "Allow all for testing risk_categories" ON risk_categories FOR ALL USING (true);
CREATE POLICY "Allow all for testing risk_assessment_projects" ON risk_assessment_projects FOR ALL USING (true);
CREATE POLICY "Allow all for testing risks" ON risks FOR ALL USING (true);
CREATE POLICY "Allow all for testing controls" ON controls FOR ALL USING (true);
CREATE POLICY "Allow all for testing risk_controls" ON risk_controls FOR ALL USING (true);
CREATE POLICY "Allow all for testing risk_assessments" ON risk_assessments FOR ALL USING (true);
CREATE POLICY "Allow all for testing key_risk_indicators" ON key_risk_indicators FOR ALL USING (true);
CREATE POLICY "Allow all for testing audit_logs" ON audit_logs FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_departments_organization_id ON departments(organization_id);
CREATE INDEX idx_departments_parent_id ON departments(parent_id);
CREATE INDEX idx_departments_special ON departments(organization_id, is_risk_department, is_executive_department);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_email ON users(organization_id, email);
CREATE INDEX idx_user_departments_user_id ON user_departments(user_id);
CREATE INDEX idx_user_departments_department_id ON user_departments(department_id);
CREATE INDEX idx_user_departments_primary ON user_departments(user_id, is_primary_department) WHERE is_primary_department = TRUE;
CREATE INDEX idx_risks_organization_id ON risks(organization_id);
CREATE INDEX idx_risks_category_id ON risks(category_id);
CREATE INDEX idx_risks_department_id ON risks(department_id);
CREATE INDEX idx_risks_owner_id ON risks(owner_id);
CREATE INDEX idx_risks_status ON risks(status);
CREATE INDEX idx_risks_priority ON risks(priority);
CREATE INDEX idx_risks_matrix_config_id ON risks(matrix_config_id);
CREATE INDEX idx_risks_project_id ON risks(project_id);
CREATE INDEX idx_risk_assessment_projects_organization_id ON risk_assessment_projects(organization_id);
CREATE INDEX idx_risk_assessment_projects_status ON risk_assessment_projects(organization_id, status);
CREATE INDEX idx_risk_assessment_projects_not_deleted ON risk_assessment_projects(organization_id, is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX idx_risk_matrix_config_organization_id ON risk_matrix_config(organization_id);
CREATE INDEX idx_risk_matrix_config_active ON risk_matrix_config(organization_id, is_active) WHERE is_active = TRUE;

-- Ensure one active config per organization using partial unique index
CREATE UNIQUE INDEX idx_risk_matrix_config_unique_active ON risk_matrix_config(organization_id) WHERE is_active = TRUE;
CREATE INDEX idx_controls_organization_id ON controls(organization_id);
CREATE INDEX idx_risk_controls_risk_id ON risk_controls(risk_id);
CREATE INDEX idx_risk_controls_control_id ON risk_controls(control_id);
CREATE INDEX idx_risk_assessments_risk_id ON risk_assessments(risk_id);
CREATE INDEX idx_risk_assessments_matrix_config_id ON risk_assessments(matrix_config_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Functions for audit trail
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (organization_id, table_name, record_id, action, old_values)
        VALUES (OLD.organization_id, TG_TABLE_NAME, OLD.id, 'delete', to_jsonb(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (organization_id, table_name, record_id, action, old_values, new_values)
        VALUES (NEW.organization_id, TG_TABLE_NAME, NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (organization_id, table_name, record_id, action, new_values)
        VALUES (NEW.organization_id, TG_TABLE_NAME, NEW.id, 'insert', to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for audit trail
CREATE TRIGGER audit_risks AFTER INSERT OR UPDATE OR DELETE ON risks
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_controls AFTER INSERT OR UPDATE OR DELETE ON controls
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_risk_controls AFTER INSERT OR UPDATE OR DELETE ON risk_controls
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_risk_assessment_projects AFTER INSERT OR UPDATE OR DELETE ON risk_assessment_projects
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
