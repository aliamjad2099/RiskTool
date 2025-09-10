-- Fix duplicate foreign key constraints causing Supabase relationship issues
-- This query will identify and remove duplicate constraints

-- 1. Check current constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('user_departments', 'risks')
ORDER BY tc.table_name, kcu.column_name;

-- 2. Drop old/redundant foreign key constraints 
-- Keep the newer ones with standard naming convention

-- For user_departments table
ALTER TABLE user_departments 
DROP CONSTRAINT IF EXISTS fk_user_departments_department;

-- For risks table  
ALTER TABLE risks
DROP CONSTRAINT IF EXISTS fk_risks_department;

-- 3. Verify remaining constraints are properly named
-- The remaining constraints should be:
-- - user_departments_department_id_fkey 
-- - risks_department_id_fkey

-- 4. Test that relationships work correctly
SELECT 'Testing user_departments join' as test_type;
SELECT 
    ud.user_id,
    ud.department_id,
    d.name as department_name
FROM user_departments ud
JOIN departments d ON ud.department_id = d.id
LIMIT 5;

SELECT 'Testing risks join' as test_type;
SELECT 
    r.id,
    r.risk_id,
    r.title,
    r.department_id,
    d.name as department_name
FROM risks r
JOIN departments d ON r.department_id = d.id
LIMIT 5;
