import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  requiresPasswordChange: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: any }>;
  checkPasswordChangeRequirement: () => Promise<void>;
  setIgnoreAuthChanges: (ignore: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [ignoreAuthChanges, setIgnoreAuthChangesState] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Skip auth changes during user creation to prevent admin logout
      if (ignoreAuthChanges) {
        console.log('Ignoring auth change during user creation');
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [ignoreAuthChanges]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRequiresPasswordChange(false);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (!error && user) {
      // Update the requires_password_change flag
      await supabase
        .from('users')
        .update({ requires_password_change: false })
        .eq('auth_user_id', user.id);
    }
    
    return { error };
  };

  const checkPasswordChangeRequirement = async () => {
    if (!user) {
      setRequiresPasswordChange(false);
      return;
    }

    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('requires_password_change, locked_until')
        .eq('auth_user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle 0 rows gracefully

      if (error) {
        console.error('Error checking password requirement:', error);
        return;
      }

      // If no user profile exists, this is likely an existing auth user without a profile
      // Create a basic profile for them (only once)
      if (!userProfile) {
        console.warn('User profile not found for auth user:', user.id);
        
        // Check if we're already creating a profile to avoid duplicates
        const profileCreationKey = `creating_profile_${user.id}`;
        if (sessionStorage.getItem(profileCreationKey)) {
          console.log('Profile creation already in progress for user:', user.id);
          setRequiresPasswordChange(false);
          return;
        }
        
        sessionStorage.setItem(profileCreationKey, 'true');
        
        try {
          // Ensure default organization exists first
          const orgId = '550e8400-e29b-41d4-a716-446655440000';
          const { data: orgCheck } = await supabase
            .from('organizations')
            .select('id')
            .eq('id', orgId)
            .maybeSingle();
            
          if (!orgCheck) {
            // Create default organization
            await supabase.from('organizations').insert([{
              id: orgId,
              name: 'Default Organization',
              subdomain: 'default-org',
              settings: { description: 'Default organization for user management' }
            }]);
          }
          
          // Create user profile
          const { error: createProfileError } = await supabase
            .from('users')
            .insert([{
              auth_user_id: user.id,
              organization_id: orgId,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin User',
              email: user.email,
              job_title: 'Administrator',
              role: 'admin',
              requires_password_change: false,
              failed_login_attempts: 0,
              is_active: true
            }]);
            
          if (createProfileError && createProfileError.code !== '23505') {
            // Ignore duplicate key errors, log others
            console.error('Failed to create user profile:', createProfileError);
          } else {
            console.log('Created basic profile for existing user');
          }
        } catch (error) {
          console.error('Error creating user profile:', error);
        } finally {
          sessionStorage.removeItem(profileCreationKey);
        }
        
        setRequiresPasswordChange(false);
        return;
      }

      // Check if account is locked
      if (userProfile.locked_until) {
        const lockUntil = new Date(userProfile.locked_until);
        if (lockUntil > new Date()) {
          // Account is still locked
          await signOut();
          return;
        }
      }

      setRequiresPasswordChange(userProfile.requires_password_change || false);
    } catch (error) {
      console.error('Error checking password requirement:', error);
      // On any error, default to not requiring password change to avoid blocking access
      setRequiresPasswordChange(false);
    }
  };

  // Check password requirement when user changes
  useEffect(() => {
    if (user && !loading && !ignoreAuthChanges) {
      // Add delay to prevent immediate password check during user creation
      const timer = setTimeout(() => {
        checkPasswordChangeRequirement();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, ignoreAuthChanges]);

  const setIgnoreAuthChanges = (ignore: boolean) => {
    setIgnoreAuthChangesState(ignore);
  };

  const value = {
    user,
    session,
    loading,
    requiresPasswordChange,
    signIn,
    signUp,
    signOut,
    changePassword,
    checkPasswordChangeRequirement,
    setIgnoreAuthChanges,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
