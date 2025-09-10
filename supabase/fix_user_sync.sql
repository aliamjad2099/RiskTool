-- Fix user sync by handling duplicate constraint properly

-- First, remove the unique constraint that's causing issues
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_organization_id_email_key;

-- Update existing users with auth data, or insert new ones
INSERT INTO users (id, email, role, full_name, organization_id)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'role', 'user') as role,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
    '550e8400-e29b-41d4-a716-446655440000' as organization_id
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM users)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

-- Re-add foreign key constraints
ALTER TABLE control_evidence 
ADD CONSTRAINT control_evidence_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE control_evidence 
ADD CONSTRAINT control_evidence_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
