-- Complete database schema analysis for department management
-- Run this query to get the full schema and data structure

-- 1. Get all table structures related to departments and users
SELECT 
    'TABLE_STRUCTURE' as type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('departments', 'users', 'user_departments', 'risks', 'organizations')
ORDER BY table_name, ordinal_position;

-- 2. Get all foreign key constraints
SELECT
    'FOREIGN_KEYS' as type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('departments', 'users', 'user_departments', 'risks');

-- 3. Current departments data
SELECT 'DEPARTMENTS_DATA' as type, id, name, organization_id, created_at 
FROM departments 
ORDER BY created_at;

-- 4. Current users and their department assignments
SELECT 
    'USER_DEPARTMENTS_DATA' as type,
    u.id as user_id,
    u.email,
    u.role,
    u.organization_id,
    ARRAY_AGG(ud.department_id) as assigned_departments,
    ARRAY_AGG(d.name) as department_names
FROM users u
LEFT JOIN user_departments ud ON u.id = ud.user_id
LEFT JOIN departments d ON ud.department_id = d.id
GROUP BY u.id, u.email, u.role, u.organization_id
ORDER BY u.email;

-- 5. Risk department usage
SELECT 
    'RISK_DEPARTMENTS_DATA' as type,
    r.department_id,
    d.name as department_name,
    COUNT(*) as risk_count
FROM risks r
LEFT JOIN departments d ON r.department_id = d.id
GROUP BY r.department_id, d.name
ORDER BY risk_count DESC;

-- 6. Check for orphaned department IDs (departments referenced but don't exist)
SELECT 
    'ORPHANED_DEPARTMENTS' as type,
    r.department_id,
    'Not found in departments table' as issue
FROM risks r
WHERE r.department_id NOT IN (SELECT id FROM departments WHERE id IS NOT NULL)
AND r.department_id IS NOT NULL
GROUP BY r.department_id;

-- 7. Check for users without department assignments
SELECT 
    'USERS_WITHOUT_DEPARTMENTS' as type,
    u.id,
    u.email,
    u.role
FROM users u
LEFT JOIN user_departments ud ON u.id = ud.user_id
WHERE ud.user_id IS NULL
AND u.role != 'admin';

-- 8. Check current organization structure
SELECT 'ORGANIZATIONS_DATA' as type, id, name, created_at 
FROM organizations 
ORDER BY created_at;
