-- Fix department user visibility issue
-- Two approaches: either update user departments OR update risk departments

-- APPROACH 1: Check what departments exist and what risks reference
SELECT 'Real Departments' as type, id, name FROM departments WHERE organization_id = '00000000-0000-0000-0000-000000000000'
UNION ALL
SELECT 'Risk Departments' as type, DISTINCT department_id as id, 'Unknown' as name FROM risks WHERE organization_id = '00000000-0000-0000-0000-000000000000';

-- APPROACH 2A: Update user to have access to existing risk departments (quick fix)
-- Find the department user and assign them to risk departments
INSERT INTO user_departments (user_id, department_id)
SELECT 
    u.id as user_id,
    '11111111-1111-1111-1111-111111111111' as department_id
FROM users u 
WHERE u.email = 'risk@riskguard.com'
ON CONFLICT (user_id, department_id) DO NOTHING;

INSERT INTO user_departments (user_id, department_id)
SELECT 
    u.id as user_id,
    '22222222-2222-2222-2222-222222222222' as department_id
FROM users u 
WHERE u.email = 'risk@riskguard.com'
ON CONFLICT (user_id, department_id) DO NOTHING;

INSERT INTO user_departments (user_id, department_id)
SELECT 
    u.id as user_id,
    '44444444-4444-4444-4444-444444444444' as department_id
FROM users u 
WHERE u.email = 'risk@riskguard.com'
ON CONFLICT (user_id, department_id) DO NOTHING;

-- APPROACH 2B: Alternative - Update risks to use real department IDs (better long-term)
-- First, check if we have real departments that match the intended departments
-- UPDATE risks SET department_id = (SELECT id FROM departments WHERE name = 'Finance' LIMIT 1) 
-- WHERE department_id = '11111111-1111-1111-1111-111111111111';

-- UPDATE risks SET department_id = (SELECT id FROM departments WHERE name = 'IT' LIMIT 1) 
-- WHERE department_id = '22222222-2222-2222-2222-222222222222';

-- UPDATE risks SET department_id = (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1) 
-- WHERE department_id = '44444444-4444-4444-4444-444444444444';
