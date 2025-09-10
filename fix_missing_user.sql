-- Check current users table and fix missing Finance user
-- Auth user: 128850eb-1509-4a17-8e5f-17f5d98280b7 (test4@riskguard.com)

-- 1. Check current users in the table
SELECT 'Current users in table:' as check_type, id, email, role, created_at 
FROM users 
ORDER BY email;

-- 2. Get Finance department ID
SELECT 'Finance department:' as check_type, id, name 
FROM departments 
WHERE name = 'Finance';

-- 3. Insert missing user if not exists
INSERT INTO users (id, email, role, created_at, updated_at)
SELECT 
  '128850eb-1509-4a17-8e5f-17f5d98280b7'::uuid,
  'test4@riskguard.com',
  'user',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE id = '128850eb-1509-4a17-8e5f-17f5d98280b7'
);

-- 4. Assign user to Finance department (get Finance dept ID first)
WITH finance_dept AS (
  SELECT id as dept_id FROM departments WHERE name = 'Finance' LIMIT 1
)
INSERT INTO user_departments (user_id, department_id, created_at)
SELECT 
  '128850eb-1509-4a17-8e5f-17f5d98280b7'::uuid,
  fd.dept_id,
  now()
FROM finance_dept fd
WHERE NOT EXISTS (
  SELECT 1 FROM user_departments 
  WHERE user_id = '128850eb-1509-4a17-8e5f-17f5d98280b7' 
  AND department_id = fd.dept_id
);

-- 5. Verify the fix
SELECT 'Verification - user record:' as check_type, * 
FROM users 
WHERE id = '128850eb-1509-4a17-8e5f-17f5d98280b7';

SELECT 'Verification - department assignment:' as check_type, 
  ud.*, d.name as department_name
FROM user_departments ud
JOIN departments d ON ud.department_id = d.id
WHERE ud.user_id = '128850eb-1509-4a17-8e5f-17f5d98280b7';

-- 6. Test user_department_view
SELECT 'Verification - user_department_view:' as check_type, *
FROM user_department_view
WHERE user_id = '128850eb-1509-4a17-8e5f-17f5d98280b7';
