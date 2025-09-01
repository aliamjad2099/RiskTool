-- Create test users for authentication testing
-- These will be created directly in Supabase Auth

-- Instructions to create these users manually in Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard/project/tztuagwtfjmujutuwmsm
-- 2. Navigate to Authentication > Users
-- 3. Click "Add User" and create these accounts:

/*
TEST USERS TO CREATE:

1. Admin User:
   Email: admin@riskguard.com
   Password: RiskGuard2025!
   Metadata: {"role": "admin", "full_name": "Admin User", "organization": "RiskGuard Inc"}

2. Regular User:
   Email: user@riskguard.com  
   Password: RiskGuard2025!
   Metadata: {"role": "user", "full_name": "Test User", "organization": "RiskGuard Inc"}

3. Manager User:
   Email: manager@riskguard.com
   Password: RiskGuard2025!
   Metadata: {"role": "manager", "full_name": "Risk Manager", "organization": "RiskGuard Inc"}
*/

-- Alternative: If RLS policies allow, we can insert users programmatically
-- But typically Supabase Auth users need to be created via the Auth API or Dashboard
