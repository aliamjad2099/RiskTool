-- Sample risks for RiskGuard platform
-- This script adds 10 sample risks to demonstrate the risk register functionality

-- First, let's insert some basic organizational data if it doesn't exist
INSERT INTO organizations (id, name, industry, country) VALUES 
('00000000-0000-0000-0000-000000000000', 'Sample Organization', 'Technology', 'US')
ON CONFLICT (id) DO NOTHING;

-- Insert sample departments
INSERT INTO departments (id, organization_id, name, description) VALUES 
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'IT Security', 'Information Technology and Security Department'),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'Finance', 'Finance and Accounting Department'),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'Operations', 'Operations and Process Management'),
('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'Legal & Compliance', 'Legal Affairs and Regulatory Compliance'),
('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'Human Resources', 'Human Resources and People Management')
ON CONFLICT (id) DO NOTHING;

-- Insert sample risk categories
INSERT INTO risk_categories (id, organization_id, name, description, color) VALUES 
('aaaa0000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Security', 'Information security and cyber risks', '#dc2626'),
('aaaa0000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Financial', 'Financial and market risks', '#059669'),
('aaaa0000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'Operational', 'Business operations and process risks', '#0284c7'),
('aaaa0000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'Compliance', 'Regulatory and compliance risks', '#7c3aed'),
('aaaa0000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'Strategic', 'Strategic and business planning risks', '#ea580c'),
('aaaa0000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'Technology', 'Technology infrastructure and system risks', '#0891b2'),
('aaaa0000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'Environmental', 'Environmental and sustainability risks', '#16a34a'),
('aaaa0000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'Reputational', 'Brand and reputation risks', '#be185d')
ON CONFLICT (id) DO NOTHING;

-- Insert sample users
INSERT INTO users (id, organization_id, department_id, full_name, email, job_title, role) VALUES 
('bbbb0000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'John Smith', 'john.smith@company.com', 'CISO', 'risk_department'),
('bbbb0000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'Sarah Johnson', 'sarah.johnson@company.com', 'CFO', 'risk_department'),
('bbbb0000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'Mike Davis', 'mike.davis@company.com', 'Operations Manager', 'department_user'),
('bbbb0000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'Lisa Wang', 'lisa.wang@company.com', 'Compliance Officer', 'risk_department'),
('bbbb0000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'Robert Brown', 'robert.brown@company.com', 'HR Director', 'department_user')
ON CONFLICT (id) DO NOTHING;

-- Insert sample risk methodology
INSERT INTO risk_methodologies (id, organization_id, name, description) VALUES 
('cccc0000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Standard Risk Matrix', 'Standard 5x5 risk assessment methodology')
ON CONFLICT (id) DO NOTHING;

-- Insert sample matrix config
INSERT INTO risk_matrix_config (id, organization_id, methodology_id, name, likelihood_levels, impact_levels) VALUES 
('dddd0000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'cccc0000-0000-0000-0000-000000000001', 'Standard 5x5 Matrix', 5, 5)
ON CONFLICT (id) DO NOTHING;

-- Now insert 10 sample risks
INSERT INTO risks (
    id,
    organization_id,
    risk_id,
    title,
    description,
    category_id,
    methodology_id,
    matrix_config_id,
    department_id,
    owner_id,
    inherent_likelihood,
    inherent_impact,
    status,
    priority,
    identified_date
) VALUES 
(
    'eeee0000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'RISK-001',
    'Data Breach from Phishing Attacks',
    'Risk of unauthorized access to sensitive customer data through successful phishing campaigns targeting employees. This could result in data theft, regulatory fines, and reputational damage.',
    'aaaa0000-0000-0000-0000-000000000001', -- Security
    'cccc0000-0000-0000-0000-000000000001',
    'dddd0000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111', -- IT Security
    'bbbb0000-0000-0000-0000-000000000001', -- John Smith
    4, -- High likelihood
    5, -- Very high impact
    'open',
    'critical',
    '2024-01-15'
),
(
    'eeee0000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'RISK-002',
    'Market Volatility Impact on Revenue',
    'Fluctuations in market conditions and economic uncertainty could significantly impact quarterly revenue projections and affect investor confidence.',
    'aaaa0000-0000-0000-0000-000000000002', -- Financial
    'cccc0000-0000-0000-0000-000000000001',
    'dddd0000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222', -- Finance
    'bbbb0000-0000-0000-0000-000000000002', -- Sarah Johnson
    3, -- Medium likelihood
    4, -- High impact
    'in_progress',
    'high',
    '2024-01-20'
),
(
    'eeee0000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'RISK-003',
    'GDPR Compliance Violations',
    'Risk of non-compliance with GDPR regulations due to inadequate data processing procedures, potentially resulting in regulatory fines up to 4% of annual revenue.',
    'aaaa0000-0000-0000-0000-000000000004', -- Compliance
    'cccc0000-0000-0000-0000-000000000001',
    'dddd0000-0000-0000-0000-000000000001',
    '44444444-4444-4444-4444-444444444444', -- Legal & Compliance
    'bbbb0000-0000-0000-0000-000000000004', -- Lisa Wang
    3, -- Medium likelihood
    5, -- Very high impact
    'open',
    'high',
    '2024-02-01'
),
(
    'eeee0000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'RISK-004',
    'Critical System Downtime',
    'Risk of extended downtime of core business systems due to hardware failure, software bugs, or cyber attacks, leading to business disruption and revenue loss.',
    'aaaa0000-0000-0000-0000-000000000006', -- Technology
    'cccc0000-0000-0000-0000-000000000001',
    'dddd0000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111', -- IT Security
    'bbbb0000-0000-0000-0000-000000000001', -- John Smith
    2, -- Low likelihood
    5, -- Very high impact
    'mitigated',
    'high',
    '2024-02-05'
),
(
    'eeee0000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'RISK-005',
    'Key Personnel Departure',
    'Risk of business disruption due to unexpected departure of critical personnel with specialized knowledge and limited succession planning.',
    'aaaa0000-0000-0000-0000-000000000003', -- Operational
    'cccc0000-0000-0000-0000-000000000001',
    'dddd0000-0000-0000-0000-000000000001',
    '55555555-5555-5555-5555-555555555555', -- Human Resources
    'bbbb0000-0000-0000-0000-000000000005', -- Robert Brown
    3, -- Medium likelihood
    3, -- Medium impact
    'open',
    'medium',
    '2024-02-10'
),
(
    'eeee0000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000000',
    'RISK-006',
    'Supply Chain Disruption',
    'Risk of business operations disruption due to critical supplier failures, natural disasters, or geopolitical events affecting the supply chain.',
    'aaaa0000-0000-0000-0000-000000000003', -- Operational
    'cccc0000-0000-0000-0000-000000000001',
    'dddd0000-0000-0000-0000-000000000001',
    '33333333-3333-3333-3333-333333333333', -- Operations
    'bbbb0000-0000-0000-0000-000000000003', -- Mike Davis
    4, -- High likelihood
    4, -- High impact
    'in_progress',
    'high',
    '2024-02-12'
),
(
    'eeee0000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000000',
    'RISK-007',
    'Intellectual Property Theft',
    'Risk of theft or unauthorized use of proprietary technology, trade secrets, or intellectual property by competitors, former employees, or malicious actors.',
    'aaaa0000-0000-0000-0000-000000000001', -- Security
    'cccc0000-0000-0000-0000-000000000001',
    'dddd0000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111', -- IT Security
    'bbbb0000-0000-0000-0000-000000000001', -- John Smith
    2, -- Low likelihood
    4, -- High impact
    'open',
    'medium',
    '2024-02-15'
),
(
    'eeee0000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000000',
    'RISK-008',
    'Cybersecurity Insurance Gap',
    'Risk of inadequate cybersecurity insurance coverage leading to significant financial exposure in case of a major cyber incident or data breach.',
    'aaaa0000-0000-0000-0000-000000000002', -- Financial
    'cccc0000-0000-0000-0000-000000000001',
    'dddd0000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222', -- Finance
    'bbbb0000-0000-0000-0000-000000000002', -- Sarah Johnson
    3, -- Medium likelihood
    3, -- Medium impact
    'open',
    'medium',
    '2024-02-18'
),
(
    'eeee0000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000000',
    'RISK-009',
    'Environmental Regulatory Changes',
    'Risk of increased compliance costs and operational changes due to new environmental regulations and sustainability requirements in key markets.',
    'aaaa0000-0000-0000-0000-000000000007', -- Environmental
    'cccc0000-0000-0000-0000-000000000001',
    'dddd0000-0000-0000-0000-000000000001',
    '44444444-4444-4444-4444-444444444444', -- Legal & Compliance
    'bbbb0000-0000-0000-0000-000000000004', -- Lisa Wang
    4, -- High likelihood
    2, -- Minor impact
    'open',
    'low',
    '2024-02-20'
),
(
    'eeee0000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000000',
    'RISK-010',
    'Brand Reputation Crisis',
    'Risk of significant damage to brand reputation due to negative publicity, social media campaigns, or public relations incidents affecting customer trust and market position.',
    'aaaa0000-0000-0000-0000-000000000008', -- Reputational
    'cccc0000-0000-0000-0000-000000000001',
    'dddd0000-0000-0000-0000-000000000001',
    '33333333-3333-3333-3333-333333333333', -- Operations
    'bbbb0000-0000-0000-0000-000000000003', -- Mike Davis
    2, -- Low likelihood
    4, -- High impact
    'open',
    'medium',
    '2024-02-22'
);
