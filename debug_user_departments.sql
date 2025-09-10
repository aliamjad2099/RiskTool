-- Debug Finance user department assignment issue
-- User ID: 128850eb-1509-4a17-8e5f-17f5d98280b7
-- Email: test4@riskguard.com

-- 1. Check if user exists in users table
SELECT 'User in users table:' as check_type, id, email 
FROM users 
WHERE id = '128850eb-1509-4a17-8e5f-17f5d98280b7';

-- 2. Check departments table
SELECT 'All departments:' as check_type, id, name, organization_id 
FROM departments 
ORDER BY name;

-- 3. Check user_departments table for this user
SELECT 'User department assignments:' as check_type, ud.*, d.name as department_name
FROM user_departments ud
LEFT JOIN departments d ON ud.department_id = d.id
WHERE ud.user_id = '128850eb-1509-4a17-8e5f-17f5d98280b7';

-- 4. Check if user_department_view exists
SELECT 'user_department_view exists:' as check_type, count(*) as view_count
FROM information_schema.views 
WHERE table_name = 'user_department_view';

-- 5. Check user_department_view structure
SELECT 'user_department_view columns:' as check_type, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_department_view'
ORDER BY ordinal_position;

-- 6. Try to query user_department_view for this user
SELECT 'user_department_view data for Finance user:' as check_type, *
FROM user_department_view
WHERE user_id = '128850eb-1509-4a17-8e5f-17f5d98280b7';

-- 7. Check all data in user_department_view
SELECT 'All user_department_view data:' as check_type, *
FROM user_department_view
LIMIT 10;
