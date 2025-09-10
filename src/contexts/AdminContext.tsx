import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';
import { assignUserToDepartment } from '../utils/departmentManager';
import { useAuth } from './AuthContext';

interface AdminContextType {
  createUser: (userData: CreateUserData) => Promise<{ user?: any; error?: any; tempPassword?: string }>;
  resetUserPassword: (userId: string) => Promise<{ tempPassword?: string; error?: any }>;
  deactivateUser: (userId: string) => Promise<{ error?: any }>;
  reactivateUser: (userId: string) => Promise<{ error?: any }>;
}

interface CreateUserData {
  email: string;
  fullName: string;
  jobTitle?: string;
  organizationId: string;
  departmentNames?: string[]; // Changed from departmentId to departmentNames array
  role: 'admin' | 'manager' | 'user' | 'read_only';
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

// Generate secure temporary password
const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Upper
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lower  
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special
  
  // Fill remaining 8 characters
  for (let i = 4; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setIgnoreAuthChanges } = useAuth();
  
  const createUser = async (userData: CreateUserData) => {
    try {
      // Check if user already exists in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', userData.email)
        .maybeSingle();
      
      if (existingUser) {
        return { error: new Error(`A user with email ${userData.email} already exists in your organization. Please use a different email address.`) };
      }
      
      // Generate secure temporary password
      const tempPassword = generateTempPassword();
      
      // Store current admin session
      const { data: adminSession } = await supabase.auth.getSession();
      if (adminSession?.session) {
        sessionStorage.setItem('admin_session', JSON.stringify(adminSession.session));
      }
      
      // Prevent auth state changes during user creation
      setIgnoreAuthChanges(true);
      
      // Create new user - this will auto-login them
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: tempPassword,
        options: {
          data: {
            full_name: userData.fullName,
            role: userData.role,
            requires_password_change: true,
            created_by_admin: true,
            created_at: new Date().toISOString()
          },
          emailRedirectTo: undefined
        }
      });
      
      if (authError) {
        setIgnoreAuthChanges(false);
        // Provide better error message for common cases
        if (authError.message?.includes('User already registered')) {
          return { error: new Error(`A user with email ${userData.email} already exists. Please use a different email address.`) };
        }
        return { error: authError };
      }
      
      if (!authData.user) {
        setIgnoreAuthChanges(false);
        return { error: new Error('User creation failed - no user returned') };
      }

      // Create profile in our users table
      const { data: profileUser, error: profileError } = await supabase
        .from('users')
        .insert([
          {
            auth_user_id: authData.user.id,
            organization_id: userData.organizationId,
            full_name: userData.fullName,
            email: userData.email,
            job_title: userData.jobTitle,
            role: userData.role,
            requires_password_change: true,
            failed_login_attempts: 0,
            is_active: true
          }
        ])
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation failed:', profileError);
        setIgnoreAuthChanges(false);
        return { error: profileError };
      }

      // Assign user to departments if specified
      if (userData.departmentNames && userData.departmentNames.length > 0 && profileUser) {
        console.log('🏢 Assigning departments to user:', {
          email: userData.email,
          profileUserId: profileUser.id,
          authUserId: authData.user.id,
          departments: userData.departmentNames
        });
        
        for (const departmentName of userData.departmentNames) {
          console.log(`🔄 Assigning department: ${departmentName} to ${userData.email}`);
          const result = await assignUserToDepartment(userData.email, departmentName);
          
          if (!result.success) {
            console.error(`❌ Department assignment failed for ${departmentName}:`, result.error);
          } else {
            console.log(`✅ Successfully assigned ${userData.email} to ${departmentName}`);
          }
        }
      } else {
        console.log('⚠️ No departments to assign:', {
          hasDepartments: !!userData.departmentNames?.length,
          hasProfile: !!profileUser,
          departments: userData.departmentNames
        });
      }

      // Immediately sign out the new user
      await supabase.auth.signOut();
      
      // Restore admin session
      const storedSession = sessionStorage.getItem('admin_session');
      if (storedSession) {
        const adminSessionData = JSON.parse(storedSession);
        await supabase.auth.setSession({
          access_token: adminSessionData.access_token,
          refresh_token: adminSessionData.refresh_token
        });
        sessionStorage.removeItem('admin_session');
      }
      
      // Re-enable auth state changes after restoration
      setTimeout(() => {
        setIgnoreAuthChanges(false);
      }, 100);

      return { 
        user: profileUser,
        tempPassword: tempPassword
      };

    } catch (error) {
      console.error('Error creating user:', error);
      setIgnoreAuthChanges(false);
      return { error: error };
    }
  };

  const resetUserPassword = async (userId: string) => {
    try {
      const tempPassword = generateTempPassword();
      
      // Get user's auth_user_id
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('auth_user_id')
        .eq('id', userId)
        .single();
        
      if (userError || !user) {
        return { error: 'User not found' };
      }

      // Reset password in Supabase Auth
      const { error: resetError } = await supabase.auth.admin.updateUserById(
        user.auth_user_id,
        { 
          password: tempPassword,
          user_metadata: { requires_password_change: true }
        }
      );

      if (resetError) {
        return { error: resetError };
      }

      // Update profile flags
      await supabase
        .from('users')
        .update({
          requires_password_change: true,
          password_changed_at: null,
          failed_login_attempts: 0
        })
        .eq('id', userId);

      return { tempPassword };
      
    } catch (error) {
      return { error };
    }
  };

  const deactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);
        
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const reactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_active: true,
          failed_login_attempts: 0
        })
        .eq('id', userId);
        
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    createUser,
    resetUserPassword,
    deactivateUser,
    reactivateUser
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
