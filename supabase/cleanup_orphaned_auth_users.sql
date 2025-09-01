-- Cleanup Orphaned Auth Users
-- These are users that exist in auth.users but have no profile in public.users

-- Step 1: Find orphaned auth users (for review before deletion)
-- These users exist in Supabase Auth but have no profile in your application
SELECT 
    au.id as auth_user_id,
    au.email,
    au.created_at as auth_created_at,
    au.email_confirmed_at,
    au.last_sign_in_at,
    CASE 
        WHEN pu.auth_user_id IS NULL THEN 'ORPHANED - No Profile'
        ELSE 'HAS PROFILE'
    END as profile_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id
WHERE pu.auth_user_id IS NULL
ORDER BY au.created_at DESC;

-- Step 2: Count orphaned users
SELECT COUNT(*) as orphaned_auth_users_count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id
WHERE pu.auth_user_id IS NULL;

-- Step 3: Find specific emails that might be causing issues
-- Replace 'your-test-email@example.com' with the actual emails you're having trouble with
SELECT 
    au.id,
    au.email,
    au.created_at,
    pu.id as profile_id,
    CASE 
        WHEN pu.auth_user_id IS NULL THEN 'Auth exists but no profile'
        ELSE 'Complete user'
    END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id
WHERE au.email IN (
    -- Add your problematic emails here
    'test@example.com',
    'user@example.com'
    -- Add more emails as needed
);

-- Step 4: Delete orphaned auth users (USE WITH CAUTION!)
-- This will permanently delete auth users that have no profiles
-- Run the SELECT queries above first to verify what will be deleted

-- UNCOMMENT THE FOLLOWING LINES ONLY AFTER REVIEWING THE ORPHANED USERS:

-- DELETE FROM auth.users 
-- WHERE id IN (
--     SELECT au.id
--     FROM auth.users au
--     LEFT JOIN public.users pu ON au.id = pu.auth_user_id
--     WHERE pu.auth_user_id IS NULL
-- );

-- Step 5: Alternative - Delete specific auth users by email
-- Replace with actual emails you want to remove from auth
-- UNCOMMENT AND MODIFY AS NEEDED:

-- DELETE FROM auth.users 
-- WHERE email IN (
--     'test@example.com',
--     'user@example.com'
-- ) 
-- AND id NOT IN (SELECT auth_user_id FROM public.users WHERE auth_user_id IS NOT NULL);

-- Step 6: Verify cleanup was successful
-- Run this after deletion to confirm orphaned users are gone
-- SELECT COUNT(*) as remaining_orphaned_users
-- FROM auth.users au
-- LEFT JOIN public.users pu ON au.id = pu.auth_user_id
-- WHERE pu.auth_user_id IS NULL;
