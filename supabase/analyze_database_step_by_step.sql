-- Step-by-step database analysis for department management
-- Run each section separately to get complete picture

-- STEP 1: Check if tables exist
SELECT 'TABLES_EXISTS' as type, table_name, table_type
FROM information_schema.tables 
WHERE table_name IN ('departments', 'users', 'user_departments', 'risks', 'organizations')
ORDER BY table_name;

-- STEP 2: Get departments table structure and data
SELECT 'DEPARTMENTS_STRUCTURE' as type, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'departments'
ORDER BY ordinal_position;

SELECT 'DEPARTMENTS_DATA' as type, id, name, organization_id, created_at 
FROM departments 
ORDER BY created_at;

-- STEP 3: Get users table structure and data  
SELECT 'USERS_STRUCTURE' as type, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

SELECT 'USERS_DATA' as type, id, email, role, organization_id, created_at
FROM users 
ORDER BY email;

-- STEP 4: Get user_departments table structure and data
SELECT 'USER_DEPARTMENTS_STRUCTURE' as type, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_departments'
ORDER BY ordinal_position;

SELECT 'USER_DEPARTMENTS_DATA' as type, user_id, department_id
FROM user_departments 
ORDER BY user_id;

-- STEP 5: Get risks table structure and department mapping
SELECT 'RISKS_STRUCTURE' as type, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'risks' AND column_name IN ('id', 'risk_id', 'department_id', 'organization_id')
ORDER BY ordinal_position;

SELECT 'RISKS_DEPARTMENTS' as type, risk_id, department_id, title
FROM risks 
ORDER BY risk_id;

-- STEP 6: Check for orphaned department IDs
SELECT 'ORPHANED_RISK_DEPARTMENTS' as type, r.department_id, COUNT(*) as risk_count
FROM risks r
LEFT JOIN departments d ON r.department_id = d.id
WHERE d.id IS NULL AND r.department_id IS NOT NULL
GROUP BY r.department_id;

-- STEP 7: Check user-department mismatches  
SELECT 'USER_DEPARTMENT_MISMATCHES' as type, 
       u.email, 
       ARRAY_AGG(ud.department_id) as assigned_dept_ids,
       ARRAY_AGG(d.name) as assigned_dept_names
FROM users u
LEFT JOIN user_departments ud ON u.id = ud.user_id  
LEFT JOIN departments d ON ud.department_id = d.id
WHERE u.role != 'admin'
GROUP BY u.id, u.email;
