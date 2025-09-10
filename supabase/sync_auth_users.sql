-- Sync auth users with users table and restore foreign key constraints

-- First, insert any missing auth users into the users table
INSERT INTO users (id, email, role, full_name, organization_id)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'role', 'user') as role,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
    '550e8400-e29b-41d4-a716-446655440000' as organization_id -- Default org
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM users)
ON CONFLICT (id) DO NOTHING;

-- Create a trigger function to automatically sync new auth users
CREATE OR REPLACE FUNCTION sync_auth_user_to_users()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert new user into users table when they sign up
    INSERT INTO users (id, email, role, full_name, organization_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        '550e8400-e29b-41d4-a716-446655440000' -- Default org
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS sync_auth_user_trigger ON auth.users;
CREATE TRIGGER sync_auth_user_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_auth_user_to_users();

-- Now restore the foreign key constraints
ALTER TABLE control_evidence 
ADD CONSTRAINT control_evidence_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE control_evidence 
ADD CONSTRAINT control_evidence_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
