-- Add security fields to users table for secure password management

-- Add security-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'read_only'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_history JSONB DEFAULT '[]'::jsonb;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_organization_role ON users(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create password history function to prevent reuse
CREATE OR REPLACE FUNCTION check_password_history(user_id UUID, new_password_hash TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  history JSONB;
BEGIN
  SELECT password_history INTO history FROM users WHERE id = user_id;
  
  -- Check if password exists in history (last 5 passwords)
  RETURN NOT (history ? new_password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update password history
CREATE OR REPLACE FUNCTION update_password_history(user_id UUID, password_hash TEXT)
RETURNS VOID AS $$
DECLARE
  current_history JSONB;
  new_history JSONB;
BEGIN
  SELECT COALESCE(password_history, '[]'::jsonb) INTO current_history FROM users WHERE id = user_id;
  
  -- Add new password hash to history and keep only last 5
  new_history := (current_history || jsonb_build_array(password_hash));
  
  -- Keep only last 5 passwords
  IF jsonb_array_length(new_history) > 5 THEN
    new_history := jsonb_path_query_array(new_history, '$[last() - 4 to last()]');
  END IF;
  
  UPDATE users 
  SET password_history = new_history,
      password_changed_at = NOW(),
      requires_password_change = FALSE,
      failed_login_attempts = 0
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle failed login attempts
CREATE OR REPLACE FUNCTION handle_failed_login(user_auth_id UUID)
RETURNS VOID AS $$
DECLARE
  current_attempts INTEGER;
BEGIN
  -- Increment failed attempts
  UPDATE users 
  SET failed_login_attempts = failed_login_attempts + 1
  WHERE auth_user_id = user_auth_id
  RETURNING failed_login_attempts INTO current_attempts;
  
  -- Lock account after 5 failed attempts for 30 minutes
  IF current_attempts >= 5 THEN
    UPDATE users 
    SET locked_until = NOW() + INTERVAL '30 minutes'
    WHERE auth_user_id = user_auth_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset failed attempts on successful login
CREATE OR REPLACE FUNCTION reset_failed_attempts(user_auth_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET failed_login_attempts = 0,
      locked_until = NULL,
      last_login_at = NOW()
  WHERE auth_user_id = user_auth_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing sample users with security fields
UPDATE users SET 
  role = CASE 
    WHEN job_title ILIKE '%CISO%' OR job_title ILIKE '%CFO%' THEN 'admin'
    WHEN job_title ILIKE '%Manager%' OR job_title ILIKE '%Director%' THEN 'manager'
    ELSE 'user'
  END,
  requires_password_change = FALSE,
  password_changed_at = NOW() - INTERVAL '30 days', -- Simulate previous password change
  failed_login_attempts = 0
WHERE organization_id IS NOT NULL;
