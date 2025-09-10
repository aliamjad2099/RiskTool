-- PERMANENT DEPARTMENT MANAGEMENT SOLUTION
-- This script fixes all department-related issues and prevents future problems

-- ============================================================================
-- STEP 1: DATA CLEANUP - Map hardcoded risk departments to real departments
-- ============================================================================

-- First, let's see what departments we have and what risks reference
SELECT 'CURRENT_REAL_DEPARTMENTS' as info, id, name FROM departments ORDER BY name;

-- Update risks to use real department IDs instead of hardcoded test UUIDs
UPDATE risks SET department_id = (
    SELECT id FROM departments WHERE name = 'IT Security' AND organization_id = '00000000-0000-0000-0000-000000000000' LIMIT 1
) WHERE department_id = '11111111-1111-1111-1111-111111111111';

UPDATE risks SET department_id = (
    SELECT id FROM departments WHERE name = 'Finance' AND organization_id = '00000000-0000-0000-0000-000000000000' LIMIT 1
) WHERE department_id = '22222222-2222-2222-2222-222222222222';

UPDATE risks SET department_id = (
    SELECT id FROM departments WHERE name = 'Operations' AND organization_id = '00000000-0000-0000-0000-000000000000' LIMIT 1
) WHERE department_id = '44444444-4444-4444-4444-444444444444';

-- Add any missing departments that risks reference
INSERT INTO departments (id, name, organization_id) 
SELECT '33333333-3333-3333-3333-333333333333', 'Marketing', '00000000-0000-0000-0000-000000000000'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Marketing' AND organization_id = '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- STEP 2: USER-DEPARTMENT CLEANUP - Assign users to correct departments
-- ============================================================================

-- Remove any assignments to non-existent departments
DELETE FROM user_departments 
WHERE department_id NOT IN (SELECT id FROM departments);

-- Ensure the risk@riskguard.com user can see ALL departments (since they're risk team)
-- First remove existing assignments for risk user
DELETE FROM user_departments WHERE user_id = (SELECT id FROM users WHERE email = 'risk@riskguard.com');

-- Add risk user to ALL departments so they can see all risks
INSERT INTO user_departments (user_id, department_id)
SELECT u.id, d.id 
FROM users u, departments d 
WHERE u.email = 'risk@riskguard.com' 
AND d.organization_id = '00000000-0000-0000-0000-000000000000';

-- ============================================================================
-- STEP 3: DATABASE CONSTRAINTS - Prevent future inconsistencies
-- ============================================================================

-- Add foreign key constraint on risks.department_id -> departments.id
ALTER TABLE risks 
ADD CONSTRAINT fk_risks_department 
FOREIGN KEY (department_id) REFERENCES departments(id) 
ON DELETE RESTRICT;

-- Add foreign key constraint on user_departments -> departments
ALTER TABLE user_departments 
ADD CONSTRAINT fk_user_departments_department 
FOREIGN KEY (department_id) REFERENCES departments(id) 
ON DELETE CASCADE;

-- Add foreign key constraint on user_departments -> users  
ALTER TABLE user_departments 
ADD CONSTRAINT fk_user_departments_user 
FOREIGN KEY (user_id) REFERENCES users(id) 
ON DELETE CASCADE;

-- ============================================================================
-- STEP 4: DATABASE FUNCTIONS - Automatic department assignment
-- ============================================================================

-- Function to get or create department by name
CREATE OR REPLACE FUNCTION get_or_create_department(dept_name TEXT, org_id UUID)
RETURNS UUID AS $$
DECLARE
    dept_id UUID;
BEGIN
    -- Try to find existing department
    SELECT id INTO dept_id 
    FROM departments 
    WHERE name = dept_name AND organization_id = org_id;
    
    -- If not found, create it
    IF dept_id IS NULL THEN
        INSERT INTO departments (id, name, organization_id)
        VALUES (gen_random_uuid(), dept_name, org_id)
        RETURNING id INTO dept_id;
    END IF;
    
    RETURN dept_id;
END;
$$ LANGUAGE plpgsql;

-- Function to assign user to department
CREATE OR REPLACE FUNCTION assign_user_to_department(user_email TEXT, dept_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_id UUID;
    dept_id UUID;
    org_id UUID;
BEGIN
    -- Get user info
    SELECT id, organization_id INTO user_id, org_id 
    FROM users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get or create department
    dept_id := get_or_create_department(dept_name, org_id);
    
    -- Assign user to department (ignore if already exists)
    INSERT INTO user_departments (user_id, department_id)
    VALUES (user_id, dept_id)
    ON CONFLICT (user_id, department_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: VALIDATION QUERIES - Verify everything is fixed
-- ============================================================================

-- Check that all risks now have valid department references
SELECT 'VALIDATION_RISKS' as check_type, 
       COUNT(*) as total_risks,
       COUNT(d.id) as risks_with_valid_departments,
       COUNT(*) - COUNT(d.id) as orphaned_risks
FROM risks r
LEFT JOIN departments d ON r.department_id = d.id;

-- Check user-department assignments
SELECT 'VALIDATION_USERS' as check_type,
       u.email,
       u.role,
       ARRAY_AGG(d.name) as assigned_departments
FROM users u
LEFT JOIN user_departments ud ON u.id = ud.user_id
LEFT JOIN departments d ON ud.department_id = d.id
WHERE u.role != 'admin'
GROUP BY u.id, u.email, u.role
ORDER BY u.email;

-- Final verification: Show risk visibility for each user
SELECT 'VALIDATION_VISIBILITY' as check_type,
       u.email,
       COUNT(DISTINCT r.id) as visible_risks,
       ARRAY_AGG(DISTINCT d.name) as risk_departments
FROM users u
JOIN user_departments ud ON u.id = ud.user_id
JOIN departments d ON ud.department_id = d.id
JOIN risks r ON r.department_id = d.id
WHERE u.role != 'admin'
GROUP BY u.id, u.email
ORDER BY u.email;
