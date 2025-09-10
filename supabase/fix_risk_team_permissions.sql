-- Fix Risk Team Permissions Issue
-- Problem: getUserDepartments() returns UUIDs but permission logic expects names

-- 1. Find all departments and their users
SELECT 
    d.id as department_id,
    d.name as department_name,
    u.email as user_email,
    u.role as user_role
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
LEFT JOIN users u ON ud.user_id = u.id
ORDER BY d.name, u.email;

-- 2. Check what departments the risk user is assigned to
SELECT 
    u.email,
    u.role,
    d.id as dept_id,
    d.name as dept_name
FROM users u
JOIN user_departments ud ON u.id = ud.user_id
JOIN departments d ON ud.department_id = d.id
WHERE u.email = 'risk@riskguard.com'
ORDER BY d.name;

-- 3. Find the Risk department UUID specifically
SELECT id, name 
FROM departments 
WHERE LOWER(name) LIKE '%risk%'
ORDER BY name;

-- 4. Create a view for easier department-based permission checking
CREATE OR REPLACE VIEW user_department_permissions AS
SELECT 
    u.id as user_id,
    u.email,
    u.role,
    array_agg(d.id) as department_ids,
    array_agg(d.name) as department_names,
    CASE 
        WHEN array_agg(LOWER(d.name)) && ARRAY['risk', 'risk team', 'risk department', 'risk management'] THEN true
        ELSE false
    END as is_risk_team_user
FROM users u
LEFT JOIN user_departments ud ON u.id = ud.user_id
LEFT JOIN departments d ON ud.department_id = d.id
GROUP BY u.id, u.email, u.role;
